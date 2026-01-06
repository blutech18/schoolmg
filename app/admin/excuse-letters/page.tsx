"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Users,
  TrendingUp,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface AdminStats {
  totalExcuseLetters: number;
  pendingApprovals: number;
  approvedToday: number;
  declinedToday: number;
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
  DeanComment: string;
  DeanActionDate: string;
  CoordinatorStatus: string;
  CoordinatorComment: string;
  CoordinatorActionDate: string;
  InstructorStatus: string;
  InstructorComment: string;
  InstructorActionDate: string;
  InstructorName: string;
}

interface ExcuseLetterFile {
  FileID: number;
  FileName: string;
  OriginalName: string;
  FileSize: number;
  FileType: string;
  FilePath: string;
  UploadDate: string;
}

export default function AdminExcuseLettersPage() {
  const [stats, setStats] = useState<AdminStats>({
    totalExcuseLetters: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    declinedToday: 0
  });
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [filteredLetters, setFilteredLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Modal states
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [letterFiles, setLetterFiles] = useState<ExcuseLetterFile[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    filterExcuseLetters();
  }, [excuseLetters, searchTerm, statusFilter, courseFilter, yearFilter, dateFilter]);

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
      const response = await fetch("/api/excuse-letters?role=admin");
      const data = await response.json();

      if (data.success) {
        const letters = data.data;
        const today = new Date().toDateString();

        const pendingApprovals = letters.filter((letter: ExcuseLetter) =>
          letter.Status === 'pending' || letter.Status === 'partial'
        ).length;

        const approvedToday = letters.filter((letter: ExcuseLetter) =>
          letter.Status === 'approved' &&
          (letter.DeanActionDate && new Date(letter.DeanActionDate).toDateString() === today ||
            letter.CoordinatorActionDate && new Date(letter.CoordinatorActionDate).toDateString() === today ||
            letter.InstructorActionDate && new Date(letter.InstructorActionDate).toDateString() === today)
        ).length;

        const declinedToday = letters.filter((letter: ExcuseLetter) =>
          letter.Status === 'declined' &&
          (letter.DeanActionDate && new Date(letter.DeanActionDate).toDateString() === today ||
            letter.CoordinatorActionDate && new Date(letter.CoordinatorActionDate).toDateString() === today ||
            letter.InstructorActionDate && new Date(letter.InstructorActionDate).toDateString() === today)
        ).length;

        setStats({
          totalExcuseLetters: letters.length,
          pendingApprovals,
          approvedToday,
          declinedToday
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchExcuseLetters = async () => {
    try {
      const response = await fetch("/api/excuse-letters?role=admin");
      const data = await response.json();

      if (data.success) {
        setExcuseLetters(data.data);
      }
    } catch (error) {
      console.error("Error fetching excuse letters:", error);
    }
  };

  const fetchLetterFiles = async (excuseLetterID: number) => {
    try {
      const response = await fetch(`/api/excuse-letters/upload?excuseLetterID=${excuseLetterID}`);
      const data = await response.json();

      if (data.success) {
        setLetterFiles(data.data);
      }
    } catch (error) {
      console.error("Error fetching letter files:", error);
    }
  };

  const filterExcuseLetters = () => {
    let filtered = excuseLetters;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(letter =>
        letter.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.Reason.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(letter => letter.Status === statusFilter);
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(letter => letter.Course === courseFilter);
    }

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(letter => letter.YearLevel.toString() === yearFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(letter =>
            new Date(letter.SubmissionDate) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(letter =>
            new Date(letter.SubmissionDate) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(letter =>
            new Date(letter.SubmissionDate) >= filterDate
          );
          break;
      }
    }

    setFilteredLetters(filtered);
  };

  const handleViewDetails = async (letter: ExcuseLetter) => {
    setSelectedLetter(letter);
    await fetchLetterFiles(letter.ExcuseLetterID);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
      approved: { color: "bg-green-100 text-green-800", text: "Approved" },
      declined: { color: "bg-red-100 text-red-800", text: "Declined" },
      partial: { color: "bg-blue-100 text-blue-800", text: "Partial Approval" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getApprovalStatusIndicator = (deanStatus: string, coordStatus: string, instStatus: string) => {
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'approved':
          return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'declined':
          return <XCircle className="h-4 w-4 text-red-600" />;
        default:
          return <Clock className="h-4 w-4 text-yellow-600" />;
      }
    };

    return (
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1">
          {getStatusIcon(deanStatus)}
          <span>Dean</span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(coordStatus)}
          <span>Coord</span>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon(instStatus)}
          <span>Inst</span>
        </div>
      </div>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileAction = async (file: ExcuseLetterFile) => {
    try {
      // Check if it's a Word document - force download
      if (file.FileType?.includes('msword') || file.FileType?.includes('officedocument.wordprocessingml.document')) {
        const response = await fetch(`/api/excuse-letters/download?fileId=${file.FileID}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.OriginalName || file.FileName;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        // For images and PDFs - get the blob URL from API and open it
        const response = await fetch(`/api/excuse-letters/view?fileId=${file.FileID}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.url) {
            // Open the Vercel Blob URL directly in a new tab
            window.open(data.url, '_blank');
          }
        }
      }
    } catch (error) {
      console.error('Error handling file:', error);
      toast.error('Failed to open file');
    }
  };

  const getUniqueValues = (key: keyof ExcuseLetter) => {
    return [...new Set(excuseLetters.map(letter => letter[key]))].filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading excuse letters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Excuse Letters Management</h1>
          <p className="text-gray-600 mt-1">Monitor and track all excuse letter submissions and approvals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Letters</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExcuseLetters}</div>
            <p className="text-xs text-muted-foreground">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground">Processed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Declined Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.declinedToday}</div>
            <p className="text-xs text-muted-foreground">Declined today</p>
          </CardContent>
        </Card>


      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar and Filter Dropdowns - Single Row Layout */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex-1 min-w-[300px]">
              <SearchBar
                placeholder="Search by student, subject, or reason..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            <div className="flex flex-wrap gap-3 lg:gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="partial">Partial Approval</SelectItem>
                </SelectContent>
              </Select>

              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {getUniqueValues('Course').map((course) => (
                    <SelectItem key={course} value={course as string}>
                      {course as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getUniqueValues('YearLevel').map((year) => (
                    <SelectItem key={year} value={year?.toString() || ''}>
                      Year {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Excuse Letters List */}
      <Card>
        <CardHeader>
          <CardTitle>Excuse Letters ({filteredLetters.length})</CardTitle>
          <CardDescription>All excuse letter submissions with approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLetters.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No excuse letters found matching your filters.</p>
              </div>
            ) : (
              filteredLetters.map((letter) => (
                <div key={letter.ExcuseLetterID} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{letter.Subject}</h3>
                        {getStatusBadge(letter.Status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                        <span><strong>Student:</strong> {letter.StudentName}</span>
                        <span><strong>Course:</strong> {letter.Course} Year {letter.YearLevel}</span>
                        <span><strong>Subject:</strong> {letter.SubjectCode}</span>
                        <span><strong>Instructor:</strong> {letter.InstructorName}</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Submitted: {new Date(letter.SubmissionDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">{letter.Reason}</p>

                      <div className="flex items-center justify-between">
                        {getApprovalStatusIndicator(letter.DeanStatus, letter.CoordinatorStatus, letter.InstructorStatus)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(letter)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Excuse Letter Details</DialogTitle>
            <DialogDescription>
              Complete information and approval status
            </DialogDescription>
          </DialogHeader>

          {selectedLetter && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Student:</strong> {selectedLetter.StudentName}</div>
                <div><strong>Course:</strong> {selectedLetter.Course} Year {selectedLetter.YearLevel}</div>
                <div><strong>Subject:</strong> {selectedLetter.SubjectCode} - {selectedLetter.SubjectTitle}</div>
                <div><strong>Instructor:</strong> {selectedLetter.InstructorName}</div>
                <div><strong>Date Range:</strong> {new Date(selectedLetter.DateFrom).toLocaleDateString()} - {new Date(selectedLetter.DateTo).toLocaleDateString()}</div>
                <div><strong>Submitted:</strong> {new Date(selectedLetter.SubmissionDate).toLocaleDateString()}</div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <strong>Overall Status:</strong>
                {getStatusBadge(selectedLetter.Status)}
              </div>

              {/* Reason */}
              <div>
                <strong>Reason:</strong>
                <p className="mt-1 p-3 bg-gray-50 rounded text-sm">{selectedLetter.Reason}</p>
              </div>

              {/* Approval Status Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedLetter.DeanStatus === 'approved' ?
                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                        selectedLetter.DeanStatus === 'declined' ?
                          <XCircle className="h-4 w-4 text-red-600" /> :
                          <Clock className="h-4 w-4 text-yellow-600" />
                      }
                      Dean Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge className={
                      selectedLetter.DeanStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedLetter.DeanStatus === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                    }>
                      {selectedLetter.DeanStatus}
                    </Badge>
                    {selectedLetter.DeanComment && (
                      <p className="text-xs text-gray-600 mt-2">{selectedLetter.DeanComment}</p>
                    )}
                    {selectedLetter.DeanActionDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedLetter.DeanActionDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedLetter.CoordinatorStatus === 'approved' ?
                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                        selectedLetter.CoordinatorStatus === 'declined' ?
                          <XCircle className="h-4 w-4 text-red-600" /> :
                          <Clock className="h-4 w-4 text-yellow-600" />
                      }
                      Coordinator Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge className={
                      selectedLetter.CoordinatorStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedLetter.CoordinatorStatus === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                    }>
                      {selectedLetter.CoordinatorStatus}
                    </Badge>
                    {selectedLetter.CoordinatorComment && (
                      <p className="text-xs text-gray-600 mt-2">{selectedLetter.CoordinatorComment}</p>
                    )}
                    {selectedLetter.CoordinatorActionDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedLetter.CoordinatorActionDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selectedLetter.InstructorStatus === 'approved' ?
                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                        selectedLetter.InstructorStatus === 'declined' ?
                          <XCircle className="h-4 w-4 text-red-600" /> :
                          <Clock className="h-4 w-4 text-yellow-600" />
                      }
                      Instructor Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge className={
                      selectedLetter.InstructorStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedLetter.InstructorStatus === 'declined' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                    }>
                      {selectedLetter.InstructorStatus}
                    </Badge>
                    {selectedLetter.InstructorComment && (
                      <p className="text-xs text-gray-600 mt-2">{selectedLetter.InstructorComment}</p>
                    )}
                    {selectedLetter.InstructorActionDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(selectedLetter.InstructorActionDate).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Attachments */}
              {letterFiles.length > 0 && (
                <div>
                  <strong>Attachments:</strong>
                  <div className="mt-2 space-y-2">
                    {letterFiles.map((file) => (
                      <div key={file.FileID} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">{file.OriginalName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.FileSize)} • Uploaded {new Date(file.UploadDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFileAction(file)}
                        >
                          {file.FileType?.includes('msword') || file.FileType?.includes('officedocument.wordprocessingml.document') ? (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
