"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import {
  Users, GraduationCap, BookOpen, Activity, Target, RefreshCw, Download
} from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

// Types
interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalSubjects: number;
  averageAttendance: number;
  passRate: number;
  failRate: number;
  atRiskStudents: number;
  averageGrade: number;
}

interface CourseData {
  name: string;
  students: number;
  attendance: number;
  passRate?: number;
}

interface AttendanceData {
  month: string;
  attendance: number;
}

interface GradeDistribution {
  grade: string;
  range: string;
  count: number;
  percentage: number;
  [key: string]: string | number; // Index signature for recharts compatibility
}

interface SubjectPerformance {
  name: string;
  averageGrade: number;
  passRate: number;
  students: number;
}

interface SubjectEnrollment {
  name: string;
  students: number;
  sections: number;
}

interface AttendanceStatus {
  status: string;
  count: number;
  percentage: number;
  [key: string]: string | number; // Index signature for recharts compatibility
}

export default function DeanAnalyticsPage() {
  // State management
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [schoolYear, setSchoolYear] = useState('all');
  const [semester, setSemester] = useState('1st');
  const [yearLevel, setYearLevel] = useState('all');

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalSubjects: 0,
    averageAttendance: 0,
    passRate: 0,
    failRate: 0,
    atRiskStudents: 0,
    averageGrade: 0
  });
  
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformance[]>([]);
  const [subjectEnrollment, setSubjectEnrollment] = useState<SubjectEnrollment[]>([]);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus[]>([]);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);
  const [yearLevels, setYearLevels] = useState<number[]>([]);

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [schoolYear, semester, yearLevel]);

  const fetchSchoolYears = async () => {
    try {
      const response = await fetch('/api/dean/filter-options');
      const data = await response.json();
      if (data.success) {
        setSchoolYears(data.data.schoolYears || []);
        setYearLevels(data.data.yearLevels || []);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchCourseData(),
        fetchAttendanceData(),
        fetchGradeDistribution(),
        fetchSubjectPerformance(),
        fetchSubjectEnrollment(),
        fetchAttendanceStatus()
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      brandedToast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Build query parameters
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });

      // Fetch filtered course and subject data
      const [coursesRes, subjectsRes] = await Promise.all([
        fetch(`/api/dean/courses-analytics?${params}`),
        fetch(`/api/dean/subjects-analytics?${params}`)
      ]);

      const coursesData = await coursesRes.json();
      const subjectsData = await subjectsRes.json();

      // Calculate stats from the filtered data
      let totalStudents = 0;
      let totalAttendanceSum = 0;
      let totalPassRate = 0;
      let totalFailRate = 0;
      let courseCount = 0;
      let atRiskCount = 0;

      if (coursesData.success && Array.isArray(coursesData.data)) {
        coursesData.data.forEach((course: any) => {
          totalStudents += course.totalStudents || 0;
          totalAttendanceSum += (course.averageAttendance || 0) * (course.totalStudents || 0);
          totalPassRate += course.passRate || 0;
          totalFailRate += (100 - (course.passRate || 0));
          courseCount++;
          
          // Students with attendance < 75% or pass rate < 50% are at risk
          if (course.averageAttendance < 75 || course.passRate < 50) {
            atRiskCount += course.totalStudents || 0;
          }
        });
      }

      // Calculate weighted average attendance
      const averageAttendance = totalStudents > 0 
        ? totalAttendanceSum / totalStudents 
        : 0;

      // Calculate average pass/fail rates
      const avgPassRate = courseCount > 0 ? totalPassRate / courseCount : 0;
      const avgFailRate = courseCount > 0 ? totalFailRate / courseCount : 0;

      // Calculate average grade from subjects
      let totalGradeSum = 0;
      let subjectCount = 0;
      if (subjectsData.success && Array.isArray(subjectsData.data)) {
        subjectsData.data.forEach((subject: any) => {
          if (subject.averageGrade > 0) {
            totalGradeSum += subject.averageGrade;
            subjectCount++;
          }
        });
      }
      const averageGrade = subjectCount > 0 ? totalGradeSum / subjectCount : 0;

      setDashboardStats({
        totalStudents: totalStudents,
        totalCourses: coursesData.success ? coursesData.data.length : 0,
        totalSubjects: subjectsData.success ? subjectsData.data.length : 0,
        averageAttendance: Math.round(averageAttendance * 10) / 10,
        passRate: Math.round(avgPassRate * 10) / 10,
        failRate: Math.round(avgFailRate * 10) / 10,
        atRiskStudents: atRiskCount,
        averageGrade: Math.round(averageGrade * 100) / 100
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Set default values on error
      setDashboardStats({
        totalStudents: 0,
        totalCourses: 0,
        totalSubjects: 0,
        averageAttendance: 0,
        passRate: 0,
        failRate: 0,
        atRiskStudents: 0,
        averageGrade: 0
      });
    }
  };

  const fetchCourseData = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/courses-analytics?${params}`);
      const data = await response.json();
      if (data.success) {
        const courseData = data.data.map((course: any) => ({
          name: course.courseCode,
          students: course.totalStudents,
          attendance: course.averageAttendance,
          passRate: course.passRate
        }));
        setCourseData(courseData);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const fetchSubjectPerformance = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/subjects-analytics?${params}`);
      const data = await response.json();
      if (data.success) {
        const subjectData = data.data
          .filter((subject: any) => subject.totalStudents > 0)
          .map((subject: any) => ({
            name: subject.subjectCode,
            averageGrade: subject.averageGrade || 0,
            passRate: subject.averageGrade <= 3.0 ? 100 : 0, // Simplified pass rate based on average
            students: subject.totalStudents
          }))
          .sort((a: any, b: any) => b.passRate - a.passRate)
          .slice(0, 10); // Top 10 subjects
        
        setSubjectPerformance(subjectData);
      }
    } catch (error) {
      console.error("Error fetching subject performance:", error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/attendance-stats?${params}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setAttendanceData(data.data);
      } else {
        // Fallback to empty data if API fails
        setAttendanceData([]);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      // Set empty data on error
      setAttendanceData([]);
    }
  };

  const fetchGradeDistribution = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/grade-distribution?${params}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setGradeDistribution(data.data);
      } else {
        // Fallback to empty data if API fails
        setGradeDistribution([]);
      }
    } catch (error) {
      console.error("Error fetching grade distribution:", error);
      // Set empty data on error
      setGradeDistribution([]);
    }
  };

  const fetchSubjectEnrollment = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/subjects-analytics?${params}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const subjectData = data.data
          .filter((subject: any) => subject.totalStudents > 0)
          .map((subject: any) => ({
            name: subject.subjectCode,
            students: subject.totalStudents,
            sections: subject.totalSchedules || 1
          }))
          .sort((a: any, b: any) => b.students - a.students)
          .slice(0, 15); // Top 15 subjects by enrollment
        
        setSubjectEnrollment(subjectData);
      } else {
        setSubjectEnrollment([]);
      }
    } catch (error) {
      console.error("Error fetching subject enrollment:", error);
      setSubjectEnrollment([]);
    }
  };

  const fetchAttendanceStatus = async () => {
    try {
      const params = new URLSearchParams({
        schoolYear,
        semester,
        ...(yearLevel !== 'all' && { yearLevel })
      });
      
      const response = await fetch(`/api/dean/attendance-overview?${params}`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.attendanceByStatus) {
        // Extract attendance status from the API response
        const statusData = data.data.attendanceByStatus;
        
        // Convert to array format for charts
        const statusArray = [
          { status: 'Present', count: statusData.present || 0 },
          { status: 'Absent', count: statusData.absent || 0 },
          { status: 'Late', count: statusData.late || 0 },
          { status: 'Excused', count: statusData.excused || 0 }
        ].filter(item => item.count > 0); // Only show statuses with data

        const total = statusArray.reduce((sum, item) => sum + item.count, 0);
        
        const statusWithPercentage = statusArray.map(item => ({
          ...item,
          percentage: total > 0 ? Math.round((item.count / total) * 100 * 10) / 10 : 0
        }));

        setAttendanceStatus(statusWithPercentage);
      } else {
        setAttendanceStatus([]);
      }
    } catch (error) {
      console.error("Error fetching attendance status:", error);
      setAttendanceStatus([]);
    }
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleExport = () => {
    brandedToast.info("Export functionality coming soon!");
  };

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Academic performance and enrollment overview</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Academic performance and enrollment overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">School Year:</label>
              <Select value={schoolYear} onValueChange={setSchoolYear}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {schoolYears.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Semester:</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                  <SelectItem value="summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Year Level:</label>
              <Select value={yearLevel} onValueChange={setYearLevel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {yearLevels.map((level) => (
                    <SelectItem key={level} value={String(level)}>Year {level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-blue-600">{dashboardStats.totalStudents.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-3xl font-bold text-green-600">{dashboardStats.totalCourses}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-3xl font-bold text-purple-600">{dashboardStats.totalSubjects}</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-3xl font-bold text-orange-600">{dashboardStats.averageAttendance}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                <p className="text-3xl font-bold text-green-600">{dashboardStats.passRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Average across courses</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fail Rate</p>
                <p className="text-3xl font-bold text-red-600">{dashboardStats.failRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Average across courses</p>
              </div>
              <Target className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
                <p className="text-3xl font-bold text-yellow-600">{dashboardStats.atRiskStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Low attendance or grades</p>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Grade</p>
                <p className="text-3xl font-bold text-indigo-600">{dashboardStats.averageGrade.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Overall performance</p>
              </div>
              <GraduationCap className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Students by Course</CardTitle>
          </CardHeader>
          <CardContent>
            {courseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="students" fill="#3B82F6" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No course data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Attendance']} />
                  <Legend />
                  <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No attendance data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ grade, range, percentage }) => `${grade} (${range}): ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} students (${props.payload.percentage}%)`,
                        `${props.payload.grade} (${props.payload.range})`
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {gradeDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700">
                        {item.grade} ({item.range}): {item.count} students
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No grade data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Course Attendance Rates</CardTitle>
          </CardHeader>
          <CardContent>
            {courseData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={courseData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                  />
                  <Legend />
                  <Bar dataKey="attendance" fill="#F59E0B" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No attendance data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      {subjectPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={subjectPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any, name: any) => {
                    if (name === 'averageGrade') return [value.toFixed(2), 'Avg Grade'];
                    if (name === 'passRate') return [`${value}%`, 'Pass Rate'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar dataKey="passRate" fill="#10B981" name="Pass Rate %" />
                <Bar dataKey="students" fill="#3B82F6" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Subject Enrollment and Average Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Enrollment Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Enrollment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectEnrollment.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={subjectEnrollment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === 'students') return [value, 'Students'];
                      if (name === 'sections') return [value, 'Sections'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="students" fill="#8B5CF6" name="Students" />
                  <Bar dataKey="sections" fill="#F59E0B" name="Sections" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No subject enrollment data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Average Grades Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Average Grades</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={subjectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    formatter={(value: any, name: any) => {
                      if (name === 'averageGrade') return [value.toFixed(2), 'Average Grade'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="averageGrade" fill="#3B82F6" name="Average Grade">
                    {subjectPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.averageGrade <= 3.0 ? '#10B981' : '#EF4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No subject grade data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {attendanceStatus.map((entry, index) => {
                        const colorMap: { [key: string]: string } = {
                          'Present': '#10B981',
                          'Absent': '#EF4444',
                          'Late': '#F59E0B',
                          'Excused': '#3B82F6'
                        };
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colorMap[entry.status] || COLORS[index % COLORS.length]} 
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value} records (${props.payload.percentage}%)`,
                        props.payload.status
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {attendanceStatus.map((item, index) => {
                    const colorMap: { [key: string]: string } = {
                      'Present': '#10B981',
                      'Absent': '#EF4444',
                      'Late': '#F59E0B',
                      'Excused': '#3B82F6'
                    };
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: colorMap[item.status] || COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-gray-700">
                          {item.status}: {item.count} ({item.percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No attendance status data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${value} records (${props.payload.percentage}%)`,
                      'Count'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Records">
                    {attendanceStatus.map((entry, index) => {
                      const colorMap: { [key: string]: string } = {
                        'Present': '#10B981',
                        'Absent': '#EF4444',
                        'Late': '#F59E0B',
                        'Excused': '#3B82F6'
                      };
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colorMap[entry.status] || COLORS[index % COLORS.length]} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No attendance status data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
