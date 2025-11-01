"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Calendar, Clock, FileText, User, BookOpen, Download, Eye } from "lucide-react";

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
  const [files, setFiles] = useState<ExcuseLetterFile[]>([]);
  const [excuseLetterSubjects, setExcuseLetterSubjects] = useState<ExcuseLetterSubject[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && excuseLetter) {
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

  if (!excuseLetter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Excuse Letter Details</span>
            {getStatusBadge(excuseLetter.Status)}
          </DialogTitle>
          <DialogDescription>
            Submitted on {new Date(excuseLetter.SubmissionDate).toLocaleDateString()}
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
                <p className="text-sm mt-1">{excuseLetter.Subject}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-600">Reason:</label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{excuseLetter.Reason}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Date From:</label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(excuseLetter.DateFrom).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Date To:</label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(excuseLetter.DateTo).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {excuseLetter.IsMultiSubject ? `Subject Information (${excuseLetter.SubjectCount || 0} subjects)` : 'Subject Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {excuseLetter.IsMultiSubject ? (
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
                        Loading subject details... ({excuseLetter.SubjectCount || 0} subjects)
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
                      <p className="text-sm mt-1">{excuseLetter.SubjectCode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Subject Name:</label>
                      <p className="text-sm mt-1">{excuseLetter.SubjectTitle || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Instructor:</label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {excuseLetter.InstructorName}
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
                  {getApprovalStatusBadge(excuseLetter.DeanStatus)}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Program Coordinator</p>
                  {getApprovalStatusBadge(excuseLetter.CoordinatorStatus)}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600 mb-1">Subject Instructor</p>
                  {getApprovalStatusBadge(excuseLetter.InstructorStatus)}
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

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
