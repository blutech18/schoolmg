"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Textarea } from "../../../components/ui/textarea";
import { FileText, Download, Eye } from "lucide-react";

interface ExcuseLetter {
  ExcuseLetterID: number;
  Subject: string;
  Reason: string;
  DateFrom: string;
  DateTo: string;
  SubmissionDate: string;
  StudentName: string;
  Course: string;
  SubjectCode: string;
  SubjectTitle: string;
}

interface ExcuseLetterFile {
  FileID: number;
  FileName: string;
  FilePath: string;
  FileSize: number;
  FileType: string;
}

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  excuseLetter: ExcuseLetter | null;
  approvalAction: 'approved' | 'declined';
  onSubmit: (comment: string) => void;
}

export default function ApprovalModal({
  isOpen,
  onClose,
  excuseLetter,
  approvalAction,
  onSubmit
}: ApprovalModalProps) {
  const [files, setFiles] = useState<ExcuseLetterFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen && excuseLetter) {
      fetchFiles();
      setComment(''); // Reset comment when modal opens
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
      console.error('Error handling file action:', error);
    }
  };

  const handleSubmit = () => {
    onSubmit(comment);
    setComment('');
  };

  if (!excuseLetter) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {approvalAction === 'approved' ? 'Approve' : 'Decline'} Excuse Letter
          </DialogTitle>
          <DialogDescription>
            Review the excuse letter details and provide your decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Letter Details */}
          <Card>
            <CardHeader>
              <CardTitle>Letter Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Student:</strong>
                  <p>{excuseLetter.StudentName}</p>
                </div>
                <div>
                  <strong>Course:</strong>
                  <p>{excuseLetter.Course}</p>
                </div>
                <div>
                  <strong>Subject:</strong>
                  <p>{excuseLetter.SubjectCode} - {excuseLetter.SubjectTitle}</p>
                </div>
                <div>
                  <strong>Date Range:</strong>
                  <p>{new Date(excuseLetter.DateFrom).toLocaleDateString()} - {new Date(excuseLetter.DateTo).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <strong>Reason:</strong>
                <p className="mt-1 p-2 bg-gray-50 rounded text-sm">{excuseLetter.Reason}</p>
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
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.FileID} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{file.FileName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.FileSize)}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileAction(file)}
                      >
                        {file.FileType.includes('msword') || file.FileType.includes('officedocument.wordprocessingml.document') ? (
                          <>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
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

          {/* Comment Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                Comment {approvalAction === 'declined' ? '(Required)' : '(Optional)'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Add your ${approvalAction === 'approved' ? 'approval' : 'decline'} comment...`}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className={approvalAction === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
            variant={approvalAction === 'declined' ? 'destructive' : 'default'}
            disabled={approvalAction === 'declined' && !comment.trim()}
          >
            {approvalAction === 'approved' ? 'Approve' : 'Decline'} Excuse Letter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
