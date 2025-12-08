"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Calendar, Clock, FileText, User, BookOpen, Download, Eye, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { brandedToast } from "@/components/ui/branded-toast";

interface ExcuseLetter {
  ExcuseLetterID: number;
  Subject: string;
  Reason: string;
  DateFrom: string;
  DateTo: string;
  SubmissionDate: string;
  Status: string;
  DeanStatus: string;
  CoordinatorStatus: string;
  InstructorStatus: string;
  SubjectCode: string;
  SubjectTitle: string;
  InstructorName: string;
  IsMultiSubject?: boolean;
  SubjectCount?: number;
  AllScheduleIds?: string;
  AllSubjectCodes?: string;
  AllSubjectTitles?: string;
}

interface ExcuseLetterFile {
  FileID: number;
  FileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
}

interface ViewExcuseLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  excuseLetter: ExcuseLetter | null;
  userRole?: 'student' | 'dean' | 'programcoor' | 'instructor';
}

interface ExcuseLetterSubject {
  ExcuseLetterSubjectID: number;
  ScheduleID: number;
  SubjectCode: string;
  SubjectTitle: string;
  InstructorName: string;
  Section: string;
  Course: string;
  YearLevel: number;
}

export default function ViewExcuseLetterModal({
  isOpen,
  onClose,
  excuseLetter,
  userRole = 'student'
}: ViewExcuseLetterModalProps) {
  const formatDateInput = (value: string | Date) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const [files, setFiles] = useState<ExcuseLetterFile[]>([]);
  const [excuseLetterSubjects, setExcuseLetterSubjects] = useState<ExcuseLetterSubject[]>([]);
  const [loading, setLoading] = useState(false);
  const [letterData, setLetterData] = useState<ExcuseLetter | null>(excuseLetter);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formReason, setFormReason] = useState(excuseLetter?.Reason || "");
  const [formDateFrom, setFormDateFrom] = useState(excuseLetter ? formatDateInput(excuseLetter.DateFrom) : "");
  const [formDateTo, setFormDateTo] = useState(excuseLetter ? formatDateInput(excuseLetter.DateTo) : "");

  useEffect(() => {
    if (isOpen && excuseLetter) {
      setLetterData(excuseLetter);
      setFormReason(excuseLetter.Reason || "");
      setFormDateFrom(formatDateInput(excuseLetter.DateFrom));
      setFormDateTo(formatDateInput(excuseLetter.DateTo));
      setEditMode(false);
      fetchFiles();
      if (excuseLetter.IsMultiSubject) {
        fetchSubjects();
      }
    }
  }, [isOpen, excuseLetter]);

  const fetchFiles = async () => {
    if (!excuseLetter) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/excuse-letters/files?excuseLetterID=${excuseLetter.ExcuseLetterID}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    if (!excuseLetter) return;
    
    console.log('Fetching subjects for excuse letter:', excuseLetter.ExcuseLetterID);
    
    try {
      const response = await fetch(`/api/excuse-letters/subjects?excuseLetterId=${excuseLetter.ExcuseLetterID}`, {
        credentials: 'include'
      });
      
      console.log('Subjects API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Subjects API response data:', data);
        setExcuseLetterSubjects(data.data || []);
      } else {
        console.error('Subjects API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      declined: { color: 'bg-red-100 text-red-800', text: 'Declined' },
      partial: { color: 'bg-blue-100 text-blue-800', text: 'Partial Approval' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.color} border-0`}>
        {config.text}
      </Badge>
    );
  };

  const getApprovalStatusBadge = (status: string) => {
    if (status === 'approved') return <Badge className="bg-green-100 text-green-800 border-0">Approved</Badge>;
    if (status === 'declined') return <Badge className="bg-red-100 text-red-800 border-0">Declined</Badge>;
    return <Badge className="bg-gray-100 text-gray-800 border-0">Pending</Badge>;
  };

  const handleFileAction = async (file: ExcuseLetterFile) => {
    try {
      // Check if it's a Word document - force download
      if (file.FileType.includes('msword') || file.FileType.includes('officedocument.wordprocessingml.document')) {
        const response = await fetch(`/api/excuse-letters/download?fileId=${file.FileID}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.FileName;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      } else {
        // For images and PDFs - open in new tab
        const response = await fetch(`/api/excuse-letters/view?fileId=${file.FileID}`, {
          credentials: 'include'
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
          // Clean up after a delay to ensure the browser can access it
          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        }
      }
    } catch (error) {
      console.error('Error handling file:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isWithin24Hours = () => {
    if (!letterData) return false;
    const submitted = new Date(letterData.SubmissionDate);
    const now = new Date();
    return now.getTime() - submitted.getTime() <= 24 * 60 * 60 * 1000;
  };

  const canEdit = () => {
    if (userRole !== 'student') return false;
    if (!letterData) return false;
    if (letterData.Status !== 'pending') return false;
    return isWithin24Hours();
  };

  const handleSaveEdits = async () => {
    if (!letterData) return;
    setSaving(true);
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));

      if (!sessionCookie) {
        brandedToast.error('Session not found. Please log in again.');
        return;
      }

      let session;
      try {
        session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      } catch {
        brandedToast.error('Invalid session data. Please log in again.');
        return;
      }

      const res = await fetch(`/api/excuse-letters/${letterData.ExcuseLetterID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userRole: 'student',
          studentId: session.userId,
          reason: formReason,
          dateFrom: formDateFrom,
          dateTo: formDateTo
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        brandedToast.error(data.error || 'Failed to save changes');
        return;
      }

      setLetterData(prev => prev ? ({
        ...prev,
        Reason: formReason,
        DateFrom: formDateFrom,
        DateTo: formDateTo
      }) : prev);
      setEditMode(false);
      brandedToast.success('Excuse letter updated');
    } catch (error) {
      console.error('Error saving edits:', error);
      brandedToast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!letterData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Excuse Letter Details</span>
            {getStatusBadge(letterData.Status)}
          </DialogTitle>
          <DialogDescription>
            Submitted on {new Date(letterData.SubmissionDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Subject/Title:</label>
                {editMode ? (
                  <Input
                    value={letterData.Subject || ''}
                    disabled={letterData.IsMultiSubject}
                    onChange={(e) => setLetterData(prev => prev ? ({ ...prev, Subject: e.target.value }) : prev)}
                    placeholder="Subject/Title"
                  />
                ) : (
                  <p className="text-sm mt-1">{letterData.Subject}</p>
                )}
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600">Reason:</label>
                {editMode ? (
                  <Textarea
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="mt-1"
                    placeholder="Enter reason"
                  />
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{letterData.Reason}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Date From:</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formDateFrom}
                      onChange={(e) => setFormDateFrom(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(letterData.DateFrom).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Date To:</label>
                  {editMode ? (
                    <Input
                      type="date"
                      value={formDateTo}
                      onChange={(e) => setFormDateTo(e.target.value)}
                    />
                  ) : (
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(letterData.DateTo).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {letterData?.IsMultiSubject ? `Subject Information (${letterData.SubjectCount || 0} subjects)` : 'Subject Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {letterData?.IsMultiSubject ? (
                // Multi-subject display
                <div className="space-y-2">
                  {excuseLetterSubjects.length > 0 ? (
                    excuseLetterSubjects.map((subject, index) => (
                      <div key={subject.ExcuseLetterSubjectID} className="p-2 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-semibold text-sm">{subject.SubjectCode}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{subject.Course}-{subject.Section}</span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {subject.InstructorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        Loading subject details... ({letterData?.SubjectCount || 0} subjects)
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        If this message persists, the subject details may not be available.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                // Single subject display
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subject Code:</label>
                        <p className="text-sm mt-1">{letterData.SubjectCode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subject Name:</label>
                        <p className="text-sm mt-1">{letterData.SubjectTitle || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Instructor:</label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                        {letterData.InstructorName}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Approval Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Dean</p>
                  {getApprovalStatusBadge(letterData.DeanStatus)}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Program Coordinator</p>
                  {getApprovalStatusBadge(letterData.CoordinatorStatus)}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Subject Instructor</p>
                  {getApprovalStatusBadge(letterData.InstructorStatus)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attached Files */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Attached Files ({files.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {files.map((file) => (
                    <div key={file.FileID} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-xs font-medium">{file.FileName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.FileSize)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleFileAction(file)}
                      >
                        {file.FileType.includes('msword') || file.FileType.includes('officedocument.wordprocessingml.document') ? (
                          <>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        <div className="flex justify-between pt-4">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            {canEdit() ? (
              <span>You can edit within 24 hours of submission while pending.</span>
            ) : (
              <span>Edit window closed or already processed.</span>
            )}
          </div>
          <div className="flex gap-2">
            {canEdit() && !editMode && (
              <Button variant="outline" onClick={() => setEditMode(true)} className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            {editMode && (
              <>
                <Button variant="outline" onClick={() => { setEditMode(false); setFormReason(letterData.Reason || ''); setFormDateFrom(formatDateInput(letterData.DateFrom)); setFormDateTo(formatDateInput(letterData.DateTo)); }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdits} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
