"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, ChevronDown, ChevronUp, Award, ClipboardList, BookOpen, FileText } from "lucide-react";
import { toast } from "sonner";

interface StudentPerformance {
  StudentID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  TotalSubjects: number;
  AttendanceRate: number;
  ExcuseLettersCount: number;
  Status: string;
}

export default function DeanStudentPerformancePage() {
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [studentDetails, setStudentDetails] = useState<{[key: number]: any}>({});

  useEffect(() => {
    fetchStudentPerformance();
  }, []);

  const fetchStudentPerformance = async () => {
    try {
      const response = await fetch("/api/dean/student-performance");
      const data = await response.json();

      if (data.success) {
        setStudentPerformance(data.data);
      } else {
        console.error("Failed to fetch student performance:", data.error);
        toast.error("Failed to load student performance data");
      }
    } catch (error) {
      console.error("Error fetching student performance:", error);
      toast.error("Failed to load student performance data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId: number) => {
    try {
      const response = await fetch(`/api/dean/student-details?studentId=${studentId}`);
      const data = await response.json();

      if (data.success) {
        setStudentDetails(prev => ({
          ...prev,
          [studentId]: data.data
        }));
      } else {
        console.error("Failed to fetch student details:", data.error);
        toast.error("Failed to load student details");
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to load student details");
    }
  };

  const toggleStudentExpansion = async (studentId: number) => {
    const newExpanded = new Set(expandedStudents);

    if (expandedStudents.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
      if (!studentDetails[studentId]) {
        await fetchStudentDetails(studentId);
      }
    }

    setExpandedStudents(newExpanded);
  };

  const getPerformanceStatus = (student: StudentPerformance) => {
    if (student.AttendanceRate < 75 || student.ExcuseLettersCount > 3) {
      return { status: 'at-risk', color: 'bg-red-100 text-red-800' };
    } else if (student.AttendanceRate < 85) {
      return { status: 'needs-attention', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'good', color: 'bg-green-100 text-green-800' };
  };

  const filteredStudentPerformance = studentPerformance.filter(student => {
    const matchesSearch = student.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.Course.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.Status === statusFilter;
    const matchesCourse = courseFilter === 'all' || student.Course === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const uniqueCourses = [...new Set(studentPerformance.map(student => student.Course))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Student Performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Performance</h1>
          <p className="text-gray-600 mt-1">Monitor student academic progress and performance</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar
          placeholder="Search students or courses..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full"
        />
        <div className="flex gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="needs-attention">Needs Attention</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map(course => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredStudentPerformance.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No students found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredStudentPerformance.map((student, index) => {
            const performance = getPerformanceStatus(student);
            const isExpanded = expandedStudents.has(student.StudentID);
            const details = studentDetails[student.StudentID];

            return (
              <Card key={`student-performance-${student.StudentID}-${index}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleStudentExpansion(student.StudentID)}>
                  <CollapsibleTrigger asChild>
                    <CardContent className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{student.StudentName}</h3>
                          <p className="text-sm text-gray-600">
                            {student.Course} • Year {student.YearLevel} • Section {student.Section}
                          </p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{student.AttendanceRate}%</div>
                            <div className="text-gray-500">Attendance</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{student.TotalSubjects}</div>
                            <div className="text-gray-500">Subjects</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{student.ExcuseLettersCount}</div>
                            <div className="text-gray-500">Excuse Letters</div>
                          </div>
                          <Badge className={performance.color}>
                            {performance.status}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t bg-gray-50">
                      {details ? (
                        <div className="p-6 space-y-6">
                          <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                              <Award className="h-5 w-5" />
                              Academic Performance
                            </h4>
                            <div className="space-y-3">
                              {details.grades && details.grades.length > 0 ? (
                                details.grades.map((grade: any, index: number) => (
                                  <div key={index} className="bg-white p-3 rounded-lg border">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h5 className="font-medium">{grade.SubjectCode}</h5>
                                        <p className="text-sm text-gray-600">{grade.SubjectName}</p>
                                        {grade.InstructorName && (
                                          <p className="text-xs text-gray-500 mt-1">Instructor: {grade.InstructorName}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-4 text-sm">
                                        {grade.MidtermGrade && (
                                          <div className="text-center">
                                            <div className="font-medium">{grade.MidtermGrade.toFixed(2)}</div>
                                            <div className="text-gray-500">Midterm</div>
                                          </div>
                                        )}
                                        {grade.FinalGrade && (
                                          <div className="text-center">
                                            <div className="font-medium">{grade.FinalGrade.toFixed(2)}</div>
                                            <div className="text-gray-500">Final</div>
                                          </div>
                                        )}
                                        <div className="text-center">
                                          <div className="font-medium">
                                            {grade.OverallGrade ? grade.OverallGrade.toFixed(2) : 'Incomplete'}
                                          </div>
                                          <div className="text-gray-500">Overall</div>
                                        </div>
                                        <Badge className={
                                          grade.Status === 'Passed' ? 'bg-green-100 text-green-800' :
                                          grade.Status === 'Failed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }>
                                          {grade.Status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 text-center py-4">No grades available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading student details...</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


