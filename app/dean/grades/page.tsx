"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Search, Download, Eye, BookOpen, ChevronDown, ChevronRight, Calculator, Users
} from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface Schedule {
  ScheduleID: number;
  SubjectID?: number;
  SubjectCode: string;
  SubjectName: string;
  Course: string;
  Section: string;
  YearLevel: number;
  InstructorID: number;
}

interface Student {
  StudentID: number;
  StudentName: string;
  StudentNumber: string;
}

interface Grade {
  GradeID: number;
  Component: string;
  Term: string;
  ItemNumber: number;
  Score: number;
  MaxScore: number;
}

interface GradingConfig {
  components: Array<{
    name: string;
    weight: number;
    items: number;
    maxScore?: number;
  }>;
}

interface ScheduleWithGrades extends Schedule {
  students: Array<Student & { grades: Grade[] }>;
  gradingConfig: GradingConfig | null;
}

export default function DeanGradesPage() {
  const [schedules, setSchedules] = useState<ScheduleWithGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSchedules, setExpandedSchedules] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all schedules
      const schedulesRes = await fetch("/api/schedules");
      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : { success: true, data: [] };
      const allSchedules = schedulesData.success ? (Array.isArray(schedulesData.data) ? schedulesData.data : []) : [];
      
      console.log("Schedules fetched:", allSchedules.length, allSchedules);

      // Fetch grades and students for each schedule
      const scheduleDetails = await Promise.all(
        allSchedules.map(async (schedule: Schedule) => {
          // Fetch enrollments for this schedule
          const enrollmentsRes = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`);
          const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : { success: true, data: [] };
          const enrollments = enrollmentsData.success ? (Array.isArray(enrollmentsData.data) ? enrollmentsData.data : []) : [];

          // Fetch students
          const studentsRes = await fetch("/api/students");
          const studentsData = studentsRes.ok ? await studentsRes.json() : [];
          const allStudents = Array.isArray(studentsData) ? studentsData : [];
          
          console.log(`Schedule ${schedule.ScheduleID}: ${enrollments.length} enrollments, ${allStudents.length} students`);

          // Fetch grading config from subject
          const subjectRes = await fetch(`/api/subjects?id=${schedule.SubjectID || ''}`);
          const subjectData = subjectRes.ok ? await subjectRes.json() : {};
          let gradingConfig: GradingConfig | null = null;
          
          if (subjectData && subjectData.GradingConfig) {
            try {
              gradingConfig = JSON.parse(subjectData.GradingConfig);
            } catch (e) {
              console.error("Error parsing grading config:", e);
            }
          }

          // Fetch grades for this schedule
          const gradesRes = await fetch(`/api/grades?scheduleId=${schedule.ScheduleID}`);
          const gradesData = gradesRes.ok ? await gradesRes.json() : {};
          const allGrades = Array.isArray(gradesData) ? gradesData : (gradesData.success ? gradesData.data : []);

          // Map enrollments to students with their grades
          const students = enrollments
            .map((enrollment: any) => {
              const student = allStudents.find((s: any) => s.StudentID === enrollment.StudentID);
              if (!student) return null;

              const studentGrades = allGrades.filter((g: any) => g.StudentID === student.StudentID);

              return {
                StudentID: student.StudentID,
                StudentName: student.FirstName + ' ' + student.LastName,
                StudentNumber: student.StudentNumber,
                grades: studentGrades
              };
            })
            .filter(Boolean);

          return {
            ...schedule,
            students,
            gradingConfig
          };
        })
      );

      setSchedules(scheduleDetails);
      console.log("Schedule details processed:", scheduleDetails.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      brandedToast.error("Failed to load grades data", { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleScheduleExpansion = (scheduleId: number) => {
    const newExpanded = new Set(expandedSchedules);
    if (newExpanded.has(scheduleId)) {
      newExpanded.delete(scheduleId);
    } else {
      newExpanded.add(scheduleId);
    }
    setExpandedSchedules(newExpanded);
  };

  const calculateStudentGrade = (studentGrades: Grade[], term: 'midterm' | 'final'): number => {
    if (!studentGrades || studentGrades.length === 0) return 0;

    const termGrades = studentGrades.filter(g => g.Term === term);
    if (termGrades.length === 0) return 0;

    // Group by component
    const components = termGrades.reduce((acc: any, grade) => {
      if (!acc[grade.Component]) {
        acc[grade.Component] = [];
      }
      acc[grade.Component].push(grade);
      return acc;
    }, {});

    // Calculate average for each component
    const componentAverages = Object.entries(components).map(([componentName, grades]: [string, any]) => {
      const totalScore = grades.reduce((sum: number, g: Grade) => sum + g.Score, 0);
      const totalMaxScore = grades.reduce((sum: number, g: Grade) => sum + g.MaxScore, 0);
      return totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    });

    // Calculate overall average (simple average of components)
    const overallAverage = componentAverages.length > 0
      ? componentAverages.reduce((sum, avg) => sum + avg, 0) / componentAverages.length
      : 0;

    return Math.round(overallAverage * 100) / 100;
  };

  const filteredSchedules = schedules.filter(schedule =>
    schedule.SubjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.Course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading grades sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grading Sheets</h1>
          <p className="text-gray-600 mt-1">View grades by subject schedule</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold text-blue-600">{schedules.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {schedules.reduce((sum, s) => sum + s.students.length, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">With Grades</p>
                <p className="text-2xl font-bold text-purple-600">
                  {schedules.filter(s => s.students.some(st => st.grades.length > 0)).length}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSchedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No schedules found</p>
              </div>
            ) : (
              filteredSchedules.map((schedule) => {
                const isExpanded = expandedSchedules.has(schedule.ScheduleID);
                
                return (
                  <div key={schedule.ScheduleID} className="border rounded-lg">
                    {/* Schedule Header */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleScheduleExpansion(schedule.ScheduleID)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{schedule.SubjectName}</h3>
                            <p className="text-sm text-gray-600">
                              {schedule.SubjectCode} • {schedule.Course} • Year {schedule.YearLevel} • {schedule.Section}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-sm">
                            {schedule.students.length} student{schedule.students.length !== 1 ? 's' : ''}
                          </Badge>
                          {schedule.gradingConfig && (
                            <Badge variant="secondary" className="text-sm">
                              {schedule.gradingConfig.components.length} components
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Grading Sheet */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gray-100">
                                <TableHead className="font-semibold">Student No.</TableHead>
                                <TableHead className="font-semibold">Student Name</TableHead>
                                {schedule.gradingConfig?.components.map((component) => (
                                  <TableHead key={component.name} className="text-center font-semibold" colSpan={component.items}>
                                    {component.name} ({component.items})
                                  </TableHead>
                                ))}
                                <TableHead className="text-center font-semibold">Midterm</TableHead>
                                <TableHead className="text-center font-semibold">Final</TableHead>
                              </TableRow>
                              <TableRow className="bg-gray-50">
                                <TableHead></TableHead>
                                <TableHead></TableHead>
                                {schedule.gradingConfig?.components.map((component) => (
                                  Array.from({ length: component.items }, (_, index) => (
                                    <TableHead key={`${component.name}-${index}`} className="text-center text-xs">
                                      {index + 1}
                                    </TableHead>
                                  ))
                                ))}
                                <TableHead className="text-center"></TableHead>
                                <TableHead className="text-center"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {schedule.students.length === 0 ? (
                                <TableRow>
                                  <TableCell 
                                    colSpan={(schedule.gradingConfig?.components.reduce((sum, c) => sum + c.items, 0) || 0) + 4} 
                                    className="text-center text-gray-500 py-8"
                                  >
                                    No students enrolled
                                  </TableCell>
                                </TableRow>
                              ) : (
                                schedule.students.map((student) => {
                                  const midtermGrade = calculateStudentGrade(student.grades, 'midterm');
                                  const finalGrade = calculateStudentGrade(student.grades, 'final');

                                  return (
                                    <TableRow key={student.StudentID}>
                                      <TableCell className="font-medium">{student.StudentNumber}</TableCell>
                                      <TableCell>{student.StudentName}</TableCell>
                                      {schedule.gradingConfig?.components.map((component) => (
                                        Array.from({ length: component.items }, (_, index) => {
                                          const itemNumber = index + 1;
                                          const midtermGradeItem = student.grades.find(
                                            g => g.Component === component.name && 
                                            g.Term === 'midterm' && 
                                            g.ItemNumber === itemNumber
                                          );
                                          const finalGradeItem = student.grades.find(
                                            g => g.Component === component.name && 
                                            g.Term === 'final' && 
                                            g.ItemNumber === itemNumber
                                          );

                                          return (
                                            <TableCell key={`${component.name}-${index}`} className="text-center">
                                              <div className="flex justify-center gap-1">
                                                {midtermGradeItem && (
                                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                                                    {midtermGradeItem.Score}
                                                  </Badge>
                                                )}
                                                {finalGradeItem && (
                                                  <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                                    {finalGradeItem.Score}
                                                  </Badge>
                                                )}
                                              </div>
                                            </TableCell>
                                          );
                                        })
                                      ))}
                                      <TableCell className="text-center font-bold bg-blue-50">
                                        {midtermGrade > 0 ? `${midtermGrade}` : '-'}
                                      </TableCell>
                                      <TableCell className="text-center font-bold bg-green-50">
                                        {finalGrade > 0 ? `${finalGrade}` : '-'}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
