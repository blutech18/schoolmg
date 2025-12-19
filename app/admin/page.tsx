"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  BarChart3,
  Settings,
  UserCheck,
  Clock,
  TrendingUp,
  Award
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalInstructors: number;
  totalSchedules: number;
  totalSubjects: number;
  activeEnrollments: number;
}

interface RecentActivity {
  id: string;
  type: 'enrollment' | 'schedule' | 'excuse_letter' | 'grade';
  title: string;
  description: string;
  timestamp: string;
  color: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'info' | 'error';
  title: string;
  description: string;
  count?: number;
  actionRequired: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalSchedules: 0,
    totalSubjects: 0,
    activeEnrollments: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadDashboardStats(),
        loadRecentActivity(),
        loadSystemAlerts()
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Fetch real data from APIs
      const [studentsRes, usersRes, schedulesRes] = await Promise.all([
        fetch('/api/students', { credentials: 'include' }),
        fetch('/api/users', { credentials: 'include' }),
        fetch('/api/schedules', { credentials: 'include' })
      ]);

      // Handle API responses with proper data validation
      const studentsData = studentsRes.ok ? await studentsRes.json() : [];
      const usersData = usersRes.ok ? await usersRes.json() : [];
      const schedulesData = schedulesRes.ok ? await schedulesRes.json() : [];

      // Extract arrays from API responses (handle both direct arrays and {success, data} format)
      const students = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);
      const users = Array.isArray(usersData) ? usersData : (usersData.data || []);
      const schedules = Array.isArray(schedulesData) ? schedulesData : (schedulesData.data || []);

      // Calculate stats from real data with safety checks
      const instructors = Array.isArray(users) ? users.filter((user: any) => user.Role === 'instructor') : [];

      setStats({
        totalStudents: students.length,
        totalInstructors: instructors.length,
        totalSchedules: schedules.length,
        totalSubjects: new Set(schedules.map((s: any) => s.SubjectCode)).size,
        activeEnrollments: students.length // Approximation for now
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      // Fallback to default values on error
      setStats({
        totalStudents: 0,
        totalInstructors: 0,
        totalSchedules: 0,
        totalSubjects: 0,
        activeEnrollments: 0
      });
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Fetch recent enrollments
      const enrollmentsRes = await fetch('/api/enrollments?limit=5', { credentials: 'include' });
      const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : { data: [] };
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData.data || []);

      const activities: RecentActivity[] = [];

      // Add recent enrollments
      enrollments.slice(0, 5).forEach((enrollment: any, index: number) => {
        activities.push({
          id: `enrollment-${enrollment.EnrollmentID || index}`,
          type: 'enrollment',
          title: 'New student enrollment',
          description: `${enrollment.StudentName || 'Student'} enrolled in ${enrollment.SubjectCode || 'course'} - ${getTimeAgo(enrollment.EnrollmentDate)}`,
          timestamp: enrollment.EnrollmentDate || new Date().toISOString(),
          color: 'bg-green-500'
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const alerts: SystemAlert[] = [];

      // Add system info alert
      alerts.push({
        id: 'system-update',
        type: 'info',
        title: 'System Update',
        description: 'Dashboard now shows real-time data',
        actionRequired: false
      });

      setSystemAlerts(alerts);
    } catch (error) {
      console.error("Error loading system alerts:", error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'recently';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const quickActions = [
    {
      title: "Manage Students",
      description: "Add, edit, and manage student records",
      icon: Users,
      href: "/admin/students",
      color: "bg-blue-500"
    },
    {
      title: "Manage Instructors",
      description: "Add, edit, and manage instructor records",
      icon: UserCheck,
      href: "/admin/instructors",
      color: "bg-green-500"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome to the City College of Angeles Management System</p>
      </div>
      <div className="border-b border-gray-200"></div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instructors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInstructors}</div>
            <p className="text-xs text-muted-foreground">
              Active faculty members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchedules}</div>
            <p className="text-xs text-muted-foreground">
              Active class schedules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Available subjects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2 hover:shadow-md transition-shadow"
                  onClick={() => router.push(action.href)}
                >
                  <div className={`p-2 rounded-full ${action.color} text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="reports">Quick Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 ${activity.color} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemAlerts.length > 0 ? (
                  systemAlerts.map((alert) => {
                    const bgColor = alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                   alert.type === 'error' ? 'bg-red-50 border-red-200' :
                                   'bg-blue-50 border-blue-200';
                    const dotColor = alert.type === 'warning' ? 'bg-yellow-500' :
                                    alert.type === 'error' ? 'bg-red-500' :
                                    'bg-blue-500';
                    const textColor = alert.type === 'warning' ? 'text-yellow-800' :
                                     alert.type === 'error' ? 'text-red-800' :
                                     'text-blue-800';
                    const descColor = alert.type === 'warning' ? 'text-yellow-600' :
                                     alert.type === 'error' ? 'text-red-600' :
                                     'text-blue-600';
                    const badgeColor = alert.type === 'warning' ? 'text-yellow-700 border-yellow-300' :
                                      alert.type === 'error' ? 'text-red-700 border-red-300' :
                                      'text-blue-700 border-blue-300';

                    return (
                      <div key={alert.id} className={`flex items-center space-x-4 p-3 ${bgColor} border rounded-lg`}>
                        <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${textColor}`}>{alert.title}</p>
                          <p className={`text-xs ${descColor}`}>{alert.description}</p>
                        </div>
                        <Badge variant="outline" className={badgeColor}>
                          {alert.actionRequired ? 'Action Required' : 'Info'}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No system alerts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
              <CardDescription>Generate common reports and analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex flex-col"
                  onClick={() => router.push('/admin/enrollments')}
                >
                  <BarChart3 className="h-5 w-5 mb-1" />
                  <span className="text-sm">Enrollment Report</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col"
                  onClick={() => router.push('/admin/grades')}
                >
                  <FileText className="h-5 w-5 mb-1" />
                  <span className="text-sm">Grade Summary</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col"
                  onClick={() => router.push('/admin/students')}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm">Student Analytics</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex flex-col"
                  onClick={() => router.push('/admin/schedules')}
                >
                  <Calendar className="h-5 w-5 mb-1" />
                  <span className="text-sm">Schedule Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
