'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Clock,
  TrendingUp,
  Settings
} from "lucide-react";
import CoursesTable from './CoursesTable';

interface DashboardStats {
  totalCourses: number;
  activeCourses: number;
  totalStudents: number;
  activeEnrollments: number;
}

export default function CoursesDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    activeCourses: 0,
    totalStudents: 0,
    activeEnrollments: 0
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Fetch real data from APIs
      const [coursesRes, studentsRes] = await Promise.all([
        fetch('/api/courses', { credentials: 'include' }),
        fetch('/api/students', { credentials: 'include' })
      ]);

      const coursesData = coursesRes.ok ? await coursesRes.json() : [];
      const studentsData = studentsRes.ok ? await studentsRes.json() : [];

      const courses = Array.isArray(coursesData) ? coursesData : (coursesData.data || []);
      const students = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);

      setStats({
        totalCourses: courses.length,
        activeCourses: courses.filter((c: any) => c.Status === 'active').length,
        totalStudents: students.length,
        activeEnrollments: students.length
      });
    } catch (error) {
      console.error("Error loading courses stats:", error);
      setStats({
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        activeEnrollments: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Manage Courses",
      description: "Add, edit, and manage degree programs",
      icon: GraduationCap,
      href: "/dean/courses",
      color: "bg-blue-500"
    },
    {
      title: "View Students",
      description: "Manage student enrollments by course",
      icon: Users,
      href: "/dean",
      color: "bg-green-500"
    },
    {
      title: "Course Analytics",
      description: "View enrollment statistics and trends",
      icon: TrendingUp,
      href: "/dean/courses/analytics",
      color: "bg-purple-500"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Management</h1>
        <p className="text-muted-foreground">
          Manage degree programs and course offerings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting enrollments
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
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              Active student enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <action.icon className={`h-5 w-5 ${action.color.replace('bg-', 'text-')}`} />
                {action.title}
              </CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(action.href)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Course Management Table */}
      <div className="mt-8">
        <CoursesTable />
      </div>
    </div>
  );
}
