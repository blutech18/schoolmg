"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface DashboardStats {
  totalStudents: number;
  totalExcuseLetters: number;
  pendingApprovals: number;
  averageAttendance: number;
  presentRate: number;
  absentRate: number;
  excusedRate: number;
  lateRate: number;
  dropRate: number;
  failedAttendanceRate: number;
}

export default function DeanDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExcuseLetters: 0,
    pendingApprovals: 0,
    averageAttendance: 0,
    presentRate: 0,
    absentRate: 0,
    excusedRate: 0,
    lateRate: 0,
    dropRate: 0,
    failedAttendanceRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await fetchDashboardStats();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      brandedToast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      // Fetch various statistics
      const [studentsRes, excuseLettersRes, attendanceStatsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/excuse-letters?role=dean"),
        fetch("/api/dean/attendance-stats")
      ]);

      const studentsData = await studentsRes.json();
      const excuseLettersData = await excuseLettersRes.json();
      const attendanceStatsData = await attendanceStatsRes.json();

      const pendingApprovals = excuseLettersData.success ?
        excuseLettersData.data.filter((letter: any) => letter.DeanStatus === 'pending').length : 0;

      // Calculate real average attendance from the stats API
      const averageAttendance = attendanceStatsData.success && attendanceStatsData.data.averageAttendance
        ? Math.round(attendanceStatsData.data.averageAttendance * 10) / 10
        : 0;

      // Calculate percentage rates for each attendance type
      const totalRecords = attendanceStatsData.success ? attendanceStatsData.data.totalRecords || 0 : 0;
      const presentRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.presentRecords / totalRecords) * 1000) / 10 : 0;
      const absentRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.absentRecords / totalRecords) * 1000) / 10 : 0;
      const excusedRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.excusedRecords / totalRecords) * 1000) / 10 : 0;
      const lateRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.lateRecords / totalRecords) * 1000) / 10 : 0;
      const dropRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.dropRecords / totalRecords) * 1000) / 10 : 0;
      const failedAttendanceRate = totalRecords > 0 ? Math.round((attendanceStatsData.data.failedAttendanceRecords / totalRecords) * 1000) / 10 : 0;

      setStats({
        totalStudents: Array.isArray(studentsData) ? studentsData.length : 0,
        totalExcuseLetters: excuseLettersData.success ? excuseLettersData.data.length : 0,
        pendingApprovals,
        averageAttendance,
        presentRate,
        absentRate,
        excusedRate,
        lateRate,
        dropRate,
        failedAttendanceRate
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Set fallback values on error
      setStats(prev => ({
        ...prev,
        averageAttendance: 0
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Dean Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dean Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor student performance and manage approvals</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excuse Letters</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExcuseLetters}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Breakdown - Full Width Row */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Attendance Breakdown</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <span className="text-green-600 font-medium text-sm">Present</span>
              <span className="text-xl font-bold text-green-700">{stats.presentRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <span className="text-red-600 font-medium text-sm">Absent</span>
              <span className="text-xl font-bold text-red-700">{stats.absentRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <span className="text-blue-600 font-medium text-sm">Excused</span>
              <span className="text-xl font-bold text-blue-700">{stats.excusedRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <span className="text-yellow-600 font-medium text-sm">Late</span>
              <span className="text-xl font-bold text-yellow-700">{stats.lateRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
              <span className="text-purple-600 font-medium text-sm">Drop</span>
              <span className="text-xl font-bold text-purple-700">{stats.dropRate || 0}%</span>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <span className="text-orange-600 font-medium text-sm">Failed Att.</span>
              <span className="text-xl font-bold text-orange-700">{stats.failedAttendanceRate || 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/dean/excuse-letters'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground mt-1">Excuse letters awaiting review</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/dean/student-performance'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Student Performance</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Total enrolled students</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/dean/attendance-overview'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall attendance average</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Overview - Consolidated View */}
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-2 border-blue-200 bg-blue-50" onClick={() => window.location.href = '/dean/section-overview'}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">📊 Section Overview (Consolidated)</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">View all sections with subjects and students in one place</p>
          <p className="text-xs text-blue-600 mt-2 font-medium">Filter by Course → Year → Section → Subjects</p>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Excuse Letters</span>
              <span className="font-semibold">{stats.totalExcuseLetters}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="font-semibold text-yellow-600">{stats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Attendance</span>
              <span className="font-semibold text-green-600">{stats.averageAttendance}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => window.location.href = '/dean/excuse-letters'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium">Review Excuse Letters</div>
                  <div className="text-sm text-gray-500">{stats.pendingApprovals} pending</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/dean/student-performance'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">Student Performance</div>
                  <div className="text-sm text-gray-500">Monitor academic progress</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => window.location.href = '/dean/grades'}
              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="font-medium">Grading Sheets</div>
                  <div className="text-sm text-gray-500">Access all grading sheets</div>
                </div>
              </div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}