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
  Search, Download, Eye, BookOpen, ChevronDown, ChevronRight, Calculator, Users, Filter
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

interface CalculatedGrades {
  midterm: number | null;
  final: number | null;
  summary: number | null;
}

interface ScheduleWithGrades extends Schedule {
  students: Array<Student & { grades: Grade[]; calculatedGrades?: CalculatedGrades }>;
  gradingConfig: GradingConfig | null;
}

export default function DeanGradesPage() {
  const [schedules, setSchedules] = useState<ScheduleWithGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSchedules, setExpandedSchedules] = useState<Set<number>>(new Set());

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedYearLevel, setSelectedYearLevel] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");

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
          const studentsWithGrades = await Promise.all(
            enrollments.map(async (enrollment: any) => {
              const student = allStudents.find((s: any) => s.StudentID === enrollment.StudentID);
              if (!student) return null;

              const studentGrades = allGrades.filter((g: any) => g.StudentID === student.StudentID);

              // Fetch calculated Filipino grades from API
              let calculatedGrades: CalculatedGrades = { midterm: null, final: null, summary: null };
              try {
                const gradeSummaryRes = await fetch(`/api/grades?role=student&userId=${student.StudentID}`);
                const gradeSummaryData = gradeSummaryRes.ok ? await gradeSummaryRes.json() : {};
                if (gradeSummaryData.success && gradeSummaryData.summary && gradeSummaryData.summary[schedule.ScheduleID]) {
                  calculatedGrades = gradeSummaryData.summary[schedule.ScheduleID];
                }
              } catch (error) {
                console.error(`Error fetching calculated grades for student ${student.StudentID}:`, error);
              }

              return {
                StudentID: student.StudentID,
                StudentName: student.FirstName + ' ' + student.LastName,
                StudentNumber: student.StudentNumber,
                grades: studentGrades,
                calculatedGrades
              };
            })
          );

          const students = studentsWithGrades.filter(Boolean);

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


  // Get unique filter options from schedules
  const courses = [...new Set(schedules.map(s => s.Course))].filter(Boolean).sort();
  const yearLevels = [...new Set(schedules.map(s => s.YearLevel))].filter(Boolean).sort();
  const sections = [...new Set(schedules.map(s => s.Section))].filter(Boolean).sort();

  const filteredSchedules = schedules.filter(schedule => {
    const matchesSearch =
      schedule.SubjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.Course.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCourse = selectedCourse === "all" || schedule.Course === selectedCourse;
    const matchesYearLevel = selectedYearLevel === "all" || schedule.YearLevel === parseInt(selectedYearLevel);
    const matchesSection = selectedSection === "all" || schedule.Section === selectedSection;

    return matchesSearch && matchesCourse && matchesYearLevel && matchesSection;
  });

  // Group schedules by section
  interface SectionGroup {
    section: string;
    course: string;
    yearLevel: number;
    schedules: ScheduleWithGrades[];
  }

  const groupedBySection: { [key: string]: SectionGroup } = {};
  
  filteredSchedules.forEach(schedule => {
    const sectionKey = `${schedule.Course}-${schedule.YearLevel}-${schedule.Section}`;
    if (!groupedBySection[sectionKey]) {
      groupedBySection[sectionKey] = {
        section: schedule.Section,
        course: schedule.Course,
        yearLevel: schedule.YearLevel,
        schedules: []
      };
    }
    groupedBySection[sectionKey].schedules.push(schedule);
  });

  const sectionGroups = Object.values(groupedBySection).sort((a, b) => {
    // Sort by course, then year level, then section
    if (a.course !== b.course) return a.course.localeCompare(b.course);
    if (a.yearLevel !== b.yearLevel) return a.yearLevel - b.yearLevel;
    return a.section.localeCompare(b.section);
  });

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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Grading Sheets</h1>
            <p className="text-gray-600 mt-1">View grades organized by sections</p>
          </div>
          <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm min-w-[150px]"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course} value={course}>{course}</option>
            ))}
          </select>

          {/* Year Level Filter */}
          <select
            value={selectedYearLevel}
            onChange={(e) => setSelectedYearLevel(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm min-w-[120px]"
          >
            <option value="all">All Years</option>
            {yearLevels.map(year => (
              <option key={year} value={year.toString()}>Year {year}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white text-sm min-w-[120px]"
          >
            <option value="all">All Sections</option>
            {sections.map(section => (
              <option key={section} value={section}>{section}</option>
            ))}
          </select>

          {/* Clear Filters */}
          {(selectedCourse !== "all" || selectedYearLevel !== "all" || selectedSection !== "all" || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCourse("all");
                setSelectedYearLevel("all");
                setSelectedSection("all");
                setSearchTerm("");
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                <p className="text-2xl font-bold text-blue-600">{sectionGroups.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schedules</p>
                <p className="text-2xl font-bold text-purple-600">{filteredSchedules.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredSchedules.reduce((sum, s) => sum + s.students.length, 0)}
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
                <p className="text-2xl font-bold text-orange-600">
                  {filteredSchedules.filter(s => s.students.some(st => st.grades.length > 0)).length}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules List - Grouped by Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Grades by Sections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sectionGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No schedules found</p>
              </div>
            ) : (
              sectionGroups.map((sectionGroup, sectionIndex) => (
                <div key={`section-${sectionGroup.course}-${sectionGroup.yearLevel}-${sectionGroup.section}`} className="border rounded-lg overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-blue-50 border-b p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {sectionGroup.course} - Year {sectionGroup.yearLevel} - Section {sectionGroup.section}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                          {sectionGroup.schedules.length} subject{sectionGroup.schedules.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-sm bg-white">
                        {sectionGroup.schedules.reduce((sum, s) => sum + s.students.length, 0)} student{sectionGroup.schedules.reduce((sum, s) => sum + s.students.length, 0) !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  {/* Subjects in this Section */}
                  <div className="space-y-2 p-4">
                    {sectionGroup.schedules.map((schedule) => {
                      const isExpanded = expandedSchedules.has(schedule.ScheduleID);

                      return (
                        <div key={schedule.ScheduleID} className="border rounded-lg bg-white">
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
                                    {schedule.SubjectCode}
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
                                  const midtermGrade = student.calculatedGrades?.midterm ?? null;
                                  const finalGrade = student.calculatedGrades?.final ?? null;

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
                                        {midtermGrade !== null ? (
                                          <>
                                            <div className="text-lg font-semibold">{midtermGrade.toFixed(2)}</div>
                                            <Badge
                                              variant={midtermGrade <= 3.0 ? "default" : "destructive"}
                                              className={`text-xs mt-1 ${midtermGrade <= 3.0 ? "bg-green-600" : "bg-red-600"}`}
                                            >
                                              {midtermGrade <= 3.0 ? 'Pass' : 'Fail'}
                                            </Badge>
                                          </>
                                        ) : '-'}
                                      </TableCell>
                                      <TableCell className="text-center font-bold bg-green-50">
                                        {finalGrade !== null ? (
                                          <>
                                            <div className="text-lg font-semibold">{finalGrade.toFixed(2)}</div>
                                            <Badge
                                              variant={finalGrade <= 3.0 ? "default" : "destructive"}
                                              className={`text-xs mt-1 ${finalGrade <= 3.0 ? "bg-green-600" : "bg-red-600"}`}
                                            >
                                              {finalGrade <= 3.0 ? 'Pass' : 'Fail'}
                                            </Badge>
                                          </>
                                        ) : '-'}
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
                })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
