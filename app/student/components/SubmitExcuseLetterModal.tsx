"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Card, CardContent } from "../../../components/ui/card";
import { Upload, X, FileText, Image, CheckCircle, Eye, Download } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectTitle: string;
  InstructorName: string;
  Course: string;
  Section: string;
  YearLevel: number;
  Day: string;
  Time: string;
  Room: string;
}

interface SubmitExcuseLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: number;
}

export default function SubmitExcuseLetterModal({
  isOpen,
  onClose,
  onSuccess,
  studentId
}: SubmitExcuseLetterModalProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Schedule | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Schedule[]>([]);
  const [isMultiSubject, setIsMultiSubject] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    scheduleId: "",
    scheduleIds: [] as number[],
    subject: "",
    reason: "",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    if (isOpen) {
      fetchSchedules();
    }
  }, [isOpen, studentId]);

  const fetchSchedules = async () => {
    try {
      // Get user session to get the actual user ID
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      
      const response = await fetch(`/api/schedules?role=student&userId=${session.userId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.data) {
        console.log("Fetched schedules:", data.data); // Debug log
        setSchedules(data.data);
        
        if (data.data.length === 0) {
          brandedToast.error("No enrolled subjects found. Please contact your administrator.");
        }
      } else {
        console.error("Failed to load schedules:", data.error);
        brandedToast.error("Failed to load class schedules");
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      brandedToast.error("Failed to load class schedules");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // If scheduleId is being changed, update selected subject (only for single subject mode)
    if (field === 'scheduleId' && !isMultiSubject) {
      const schedule = schedules.find(s => s.ScheduleID.toString() === value);
      setSelectedSubject(schedule || null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types - Enhanced to accept all requested formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      brandedToast.error("Some files have invalid formats. Only PDF, DOC, DOCX, PNG, and JPEG files are allowed.");
      return;
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      brandedToast.error("Some files exceed the 10MB size limit.");
      return;
    }

    setSelectedFiles(prev => [...prev, ...files]);
    brandedToast.success(`${files.length} file(s) added successfully!`);
    
    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    brandedToast.info("File removed");
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <Image className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word') || fileType.includes('document')) return 'Word';
    if (fileType.includes('image')) return 'Image';
    return 'Document';
  };

  const handlePreviewFile = (file: File) => {
    // Always reset preview states first
    setPreviewFile(null);
    setPreviewUrl(null);

    // Handle images – open in a new tab just like PDFs
    if (file.type.includes("image")) {
      const url = URL.createObjectURL(file);
      window.open(url, "_blank");
      // Revoke after short delay to ensure the browser can access it
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    // Handle PDFs – open in a new tab for full-page viewing
    if (file.type.includes("pdf")) {
      const url = URL.createObjectURL(file);
      // Open the generated URL in a new browser tab
      window.open(url, "_blank");
      // Revoke the object URL shortly after opening to free memory
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    // Handle Microsoft Word documents – trigger direct download
    if (
      file.type.includes("msword") ||
      file.type.includes("officedocument.wordprocessingml.document")
    ) {
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoke the object URL after the click to prevent leaks
      URL.revokeObjectURL(url);
      return;
    }

    // Fallback – for any unsupported preview types just show file info
    setPreviewFile(file);
    setPreviewUrl(null);
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    console.log("Submit button clicked", { formData, selectedFiles }); // Debug log
    
    // Validation
    if ((!isMultiSubject && !formData.scheduleId) || (isMultiSubject && selectedSubjects.length === 0) || !formData.subject || !formData.reason || !formData.dateFrom || !formData.dateTo) {
      brandedToast.error("Please fill in all required fields and select at least one subject");
      return;
    }

    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
      brandedToast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    setUploadSuccess(false);

    try {
      console.log("Submitting excuse letter with data:", {
        studentId,
        scheduleId: formData.scheduleId,
        subject: formData.subject,
        reason: formData.reason,
        dateFrom: formData.dateFrom,
        dateTo: formData.dateTo,
      });

      // Submit excuse letter
      const excuseLetterResponse = await fetch('/api/excuse-letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: isMultiSubject ? null : formData.scheduleId,
          scheduleIds: isMultiSubject ? selectedSubjects.map(s => s.ScheduleID) : [],
          subject: formData.subject,
          reason: formData.reason,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
          // Include subject code and title from selected subject(s)
          subjectCode: isMultiSubject ? 'Multiple Subjects' : (selectedSubject?.SubjectCode || ''),
          subjectTitle: isMultiSubject ? 'Multiple Subjects' : (selectedSubject?.SubjectTitle || ''),
          instructorName: isMultiSubject ? 'Multiple Instructors' : (selectedSubject?.InstructorName || '')
        }),
      });

      const excuseLetterData = await excuseLetterResponse.json();
      console.log("Excuse letter response:", excuseLetterData);

      if (!excuseLetterData.success) {
        brandedToast.error(excuseLetterData.error || "Failed to submit excuse letter");
        return;
      }

      // Upload files if any
      if (selectedFiles.length > 0) {
        console.log("Uploading files:", selectedFiles);
        setUploading(true);
        
        const formDataFiles = new FormData();
        formDataFiles.append('excuseLetterID', excuseLetterData.excuseLetterID.toString());
        
        selectedFiles.forEach((file) => {
          formDataFiles.append('files', file);
        });

        const uploadResponse = await fetch('/api/excuse-letters/upload', {
          method: 'POST',
          credentials: 'include',
          body: formDataFiles,
        });

        const uploadData = await uploadResponse.json();
        console.log("File upload response:", uploadData);
        
        if (!uploadData.success) {
          brandedToast.error(uploadData.error || "Failed to upload files");
          return;
        } else {
          setUploadSuccess(true);
          brandedToast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
        }
      }

      // Reset form and close modal
      setFormData({
        scheduleId: "",
        scheduleIds: [],
        subject: "",
        reason: "",
        dateFrom: "",
        dateTo: ""
      });
      setSelectedFiles([]);
      setSelectedSubject(null);
      setUploadSuccess(false);
      
      console.log("Excuse letter submitted successfully");
      brandedToast.success("Excuse letter submitted successfully!");
      onSuccess();
      
    } catch (error) {
      console.error("Error submitting excuse letter:", error);
      brandedToast.error("Failed to submit excuse letter. Please try again.");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleClose = () => {
    console.log("Modal closing, resetting form"); // Debug log
    setFormData({
      scheduleId: "",
      scheduleIds: [],
      subject: "",
      reason: "",
      dateFrom: "",
      dateTo: ""
    });
    setSelectedFiles([]);
    setSelectedSubject(null);
    setSelectedSubjects([]);
    setIsMultiSubject(false);
    setUploadSuccess(false);
    closePreview();
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Submit Excuse Letter</DialogTitle>
            <DialogDescription>
              Submit an excuse letter for your absence. It will be sent to your Dean, Program Coordinator, and Subject Instructor for approval.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4 w-full">
            {/* Form section with consistent styling */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Absence Information</h3>
              
              {/* Subject Selection - Multi-subject support */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Label htmlFor="schedule" className="text-sm font-medium">Subject(s)</Label>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="multiSubject"
                      checked={isMultiSubject}
                      onChange={(e) => {
                        setIsMultiSubject(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedSubjects([]);
                          setFormData(prev => ({ ...prev, scheduleIds: [] }));
                        } else {
                          setSelectedSubject(null);
                          setFormData(prev => ({ ...prev, scheduleId: "" }));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="multiSubject" className="text-sm text-gray-600">
                      Multiple subjects
                    </Label>
                  </div>
                </div>

                {!isMultiSubject ? (
                  // Single subject selection
                  <>
                    <Select value={formData.scheduleId} onValueChange={(value) => handleInputChange("scheduleId", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {schedules.map((schedule) => (
                          <SelectItem key={schedule.ScheduleID} value={schedule.ScheduleID.toString()}>
                            {schedule.SubjectCode} - {schedule.SubjectTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Display selected subject details */}
                    {selectedSubject && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-900">
                          {selectedSubject.SubjectCode} - {selectedSubject.SubjectTitle}
                        </p>
                        <div className="flex items-center justify-between mt-1 text-xs text-blue-700">
                          <span><strong>Instructor:</strong> {selectedSubject.InstructorName}</span>
                          <span><strong>Section:</strong> {selectedSubject.Section}</span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Multiple subjects selection
                  <>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3 bg-white">
                      {schedules.map((schedule) => (
                        <div key={schedule.ScheduleID} className="flex items-center space-x-2 py-2 border-b border-gray-100 last:border-b-0">
                          <input
                            type="checkbox"
                            id={`schedule-${schedule.ScheduleID}`}
                            checked={selectedSubjects.some(s => s.ScheduleID === schedule.ScheduleID)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newSelected = [...selectedSubjects, schedule];
                                setSelectedSubjects(newSelected);
                                setFormData(prev => ({
                                  ...prev,
                                  scheduleIds: newSelected.map(s => s.ScheduleID)
                                }));
                              } else {
                                const newSelected = selectedSubjects.filter(s => s.ScheduleID !== schedule.ScheduleID);
                                setSelectedSubjects(newSelected);
                                setFormData(prev => ({
                                  ...prev,
                                  scheduleIds: newSelected.map(s => s.ScheduleID)
                                }));
                              }
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={`schedule-${schedule.ScheduleID}`} className="flex-1 cursor-pointer">
                            <div>
                              <span className="font-medium">{schedule.SubjectCode} - {schedule.SubjectTitle}</span>
                              <div className="text-xs text-gray-500">
                                Instructor: {schedule.InstructorName} | Section: {schedule.Section}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Display selected subjects summary */}
                    {selectedSubjects.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm font-medium text-green-900 mb-2">
                          Selected {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-1">
                          {selectedSubjects.map((subject) => (
                            <div key={subject.ScheduleID} className="text-xs text-green-700">
                              {subject.SubjectCode} - {subject.SubjectTitle}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Subject/Title - Formal layout */}
              <div className="mb-5">
                <div className="flex items-center mb-1.5">
                  <Label htmlFor="subject" className="text-sm font-medium">Letter Subject</Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("subject", e.target.value)}
                  placeholder="e.g., Medical Excuse, Family Emergency"
                  className="w-full"
                />
              </div>

              {/* Date Range - Formal layout with better alignment */}
              <div className="mb-5">
                <div className="flex items-center mb-1.5">
                  <Label className="text-sm font-medium">Absence Period</Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-gray-500 block mb-1">From Date</Label>
                    <div className="relative date-input-container">
                      <Input
                        id="dateFrom"
                        type="date"
                        value={formData.dateFrom}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("dateFrom", e.target.value)}
                        className="w-full date-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-gray-500 block mb-1">To Date</Label>
                    <div className="relative date-input-container">
                      <Input
                        id="dateTo"
                        type="date"
                        value={formData.dateTo}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("dateTo", e.target.value)}
                        className="w-full date-input"
                      />
                    </div>
                  </div>
                </div>
                {/* Global style for date inputs to ensure calendar icon appears at the end */}
                <style jsx global>{`
                  .date-input::-webkit-calendar-picker-indicator {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                  }
                  .date-input {
                    position: relative;
                  }
                  .date-input-container {
                    position: relative;
                  }
                  
                  /* Ensure file names are properly truncated */
                  .file-name-truncate {
                    word-break: break-all;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 100%;
                    display: block;
                    width: 100%;
                    min-width: 0;
                  }
                  
                  /* Force grid to respect width constraints */
                  .file-card-grid {
                    max-width: 100%;
                    overflow: hidden;
                  }
                `}</style>
              </div>

              {/* Reason - Formal layout */}
              <div>
                <div className="flex items-center mb-1.5">
                  <Label htmlFor="reason" className="text-sm font-medium">Reason for Absence</Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("reason", e.target.value)}
                  placeholder="Please provide a detailed explanation for your absence..."
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
            </div>

            {/* File Upload - Formal layout in a separate section */}
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 w-full">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Supporting Documents</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-white">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload supporting documents
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Accepted formats: PDF, DOC, DOCX, PNG, JPEG
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Maximum file size: 10MB per file
                </p>
                <Input
                  type="file"
                  id="fileUpload"
                  className="hidden"
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                  onClick={() => document.getElementById('fileUpload')?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Select Files'}
                </Button>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 mt-6 w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Selected Files ({selectedFiles.length})</h3>
                    {uploadSuccess && (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span>Successfully uploaded</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 w-full max-w-full">
                    {selectedFiles.map((file, index) => (
                      <Card key={index} className="overflow-hidden border border-gray-200 w-full">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center w-full file-card-grid">
                            {/* File Icon */}
                            <div className="flex-shrink-0">
                              {getFileIcon(file.type)}
                            </div>
                            
                            {/* File Info - Takes remaining space */}
                            <div className="min-w-0 overflow-hidden">
                              <p className="text-sm font-medium text-gray-900 file-name-truncate" title={file.name}>
                                {file.name}
                              </p>
                              <div className="flex items-center mt-1 gap-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 flex-shrink-0">
                                  {getFileTypeLabel(file.type)}
                                </span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  {formatFileSize(file.size)}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons - Fixed width */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                type="button"
                                className="p-1.5 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                onClick={() => handlePreviewFile(file)}
                                title="Preview file"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={() => removeFile(index)}
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={loading || uploading}
                  className="px-5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || uploading}
                  className="relative px-5 min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Submitting...
                    </>
                  ) : uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Submit Letter'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Modal */}
      {previewFile &&
        createPortal(
        <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closePreview();
          }
        }}
      >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{previewFile.name}</h3>
                <p className="text-sm text-gray-500">
                  {getFileTypeLabel(previewFile.type)} • {formatFileSize(previewFile.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {previewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      const link = document.createElement('a');
                      link.href = previewUrl;
                      link.download = previewFile.name;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                )}
                <button
                  type="button"
                  aria-label="Close Preview"
                  className="inline-flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded-md transition-colors focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    closePreview();
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 max-h-[70vh] overflow-auto">
              {previewFile.type.includes('image') && previewUrl && (
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
              
              {previewFile.type.includes('pdf') && previewUrl && (
                <div className="w-full h-[60vh]">
                  <iframe 
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title={previewFile.name}
                  />
                </div>
              )}
              
              {(previewFile.type.includes('word') || previewFile.type.includes('document')) && (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Word Document Preview</h4>
                  <p className="text-gray-600 mb-4">
                    Word documents cannot be previewed directly in the browser.
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    File: {previewFile.name}<br/>
                    Size: {formatFileSize(previewFile.size)}<br/>
                    Type: {previewFile.type}
                  </p>
                  <Button
                    onClick={() => {
                      const url = URL.createObjectURL(previewFile);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = previewFile.name;
                      link.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>, document.body) }
    </>
  );
}
