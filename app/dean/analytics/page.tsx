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
}

interface CourseData {
  name: string;
  students: number;
  attendance: number;
}

interface AttendanceData {
  month: string;
  attendance: number;
}

interface GradeDistribution {
  grade: string;
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

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalCourses: 0,
    totalSubjects: 0,
    averageAttendance: 0
  });
  
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [schoolYears, setSchoolYears] = useState<string[]>([]);

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [schoolYear, semester]);

  const fetchSchoolYears = async () => {
    try {
      const response = await fetch('/api/dean/filter-options');
      const data = await response.json();
      if (data.success) {
        setSchoolYears(data.data.schoolYears || []);
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
        fetchGradeDistribution()
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
      // Fetch filtered course and subject data
      const [coursesRes, subjectsRes] = await Promise.all([
        fetch(`/api/dean/courses-analytics?schoolYear=${schoolYear}&semester=${semester}`),
        fetch(`/api/dean/subjects-analytics?schoolYear=${schoolYear}&semester=${semester}`)
      ]);

      const coursesData = await coursesRes.json();
      const subjectsData = await subjectsRes.json();

      // Calculate stats from the filtered data
      let totalStudents = 0;
      let totalAttendanceSum = 0;
      let courseCount = 0;

      if (coursesData.success && Array.isArray(coursesData.data)) {
        coursesData.data.forEach((course: any) => {
          totalStudents += course.totalStudents || 0;
          totalAttendanceSum += (course.averageAttendance || 0) * (course.totalStudents || 0);
          courseCount++;
        });
      }

      // Calculate weighted average attendance
      const averageAttendance = totalStudents > 0 
        ? totalAttendanceSum / totalStudents 
        : 0;

      setDashboardStats({
        totalStudents: totalStudents,
        totalCourses: coursesData.success ? coursesData.data.length : 0,
        totalSubjects: subjectsData.success ? subjectsData.data.length : 0,
        averageAttendance: Math.round(averageAttendance * 10) / 10
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Set default values on error
      setDashboardStats({
        totalStudents: 0,
        totalCourses: 0,
        totalSubjects: 0,
        averageAttendance: 0
      });
    }
  };

  const fetchCourseData = async () => {
    try {
      const response = await fetch(`/api/dean/courses-analytics?schoolYear=${schoolYear}&semester=${semester}`);
      const data = await response.json();
      if (data.success) {
        const courseData = data.data.map((course: any) => ({
          name: course.courseCode,
          students: course.totalStudents,
          attendance: course.averageAttendance
        }));
        setCourseData(courseData);
      }
    } catch (error) {
      console.error("Error fetching course data:", error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      // Mock attendance trend data - replace with actual API call
      const mockData = [
        { month: 'Jan', attendance: 85 },
        { month: 'Feb', attendance: 88 },
        { month: 'Mar', attendance: 82 },
        { month: 'Apr', attendance: 90 },
        { month: 'May', attendance: 87 },
        { month: 'Jun', attendance: 89 }
      ];
      setAttendanceData(mockData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  const fetchGradeDistribution = async () => {
    try {
      // Mock grade distribution data - replace with actual API call
      const mockData = [
        { grade: 'Excellent (1.0-1.5)', count: 120, percentage: 25 },
        { grade: 'Very Good (1.75-2.25)', count: 180, percentage: 37 },
        { grade: 'Good (2.5-3.0)', count: 150, percentage: 31 },
        { grade: 'Failed (5.0)', count: 35, percentage: 7 }
      ];
      setGradeDistribution(mockData);
    } catch (error) {
      console.error("Error fetching grade distribution:", error);
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
          <div className="flex items-center gap-4">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Enrollment Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Students by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="attendance" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Course Attendance Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={courseData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="attendance" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
