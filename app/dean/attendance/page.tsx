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
  Search, Download, Users, BookOpen, ChevronDown, ChevronRight, Clock
} from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectName: string;
  Course: string;
  Section: string;
  YearLevel: number;
  InstructorID: number;
  ClassType?: string;
  Lecture?: number;
  Laboratory?: number;
  Room?: string;
}

interface Student {
  StudentID: number;
  StudentName: string;
  StudentNumber: string;
}

interface AttendanceRecord {
  Week: number;
  SessionType: string;
  Status: string;
}

interface ScheduleWithStudents extends Schedule {
  students: Array<Student & { attendance: {[key: string]: AttendanceRecord[]} }>;
}

export default function DeanAttendancePage() {
  const [schedules, setSchedules] = useState<ScheduleWithStudents[]>([]);
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

      // Fetch attendance and students for each schedule
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

          // Map enrollments to students with attendance
          const students = await Promise.all(
            enrollments.map(async (enrollment: any) => {
              const student = allStudents.find((s: any) => s.StudentID === enrollment.StudentID);
              if (!student) return null;

              // Fetch attendance for this student in this schedule
              const attendanceRes = await fetch(
                `/api/attendance?studentId=${student.StudentID}&scheduleId=${schedule.ScheduleID}`
              );
              const attendanceData = attendanceRes.ok ? await attendanceRes.json() : {};
              const records = Array.isArray(attendanceData) ? attendanceData : (attendanceData.success ? attendanceData.data : []);

              // Organize attendance by week and session type
              const attendance: {[key: string]: AttendanceRecord[]} = {};
              records.forEach((record: any) => {
                const key = `${record.SessionType}_week${record.Week}`;
                if (!attendance[key]) {
                  attendance[key] = [];
                }
                attendance[key].push({
                  Week: record.Week,
                  SessionType: record.SessionType,
                  Status: record.Status
                });
              });

              return {
                StudentID: student.StudentID,
                StudentName: student.FirstName + ' ' + student.LastName,
                StudentNumber: student.StudentNumber,
                attendance
              };
            })
          );

          return {
            ...schedule,
            students: students.filter(Boolean)
          };
        })
      );

      setSchedules(scheduleDetails);
      console.log("Schedule details processed:", scheduleDetails.length);
    } catch (error) {
      console.error("Error fetching data:", error);
      brandedToast.error("Failed to load attendance data", { title: "Error" });
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

  const getStatusBadge = (status: string) => {
    const statusConfig: {[key: string]: {color: string, label: string}} = {
      "P": { color: "bg-green-100 text-green-800", label: "Present" },
      "A": { color: "bg-red-100 text-red-800", label: "Absent" },
      "E": { color: "bg-blue-100 text-blue-800", label: "Excused" },
      "L": { color: "bg-yellow-100 text-yellow-800", label: "Late" },
      "CC": { color: "bg-gray-100 text-gray-800", label: "Cancelled" },
      "D": { color: "bg-orange-100 text-orange-800", label: "Dropped" },
      "FA": { color: "bg-purple-100 text-purple-800", label: "Failed" }
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={config.color}>{config.label}</Badge>;
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
          <p className="mt-4 text-lg text-gray-600">Loading attendance sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Sheets</h1>
          <p className="text-gray-600 mt-1">View attendance by subject schedule</p>
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
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {schedules.filter(s => s.students.length > 0).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
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
        <CardContent className="overflow-x-scroll">
          <p className="text-sm text-gray-500 mb-4">
            Tip: Hold Shift and use your mouse wheel to scroll horizontally across weeks.
          </p>
          <div className="space-y-4 min-w-full">
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
                        <Badge variant="outline" className="text-sm">
                          {schedule.students.length} student{schedule.students.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>

                    {/* Expanded Attendance Sheet */}
                    {isExpanded && (() => {
                      // Check if this is a Cisco schedule
                      const isCiscoSchedule = (schedule.ClassType || '').toUpperCase() === 'MAJOR' || 
                                              (schedule.Room && schedule.Room.toLowerCase().includes('cisco'));
                      
                      // Only Cisco schedules can show both Lecture and Laboratory sections
                      // Non-Cisco schedules should only show ONE section (prefer lecture if both have hours)
                      const hasLectureHours = (schedule.Lecture || 0) > 0;
                      const hasLabHours = (schedule.Laboratory || 0) > 0;
                      
                      let hasLecture = false;
                      let hasLab = false;
                      
                      if (isCiscoSchedule) {
                        // Cisco schedules: show both sections if both hours are configured
                        hasLecture = hasLectureHours;
                        hasLab = hasLabHours;
                      } else {
                        // Non-Cisco schedules: show only ONE section
                        if (hasLectureHours) {
                          hasLecture = true;
                          hasLab = false;
                        } else if (hasLabHours) {
                          hasLecture = false;
                          hasLab = true;
                        }
                      }
                      
                      const hasBoth = hasLecture && hasLab;
                      
                      return (
                        <div className="border-t bg-gray-50 p-4">
                          <div className="overflow-x-scroll w-full pb-2">
                            <Table className={hasBoth ? "min-w-[2400px]" : "min-w-[1400px]"}>
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead rowSpan={hasBoth ? 2 : 1}>Student No.</TableHead>
                                  <TableHead rowSpan={hasBoth ? 2 : 1}>Student Name</TableHead>
                                  {hasBoth ? (
                                    <>
                                      <TableHead colSpan={18} className="text-center border-b">Lecture</TableHead>
                                      <TableHead colSpan={18} className="text-center border-b">Laboratory</TableHead>
                                    </>
                                  ) : (
                                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => (
                                      <TableHead key={week} className="text-center min-w-[60px]">W{week}</TableHead>
                                    ))
                                  )}
                                </TableRow>
                                {hasBoth && (
                                  <TableRow className="bg-gray-100">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => (
                                      <TableHead key={`lec-${week}`} className="text-center min-w-[60px]">W{week}</TableHead>
                                    ))}
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => (
                                      <TableHead key={`lab-${week}`} className="text-center min-w-[60px]">W{week}</TableHead>
                                    ))}
                                  </TableRow>
                                )}
                              </TableHeader>
                              <TableBody>
                                {schedule.students.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={hasBoth ? 38 : 20} className="text-center text-gray-500 py-8">
                                      No students enrolled
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  schedule.students.map((student) => (
                                    <TableRow key={student.StudentID}>
                                      <TableCell className="font-medium">{student.StudentNumber}</TableCell>
                                      <TableCell>{student.StudentName}</TableCell>
                                      {hasBoth ? (
                                        <>
                                          {/* Lecture columns */}
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => {
                                            const lectureKey = `lecture_week${week}`;
                                            const lectureAtt = student.attendance[lectureKey]?.[0];
                                            return (
                                              <TableCell key={`lec-${week}`} className="text-center">
                                                {lectureAtt ? getStatusBadge(lectureAtt.Status) : (
                                                  <span className="text-gray-300">-</span>
                                                )}
                                              </TableCell>
                                            );
                                          })}
                                          {/* Lab columns */}
                                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => {
                                            const labKey = `lab_week${week}`;
                                            const labAtt = student.attendance[labKey]?.[0];
                                            return (
                                              <TableCell key={`lab-${week}`} className="text-center">
                                                {labAtt ? getStatusBadge(labAtt.Status) : (
                                                  <span className="text-gray-300">-</span>
                                                )}
                                              </TableCell>
                                            );
                                          })}
                                        </>
                                      ) : (
                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(week => {
                                          // Get attendance for this week (check both lecture and lab)
                                          const lectureKey = `lecture_week${week}`;
                                          const labKey = `lab_week${week}`;
                                          const lectureAtt = student.attendance[lectureKey]?.[0];
                                          const labAtt = student.attendance[labKey]?.[0];
                                          
                                          // Prioritize lecture attendance, fallback to lab
                                          const attendance = lectureAtt || labAtt;
                                          
                                          return (
                                            <TableCell key={week} className="text-center">
                                              {attendance ? getStatusBadge(attendance.Status) : (
                                                <span className="text-gray-300">-</span>
                                              )}
                                            </TableCell>
                                          );
                                        })
                                      )}
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })()}
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
