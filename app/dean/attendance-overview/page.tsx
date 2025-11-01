"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, UserCheck, UserX, Clock, Shield, UserMinus, XCircle, Activity, TrendingUp, GraduationCap, BookOpen, Calendar, CheckCircle, AlertCircle, Search, Filter } from "lucide-react";
import { toast } from "sonner";

interface AttendanceOverview {
  totalRecords: number;
  attendanceByStatus: {
    present: number;
    absent: number;
    excused: number;
    late: number;
    dropped: number;
    failed: number;
  };
  attendanceBySession: Array<{
    sessionNumber: number;
    sessionType: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  attendanceByCourse: Array<{
    course: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  attendanceBySubject: Array<{
    subjectCode: string;
    subjectName: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  recentActivity: Array<{
    date: string;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    rate: number;
  }>;
  lowAttendanceAlerts: Array<{
    studentName: string;
    course: string;
    subjectCode: string;
    attendanceRate: number;
    totalRecords: number;
    presentCount: number;
  }>;
}

interface DetailedAttendanceRecord {
  AttendanceID: number;
  StudentName: string;
  StudentNumber: string;
  Course: string;
  YearLevel: number;
  Section: string;
  SubjectCode: string;
  SubjectName: string;
  InstructorName: string;
  ScheduleID: number;
  SessionNumber: number;
  SessionType: string;
  Day: string;
  Time: string;
  Room: string;
  Date: string;
  Status: string;
  Remarks: string;
}

export default function DeanAttendanceOverviewPage() {
  const [attendanceOverview, setAttendanceOverview] = useState<AttendanceOverview | null>(null);
  const [detailedRecords, setDetailedRecords] = useState<DetailedAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");

  useEffect(() => {
    fetchAttendanceOverview();
    fetchDetailedRecords();
  }, []);

  const fetchAttendanceOverview = async () => {
    try {
      const response = await fetch("/api/dean/attendance-overview");
      const data = await response.json();

      if (data.success) {
        setAttendanceOverview(data.data);
      } else {
        console.error("Failed to fetch attendance overview:", data.error);
        toast.error("Failed to load attendance overview data");
      }
    } catch (error) {
      console.error("Error fetching attendance overview:", error);
      toast.error("Failed to load attendance overview data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedRecords = async () => {
    try {
      setLoadingDetails(true);
      const response = await fetch("/api/attendance");
      const data = await response.json();

      if (data.success) {
        setDetailedRecords(data.data);
      } else {
        console.error("Failed to fetch detailed attendance records:", data.error);
        toast.error("Failed to load detailed attendance records");
      }
    } catch (error) {
      console.error("Error fetching detailed attendance records:", error);
      toast.error("Failed to load detailed attendance records");
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'P': { color: "bg-green-100 text-green-800", label: "Present" },
      'A': { color: "bg-red-100 text-red-800", label: "Absent" },
      'L': { color: "bg-yellow-100 text-yellow-800", label: "Late" },
      'E': { color: "bg-blue-100 text-blue-800", label: "Excused" },
      'D': { color: "bg-orange-100 text-orange-800", label: "Dropped" },
      'FA': { color: "bg-red-200 text-red-900", label: "Failed" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['A'];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const filteredRecords = detailedRecords.filter(record => {
    const matchesSearch = record.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.StudentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.SubjectName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.Status === statusFilter;
    const matchesCourse = courseFilter === 'all' || record.Course === courseFilter;
    const matchesSubject = subjectFilter === 'all' || record.SubjectCode === subjectFilter;
    const matchesInstructor = instructorFilter === 'all' || record.InstructorName === instructorFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesSubject && matchesInstructor;
  });

  const uniqueCourses = [...new Set(detailedRecords.map(record => record.Course))];
  const uniqueSubjects = [...new Set(detailedRecords.map(record => record.SubjectCode))];
  const uniqueInstructors = [...new Set(detailedRecords.map(record => record.InstructorName))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Attendance Overview...</p>
        </div>
      </div>
    );
  }

  if (!attendanceOverview) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Failed to load attendance overview data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Overview</h1>
          <p className="text-gray-600 mt-1">Comprehensive attendance analytics and insights</p>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceOverview.totalRecords.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {attendanceOverview.attendanceByStatus.present.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.present / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {attendanceOverview.attendanceByStatus.absent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.absent / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {attendanceOverview.attendanceByStatus.late.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.late / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {attendanceOverview.attendanceByStatus.excused.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.excused / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dropped</CardTitle>
            <UserMinus className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {attendanceOverview.attendanceByStatus.dropped.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.dropped / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {attendanceOverview.attendanceByStatus.failed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceOverview.totalRecords > 0
                ? Math.round((attendanceOverview.attendanceByStatus.failed / attendanceOverview.totalRecords) * 100)
                : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Present (P)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Absent (A)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Late (L)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Excused (E)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Dropped (D)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-800 rounded-full"></div>
              <span>Failed (FA)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Detailed Attendance Records
              </CardTitle>
              <CardDescription>All attendance records with detailed information</CardDescription>
            </div>
            <Button onClick={fetchDetailedRecords} disabled={loadingDetails} variant="outline" size="sm">
              {loadingDetails ? "Loading..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col xl:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <SearchBar
                  placeholder="Search by student name, number, subject code, or subject name..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="P">Present</SelectItem>
                    <SelectItem value="A">Absent</SelectItem>
                    <SelectItem value="L">Late</SelectItem>
                    <SelectItem value="E">Excused</SelectItem>
                    <SelectItem value="D">Dropped</SelectItem>
                    <SelectItem value="FA">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {uniqueCourses.map(course => (
                      <SelectItem key={`course-${course}`} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueSubjects.map(subject => (
                      <SelectItem key={`subject-${subject}`} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {uniqueInstructors.map(instructor => (
                      <SelectItem key={`instructor-${instructor}`} value={instructor}>{instructor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Records Table */}
          {loadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading detailed records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Showing {filteredRecords.length} of {detailedRecords.length} records
              </div>
              
              <div className="grid gap-4">
                {filteredRecords.map((record) => (
                  <div key={record.AttendanceID} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.StudentName}</div>
                        <div className="text-xs text-gray-600">{record.StudentNumber}</div>
                        <div className="text-xs text-gray-500">{record.Course} - Year {record.YearLevel} - Section {record.Section}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.SubjectCode}</div>
                        <div className="text-xs text-gray-600">{record.SubjectName}</div>
                        <div className="text-xs text-gray-500">Instructor: {record.InstructorName}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-900">Schedule</div>
                        <div className="text-xs text-gray-600">{record.Day} {record.Time}</div>
                        <div className="text-xs text-gray-500">Room: {record.Room}</div>
                        <div className="text-xs text-gray-500">Session {record.SessionNumber} ({record.SessionType})</div>
                      </div>
                      
                      <div className="flex flex-col justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {new Date(record.Date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(record.Status)}
                          </div>
                        </div>
                        {record.Remarks && (
                          <div className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Remarks:</span> {record.Remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Performance
          </CardTitle>
          <CardDescription>Top subjects by attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceOverview.attendanceBySubject.length === 0 ? (
              <div className="text-center py-4">
                <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No subject attendance data available</p>
              </div>
            ) : (
              attendanceOverview.attendanceBySubject.slice(0, 6).map((subject, index) => (
                <div key={`${subject.subjectCode}-${subject.subjectName}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{subject.subjectCode || 'Unknown Code'}</div>
                    <div className="text-xs text-gray-600 truncate">{subject.subjectName || 'Unknown Subject'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      (subject.rate || 0) >= 85 ? 'text-green-600' :
                      (subject.rate || 0) >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {subject.rate || 0}%
                    </div>
                    <div className="text-xs text-gray-500">{subject.total || 0} records</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity (Last 7 Days)
          </CardTitle>
          <CardDescription>Daily attendance recording activity</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceOverview.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent attendance activity</p>
              <p className="text-sm text-gray-500 mt-1">Attendance records will appear here once recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {attendanceOverview.recentActivity.map((activity, index) => (
                <div key={`activity-${activity.date}-${index}`} className="p-4 border rounded-lg">
                  <div className="text-sm font-medium">
                    {activity.date ? new Date(activity.date).toLocaleDateString() : 'Unknown Date'}
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-bold">{activity.rate || 0}%</div>
                    <div className="text-xs text-gray-600">
                      {activity.presentCount || 0} present, {activity.absentCount || 0} absent
                    </div>
                    <div className="text-xs text-gray-500">
                      {activity.totalRecords || 0} total records
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
