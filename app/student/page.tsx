"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { FileText, Calendar, GraduationCap, Clock, Plus, AlertCircle, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";
import SubmitExcuseLetterModal from "./components/SubmitExcuseLetterModal";
import ViewExcuseLetterModal from "./components/ViewExcuseLetterModal";
import StudentScheduleHub from "./components/StudentScheduleHub";
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils";

interface StudentData {
  userId: number;
  studentId: number;
  studentNumber: string;
  name: string;
  course: string;
  yearLevel: number;
  section: string;
  email: string;
  contactNumber: string;
  isPWD: string;
}

interface GradeData {
  ScheduleID: number;
  SubjectCode: string;
  SubjectName: string;
  ClassType: string;
  midterm: number | null;
  final: number | null;
  summary: number | null;
}

interface AttendanceData {
  AttendanceID: number;
  ScheduleID: number;
  Week: number;
  Status: string;
  Date: string;
  SubjectCode: string;
  SubjectName?: string;
  SubjectTitle?: string; // fallback if SubjectName missing
  Remarks: string;
}

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
}

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectTitle: string;
  Course: string;
  Section: string;
  YearLevel: number;
  Day: string;
  Time: string;
  Room: string;
  InstructorName: string;
  ClassType?: string;
  Units?: number;
  Lecture?: number;
  Laboratory?: number;
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSubjects, setExpandedSubjects] = useState<{[key: string]: boolean}>({});
  const [expandedGrades, setExpandedGrades] = useState<{[key: number]: boolean}>({});
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null);
  const [excuseLetterFiles, setExcuseLetterFiles] = useState<{[key: number]: any[]}>({});
  const [currentSessionType, setCurrentSessionType] = useState<'lecture' | 'lab'>('lecture');
  const [currentSessionNumber, setCurrentSessionNumber] = useState(1);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [scheduleAttendance, setScheduleAttendance] = useState<AttendanceData[]>([]);
  const [cancelledSessions, setCancelledSessions] = useState<{[key: string]: {reason: string, cancelledBy: string, cancelledAt: string}}>({});
  const [selectedGradesSchedule, setSelectedGradesSchedule] = useState<Schedule | null>(null);
  const [scheduleGrades, setScheduleGrades] = useState<GradeData[]>([]);

  // Schedule hub modal state
  const [showScheduleHub, setShowScheduleHub] = useState(false);
  const [selectedScheduleForHub, setSelectedScheduleForHub] = useState<Schedule | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStudentData();
      await fetchExcuseLetters();
      await fetchSchedules();
      await fetchAttendance();
      setLoading(false);
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (studentData && studentData.studentId) {
      fetchGrades();
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    try {
      // Get user session from cookie
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        const errorMsg = "Session not found. Please log in again.";
        setError(errorMsg);
        brandedToast.error(errorMsg);
        console.error("Student page error: No session cookie found");
        return;
      }

      let session;
      try {
        session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
        console.log("User session:", session); // Debug log
      } catch (parseError) {
        const errorMsg = "Invalid session data. Please log in again.";
        setError(errorMsg);
        brandedToast.error(errorMsg);
        console.error("Student page error: Failed to parse session:", parseError);
        return;
      }
      
      if (!session.userId) {
        const errorMsg = "User ID not found in session. Please log in again.";
        setError(errorMsg);
        brandedToast.error(errorMsg);
        console.error("Student page error: No userId in session", session);
        return;
      }
      
      // Fetch student details
      console.log(`Fetching student data for userId: ${session.userId}`);
      const response = await fetch(`/api/students?userId=${session.userId}`);
      
      if (!response.ok) {
        const errorMsg = `API request failed with status: ${response.status} ${response.statusText}`;
        setError(errorMsg);
        brandedToast.error("Failed to fetch student data from server");
        console.error("Student page error:", errorMsg);
        return;
      }
      
      const data = await response.json();
      console.log("Student data response:", data); // Debug log

      // Handle error response from API
      if (data.error) {
        const errorMsg = `API Error: ${data.error}`;
        setError(errorMsg);
        brandedToast.error("Server error while fetching student data");
        console.error("Student page error:", errorMsg);
        return;
      }

      // Check if data is an array and has students
      if (Array.isArray(data) && data.length > 0) {
        const student = data[0];
        console.log("Processing student data:", student);
        
        // Validate required fields
        if (!student.FirstName || !student.LastName || !student.Course) {
          const errorMsg = "Incomplete student data received from server";
          setError(errorMsg);
          brandedToast.error(errorMsg);
          console.error("Student page error: Missing required fields:", student);
          return;
        }
        
        const studentInfo = {
          userId: session.userId,
          studentId: student.StudentID,
          studentNumber: student.StudentNumber || `STU-${student.StudentID}`,
          name: `${student.FirstName} ${student.LastName}`,
          course: student.Course,
          yearLevel: student.YearLevel,
          section: student.Section,
          email: student.EmailAddress || '',
          contactNumber: student.ContactNumber || '',
          isPWD: student.IsPWD ? 'Yes' : 'No'
        };
        console.log("Setting student data:", studentInfo); // Debug log
        setStudentData(studentInfo);
        setError(null);
      } else if (Array.isArray(data) && data.length === 0) {
        const errorMsg = "No student record found for this user. Please contact administrator.";
        setError(errorMsg);
        brandedToast.error(errorMsg);
        console.error("Student page error: Empty student data array for userId:", session.userId);
      } else {
        const errorMsg = "Invalid student data format received from server";
        setError(errorMsg);
        brandedToast.error(errorMsg);
        console.error("Student page error: Unexpected data format:", data);
      }
    } catch (error) {
      const errorMsg = `Network or parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error("Error fetching student data:", error);
      setError(errorMsg);
      brandedToast.error("Failed to load student information");
    }
  };

  const fetchFilesForExcuseLetter = async (excuseLetterID: number) => {
    try {
      const response = await fetch(`/api/excuse-letters/files?excuseLetterID=${excuseLetterID}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.files || [];
      }
    } catch (error) {
      console.error('Error fetching files for excuse letter:', excuseLetterID, error);
    }
    return [];
  };

  const fetchExcuseLetters = async () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        console.log("No session cookie found for excuse letters fetch");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      console.log(`Fetching excuse letters for userId: ${session.userId}`);
      
      const response = await fetch(`/api/excuse-letters?role=student&userId=${session.userId}`);
      
      if (!response.ok) {
        console.error(`Excuse letters API failed: ${response.status} ${response.statusText}`);
        brandedToast.error("Failed to fetch excuse letters from server");
        return;
      }
      
      const data = await response.json();
      console.log("Excuse letters response:", data);

      if (data.success) {
        const letters = data.data || [];
        setExcuseLetters(letters);
        
        // Fetch files for each excuse letter
        const filesMap: {[key: number]: any[]} = {};
        for (const letter of letters) {
          const files = await fetchFilesForExcuseLetter(letter.ExcuseLetterID);
          filesMap[letter.ExcuseLetterID] = files;
        }
        setExcuseLetterFiles(filesMap);
      } else if (data.error) {
        console.error("Excuse letters API error:", data.error);
        brandedToast.error("Error loading excuse letters");
      } else {
        console.log("No excuse letters found or unexpected response format");
        setExcuseLetters([]);
      }
    } catch (error) {
      console.error("Error fetching excuse letters:", error);
      brandedToast.error("Failed to load excuse letters");
    }
  };

  const fetchSchedules = async () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        console.log("No session cookie found for schedules fetch");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      console.log(`Fetching schedules for userId: ${session.userId}`);
      
      const response = await fetch(`/api/schedules?role=student&userId=${session.userId}`);
      
      if (!response.ok) {
        console.error(`Schedules API failed: ${response.status} ${response.statusText}`);
        brandedToast.error("Failed to fetch schedules from server");
        return;
      }
      
      const data = await response.json();
      console.log("Schedules response:", data);

      if (data.success) {
        setSchedules(data.data || []);
      } else if (data.error) {
        console.error("Schedules API error:", data.error);
        brandedToast.error("Error loading class schedules");
      } else {
        console.log("No schedules found or unexpected response format");
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      brandedToast.error("Failed to load class schedules");
    }
  };

  const fetchGrades = async (scheduleId?: number) => {
    try {
      // Wait for student data to be loaded first
      if (!studentData || !studentData.studentId) {
        console.log("Student data not loaded yet, cannot fetch grades");
        return;
      }

      console.log(`Fetching grades for studentId: ${studentData.studentId}`);
      
      const response = await fetch(`/api/grades?role=student&userId=${studentData.studentId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Grades API failed: ${response.status} ${response.statusText}`);
        brandedToast.error(`Failed to fetch grades: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log("Grades API response:", data);

      if (data.success && data.summary) {
        // Convert summary object to array format expected by frontend
        const gradesArray = Object.keys(data.summary).map(scheduleIdKey => {
          const gradeData = data.summary[scheduleIdKey];
          console.log(`Processing grade for schedule ${scheduleIdKey}:`, gradeData);
          return {
            ScheduleID: parseInt(scheduleIdKey),
            SubjectCode: gradeData.SubjectCode || 'N/A',
            SubjectName: gradeData.SubjectName || 'Unknown Subject',
            ClassType: gradeData.ClassType || 'lecture-only',
            midterm: gradeData.midterm,
            final: gradeData.final,
            summary: gradeData.summary
          };
        });
        console.log("Processed grades array:", gradesArray);
        
        // Filter by specific schedule if provided
        if (scheduleId) {
          const filteredGrades = gradesArray.filter(grade => grade.ScheduleID === scheduleId);
          setScheduleGrades(filteredGrades);
        } else {
          setGrades(gradesArray);
        }
        
        if (gradesArray.length === 0) {
          console.log("No grades available for this student");
          brandedToast.info("No grades have been entered for your subjects yet.");
        } else {
          console.log(`Successfully loaded ${gradesArray.length} grade records`);
        }
      } else if (data.error) {
        console.error("Grades API error:", data.error);
        brandedToast.error(`Error loading grades: ${data.error}`);
        if (scheduleId) {
          setScheduleGrades([]);
        } else {
          setGrades([]);
        }
      } else {
        console.log("No grades found or unexpected response format:", data);
        brandedToast.info("No grades available yet.");
        if (scheduleId) {
          setScheduleGrades([]);
        } else {
          setGrades([]);
        }
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      brandedToast.error(`Failed to load grades: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (scheduleId) {
        setScheduleGrades([]);
      } else {
        setGrades([]);
      }
    }
  };

  const fetchAttendance = async (sessionType?: 'lecture' | 'lab', sessionNumber?: number, scheduleId?: number) => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        console.log("No session cookie found for attendance fetch");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      console.log(`Fetching attendance for userId: ${session.userId}`);
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        role: 'student',
        userId: session.userId.toString()
      });
      
      // Add schedule filter if specified
      if (scheduleId) {
        queryParams.append('scheduleId', scheduleId.toString());
      }
      
      // Add session type filter if specified
      if (sessionType) {
        queryParams.append('sessionType', sessionType);
      }
      
      // Add session number filter if specified
      if (sessionNumber) {
        queryParams.append('week', sessionNumber.toString());
      }
      
      const response = await fetch(`/api/attendance?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error(`Attendance API failed: ${response.status} ${response.statusText}`);
        brandedToast.error("Failed to fetch attendance from server");
        return;
      }
      
      const data = await response.json();
      console.log("Attendance response:", data);

      if (data.success) {
        // Filter out regular attendance records if a cancelled class record exists
        let filteredData = data.data || [];
        
        // Group records by ScheduleID, Week, SessionType
        const sessionGroups: {[key: string]: any[]} = {};
        filteredData.forEach((record: any) => {
          const key = `${record.ScheduleID}-${record.Week}-${record.SessionType}`;
          if (!sessionGroups[key]) {
            sessionGroups[key] = [];
          }
          sessionGroups[key].push(record);
        });
        
        // Filter each group: if CC exists, only show CC; otherwise show all
        filteredData = [];
        Object.values(sessionGroups).forEach(group => {
          const hasCancelled = group.some((r: any) => r.Status === 'CC');
          if (hasCancelled) {
            filteredData.push(...group.filter((r: any) => r.Status === 'CC'));
          } else {
            filteredData.push(...group);
          }
        });
        
        if (scheduleId) {
          setScheduleAttendance(filteredData);
        } else {
          setAttendance(filteredData);
        }
      } else if (data.error) {
        console.error("Attendance API error:", data.error);
        brandedToast.error("Error loading attendance records");
      } else {
        console.log("No attendance found or unexpected response format");
        if (scheduleId) {
          setScheduleAttendance([]);
        } else {
          setAttendance([]);
        }
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      brandedToast.error("Failed to load attendance records");
    }
  };

  const handleScheduleClick = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setCurrentSessionType('lecture');
    setCurrentSessionNumber(1);
    await fetchAttendance('lecture', 1, schedule.ScheduleID);
    await fetchCancelledSessions(schedule.ScheduleID);
  };

  const handleGradesScheduleClick = async (schedule: Schedule) => {
    setSelectedGradesSchedule(schedule);
    await fetchGrades(schedule.ScheduleID);
  };

  const handleBackToSchedules = () => {
    setSelectedSchedule(null);
    setScheduleAttendance([]);
    setCurrentSessionType('lecture');
    setCurrentSessionNumber(1);
  };

  const handleBackToGradesSchedules = () => {
    setSelectedGradesSchedule(null);
    setScheduleGrades([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      approved: { color: "bg-green-100 text-green-800", label: "Approved" },
      declined: { color: "bg-red-100 text-red-800", label: "Declined" },
      partial: { color: "bg-blue-100 text-blue-800", label: "Partial Approval" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getApprovalStatus = (deanStatus: string, coordStatus: string, instStatus: string) => {
    const statuses = [
      { label: "Dean", status: deanStatus },
      { label: "Coordinator", status: coordStatus },
      { label: "Instructor", status: instStatus }
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {statuses.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="text-xs font-medium">{item.label}:</span>
            <Badge 
              variant={item.status === "approved" ? "default" : 
                      item.status === "declined" ? "destructive" : "secondary"}
              className="text-xs"
            >
              {item.status}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  const fetchCancelledSessions = async (scheduleID: number) => {
    try {
      console.log('Fetching cancelled sessions for schedule:', scheduleID)
      const res = await fetch(`/api/attendance/cancelled-sessions?scheduleId=${scheduleID}`)
      if (res.ok) {
        const result = await res.json()
        console.log('Cancelled sessions API response:', result)
        const cancelledData = result.success ? result.data : result
        
        if (Array.isArray(cancelledData) && cancelledData.length > 0) {
          const cancelledSessionsMap: {[key: string]: {reason: string, cancelledBy: string, cancelledAt: string}} = {}
          
          cancelledData.forEach((record: any) => {
            const sessionKey = `${record.ScheduleID}-${record.Week}`
            cancelledSessionsMap[sessionKey] = {
              reason: (record.CancellationReason || record.Remarks || 'No reason provided').replace(/^Class Cancelled by instructor\. Reason: /, ''),
              cancelledBy: record.RecordedBy || 'Unknown',
              cancelledAt: record.Date || new Date().toISOString()
            }
          })
          
          console.log('Processed cancelled sessions:', cancelledSessionsMap)
          setCancelledSessions(cancelledSessionsMap)
        }
      }
    } catch (error) {
      console.error('Error fetching cancelled sessions:', error)
    }
  }

  const isCurrentSessionCancelled = (scheduleID: number) => {
    const sessionKey = `${scheduleID}-${currentSessionNumber}`
    return cancelledSessions[sessionKey] !== undefined
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'P': return 'Present';
      case 'A': return 'Absent';
      case 'E': return 'Excused';
      case 'L': return 'Late';
      case 'D': return 'Dropped';
      case 'FA': return 'Failure due to Absences';
      case 'CC': return 'Class Cancelled';
      default: return 'Unknown';
    }
  };

  const openScheduleHub = (schedule: Schedule) => {
    setSelectedScheduleForHub(schedule);
    setShowScheduleHub(true);
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          {studentData && (
            <p className="text-gray-600 mt-1">
              Welcome back, {studentData.name}
            </p>
          )}
        </div>
      </div>

      {/* Student Info Card */}
      {studentData && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const totalSubjects = schedules.length;
              const totalUnits = schedules.reduce((sum, s) => sum + (s.Units || 0), 0);
              const gradeValues = grades.map(g => g.summary).filter(v => v !== null) as number[];
              const overallGrade = gradeValues.length > 0
                ? (Math.round((gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length) * 100) / 100).toFixed(2)
                : 'N/A';
              const attTotal = attendance.length;
              const attEffectivePresent = attendance.filter(r => r.Status === 'P' || r.Status === 'E').length;
              const attendanceRate = attTotal > 0 ? Math.round((attEffectivePresent / attTotal) * 100) : 0;
              return (
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-semibold">{studentData.course}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Year Level</p>
                    <p className="font-semibold">{studentData.yearLevel}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Section</p>
                    <p className="font-semibold">{studentData.section}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Subjects</p>
                    <p className="font-semibold">{totalSubjects}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Units</p>
                    <p className="font-semibold">{totalUnits > 0 ? totalUnits : '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Overall Grade</p>
                    <p className={`font-semibold ${overallGrade !== 'N/A' ? (parseFloat(overallGrade) <= 3.0 ? 'text-green-700' : 'text-red-700') : 'text-gray-700'}`}>{overallGrade}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Attendance Rate</p>
                    <p className="font-semibold">{attendanceRate}%</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="excuse-letters">Excuse Letters</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with important announcements, grade updates, and attendance changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Grade Update Notifications */}
                {grades.some(g => g.midterm !== null || g.final !== null || g.summary !== null) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 text-sm mb-1">New Grades Available</h3>
                        <p className="text-blue-700 text-sm mb-2">
                          Check your grades tab to view updated grade information for your subjects.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {grades.filter(g => g.summary !== null).map(grade => (
                            <Badge key={grade.ScheduleID} variant="secondary" className="text-xs">
                              {grade.SubjectCode}: {grade.summary?.toFixed(1)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Attendance Warnings */}
                {(() => {
                  const warningAttendance = attendance.filter(r => r.Status === 'A' || r.Status === 'FA');
                  if (warningAttendance.length > 0) {
                    return (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-yellow-900 text-sm mb-1">Attendance Warning</h3>
                            <p className="text-yellow-700 text-sm mb-2">
                              You have {warningAttendance.length} absent or failed attendance record(s). 
                              Consider submitting an excuse letter if applicable.
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const tabsList = document.querySelector('[role="tablist"]');
                                const excuseTab = Array.from(tabsList?.children || []).find(
                                  (child: any) => child.textContent === 'Excuse Letters'
                                );
                                if (excuseTab) (excuseTab as HTMLElement).click();
                              }}
                            >
                              Submit Excuse Letter
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Notification Feed (basic info) */}
                <div className="bg-white border rounded-lg">
                  {(() => {
                    const recentAttendance = [...attendance]
                      .sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime())
                      .slice(0, 5);
                    const gradedSubjects = grades.filter(g => g.summary !== null).slice(0, 5);

                    const hasAny = recentAttendance.length > 0 || gradedSubjects.length > 0;
                    if (!hasAny) {
                      return (
                        <div className="p-4 text-sm text-gray-500">No notifications</div>
                      );
                    }

                    return (
                      <>
                        {recentAttendance.map((item, idx) => (
                          <div key={`notif-att-${idx}`} className="p-4 flex items-start gap-3 border-b last:border-b-0">
                            <div className="p-2 bg-gray-100 rounded-md"><Calendar className="h-4 w-4 text-gray-700" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium text-gray-900 truncate">
                                  Attendance • {item.SubjectCode}
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">
                                  {new Date(item.Date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-gray-700 flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.Status === 'P' ? 'bg-green-100 text-green-800' :
                                  item.Status === 'A' ? 'bg-red-100 text-red-800' :
                                  item.Status === 'E' ? 'bg-blue-100 text-blue-800' :
                                  item.Status === 'L' ? 'bg-yellow-100 text-yellow-800' :
                                  item.Status === 'D' ? 'bg-orange-100 text-orange-800' :
                                  item.Status === 'FA' ? 'bg-red-200 text-red-900' :
                                  item.Status === 'CC' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {getStatusText(item.Status)}
                                </span>
                                <span className="text-xs text-gray-500">• Week {item.Week}</span>
                              </div>
                            </div>
                          </div>
                        ))}

                        {gradedSubjects.map((g, idx) => (
                          <div key={`notif-grade-${idx}`} className="p-4 flex items-start gap-3 border-b last:border-b-0">
                            <div className="p-2 bg-blue-100 rounded-md"><GraduationCap className="h-4 w-4 text-blue-700" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium text-gray-900 truncate">
                                  Grades • {g.SubjectCode}
                                </div>
                                <div className="text-xs text-gray-500 whitespace-nowrap">Updated</div>
                              </div>
                              <div className="mt-1 text-sm text-gray-700 flex items-center gap-3">
                                <span className="text-xs">Overall: {g.summary?.toFixed(2)}</span>
                                {g.midterm !== null && (<span className="text-xs">Midterm: {g.midterm.toFixed(2)}</span>)}
                                {g.final !== null && (<span className="text-xs">Final: {g.final.toFixed(2)}</span>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                </div>

                {/* No New Notifications */}
                {grades.every(g => g.midterm === null && g.final === null && g.summary === null) &&
                 attendance.filter(r => r.Status === 'A' || r.Status === 'FA').length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No new notifications</p>
                    <p className="text-sm text-gray-500 mt-2">You're all caught up!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab - New consolidated view */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">My Schedules</h2>
              <p className="text-sm text-gray-600">Click on a subject to view details, attendance, or grades</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No enrolled subjects found.</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              schedules.map((schedule) => (
                <Card 
                  key={schedule.ScheduleID} 
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => openScheduleHub(schedule)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{schedule.SubjectCode}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">{schedule.SubjectTitle}</CardDescription>
                      </div>
                      {(() => {
                        const hasGrades = grades.some(g => g.ScheduleID === schedule.ScheduleID && (g.midterm !== null || g.final !== null));
                        const hasAttendance = attendance.some(a => a.ScheduleID === schedule.ScheduleID);
                        if (hasGrades && hasAttendance) {
                          return <Badge className="bg-green-100 text-green-800 text-xs h-5">Complete</Badge>;
                        }
                        return null;
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span className="truncate">{schedule.Day} • {schedule.Time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FileText className="h-3 w-3" />
                      <span className="truncate">{schedule.Room}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <GraduationCap className="h-3 w-3" />
                      <span className="truncate">{schedule.InstructorName}</span>
                    </div>
                    <Badge variant="outline" className="text-xs w-fit">
                      {(() => {
                        const ct = (schedule.ClassType || '').toUpperCase();
                        if (ct === 'LECTURE-ONLY' || ct === 'LECTURE') return 'Lecture';
                        if (ct === 'LAB-ONLY' || ct === 'LAB') return 'Lab';
                        if (ct === 'LECTURE-LAB' || ct === 'LECTURE+LAB') return 'Lec+Lab';
                        if (ct === 'MAJOR') return 'Cisco';
                        if (ct === 'NSTP') return 'NSTP';
                        if (ct === 'OJT') return 'OJT';
                        return 'Lecture';
                      })()}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Excuse Letters Tab */}
        <TabsContent value="excuse-letters" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Excuse Letters</h2>
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                console.log("Button clicked, studentData:", studentData); // Debug log
                if (!studentData) {
                  brandedToast.error("Student data not loaded. Please refresh the page.");
                  return;
                }
                setShowExcuseModal(true);
              }}
              disabled={!studentData}
            >
              <Plus className="h-4 w-4" />
              Submit New Excuse Letter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {excuseLetters.length === 0 ? (
              <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No excuse letters submitted yet.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      console.log("First excuse letter button clicked, studentData:", studentData); // Debug log
                      if (!studentData) {
                        brandedToast.error("Student data not loaded. Please refresh the page.");
                        return;
                      }
                      setShowExcuseModal(true);
                    }}
                    disabled={!studentData}
                  >
                    Submit Your First Excuse Letter
                  </Button>
                </CardContent>
              </Card>
            </div>
            ) : (
              excuseLetters.map((letter) => (
                <Card key={letter.ExcuseLetterID} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{letter.Subject}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {new Date(letter.SubmissionDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(letter.Status)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0 space-y-2">
                    <p className="text-sm text-gray-600 line-clamp-2 leading-snug">{letter.Reason}</p>
                    
                    <div className="flex flex-col gap-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="truncate">
                          {new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}
                        </span>
                      </div>
                      {excuseLetterFiles[letter.ExcuseLetterID] && excuseLetterFiles[letter.ExcuseLetterID].length > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" />
                          <span>{excuseLetterFiles[letter.ExcuseLetterID].length} file(s)</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full mt-2 text-xs"
                      onClick={() => setSelectedExcuseLetter(letter)}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>My Grades</CardTitle>
              <CardDescription>
                {selectedGradesSchedule 
                  ? `Grades for ${selectedGradesSchedule.SubjectCode} - ${selectedGradesSchedule.SubjectTitle}`
                  : "Select a subject to view your grades - Click on subjects to expand details"
                }
              </CardDescription>

              {selectedGradesSchedule && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToGradesSchedules}
                    className="flex items-center gap-2"
                  >
                    ← Back to All Subjects
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedGradesSchedule ? (
                // Display all schedules
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No enrolled subjects found.</p>
                      </div>
                    ) : (
                      schedules.map((schedule) => {
                        // Find if this schedule has grades
                        const scheduleGrade = grades.find(grade => grade.ScheduleID === schedule.ScheduleID);
                        const hasGrades = scheduleGrade && (scheduleGrade.midterm !== null || scheduleGrade.final !== null || scheduleGrade.summary !== null);
                        
                        return (
                          <Card 
                            key={schedule.ScheduleID} 
                            className="cursor-pointer hover:shadow-md transition-all"
                            onClick={() => handleGradesScheduleClick(schedule)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base font-semibold truncate">{schedule.SubjectCode}</CardTitle>
                                  <CardDescription className="text-xs mt-1 line-clamp-2">{schedule.SubjectTitle}</CardDescription>
                                </div>
                                {hasGrades && (
                                  <Badge className="bg-green-100 text-green-800 text-xs h-5">✓</Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="h-3 w-3" />
                                <span className="truncate">{schedule.Room}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <FileText className="h-3 w-3" />
                                <span className="truncate">{schedule.InstructorName}</span>
                              </div>
                              <Badge variant="outline" className="text-xs w-fit">
                                {(() => {
                                  const ct = (schedule.ClassType || '').toUpperCase();
                                  if (ct === 'LECTURE-ONLY' || ct === 'LECTURE') return 'Lecture';
                                  if (ct === 'LAB-ONLY' || ct === 'LAB') return 'Lab';
                                  if (ct === 'LECTURE-LAB' || ct === 'LECTURE+LAB') return 'Lec+Lab';
                                  if (ct === 'MAJOR') return 'Cisco';
                                  if (ct === 'NSTP') return 'NSTP';
                                  if (ct === 'OJT') return 'OJT';
                                  return 'Lecture';
                                })()}
                              </Badge>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                // Display grades for selected schedule
                <div className="space-y-4">
                  {scheduleGrades.length === 0 ? (
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No grades available yet</p>
                      <p className="text-gray-500 text-sm">Your grades will appear here once your instructor has entered them.</p>
                    </div>
                  ) : (
                    scheduleGrades.map((grade) => {
                      const hasAnyGrade = grade.midterm !== null || grade.final !== null || grade.summary !== null;
                      const midtermDisplay = grade.midterm !== null ? grade.midterm.toFixed(2) : 'Not Available';
                      const finalDisplay = grade.final !== null ? grade.final.toFixed(2) : 'Not Available';
                      const summaryDisplay = grade.summary !== null ? grade.summary.toFixed(2) : 'Incomplete';
                      const isExpanded = expandedGrades[grade.ScheduleID] || false;
                      
                      const toggleExpanded = () => {
                        setExpandedGrades(prev => ({
                          ...prev,
                          [grade.ScheduleID]: !prev[grade.ScheduleID]
                        }));
                      };
                      
                      return (
                        <div key={grade.ScheduleID} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {/* Subject Header - Always Visible */}
                          <div 
                            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={toggleExpanded}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  )}
                                  <div>
                                    <h3 className="font-semibold text-lg text-gray-900">
                                      {grade.SubjectCode} - {grade.SubjectName}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {(() => {
                                        const ct = (grade.ClassType || '').toUpperCase();
                                        if (ct === 'LECTURE-ONLY' || ct === 'LECTURE') return 'Lecture Class';
                                        if (ct === 'LAB-ONLY' || ct === 'LAB') return 'Lab Only Class';
                                        if (ct === 'LECTURE-LAB' || ct === 'LECTURE+LAB') return 'Lecture and Laboratory Class';
                                        if (ct === 'MAJOR') return 'Cisco Class';
                                        if (ct === 'NSTP') return 'NSTP Class';
                                        if (ct === 'OJT') return 'OJT Class';
                                        return 'Lecture Class';
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {/* Quick Grade Display */}
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="text-center">
                                    <div className={`font-medium ${
                                      grade.midterm !== null ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {grade.midterm !== null ? grade.midterm.toFixed(1) : 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">Mid</div>
                                  </div>
                                  <div className="text-center">
                                    <div className={`font-medium ${
                                      grade.final !== null ? 'text-blue-600' : 'text-gray-400'
                                    }`}>
                                      {grade.final !== null ? grade.final.toFixed(1) : 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">Final</div>
                                  </div>
                                </div>
                                
                                {/* Overall Grade Badge */}
                                <div className="text-right">
                                  <div className={`text-xl font-bold ${
                                    grade.summary !== null 
                                      ? grade.summary <= 3.0 
                                        ? 'text-green-600' 
                                        : 'text-red-600'
                                      : 'text-gray-400'
                                  }`}>
                                    {summaryDisplay}
                                  </div>
                                  {grade.summary !== null && (
                                    <Badge variant={grade.summary <= 3.0 ? "default" : "destructive"} className="text-xs">
                                      {grade.summary <= 3.0 ? "Passed" : "Failed"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Expanded Content - Only Visible When Expanded */}
                          {isExpanded && (
                            <div className="border-t bg-gray-50/50">
                              <div className="p-6 space-y-6">
                                {/* Detailed Grade Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className={`p-4 rounded-lg border-2 transition-all ${
                                    grade.midterm !== null 
                                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="text-center">
                                      <div className={`text-3xl font-bold mb-2 ${
                                        grade.midterm !== null ? 'text-blue-700' : 'text-gray-500'
                                      }`}>
                                        {midtermDisplay}
                                      </div>
                                      <div className="text-sm font-medium text-gray-700 mb-1">Midterm Grade</div>
                                      {grade.midterm === null ? (
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                                          Pending Evaluation
                                        </div>
                                      ) : (
                                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                          grade.midterm <= 3.0 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {grade.midterm <= 3.0 ? 'Passing' : 'Needs Improvement'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className={`p-4 rounded-lg border-2 transition-all ${
                                    grade.final !== null
                                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="text-center">
                                      <div className={`text-3xl font-bold mb-2 ${
                                        grade.final !== null ? 'text-blue-700' : 'text-gray-500'
                                      }`}>
                                        {finalDisplay}
                                      </div>
                                      <div className="text-sm font-medium text-gray-700 mb-1">Final Grade</div>
                                      {grade.final === null ? (
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                                          Pending Evaluation
                                        </div>
                                      ) : (
                                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                                          grade.final <= 3.0 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                          {grade.final <= 3.0 ? 'Passing' : 'Needs Improvement'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Overall Summary */}
                                <div className={`p-4 rounded-lg border-2 ${
                                  grade.summary !== null 
                                    ? grade.summary <= 3.0
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="text-center">
                                    <div className="text-sm font-medium text-gray-700 mb-2">Overall Performance</div>
                                    <div className={`text-4xl font-bold mb-3 ${
                                      grade.summary !== null 
                                        ? grade.summary <= 3.0 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                        : 'text-gray-400'
                                    }`}>
                                      {summaryDisplay}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      {grade.summary !== null ? (
                                        <>
                                          <Badge 
                                            variant={grade.summary <= 3.0 ? "default" : "destructive"} 
                                            className="text-sm px-3 py-1"
                                          >
                                            {grade.summary <= 3.0 ? "✅ PASSED" : "❌ FAILED"}
                                          </Badge>
                                          <div className="text-xs text-gray-600 mt-2">
                                            {grade.summary <= 3.0 
                                              ? 'Congratulations! You have successfully completed this subject.' 
                                              : 'Additional effort may be needed to improve your performance.'}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-sm text-gray-500">
                                          {!hasAnyGrade 
                                            ? 'No grades have been entered yet. Please check back later.' 
                                            : 'Partial grades available. Final grade will be calculated once all components are complete.'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Grade Status Info */}
                                <div className="text-center text-xs text-gray-500 pt-2 border-t">
                                  <p>
                                    {!hasAnyGrade ? 'Waiting for instructor to enter grades' : 
                                     grade.midterm !== null && grade.final !== null ? 'All grade components completed' :
                                     'Some grade components are still pending'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>My Attendance</CardTitle>
              <CardDescription>
                {selectedSchedule 
                  ? `Attendance for ${selectedSchedule.SubjectCode} - ${selectedSchedule.SubjectTitle}`
                  : "Select a subject to view your attendance records"
                }
              </CardDescription>

              {selectedSchedule && (
                <div className="mt-4 flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSchedules}
                    className="flex items-center gap-2"
                  >
                    ← Back to All Subjects
                  </Button>
                  
                  {/* Session Number Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Session:</span>
                    <Select value={currentSessionNumber.toString()} onValueChange={async (value) => {
                      const newSessionNumber = parseInt(value);
                      setCurrentSessionNumber(newSessionNumber);
                      await fetchAttendance(currentSessionType, newSessionNumber, selectedSchedule.ScheduleID);
                      await fetchCancelledSessions(selectedSchedule.ScheduleID);
                    }}>
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="Session" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 18 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Status Legend */}
              {selectedSchedule && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status Legend:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Present (P)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Absent (A)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Late (L)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Excused (E)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Dropped (D)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-800 rounded-full"></div>
                      <span>Failed (FA)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Class Cancelled (CC)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!selectedSchedule ? (
                // Display all schedules
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No enrolled subjects found.</p>
                      </div>
                    ) : (
                      schedules.map((schedule) => (
                        <Card 
                          key={schedule.ScheduleID} 
                          className="cursor-pointer hover:shadow-md transition-all"
                          onClick={() => handleScheduleClick(schedule)}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold truncate">{schedule.SubjectCode}</CardTitle>
                                <CardDescription className="text-xs mt-1 line-clamp-2">{schedule.SubjectTitle}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="h-3 w-3" />
                              <span className="truncate">{schedule.Room}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <FileText className="h-3 w-3" />
                              <span className="truncate">{schedule.InstructorName}</span>
                            </div>
                            <Badge variant="outline" className="text-xs w-fit">
                              {(() => {
                                const ct = (schedule.ClassType || '').toUpperCase();
                                if (ct === 'LECTURE-ONLY' || ct === 'LECTURE') return 'Lecture';
                                if (ct === 'LAB-ONLY' || ct === 'LAB') return 'Lab';
                                if (ct === 'LECTURE-LAB' || ct === 'LECTURE+LAB') return 'Lec+Lab';
                                if (ct === 'MAJOR') return 'Cisco';
                                if (ct === 'NSTP') return 'NSTP';
                                if (ct === 'OJT') return 'OJT';
                                return 'Lecture';
                              })()}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                // Display attendance for selected schedule
                <div className="space-y-6">
                  {/* Session-Based Attendance Display */}
                  <div className="bg-gray-50 px-4 py-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-700">
                        {currentSessionType === 'lecture' ? '📚 Lecture' : '🧪 Laboratory'} Session {currentSessionNumber} Attendance
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentSessionType === 'lecture' ? 'Lecture' : 'Laboratory'} sessions: 1-18 per semester
                      </div>
                    </div>
                  </div>

                  {/* Cancelled Session Alert */}
                  {selectedSchedule && isCurrentSessionCancelled(selectedSchedule.ScheduleID) && (() => {
                    const sessionKey = `${selectedSchedule.ScheduleID}-${currentSessionNumber}`
                    const cancellationDetails = cancelledSessions[sessionKey]
                    
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-800 text-sm mb-2">Session Cancelled</h3>
                            <p className="text-red-700 text-sm mb-1">
                              <span className="font-medium">Reason:</span> {cancellationDetails?.reason || 'No reason provided'}
                            </p>
                            <p className="text-red-600 text-xs">
                              This session has been cancelled by your instructor. No attendance will be recorded for this session.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Subject-wise Attendance Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r">
                              Subject
                            </th>
                            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 border-r">
                              Date
                            </th>
                            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 border-r">
                              Session Type
                            </th>
                            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 border-r">
                              Session #
                            </th>
                            <th className="px-3 py-3 text-center text-sm font-medium text-gray-700">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {scheduleAttendance.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                {currentSessionNumber && currentSessionType ? 
                                  `No attendance records found for ${currentSessionType} session ${currentSessionNumber}.` :
                                  'No attendance records found for this subject. Use the session controls above to filter specific sessions.'
                                }
                              </td>
                            </tr>
                          ) : (
                            scheduleAttendance.map((record: AttendanceData, index) => (
                              <tr key={record.AttendanceID || index} className="hover:bg-gray-50">
                                <td className="px-4 py-3 border-r">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {record.SubjectCode} - {record.SubjectName || record.SubjectTitle || 'Unknown Subject'}
                                    </div>
                                    {record.Remarks && (
                                      <div className="text-sm text-gray-500 mt-1">
                                        {record.Remarks}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center border-r">
                                  <div className="text-sm text-gray-600">
                                    {new Date(record.Date).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center border-r">
                                  <div className="text-sm text-gray-600">
                                    {(() => {
                                      const type = (record as any).SessionType || currentSessionType || '';
                                      if (type === 'lecture') return '📚 Lecture';
                                      if (type === 'lab') return '🧪 Lab';
                                      return 'All';
                                    })()}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center border-r">
                                  <div className="text-sm font-medium text-gray-900">
                                    {record.Week}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex justify-center">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      record.Status === 'P' ? 'bg-green-100 text-green-800' :
                                      record.Status === 'A' ? 'bg-red-100 text-red-800' :
                                      record.Status === 'E' ? 'bg-blue-100 text-blue-800' :
                                      record.Status === 'L' ? 'bg-yellow-100 text-yellow-800' :
                                      record.Status === 'D' ? 'bg-orange-100 text-orange-800' :
                                      record.Status === 'FA' ? 'bg-red-200 text-red-900' :
                                      record.Status === 'CC' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {record.Status === 'P' ? 'Present' :
                                       record.Status === 'A' ? 'Absent' :
                                       record.Status === 'E' ? 'Excused' :
                                       record.Status === 'L' ? 'Late' :
                                       record.Status === 'D' ? 'Dropped' :
                                       record.Status === 'FA' ? 'Failed' :
                                       record.Status === 'CC' ? 'Class Cancelled' : 'Unknown'}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Overall Attendance Summary */}
                  {scheduleAttendance.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {(() => {
                        const stats = {
                          present: scheduleAttendance.filter(r => r.Status === 'P').length,
                          absent: scheduleAttendance.filter(r => r.Status === 'A').length,
                          excused: scheduleAttendance.filter(r => r.Status === 'E').length,
                          late: scheduleAttendance.filter(r => r.Status === 'L').length,
                          dropped: scheduleAttendance.filter(r => r.Status === 'D').length,
                          failed: scheduleAttendance.filter(r => r.Status === 'FA').length
                        };
                        
                        const total = scheduleAttendance.length;
                        const effectivePresent = stats.present + stats.excused;
                        const attendanceRate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

                        return (
                          <>
                            <div className="text-center p-3 bg-green-50 rounded-lg border">
                              <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                              <div className="text-sm text-gray-600">Present</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg border">
                              <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                              <div className="text-sm text-gray-600">Absent</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg border">
                              <div className="text-2xl font-bold text-blue-700">{stats.excused}</div>
                              <div className="text-sm text-gray-600">Excused</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg border">
                              <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
                              <div className="text-sm text-gray-600">Late</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 rounded-lg border">
                              <div className="text-2xl font-bold text-orange-700">{stats.dropped}</div>
                              <div className="text-sm text-gray-600">Dropped</div>
                            </div>
                            <div className="text-center p-3 bg-red-100 rounded-lg border">
                              <div className="text-2xl font-bold text-red-900">{stats.failed}</div>
                              <div className="text-sm text-gray-600">Failed</div>
                            </div>
                            <div className="text-center p-3 bg-blue-50 rounded-lg border">
                              <div className="text-2xl font-bold text-blue-700">{attendanceRate}%</div>
                              <div className="text-sm text-gray-600">Attendance Rate</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Legend */}
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-green-600 rounded"></div>
                        <span>Present (P)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-600 rounded"></div>
                        <span>Absent (A)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span>Excused (E)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                        <span>Late (L)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-orange-600 rounded"></div>
                        <span>Dropped (D)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-red-800 rounded"></div>
                        <span>Failed (FA)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Class Schedule</CardTitle>
              <CardDescription>Your enrolled subjects and schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedules.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No class schedules found.</p>
                  </div>
                ) : (
                  schedules.map((schedule) => (
                    <Card 
                      key={schedule.ScheduleID} 
                      className="cursor-pointer hover:shadow-md transition-all"
                      onClick={() => openScheduleHub(schedule)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold truncate">{schedule.SubjectCode}</CardTitle>
                            <CardDescription className="text-xs mt-1 line-clamp-2">{schedule.SubjectTitle}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{schedule.Room}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">{schedule.InstructorName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs w-fit">
                          {(() => {
                            const ct = (schedule.ClassType || '').toUpperCase();
                            if (ct === 'LECTURE-ONLY' || ct === 'LECTURE') return 'Lecture';
                            if (ct === 'LAB-ONLY' || ct === 'LAB') return 'Lab';
                            if (ct === 'LECTURE-LAB' || ct === 'LECTURE+LAB') return 'Lec+Lab';
                            if (ct === 'MAJOR') return 'Cisco';
                            if (ct === 'NSTP') return 'NSTP';
                            if (ct === 'OJT') return 'OJT';
                            return 'Lecture';
                          })()}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Excuse Letter Submission Modal */}
      <SubmitExcuseLetterModal
        isOpen={showExcuseModal && !!studentData}
        onClose={() => {
          console.log("Modal closing"); // Debug log
          setShowExcuseModal(false);
        }}
        onSuccess={() => {
          console.log("Excuse letter submitted successfully"); // Debug log
          setShowExcuseModal(false);
          fetchExcuseLetters();
          brandedToast.success("Excuse letter submitted successfully!");
        }}
        studentId={studentData?.studentId || 0}
      />

      {/* View Excuse Letter Modal */}
      <ViewExcuseLetterModal
        isOpen={!!selectedExcuseLetter}
        onClose={() => setSelectedExcuseLetter(null)}
        excuseLetter={selectedExcuseLetter}
        userRole="student"
      />

      {/* Student Schedule Hub Modal */}
      {showScheduleHub && selectedScheduleForHub && studentData && (
        <StudentScheduleHub
          schedule={selectedScheduleForHub}
          studentId={studentData.studentId}
          onClose={() => {
            setShowScheduleHub(false);
            setSelectedScheduleForHub(null);
          }}
        />
      )}
    </div>
  );
}
