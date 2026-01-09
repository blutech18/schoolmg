"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  MessageSquare,
  Users,
  TrendingUp,
  GraduationCap
} from "lucide-react";
import { toast } from "sonner";
import ViewExcuseLetterModal from "../student/components/ViewExcuseLetterModal";
import ApprovalModal from "../student/components/ApprovalModal";

interface CoordinatorStats {
  totalExcuseLetters: number;
  pendingApprovals: number;
  approvedToday: number;
  totalStudents: number;
}

interface ExcuseLetter {
  ExcuseLetterID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  Subject: string;
  SubjectCode: string;
  SubjectTitle: string;
  Reason: string;
  DateFrom: string;
  DateTo: string;
  SubmissionDate: string;
  Status: string;
  DeanStatus: string;
  CoordinatorStatus: string;
  CoordinatorComment: string;
  CoordinatorActionDate: string;
  InstructorStatus: string;
  InstructorName: string;
}


export default function CoordinatorDashboard() {
  const [stats, setStats] = useState<CoordinatorStats>({
    totalExcuseLetters: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    totalStudents: 0
  });
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");

  // Modal states
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'declined'>('approved');
  const [approvalComment, setApprovalComment] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchExcuseLetters()
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const [studentsRes, excuseLettersRes] = await Promise.all([
        fetch("/api/students", { credentials: 'include' }),
        fetch("/api/excuse-letters?role=programcoor", { credentials: 'include' })
      ]);

      const studentsData = await studentsRes.json();
      const excuseLettersData = await excuseLettersRes.json();

      // Handle both response formats
      const students = studentsData.success ? studentsData.data : (Array.isArray(studentsData) ? studentsData : []);
      const letters = excuseLettersData.success ? excuseLettersData.data : (Array.isArray(excuseLettersData) ? excuseLettersData : []);

      const pendingApprovals = letters.filter((letter: ExcuseLetter) => letter.CoordinatorStatus === 'pending').length;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const approvedToday = letters.filter((letter: ExcuseLetter) => {
        const submissionDate = new Date(letter.SubmissionDate).toISOString().split('T')[0];
        return letter.CoordinatorStatus === 'approved' && submissionDate === today;
      }).length;

      setStats({
        totalStudents: students.length,
        totalExcuseLetters: letters.length,
        pendingApprovals,
        approvedToday
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  };

  const fetchExcuseLetters = async () => {
    try {
      const response = await fetch("/api/excuse-letters?role=programcoor", { credentials: 'include' });
      const data = await response.json();
      const letters = data.success ? data.data : (Array.isArray(data) ? data : []);
      setExcuseLetters(letters);
    } catch (error) {
      console.error("Error fetching excuse letters:", error);
      toast.error("Failed to load excuse letters");
    }
  };


  const handleApprovalAction = (letter: ExcuseLetter, action: 'approved' | 'declined') => {
    setSelectedLetter(letter);
    setApprovalAction(action);
    setApprovalComment("");
    setShowApprovalModal(true);
  };

  const submitApproval = async () => {
    if (!selectedLetter) return;

    try {
      const response = await fetch("/api/excuse-letters", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          excuseLetterID: selectedLetter.ExcuseLetterID,
          userRole: "programcoor",
          status: approvalAction,
          comment: approvalComment || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Excuse letter ${approvalAction} successfully`);
        setShowApprovalModal(false);
        fetchExcuseLetters();
        fetchDashboardStats();
      } else {
        toast.error(data.error || "Failed to update excuse letter");
      }
    } catch (error) {
      console.error("Error updating excuse letter:", error);
      toast.error("Failed to update excuse letter");
    }
  };



  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", label: "Approved", icon: CheckCircle },
      declined: { color: "bg-red-100 text-red-800", label: "Declined", icon: XCircle },
      partial: { color: "bg-blue-100 text-blue-800", label: "Partial", icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getApprovalPriority = (letter: ExcuseLetter) => {
    const submissionDate = new Date(letter.SubmissionDate);
    const daysSinceSubmission = Math.floor((Date.now() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceSubmission > 3) return { priority: 'high', color: 'text-red-600' };
    if (daysSinceSubmission > 1) return { priority: 'medium', color: 'text-yellow-600' };
    return { priority: 'normal', color: 'text-green-600' };
  };



  const filteredExcuseLetters = excuseLetters.filter(letter => {
    const coordinatorStatus = letter.CoordinatorStatus || letter.Status || 'pending';
    const matchesSearch = letter.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || coordinatorStatus === statusFilter;
    const matchesCourse = courseFilter === 'all' || letter.Course === courseFilter;
    const matchesYear = yearFilter === 'all' || letter.YearLevel.toString() === yearFilter;

    return matchesSearch && matchesStatus && matchesCourse && matchesYear;
  });

  const uniqueCourses = [...new Set(excuseLetters.map(letter => letter.Course))];
  const uniqueYears = [...new Set(excuseLetters.map(letter => letter.YearLevel.toString()))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Program Coordinator Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Program Coordinator Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage excuse letter approvals and student monitoring</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Excuse Letters</CardTitle>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="all">All Excuse Letters</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Pending Excuse Letter Approvals</h2>
            <div className="w-full sm:w-auto">
              <SearchBar
                placeholder="Search students or subjects..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {excuseLetters.filter(letter => letter.CoordinatorStatus === 'pending').length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending excuse letters to review.</p>
                </CardContent>
              </Card>
            ) : (
              excuseLetters
                .filter(letter => letter.CoordinatorStatus === 'pending')
                .filter(letter =>
                  letter.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  letter.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  letter.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((letter) => {
                  const priority = getApprovalPriority(letter);
                  return (
                    <Card key={letter.ExcuseLetterID} className="border-l-4 border-l-yellow-400">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{letter.Subject}</CardTitle>
                            <CardDescription>
                              {letter.StudentName} • {letter.Course} Year {letter.YearLevel} • Section {letter.Section}
                            </CardDescription>
                            <CardDescription className="mt-1">
                              {letter.SubjectCode} - {letter.SubjectTitle} • Instructor: {letter.InstructorName}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${priority.color}`}>
                              {priority.priority} priority
                            </span>
                            {getStatusBadge(letter.CoordinatorStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-700">{letter.Reason}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Submitted: {new Date(letter.SubmissionDate).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Approval Status Section */}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium text-xs">Instructor:</span>
                                {getStatusBadge(letter.InstructorStatus || 'pending')}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 font-medium text-xs">Dean:</span>
                                {getStatusBadge(letter.DeanStatus || 'pending')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedExcuseLetter(letter);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApprovalAction(letter, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApprovalAction(letter, 'declined')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </TabsContent>

        {/* All Excuse Letters Tab */}
        <TabsContent value="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Excuse Letters</h2>
            <div className="flex items-center gap-4">
              <SearchBar
                placeholder="Search..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-48"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={year} value={year}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredExcuseLetters.map((letter) => (
              <Card key={letter.ExcuseLetterID}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{letter.Subject}</CardTitle>
                      <CardDescription>
                        {letter.StudentName} • {letter.Course} Year {letter.YearLevel} • {letter.SubjectCode}
                      </CardDescription>
                    </div>
                    {getStatusBadge(letter.CoordinatorStatus || letter.Status || 'pending')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{letter.Reason}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}</span>
                      <span>Submitted: {new Date(letter.SubmissionDate).toLocaleDateString()}</span>
                    </div>

                    {/* Approval Status Section */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium text-xs">Instructor:</span>
                          {getStatusBadge(letter.InstructorStatus || letter.Status || 'pending')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600 font-medium text-xs">Dean:</span>
                          {getStatusBadge(letter.DeanStatus || letter.Status || 'pending')}
                        </div>
                      </div>
                    </div>

                    {letter.CoordinatorComment && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                        <strong>Your Comment:</strong> {letter.CoordinatorComment}
                      </div>
                    )}

                    <div className="pt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedExcuseLetter(letter)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {(letter.CoordinatorStatus === 'pending') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction(letter, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApprovalAction(letter, 'declined')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {excuseLetters.filter(letter => letter.CoordinatorStatus !== 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Approved or declined letters
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {excuseLetters.filter(letter => letter.CoordinatorStatus !== 'pending').length > 0
                    ? Math.round((excuseLetters.filter(letter => letter.CoordinatorStatus === 'approved').length /
                      excuseLetters.filter(letter => letter.CoordinatorStatus !== 'pending').length) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Letters approved by you
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return excuseLetters.filter(letter =>
                      new Date(letter.SubmissionDate) >= oneWeekAgo
                    ).length;
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">
                  New submissions
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Current status of all excuse letters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { status: 'pending', label: 'Pending Review', color: 'bg-yellow-500', count: excuseLetters.filter(l => l.CoordinatorStatus === 'pending').length },
                    { status: 'approved', label: 'Approved', color: 'bg-green-500', count: excuseLetters.filter(l => l.CoordinatorStatus === 'approved').length },
                    { status: 'declined', label: 'Declined', color: 'bg-red-500', count: excuseLetters.filter(l => l.CoordinatorStatus === 'declined').length }
                  ].map((item) => {
                    const percentage = excuseLetters.length > 0 ? (item.count / excuseLetters.length) * 100 : 0;
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{item.count}</span>
                          <span className="text-xs text-gray-500">({percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
                <CardDescription>Excuse letters by course program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const courseStats = excuseLetters.reduce((acc, letter) => {
                      const course = letter.Course || 'Unknown Course';
                      acc[course] = (acc[course] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const courseEntries = Object.entries(courseStats)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5);

                    if (courseEntries.length === 0) {
                      return (
                        <div className="text-center py-4">
                          <GraduationCap className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No course data available</p>
                        </div>
                      );
                    }

                    return courseEntries.map(([course, count]) => {
                      const percentage = excuseLetters.length > 0 ? (count / excuseLetters.length) * 100 : 0;
                      return (
                        <div key={course} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{course}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest excuse letter submissions and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {excuseLetters.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No excuse letters available</p>
                    <p className="text-sm text-gray-500 mt-1">Recent activity will appear here</p>
                  </div>
                ) : (
                  excuseLetters
                    .sort((a, b) => new Date(b.SubmissionDate).getTime() - new Date(a.SubmissionDate).getTime())
                    .slice(0, 5)
                    .map((letter) => (
                      <div key={letter.ExcuseLetterID} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${letter.CoordinatorStatus === 'approved' ? 'bg-green-500' :
                            letter.CoordinatorStatus === 'declined' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                          <div>
                            <p className="text-sm font-medium">{letter.StudentName || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-600">
                              {letter.SubjectCode || 'N/A'} - {letter.SubjectTitle || 'Unknown Subject'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-600">
                            {letter.SubmissionDate ? new Date(letter.SubmissionDate).toLocaleDateString() : 'Unknown Date'}
                          </p>
                          <Badge variant={letter.CoordinatorStatus === 'approved' ? 'default' :
                            letter.CoordinatorStatus === 'declined' ? 'destructive' : 'secondary'}>
                            {letter.CoordinatorStatus || 'pending'}
                          </Badge>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Approval Modal */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        excuseLetter={selectedLetter}
        approvalAction={approvalAction}
        onSubmit={(comment) => {
          setApprovalComment(comment);
          submitApproval();
        }}
      />

      {/* View Excuse Letter Modal */}
      <ViewExcuseLetterModal
        isOpen={selectedExcuseLetter !== null}
        excuseLetter={selectedExcuseLetter}
        userRole="programcoor"
        onClose={() => {
          setSelectedExcuseLetter(null);
        }}
      />
    </div>
  );
}
