"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Users, TrendingUp, Award } from "lucide-react";
import { toast } from "sonner";

interface CourseAnalytics {
  courseCode: string;
  courseName: string;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  passRate: number;
  department: string;
}

export default function DeanCoursesAnalyticsPage() {
  const [coursesAnalytics, setCoursesAnalytics] = useState<CourseAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("courseName");

  useEffect(() => {
    fetchCoursesAnalytics();
  }, []);

  const fetchCoursesAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dean/courses-analytics");
      const data = await response.json();

      if (data.success) {
        setCoursesAnalytics(data.data);
      } else {
        console.error("Failed to fetch courses analytics:", data.error);
        toast.error("Failed to load courses analytics");
      }
    } catch (error) {
      console.error("Error fetching courses analytics:", error);
      toast.error("Failed to load courses analytics");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCourses = coursesAnalytics
    .filter(course => {
      const matchesSearch = course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.courseCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'courseName':
          return a.courseName.localeCompare(b.courseName);
        case 'courseCode':
          return a.courseCode.localeCompare(b.courseCode);
        case 'totalStudents':
          return b.totalStudents - a.totalStudents;
        case 'averageAttendance':
          return b.averageAttendance - a.averageAttendance;
        case 'passRate':
          return b.passRate - a.passRate;
        default:
          return 0;
      }
    });

  const uniqueDepartments = [...new Set(coursesAnalytics.map(course => course.department))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Courses Analytics</h1>
          <p className="text-gray-600 mt-1">Performance analytics by course program</p>
        </div>
        <Button onClick={fetchCoursesAnalytics} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Summary Cards */}
      {coursesAnalytics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesAnalytics.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursesAnalytics.reduce((sum, course) => sum + course.totalStudents, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(coursesAnalytics.reduce((sum, course) => sum + course.averageAttendance, 0) / coursesAnalytics.length)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(coursesAnalytics.reduce((sum, course) => sum + course.passRate, 0) / coursesAnalytics.length)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search and Filter Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by course name or code..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(department => (
                    <SelectItem key={`department-${department}`} value={department}>{department}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courseName">Course Name</SelectItem>
                  <SelectItem value="courseCode">Course Code</SelectItem>
                  <SelectItem value="totalStudents">Total Students</SelectItem>
                  <SelectItem value="averageAttendance">Average Attendance</SelectItem>
                  <SelectItem value="passRate">Pass Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading courses analytics...</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedCourses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No courses found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedCourses.map((course, index) => (
            <Card key={`course-${course.courseCode}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{course.courseName} ({course.courseCode})</span>
                  <Badge variant="outline">{course.department}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{course.totalStudents}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{course.totalSubjects}</div>
                    <div className="text-sm text-gray-600">Total Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{course.averageAttendance}%</div>
                    <div className="text-sm text-gray-600">Avg Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{course.passRate}%</div>
                    <div className="text-sm text-gray-600">Pass Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}