"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ViewExcuseLetterModal from "@/app/student/components/ViewExcuseLetterModal";
import ApprovalModal from "@/app/student/components/ApprovalModal";

interface ExcuseLetter {
  ExcuseLetterID: number;
  StudentName: string;
  Course: string;
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
  InstructorStatus: string;
  InstructorName: string;
}

export default function DeanExcuseLettersPage() {
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'declined'>('approved');
  const [approvalComment, setApprovalComment] = useState("");
  const [approvalExcuseLetter, setApprovalExcuseLetter] = useState<ExcuseLetter | null>(null);

  useEffect(() => {
    fetchExcuseLetters();
  }, []);

  const fetchExcuseLetters = async () => {
    try {
      const response = await fetch("/api/excuse-letters?role=dean");
      const data = await response.json();
      if (data.success) setExcuseLetters(data.data);
    } catch (error) {
      console.error("Error fetching excuse letters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveExcuseLetter = async (excuseLetterID: number, action: 'approved' | 'declined', comment?: string) => {
    try {
      const response = await fetch("/api/excuse-letters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excuseLetterID, userRole: "dean", status: action, comment: comment || null }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Excuse letter ${action} successfully`);
        fetchExcuseLetters();
      } else {
        toast.error(data.error || "Failed to update excuse letter");
      }
    } catch (error) {
      console.error("Error updating excuse letter:", error);
      toast.error("Failed to update excuse letter");
    }
  };

  const submitApproval = async (comment: string) => {
    if (!approvalExcuseLetter) return;
    try {
      const response = await fetch("/api/excuse-letters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          excuseLetterID: approvalExcuseLetter.ExcuseLetterID, 
          userRole: "dean", 
          status: approvalAction, 
          comment: comment || null 
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Excuse letter ${approvalAction} successfully`);
        setShowApprovalModal(false);
        setApprovalExcuseLetter(null);
        setApprovalComment("");
        fetchExcuseLetters();
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
      partial: { color: "bg-blue-100 text-blue-800", label: "Partial", icon: AlertCircle },
    } as any;
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredExcuseLetters = excuseLetters.filter(letter => {
    const matchesSearch = letter.StudentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.Subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      letter.SubjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || letter.DeanStatus === statusFilter;
    const matchesCourse = courseFilter === 'all' || letter.Course === courseFilter;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const uniqueCourses = [...new Set(excuseLetters.map(letter => letter.Course))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Excuse Letters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Excuse Letters</h1>
          <p className="text-gray-600 mt-1">Approve or decline student excuse letters</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar placeholder="Search students or subjects..." value={searchTerm} onChange={setSearchTerm} className="w-full" />
        <div className="flex gap-2 flex-shrink-0">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {uniqueCourses.map(course => (
                <SelectItem key={course} value={course}>{course}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredExcuseLetters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No excuse letters found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredExcuseLetters.map((letter) => (
            <Card key={letter.ExcuseLetterID}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{letter.Subject}</CardTitle>
                    <CardDescription>
                      {letter.StudentName} • {letter.Course} • {letter.SubjectCode} - {letter.SubjectTitle}
                    </CardDescription>
                  </div>
                  {getStatusBadge(letter.DeanStatus)}
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
                        <span className="text-gray-600 font-medium text-xs">Program Coordinator:</span>
                        {getStatusBadge(letter.CoordinatorStatus || 'pending')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedExcuseLetter(letter)}>View Details</Button>
                    {letter.DeanStatus === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => { setApprovalAction('approved'); setApprovalExcuseLetter(letter); setShowApprovalModal(true); }} className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setApprovalAction('declined'); setApprovalExcuseLetter(letter); setShowApprovalModal(true); }}>
                          <XCircle className="h-4 w-4 mr-1" /> Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => { setShowApprovalModal(false); setApprovalExcuseLetter(null); }}
        excuseLetter={approvalExcuseLetter}
        approvalAction={approvalAction}
        onSubmit={submitApproval}
      />

      <ViewExcuseLetterModal
        isOpen={!!selectedExcuseLetter}
        onClose={() => setSelectedExcuseLetter(null)}
        excuseLetter={selectedExcuseLetter}
        userRole="dean"
      />
    </div>
  );
}


