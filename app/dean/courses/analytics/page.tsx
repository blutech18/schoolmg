'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Users, 
  BookOpen,
  Award,
  BarChart3,
  ArrowLeft,
  Target,
  AlertTriangle
} from "lucide-react";

interface CourseAnalytics {
  courseCode: string;
  courseName: string;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  passRate: number;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  averageAttendance: number;
  averagePassRate: number;
  topPerformingCourse: string;
  lowestPerformingCourse: string;
}

export default function CourseAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
  const [stats, setStats] = useState<CourseStats>({
    totalCourses: 0,
    totalStudents: 0,
    averageAttendance: 0,
    averagePassRate: 0,
    topPerformingCourse: 'N/A',
    lowestPerformingCourse: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/courses-analytics', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data.analytics || []);
        setStats(result.data.stats || stats);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (passRate: number) => {
    if (passRate >= 80) return 'bg-green-500';
    if (passRate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceText = (passRate: number) => {
    if (passRate >= 80) return 'Excellent';
    if (passRate >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of course performance and student statistics
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dean/courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active degree programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across all programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Overall attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePassRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall pass rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Highlights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performing Course
            </CardTitle>
            <CardDescription>
              Course with the highest pass rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{stats.topPerformingCourse}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Needs Attention
            </CardTitle>
            <CardDescription>
              Course requiring improvement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{stats.lowestPerformingCourse}</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Course Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Course Performance Details
          </CardTitle>
          <CardDescription>
            Detailed analytics for each course program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No course data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.map((course, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{course.courseName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.courseCode}
                      </p>
                    </div>
                    <Badge 
                      className={`${getPerformanceColor(course.passRate)} text-white`}
                    >
                      {getPerformanceText(course.passRate)}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {course.totalStudents}
                      </div>
                      <div className="text-sm text-muted-foreground">Students</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {course.totalSubjects}
                      </div>
                      <div className="text-sm text-muted-foreground">Subjects</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {course.averageAttendance}%
                      </div>
                      <div className="text-sm text-muted-foreground">Attendance</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {course.passRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Pass Rate</div>
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
