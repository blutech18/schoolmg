"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Plus,
  Minus,
  Calculator,
  Printer
} from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";
import ViewExcuseLetterModal from "../student/components/ViewExcuseLetterModal";
import ApprovalModal from "../student/components/ApprovalModal";
import EnhancedSeatPlanModal from "./components/EnhancedSeatPlanModal";
import { printDocument, generateSeatPlanPrintContent, generateAttendancePrintContent } from "../lib/printUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatScheduleEntry, formatScheduleForDisplay, type ScheduleDisplayData } from "@/lib/utils";
import ScheduleHub from "./components/ScheduleHub";
import AttendanceSheetWrapper from "./components/AttendanceSheetWrapper";
import { NotificationBannerContainer, useNotificationBanner } from "@/components/ui/notification-banner";
import ScheduleCard from "@/app/components/ScheduleCard";

interface InstructorStats {
  totalSchedules: number;
  totalStudents: number;
  pendingExcuseLetters: number;
  attendanceRecorded: number;
}

interface Schedule {
  ScheduleID: number;
  Course: string;
  SubjectCode: string;
  SubjectTitle: string;
  Section: string;
  YearLevel: number;
  Day: string;
  Time: string;
  Room: string;
  ClassType: string;
  TotalSeats: number;
  EnrolledStudents: number;
  InstructorName?: string;
  SeatCols?: number;
  SeatMap?: string;
  LectureSeatMap?: string;
  LaboratorySeatMap?: string;
  LectureSeatCols?: number;
  LaboratorySeatCols?: number;
  Lecture?: number;
  Laboratory?: number;
}

interface Student {
  StudentID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  AttendanceRate?: number;
  TotalClasses?: number;
  PresentCount?: number;
  IsDisabled?: boolean;
  IsDropped?: boolean;
  IsFailed?: boolean;
  FirstName?: string;
  MiddleName?: string;
  LastName?: string;
}

interface StudentGrades {
  StudentID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  midtermGrade: number;
  finalGrade: number;
  summaryGrade: number;
  status: string;
}

interface InstructorGradeData {
  ScheduleID: number;
  SubjectCode: string;
  SubjectName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  ClassType: string;
  midterm: number | null;
  final: number | null;
  summary: number | null;
  studentCount: number;
  passedCount: number;
  failedCount: number;
  averageGrade: number;
}

interface ExcuseLetter {
  ExcuseLetterID: number;
  StudentID?: number;
  ScheduleID?: number;
  StudentName: string;
  Course: string;
  Section?: string;
  Subject: string;
  Reason: string;
  DateFrom: string;
  DateTo: string;
  SubmissionDate: string;
  Status: string;
  InstructorStatus: string;
  InstructorComment: string;
  DeanStatus: string;
  CoordinatorStatus: string;
  SubjectCode: string;
  SubjectTitle: string;
  InstructorName: string;
}

export default function InstructorDashboard() {
  const [stats, setStats] = useState<InstructorStats>({
    totalSchedules: 0,
    totalStudents: 0,
    pendingExcuseLetters: 0,
    attendanceRecorded: 0
  });
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentGrades, setStudentGrades] = useState<StudentGrades[]>([]);
  const [allInstructorGrades, setAllInstructorGrades] = useState<InstructorGradeData[]>([]);
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [excuseLettersLoading, setExcuseLettersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('schedules');
  const [currentSessionNumber, setCurrentSessionNumber] = useState(1);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [lectureAttendance, setLectureAttendance] = useState<{[key: string]: {[sessionNumber: number]: string}}>({});
  const [labAttendance, setLabAttendance] = useState<{[key: string]: {[sessionNumber: number]: string}}>({});
  const [currentSessionType, setCurrentSessionType] = useState<'lecture' | 'lab'>('lecture');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDropFailModal, setShowDropFailModal] = useState(false);
  const [bulkMarkingLoading, setBulkMarkingLoading] = useState(false);
  const [dropFailMarkingLoading, setDropFailMarkingLoading] = useState(false);
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null);
  
  // Notification banner system
  const { notifications, addNotification, dismissNotification } = useNotificationBanner();
  
  // CC Modal states
  const [showCCModal, setShowCCModal] = useState(false);
  const [ccReason, setCCReason] = useState('');
  const [ccStudentId, setCCStudentId] = useState<number | null>(null);
  const [ccSessionType, setCCSessionType] = useState<'lecture' | 'lab'>('lecture');
  const [ccNotifyStudents, setCCNotifyStudents] = useState(false);

  // Approval modal states
  const [selectedLetter, setSelectedLetter] = useState<ExcuseLetter | null>(null);
  const [showViewExcuseModal, setShowViewExcuseModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'declined'>('approved');
  const [approvalComment, setApprovalComment] = useState("");

  // Schedule hub modal state
  const [showScheduleHub, setShowScheduleHub] = useState(false);
  const [selectedScheduleForHub, setSelectedScheduleForHub] = useState<Schedule | null>(null);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const handleViewExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedLetter(letter);
    setShowViewExcuseModal(true);
  };

  const handleApproveExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedLetter(letter);
    setApprovalAction('approved');
    setApprovalComment('');
    setShowApprovalModal(true);
  };

  const handleDeclineExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedLetter(letter);
    setApprovalAction('declined');
    setApprovalComment('');
    setShowApprovalModal(true);
  };

  const [instructorId, setInstructorId] = useState<number | null>(null);

  const fetchInstructorData = async () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      setInstructorId(session.userId);
      
      await Promise.all([
        fetchSchedules(session.userId),
        fetchExcuseLetters(session.userId),
        fetchAllInstructorGrades(session.userId)
      ]);
    } catch (error) {
      console.error("Error fetching instructor data:", error);
      brandedToast.error("Failed to load instructor data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (instructorId: number) => {
    try {
      const response = await fetch(`/api/schedules?role=instructor&instructorId=${instructorId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Schedules API response:', data);

      // Handle both response formats
      const schedulesData = data.success ? data.data : (Array.isArray(data) ? data : []);
      
      if (Array.isArray(schedulesData)) {
        // Fetch real enrollment counts for each schedule
        const schedulesWithEnrollment = await Promise.all(
          schedulesData.map(async (schedule: Schedule) => {
            try {
              const enrollmentResponse = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`, {
                credentials: 'include'
              });
              const enrollmentData = await enrollmentResponse.json();
              const enrolledCount = enrollmentData.success ? enrollmentData.data.length : 0;
              
              return {
                ...schedule,
                EnrolledStudents: enrolledCount
              };
            } catch (error) {
              console.error(`Error fetching enrollment for schedule ${schedule.ScheduleID}:`, error);
              return {
                ...schedule,
                EnrolledStudents: 0
              };
            }
          })
        );

        setSchedules(schedulesWithEnrollment);
        
        const totalStudents = schedulesWithEnrollment.reduce((sum: number, schedule: Schedule) => 
          sum + schedule.EnrolledStudents, 0);
        
        setStats(prev => ({
          ...prev,
          totalSchedules: schedulesWithEnrollment.length,
          totalStudents
        }));
      } else {
        console.error('Invalid schedules data format:', data);
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      brandedToast.error("Failed to load schedules");
      setSchedules([]);
    }
  };

  const fetchExcuseLetters = async (instructorId: number) => {
    try {
      const response = await fetch(`/api/excuse-letters?role=instructor&userId=${instructorId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setExcuseLetters(data.data);

        const pendingCount = data.data.filter((letter: ExcuseLetter) =>
          letter.InstructorStatus === 'pending').length;

        setStats(prev => ({
          ...prev,
          pendingExcuseLetters: pendingCount
        }));
      }
    } catch (error) {
      console.error("Error fetching excuse letters:", error);
    }
  };

  const fetchAllInstructorGrades = async (instructorId: number) => {
    try {
      // First get all schedules for this instructor
      const schedulesResponse = await fetch(`/api/schedules?role=instructor&instructorId=${instructorId}`, {
        credentials: 'include'
      });

      if (!schedulesResponse.ok) {
        throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
      }

      const schedulesData = await schedulesResponse.json();
      const schedules = schedulesData.success ? schedulesData.data : (Array.isArray(schedulesData) ? schedulesData : []);

      if (!Array.isArray(schedules) || schedules.length === 0) {
        setAllInstructorGrades([]);
        return;
      }

      // For each schedule, get enrollment data and calculate grade statistics
      const gradeDataPromises = schedules.map(async (schedule: Schedule) => {
        try {
          // Get enrolled students for this schedule
          const enrollmentResponse = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`, {
            credentials: 'include'
          });

          if (!enrollmentResponse.ok) {
            throw new Error(`Failed to fetch enrollments for schedule ${schedule.ScheduleID}`);
          }

          const enrollmentData = await enrollmentResponse.json();
          const enrollments = enrollmentData.success ? enrollmentData.data : [];

          if (!Array.isArray(enrollments) || enrollments.length === 0) {
            return {
              ScheduleID: schedule.ScheduleID,
              SubjectCode: schedule.SubjectCode,
              SubjectName: schedule.SubjectTitle,
              Course: schedule.Course,
              YearLevel: schedule.YearLevel,
              Section: schedule.Section,
              ClassType: schedule.ClassType,
              midterm: null,
              final: null,
              summary: null,
              studentCount: 0,
              passedCount: 0,
              failedCount: 0,
              averageGrade: 5.0
            };
          }

          // Fetch grades for all students in this schedule
          const studentGradePromises = enrollments.map(async (enrollment: any) => {
            try {
              const gradesResponse = await fetch(
                `/api/grades?role=student&userId=${enrollment.StudentID}`,
                { credentials: 'include' }
              );

              if (gradesResponse.ok) {
                const gradesData = await gradesResponse.json();

                if (gradesData.success && gradesData.summary && gradesData.summary[schedule.ScheduleID]) {
                  const scheduleGrades = gradesData.summary[schedule.ScheduleID];
                  return {
                    midterm: scheduleGrades.midterm || 5.0,
                    final: scheduleGrades.final || 5.0,
                    summary: scheduleGrades.summary || 5.0
                  };
                }
              }

              return { midterm: 5.0, final: 5.0, summary: 5.0 };
            } catch (error) {
              console.error(`Error fetching grades for student ${enrollment.StudentID}:`, error);
              return { midterm: 5.0, final: 5.0, summary: 5.0 };
            }
          });

          const studentGrades = await Promise.all(studentGradePromises);

          // Calculate statistics
          const studentCount = studentGrades.length;
          const passedCount = studentGrades.filter(g => g.summary <= 3.0).length;
          const failedCount = studentCount - passedCount;
          const averageGrade = studentCount > 0
            ? studentGrades.reduce((sum, g) => sum + g.summary, 0) / studentCount
            : 5.0;

          // Calculate class averages for midterm and final
          const midtermAvg = studentCount > 0
            ? studentGrades.reduce((sum, g) => sum + g.midterm, 0) / studentCount
            : null;
          const finalAvg = studentCount > 0
            ? studentGrades.reduce((sum, g) => sum + g.final, 0) / studentCount
            : null;

          return {
            ScheduleID: schedule.ScheduleID,
            SubjectCode: schedule.SubjectCode,
            SubjectName: schedule.SubjectTitle,
            Course: schedule.Course,
            YearLevel: schedule.YearLevel,
            Section: schedule.Section,
            ClassType: schedule.ClassType,
            midterm: midtermAvg,
            final: finalAvg,
            summary: averageGrade,
            studentCount,
            passedCount,
            failedCount,
            averageGrade
          };

        } catch (error) {
          console.error(`Error processing schedule ${schedule.ScheduleID}:`, error);
          return {
            ScheduleID: schedule.ScheduleID,
            SubjectCode: schedule.SubjectCode,
            SubjectName: schedule.SubjectTitle,
            Course: schedule.Course,
            YearLevel: schedule.YearLevel,
            Section: schedule.Section,
            ClassType: schedule.ClassType,
            midterm: null,
            final: null,
            summary: null,
            studentCount: 0,
            passedCount: 0,
            failedCount: 0,
            averageGrade: 5.0
          };
        }
      });

      const allGradeData = await Promise.all(gradeDataPromises);
      setAllInstructorGrades(allGradeData);

    } catch (error) {
      console.error("Error fetching all instructor grades:", error);
      brandedToast.error("Failed to load grade overview");
      setAllInstructorGrades([]);
    }
  };

  const handleScheduleSelect = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setActiveTab('attendance'); // Switch to attendance tab
    await fetchStudentsForSchedule(schedule.ScheduleID);
    
    // Clear previous attendance data
    setLectureAttendance({});
    setLabAttendance({});
    
    // Load all lecture and lab attendance data for this schedule
    await Promise.all([
      fetchSessionAttendance(schedule.ScheduleID, null, 'lecture'),
      fetchSessionAttendance(schedule.ScheduleID, null, 'lab')
    ]);
    
    brandedToast.success(`Selected ${schedule.SubjectCode} for attendance management`);
  };

  const fetchSessionAttendance = async (scheduleId: number, sessionNumber: number | null, sessionType: 'lecture' | 'lab' = 'lecture') => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        scheduleId: scheduleId.toString(),
        sessionType: sessionType
      });
      
      // Only add sessionNumber filter if specified
      if (sessionNumber !== null) {
        queryParams.append('week', sessionNumber.toString());
      }
      
      const response = await fetch(`/api/attendance?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.status}`);
      }
      
      const data = await response.json();
      const attendanceRecords = data.success ? data.data : [];
      
      // Process attendance data into session format
      const sessionData: {[key: string]: {[sessionNum: number]: string}} = {};
      
      attendanceRecords.forEach((record: any) => {
        const studentKey = `${record.StudentID}`;
        if (!sessionData[studentKey]) {
          sessionData[studentKey] = {};
        }
        
        // Store by session number (Week field contains the session number)
        const sessionNum = record.Week;
        sessionData[studentKey][sessionNum] = record.Status;
        
        console.log(`📅 Fetching ${sessionType} attendance: StudentID=${record.StudentID}, Session=${sessionNum}, Status=${record.Status}`);
      });
      
      console.log(`📊 ${sessionType} ${sessionNumber ? `session ${sessionNumber}` : 'all sessions'} attendance data loaded:`, sessionData);
      if (sessionType === 'lecture') {
        if (sessionNumber === null) {
          // Replace all lecture data
          setLectureAttendance(sessionData);
        } else {
          // Merge with existing data
          setLectureAttendance(prev => ({
            ...prev,
            ...sessionData
          }));
        }
      } else {
        if (sessionNumber === null) {
          // Replace all lab data
          setLabAttendance(sessionData);
        } else {
          // Merge with existing data
          setLabAttendance(prev => ({
            ...prev,
            ...sessionData
          }));
        }
      }
    } catch (error) {
      console.error(`Error fetching ${sessionType} ${sessionNumber ? `session ${sessionNumber}` : 'all sessions'} attendance:`, error);
      if (sessionType === 'lecture') {
        setLectureAttendance({});
      } else {
        setLabAttendance({});
      }
    }
  };

  const fetchStudentsForSchedule = async (scheduleId: number) => {
    try {
      // Fetch enrolled students for this schedule
      const enrollmentResponse = await fetch(`/api/enrollments?scheduleId=${scheduleId}`, {
        credentials: 'include'
      });
      
      if (!enrollmentResponse.ok) {
        throw new Error(`Failed to fetch enrollments: ${enrollmentResponse.status}`);
      }
      
      const enrollmentData = await enrollmentResponse.json();
      const enrollments = enrollmentData.success ? enrollmentData.data : [];
      
      // Fetch attendance data for each student
      const studentsWithAttendance = await Promise.all(
        enrollments.map(async (enrollment: any) => {
          try {
            const attendanceResponse = await fetch(
              `/api/attendance?studentId=${enrollment.StudentID}&scheduleId=${scheduleId}`,
              { credentials: 'include' }
            );
            
            let attendanceData = [];
            let attendanceRate = 0;
            let totalClasses = 0;
            let presentCount = 0;
            
            if (attendanceResponse.ok) {
              const attendanceResult = await attendanceResponse.json();
              attendanceData = attendanceResult.success ? attendanceResult.data : [];
              
              // Calculate attendance statistics based on actual attendance records
              totalClasses = attendanceData.length; // each record represents one class session
              presentCount = attendanceData.filter((record: any) => 
                record.Status === 'P' || record.Status === 'E'
              ).length;
              attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
            }
            
            // Check if student has D or FA status
            const hasDroppedStatus = attendanceData.some((record: any) => record.Status === 'D');
            const hasFailedStatus = attendanceData.some((record: any) => record.Status === 'FA');

            return {
              StudentID: enrollment.StudentID,
              StudentName: enrollment.StudentName || enrollment.FirstName + ' ' + enrollment.LastName,
              FirstName: enrollment.FirstName,
              MiddleName: enrollment.MiddleName,
              LastName: enrollment.LastName,
              Course: enrollment.Course,
              YearLevel: enrollment.YearLevel,
              Section: enrollment.Section,
              AttendanceRate: attendanceRate,
              TotalClasses: totalClasses,
              PresentCount: presentCount,
              IsDropped: hasDroppedStatus,
              IsFailed: hasFailedStatus,
              IsDisabled: hasDroppedStatus || hasFailedStatus
            };
          } catch (error) {
            console.error(`Error fetching attendance for student ${enrollment.StudentID}:`, error);
            return {
              StudentID: enrollment.StudentID,
              StudentName: enrollment.StudentName || enrollment.FirstName + ' ' + enrollment.LastName,
              FirstName: enrollment.FirstName,
              MiddleName: enrollment.MiddleName,
              LastName: enrollment.LastName,
              Course: enrollment.Course,
              YearLevel: enrollment.YearLevel,
              Section: enrollment.Section,
              AttendanceRate: 0,
              TotalClasses: 0,
              PresentCount: 0,
              IsDropped: false,
              IsFailed: false,
              IsDisabled: false
            };
          }
        })
      );
      
      setStudents(studentsWithAttendance);

      // Update attendance recorded stat
      const recordedCount = studentsWithAttendance.reduce((sum, student) =>
        sum + student.TotalClasses, 0);

      setStats(prev => ({
        ...prev,
        attendanceRecorded: recordedCount
      }));
      
    } catch (error) {
      console.error("Error fetching students for schedule:", error);
      brandedToast.error("Failed to load students data");
      setStudents([]);
    }
  };

  const handleExcuseLetterAction = async (letterId: number, action: 'approved' | 'declined') => {
    setExcuseLettersLoading(true);
    try {
      const response = await fetch('/api/excuse-letters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          excuseLetterID: letterId,
          userRole: 'instructor',
          status: action,
          comment: action === 'approved' ? 'Approved by instructor' : 'Declined by instructor'
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || `Failed to ${action} excuse letter`);
      }

      // Update the local state immediately for better UX
      setExcuseLetters(prev => prev.map(letter =>
        letter.ExcuseLetterID === letterId
          ? { ...letter, InstructorStatus: action, InstructorComment: action === 'approved' ? 'Approved by instructor' : 'Declined by instructor' }
          : letter
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingExcuseLetters: prev.pendingExcuseLetters - 1
      }));

      brandedToast.success(`Excuse letter ${action} successfully`);
      
      // Refresh excuse letters from server to get latest dean/coordinator statuses
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (sessionCookie) {
        try {
          const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          if (session.userId) {
            await fetchExcuseLetters(session.userId);
          }
        } catch (e) {
          console.error('Error refreshing excuse letters:', e);
        }
      }
    } catch (error) {
      console.error('Error updating excuse letter:', error);
      brandedToast.error(error instanceof Error ? error.message : 'Failed to update excuse letter');
    } finally {
      setExcuseLettersLoading(false);
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

    setExcuseLettersLoading(true);
    try {
      const response = await fetch('/api/excuse-letters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          excuseLetterID: selectedLetter.ExcuseLetterID,
          userRole: 'instructor',
          status: approvalAction,
          comment: approvalComment || (approvalAction === 'approved' ? 'Approved by instructor' : 'Declined by instructor')
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || `Failed to ${approvalAction} excuse letter`);
      }

      // Update the local state immediately for better UX
      setExcuseLetters(prev => prev.map(letter =>
        letter.ExcuseLetterID === selectedLetter.ExcuseLetterID
          ? { ...letter, InstructorStatus: approvalAction, InstructorComment: approvalComment || (approvalAction === 'approved' ? 'Approved by instructor' : 'Declined by instructor') }
          : letter
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingExcuseLetters: prev.pendingExcuseLetters - 1
      }));

      brandedToast.success(`Excuse letter ${approvalAction} successfully`);
      setShowApprovalModal(false);
      
      // Refresh excuse letters from server to get latest dean/coordinator statuses
      if (instructorId) {
        await fetchExcuseLetters(instructorId);
      }
    } catch (error) {
      console.error('Error updating excuse letter:', error);
      brandedToast.error(error instanceof Error ? error.message : 'Failed to update excuse letter');
    } finally {
      setExcuseLettersLoading(false);
    }
  };

  const openScheduleHub = (schedule: Schedule) => {
    setSelectedScheduleForHub(schedule);
    setShowScheduleHub(true);
  };

  const markAttendance = async (studentId: number, status: string) => {
    if (!selectedSchedule) {
      brandedToast.error("No schedule selected");
      return;
    }

    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: selectedSchedule.ScheduleID,
          week: currentSessionNumber,
          status,
          date: attendanceDate,
          sessionType: 'lecture', // Default to lecture for backward compatibility
          remarks: `Marked as ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} by instructor`,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }

      brandedToast.success(`Attendance marked as ${status}`);
      
      // Update local state immediately for UI responsiveness
      const studentKey = `${studentId}`;
      if (currentSessionType === 'lecture') {
        setLectureAttendance(prev => ({
          ...prev,
          [studentKey]: {
            ...(prev[studentKey] || {}),
            [currentSessionNumber]: status
          }
        }));
      } else {
        setLabAttendance(prev => ({
          ...prev,
          [studentKey]: {
            ...(prev[studentKey] || {}),
            [currentSessionNumber]: status
          }
        }));
      }
      
      // Refresh student data to show updated attendance
      await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
    } catch (error) {
      console.error('Error marking attendance:', error);
      brandedToast.error('Failed to mark attendance');
    }
  };

  const markAllPresentForDay = async (dayOfWeek: number) => {
    if (!selectedSchedule || students.length === 0) {
      brandedToast.error("No schedule or students found");
      return;
    }

    setBulkMarkingLoading(true);
    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      // Calculate the specific date for the selected day
      const currentYear = new Date().getFullYear();
      const academicYearStart = new Date(currentYear, 7, 1);
      const weekStart = new Date(academicYearStart.getTime() + (currentSessionNumber - 1) * 7 * 24 * 60 * 60 * 1000);
      const dayOfWeekStart = weekStart.getDay();
      const daysToMonday = dayOfWeekStart === 0 ? -6 : 1 - dayOfWeekStart;
      const monday = new Date(weekStart.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
      const specificDate = new Date(monday.getTime() + (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
      const dateString = `${specificDate.getFullYear()}-${String(specificDate.getMonth() + 1).padStart(2, '0')}-${String(specificDate.getDate()).padStart(2, '0')}`;

      const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      const eligibleStudents = students.filter(student => !student.IsDisabled);
      const attendancePromises = eligibleStudents.map(student =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            studentId: student.StudentID,
            scheduleId: selectedSchedule.ScheduleID,
            week: currentSessionNumber,
            status: 'P',
            date: dateString,
            sessionType: currentSessionType,
            remarks: `Marked as Present by instructor (bulk action for ${dayNames[dayOfWeek]} - ${currentSessionType})`,
            recordedBy: instructorId
          })
        })
      );

      await Promise.all(attendancePromises);
      brandedToast.success(`✅ Marked all ${eligibleStudents.length} eligible students as present for ${dayNames[dayOfWeek]}`);

      // Update local state for immediate UI feedback
      if (currentSessionType === 'lecture') {
        setLectureAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const key = `${student.StudentID}`;
            updated[key] = {
              ...(updated[key] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return updated;
        });
      } else {
        setLabAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const key = `${student.StudentID}`;
            updated[key] = {
              ...(updated[key] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return updated;
        });
      }
      
      // Refresh data from server
      await fetchSessionAttendance(selectedSchedule.ScheduleID, currentSessionNumber, currentSessionType);
      await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error marking all present for day:', error);
      brandedToast.error(`Failed to mark all students as present for ${['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}`);
    } finally {
      setBulkMarkingLoading(false);
    }
  };

  const markStudentAsDropFail = async (studentId: number, status: 'D' | 'FA') => {
    if (!selectedSchedule) {
      brandedToast.error('No schedule selected');
      return;
    }

    setDropFailMarkingLoading(true);

    try {
      const statusText = status === 'D' ? 'Dropped' : 'Failure due to Absences';
      console.log(`🔄 Marking student ${studentId} as ${statusText}`);

      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));

      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: selectedSchedule.ScheduleID,
          week: currentSessionNumber,
          status,
          date: currentDate,
          sessionType: currentSessionType,
          remarks: `Marked as ${statusText} by instructor (${currentSessionType} week ${currentSessionNumber})`,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark student status');
      }

      const result = await response.json();

      if (result.success) {
        brandedToast.success(`✅ Marked student as ${statusText} across all sessions`);

        // Refresh all session data from server (both lecture and lab) since D/FA applies to all
        await Promise.all([
          fetchSessionAttendance(selectedSchedule.ScheduleID, null, 'lecture'),
          fetchSessionAttendance(selectedSchedule.ScheduleID, null, 'lab')
        ]);
        await fetchStudentsForSchedule(selectedSchedule.ScheduleID);

        // Don't close modal to allow multiple operations
      } else {
        throw new Error(result.error || 'Failed to mark student status');
      }
    } catch (error) {
      console.error('Error marking student status:', error);
      brandedToast.error(`Failed to mark student as ${status === 'D' ? 'Dropped' : 'Failure due to Absences'}`);
    } finally {
      setDropFailMarkingLoading(false);
    }
  };

  const restoreStudent = async (studentId: number) => {
    if (!selectedSchedule) {
      brandedToast.error('No schedule selected');
      return;
    }

    setDropFailMarkingLoading(true);

    try {
      console.log(`🔄 Restoring student ${studentId}`);

      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));

      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      // Delete the D/FA attendance records for this student in this schedule
      const response = await fetch(`/api/attendance/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: selectedSchedule.ScheduleID,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to restore student');
      }

      const result = await response.json();

      if (result.success) {
        brandedToast.success(`✅ Student restored successfully across all sessions`);

        // Refresh all session data from server (both lecture and lab) since restore affects all
        await Promise.all([
          fetchSessionAttendance(selectedSchedule.ScheduleID, null, 'lecture'),
          fetchSessionAttendance(selectedSchedule.ScheduleID, null, 'lab')
        ]);
        await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      } else {
        throw new Error(result.error || 'Failed to restore student');
      }
    } catch (error) {
      console.error('Error restoring student:', error);
      brandedToast.error('Failed to restore student');
    } finally {
      setDropFailMarkingLoading(false);
    }
  };

  const markAttendanceForSession = async (studentId: number, status: string, sessionType: 'lecture' | 'lab' = 'lecture') => {
    if (!selectedSchedule) {
      brandedToast.error('No schedule selected');
      return;
    }

    // Handle CC status specially - show modal for reason
    if (status === 'CC') {
      setCCStudentId(studentId);
      setCCSessionType(sessionType);
      setCCReason('');
      setCCNotifyStudents(false);
      setShowCCModal(true);
      return;
    }

    // Handle Excused status - check for excuse letters
    if (status === 'E') {
      // Check if student has approved excuse letters for this date/schedule
      const studentExcuseLetters = excuseLetters.filter(letter => 
        letter.StudentID === studentId && 
        letter.ScheduleID === selectedSchedule.ScheduleID &&
        letter.InstructorStatus === 'approved'
      );
      
      if (studentExcuseLetters.length > 0) {
        // Show excuse letter info in remarks
        const excuseLetterInfo = studentExcuseLetters.map(letter => 
          `Approved excuse letter (ID: ${letter.ExcuseLetterID}): ${letter.Reason}`
        ).join('; ');
        
        try {
          // Get instructor ID from session
          const sessionCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('userSession='));
          
          if (!sessionCookie) {
            brandedToast.error("Session not found. Please log in again.");
            return;
          }

          const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          const instructorId = session.userId;

          if (!instructorId) {
            brandedToast.error("Instructor ID not found in session.");
            return;
          }

          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              studentId,
              scheduleId: selectedSchedule.ScheduleID,
              week: currentSessionNumber,
              status: 'E',
              date: attendanceDate,
              sessionType,
              remarks: `Marked as Excused by instructor. ${excuseLetterInfo}`,
              recordedBy: instructorId
            })
          });

          if (!response.ok) {
            throw new Error('Failed to mark attendance');
          }

          brandedToast.success(`Attendance marked as Excused (linked to ${studentExcuseLetters.length} excuse letter${studentExcuseLetters.length > 1 ? 's' : ''})`);
          
          // Refresh student data to show updated attendance
          await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
          return;
        } catch (error) {
          console.error('Error marking attendance:', error);
          brandedToast.error('Failed to mark attendance');
          return;
        }
      } else {
        // No approved excuse letters - proceed with normal marking but show warning
        brandedToast.warning('No approved excuse letters found for this student. Proceeding with Excused status.');
      }
    }

    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error('Session not found. Please log in again.');
        return;
      }

      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = sessionData.userId;

      if (!instructorId) {
        brandedToast.error('Instructor ID not found in session');
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: selectedSchedule.ScheduleID,
          week: currentSessionNumber,
          status,
          date: currentDate,
          sessionType,
          remarks: `Marked as ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} by instructor for ${sessionType} session ${currentSessionNumber}`,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to mark attendance: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        brandedToast.success(`✅ Marked ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} for ${sessionType} session`);
        
        // Update local state immediately for better UX
        if (sessionType === 'lecture') {
          setLectureAttendance(prev => {
            const key = `${studentId}`;
            return {
              ...prev,
              [key]: {
                ...(prev[key] || {}),
                [currentSessionNumber]: status
              }
            };
          });
        } else {
          setLabAttendance(prev => {
            const key = `${studentId}`;
            return {
              ...prev,
              [key]: {
                ...(prev[key] || {}),
                [currentSessionNumber]: status
              }
            };
          });
        }
        
        // Refresh the session attendance data from server
        await fetchSessionAttendance(selectedSchedule.ScheduleID, currentSessionNumber, sessionType);
        // Also refresh the students data to show updated attendance stats
        await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      } else {
        throw new Error(result.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      brandedToast.error(`Failed to mark attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const markAllPresentForSession = async () => {
    if (!selectedSchedule || students.length === 0) {
      brandedToast.error("No schedule or students found");
      return;
    }

    setBulkMarkingLoading(true);
    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      const currentDate = new Date().toISOString().split('T')[0];
      
      const eligibleStudents = students.filter(student => !student.IsDisabled);
      const attendancePromises = eligibleStudents.map(student =>
        fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            studentId: student.StudentID,
            scheduleId: selectedSchedule.ScheduleID,
            week: currentSessionNumber,
            status: 'P',
            date: currentDate,
            sessionType: currentSessionType,
            remarks: `Marked as Present by instructor (bulk action for ${currentSessionType} session ${currentSessionNumber})`,
            recordedBy: instructorId
          })
        })
      );

      await Promise.all(attendancePromises);
      brandedToast.success(`✅ Marked all ${eligibleStudents.length} eligible students as present for ${currentSessionType} session ${currentSessionNumber}`);

      // Update local state for immediate UI feedback
      if (currentSessionType === 'lecture') {
        setLectureAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const key = `${student.StudentID}`;
            updated[key] = {
              ...(updated[key] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return updated;
        });
      } else {
        setLabAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const key = `${student.StudentID}`;
            updated[key] = {
              ...(updated[key] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return updated;
        });
      }
      
      // Refresh data from server
      await fetchSessionAttendance(selectedSchedule.ScheduleID, currentSessionNumber, currentSessionType);
      await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      
    } catch (error) {
      console.error('Error marking all present for session:', error);
      brandedToast.error(`Failed to mark all students as present for ${currentSessionType} session`);
    } finally {
      setBulkMarkingLoading(false);
    }
  };

  const markCCWithReason = async () => {
    if (!selectedSchedule || !ccStudentId || !ccReason.trim()) {
      brandedToast.error('Please provide a reason for class cancellation');
      return;
    }

    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          studentId: ccStudentId,
          scheduleId: selectedSchedule.ScheduleID,
          week: currentSessionNumber,
          status: 'CC',
          date: attendanceDate,
          sessionType: ccSessionType,
          remarks: `Class Cancelled by instructor. Reason: ${ccReason}`,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark class cancellation');
      }

      brandedToast.success('Class cancellation recorded');
      
      // Update local state immediately for UI responsiveness
      const studentKey = `${ccStudentId}`;
      if (ccSessionType === 'lecture') {
        setLectureAttendance(prev => ({
          ...prev,
          [studentKey]: {
            ...(prev[studentKey] || {}),
            [currentSessionNumber]: 'CC'
          }
        }));
      } else {
        setLabAttendance(prev => ({
          ...prev,
          [studentKey]: {
            ...(prev[studentKey] || {}),
            [currentSessionNumber]: 'CC'
          }
        }));
      }
      
      // Optional notification to students
      if (ccNotifyStudents) {
        // For now, we'll just show a toast. In a real implementation, this would send emails or push notifications
        brandedToast.info('Students will be notified about the class cancellation');
      }
      
      setShowCCModal(false);
      setCCReason('');
      setCCStudentId(null);
      setCCNotifyStudents(false);
      
      // Refresh attendance data from server to ensure it's saved and displayed correctly
      await fetchSessionAttendance(selectedSchedule.ScheduleID, currentSessionNumber, ccSessionType);
      // Refresh student data to show updated attendance
      await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
    } catch (error) {
      console.error('Error marking class cancellation:', error);
      brandedToast.error('Failed to record class cancellation');
    }
  };

  const markAllCCForSession = async () => {
    if (!selectedSchedule || !ccReason.trim()) {
      brandedToast.error('Please provide a reason for class cancellation');
      return;
    }

    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error("Session not found. Please log in again.");
        return;
      }

      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = session.userId;

      if (!instructorId) {
        brandedToast.error("Instructor ID not found in session.");
        return;
      }

      const eligibleStudents = students.filter(student => !student.IsDisabled);
      const studentIds = eligibleStudents.map(student => student.StudentID);

      const response = await fetch('/api/attendance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          scheduleId: selectedSchedule.ScheduleID,
          week: currentSessionNumber,
          status: 'CC',
          date: attendanceDate,
          recordedBy: instructorId,
          studentIds,
          sessionType: ccSessionType,
          overrideExisting: true,
          ccReason: ccReason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark class cancellation for all students');
      }

      brandedToast.success(`Class cancellation recorded for all ${eligibleStudents.length} students`);
      
      // Update local state immediately for UI responsiveness
      if (ccSessionType === 'lecture') {
        setLectureAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const studentKey = `${student.StudentID}`;
            updated[studentKey] = {
              ...(updated[studentKey] || {}),
              [currentSessionNumber]: 'CC'
            };
          });
          return updated;
        });
      } else {
        setLabAttendance(prev => {
          const updated = { ...prev };
          eligibleStudents.forEach(student => {
            const studentKey = `${student.StudentID}`;
            updated[studentKey] = {
              ...(updated[studentKey] || {}),
              [currentSessionNumber]: 'CC'
            };
          });
          return updated;
        });
      }
      
      // Optional notification to students
      if (ccNotifyStudents) {
        // Show notification banner for class cancellation
        addNotification({
          type: 'info',
          title: 'Class Cancellation Notice',
          message: `${selectedSchedule.SubjectCode} - ${ccSessionType.charAt(0).toUpperCase() + ccSessionType.slice(1)} Session ${currentSessionNumber} has been cancelled. Reason: ${ccReason}`,
          autoHide: false, // Keep visible until manually dismissed
          action: {
            label: 'View Attendance',
            onClick: () => {
              setActiveTab('attendance');
            }
          }
        });
        
        brandedToast.info(`All ${eligibleStudents.length} students will be notified about the class cancellation`);
      }
      
              setShowCCModal(false);
        setCCReason('');
        setCCStudentId(null);
        setCCNotifyStudents(false);
        
        // Refresh attendance data from server to ensure it's saved and displayed correctly
        await fetchSessionAttendance(selectedSchedule.ScheduleID, currentSessionNumber, ccSessionType);
        // Refresh student data to show updated attendance
        await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      } catch (error) {
        console.error('Error marking class cancellation for all students:', error);
        brandedToast.error('Failed to record class cancellation for all students');
      }
    };

  // Attendance handlers for the new AttendanceSheet component
  const handleAttendanceMarked = async (studentId: number, status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => {
    await markAttendanceForSession(studentId, status, sessionType);
  };

  const handleBulkMarking = async (status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => {
    if (status === 'P') {
      await markAllPresentForSession();
    } else if (status === 'CC') {
      setCCStudentId(null);
      setCCSessionType(sessionType);
      setCCReason('');
      setCCNotifyStudents(false);
      setShowCCModal(true);
    }
  };

  const handleClassCancellation = async (reason: string, notifyStudents: boolean, sessionType: 'lecture' | 'lab', sessionNumber: number, studentId?: number) => {
    if (studentId) {
      await markCCWithReason();
    } else {
      await markAllCCForSession();
    }
  };

  // Print functions
  const printSeatPlan = (seatType: 'lecture' | 'laboratory' = 'lecture') => {
    if (!selectedSchedule) {
      brandedToast.error('Please select a schedule first');
      return;
    }

    // Get seat assignments from the schedule data
    const seatMap = seatType === 'lecture' ? selectedSchedule.LectureSeatMap : selectedSchedule.LaboratorySeatMap;
    const seatAssignments: {[key: number]: number} = {};
    
    if (seatMap) {
      try {
        const parsedSeatMap = JSON.parse(seatMap);
        parsedSeatMap.forEach((studentId: number, index: number) => {
          if (studentId && studentId !== 0) {
            seatAssignments[index] = studentId;
          }
        });
      } catch (error) {
        console.error('Error parsing seat map:', error);
      }
    }

    const printContent = generateSeatPlanPrintContent(
      selectedSchedule,
      seatAssignments,
      students,
      seatType
    );

    printDocument(printContent, `${selectedSchedule.SubjectCode} - ${seatType} Seat Plan`);
  };

  const printAttendance = () => {
    if (!selectedSchedule) {
      brandedToast.error('Please select a schedule first');
      return;
    }

    const attendanceData = currentSessionType === 'lecture' ? lectureAttendance : labAttendance;
    
    const printContent = generateAttendancePrintContent(
      selectedSchedule,
      students,
      attendanceData,
      currentSessionType,
      currentSessionNumber
    );

    printDocument(printContent, `${selectedSchedule.SubjectCode} - Attendance Session ${currentSessionNumber}`);
  };

  const markAttendanceForDay = async (studentId: number, week: number, dayOfWeek: number, status: string, sessionType: 'lecture' | 'lab' = 'lecture') => {
    if (!selectedSchedule) {
      brandedToast.error('No schedule selected');
      return;
    }

    try {
      // Get instructor ID from session
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='));
      
      if (!sessionCookie) {
        brandedToast.error('Session not found. Please log in again.');
        return;
      }

      const sessionData = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
      const instructorId = sessionData.userId;

      if (!instructorId) {
        brandedToast.error('Instructor ID not found in session');
        return;
      }

      // FIXED: Proper date calculation for day-of-week alignment
      // Get the current academic year start (August 1st)
      const currentYear = new Date().getFullYear();
      const academicYearStart = new Date(currentYear, 7, 1); // August 1st
      
      // Calculate the start of the specified week
      const weekStart = new Date(academicYearStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
      
      // Find the Monday of that week
      const dayOfWeekStart = weekStart.getDay(); // 0=Sunday, 1=Monday, etc.
      const daysToMonday = dayOfWeekStart === 0 ? -6 : 1 - dayOfWeekStart;
      const monday = new Date(weekStart.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
      
      // Calculate the specific date based on dayOfWeek parameter
      // dayOfWeek: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const specificDate = new Date(monday.getTime() + (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
      // Format date in local timezone (YYYY-MM-DD) to avoid UTC offset issues
      const dateString = `${specificDate.getFullYear()}-${String(specificDate.getMonth() + 1).padStart(2, '0')}-${String(specificDate.getDate()).padStart(2, '0')}`;
      
      // Verify the calculated date matches the expected day
      const calculatedJsDay = specificDate.getDay(); // 0=Sun, 1=Mon, 2=Tue, etc.
      const expectedJsDay = dayOfWeek === 7 ? 0 : dayOfWeek; // Convert our format to JS format
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const ourDayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      console.log(`🎯 MARKING ATTENDANCE - FIXED VERSION`);
      console.log(`Week: ${week}, DayOfWeek: ${dayOfWeek} (${ourDayNames[dayOfWeek]})`);
      console.log(`Calculated Date: ${dateString} (${dayNames[calculatedJsDay]})`);
      console.log(`✅ Verification: Expected ${ourDayNames[dayOfWeek]}, Got ${dayNames[calculatedJsDay]}`);
      console.log(`Match: ${calculatedJsDay === expectedJsDay ? '✅ CORRECT' : '❌ MISMATCH'}`);
      
      // Additional safety check
      if (calculatedJsDay !== expectedJsDay) {
        console.error(`❌ Date calculation error: Expected ${ourDayNames[dayOfWeek]} but got ${dayNames[calculatedJsDay]}`);
        brandedToast.error(`Date calculation error. Please try again.`);
        return;
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId,
          scheduleId: selectedSchedule.ScheduleID,
          week,
          status,
          date: dateString,
          sessionType,
          remarks: `Marked as ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} by instructor for ${ourDayNames[dayOfWeek]} (${sessionType})`,
          recordedBy: instructorId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to mark attendance: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        brandedToast.success(`✅ Marked ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} for ${ourDayNames[dayOfWeek]}`);
        
        // Update local state immediately for better UX
        if (sessionType === 'lecture') {
          setLectureAttendance(prev => {
            const key = `${studentId}`;
            return {
              ...prev,
              [key]: {
                ...(prev[key] || {}),
                [currentSessionNumber]: status
              }
            };
          });
        } else {
          setLabAttendance(prev => {
            const key = `${studentId}`;
            return {
              ...prev,
              [key]: {
                ...(prev[key] || {}),
                [currentSessionNumber]: status
              }
            };
          });
        }
        
        // Refresh the weekly attendance data from server
        await fetchSessionAttendance(selectedSchedule.ScheduleID, week, sessionType);
        // Also refresh the students data to show updated attendance stats
        await fetchStudentsForSchedule(selectedSchedule.ScheduleID);
      } else {
        throw new Error(result.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      brandedToast.error(`Failed to mark attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSeatPlanManagement = (schedule: Schedule) => {
    // Set the selected schedule for seat plan modal
    setSelectedSchedule(schedule);
    setActiveTab('seat-plan'); // Switch to seat plan tab
  };

  const handleSeatPlanClose = async () => {
    // Refresh the schedules data to get updated seat map
    if (selectedSchedule) {
      try {
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('userSession='));
        
        if (sessionCookie) {
          const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
          await fetchSchedules(session.userId);
        }
      } catch (error) {
        console.error('Error refreshing schedules:', error);
      }
    }
    setSelectedSchedule(null);
  };

  const handleGradesManagement = (schedule: Schedule) => {
    // Navigate to grades management page for this schedule
    window.location.href = `/instructor/grades?scheduleId=${schedule.ScheduleID}`;
  };

  const handleGradesSelect = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setActiveTab('grades'); // Switch to grades tab
    await fetchStudentsForSchedule(schedule.ScheduleID);
    await fetchStudentGrades(schedule.ScheduleID);
    brandedToast.success(`Selected ${schedule.SubjectCode} for grade management`);
  };

  const fetchStudentGrades = async (scheduleId: number) => {
    try {
      // First get the enrolled students
      const enrollmentResponse = await fetch(`/api/enrollments?scheduleId=${scheduleId}`, {
        credentials: 'include'
      });

      if (!enrollmentResponse.ok) {
        throw new Error(`Failed to fetch enrollments: ${enrollmentResponse.status}`);
      }

      const enrollmentData = await enrollmentResponse.json();
      const enrollments = enrollmentData.success ? enrollmentData.data : [];

      // Fetch grades for each student
      const gradesPromises = enrollments.map(async (enrollment: any) => {
        try {
          const gradesResponse = await fetch(
            `/api/grades?role=student&userId=${enrollment.StudentID}`,
            { credentials: 'include' }
          );

          if (gradesResponse.ok) {
            const gradesData = await gradesResponse.json();

            // Extract grades for this specific schedule
            let midtermGrade = 5.0;
            let finalGrade = 5.0;
            let summaryGrade = 5.0;

            if (gradesData.success && gradesData.summary && gradesData.summary[scheduleId]) {
              const scheduleGrades = gradesData.summary[scheduleId];
              midtermGrade = scheduleGrades.midterm || 5.0;
              finalGrade = scheduleGrades.final || 5.0;
              summaryGrade = scheduleGrades.summary || 5.0;
            }

            return {
              StudentID: enrollment.StudentID,
              StudentName: enrollment.StudentName || `${enrollment.FirstName} ${enrollment.LastName}`,
              Course: enrollment.Course,
              YearLevel: enrollment.YearLevel,
              Section: enrollment.Section,
              midtermGrade,
              finalGrade,
              summaryGrade,
              status: summaryGrade <= 3.0 ? 'Passed' : 'Failed'
            };
          } else {
            // Return default grades if API call fails
            return {
              StudentID: enrollment.StudentID,
              StudentName: enrollment.StudentName || `${enrollment.FirstName} ${enrollment.LastName}`,
              Course: enrollment.Course,
              YearLevel: enrollment.YearLevel,
              Section: enrollment.Section,
              midtermGrade: 5.0,
              finalGrade: 5.0,
              summaryGrade: 5.0,
              status: 'No Grades'
            };
          }
        } catch (error) {
          console.error(`Error fetching grades for student ${enrollment.StudentID}:`, error);
          return {
            StudentID: enrollment.StudentID,
            StudentName: enrollment.StudentName || `${enrollment.FirstName} ${enrollment.LastName}`,
            Course: enrollment.Course,
            YearLevel: enrollment.YearLevel,
            Section: enrollment.Section,
            midtermGrade: 5.0,
            finalGrade: 5.0,
            summaryGrade: 5.0,
            status: 'Error'
          };
        }
      });

      const gradesResults = await Promise.all(gradesPromises);
      setStudentGrades(gradesResults);

    } catch (error) {
      console.error("Error fetching student grades:", error);
      brandedToast.error("Failed to load student grades");
      setStudentGrades([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      P: { color: "bg-green-100 text-green-800", label: "Present" },
      A: { color: "bg-red-100 text-red-800", label: "Absent" },
      L: { color: "bg-yellow-100 text-yellow-800", label: "Late" },
      E: { color: "bg-blue-100 text-blue-800", label: "Excused" },
      D: { color: "bg-orange-100 text-orange-800", label: "Dropped" },
      FA: { color: "bg-red-200 text-red-900", label: "Failed" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.A;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Instructor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your classes, attendance, and grades</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Schedules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSchedules}</div>
          </CardContent>
        </Card>

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
            <CardTitle className="text-sm font-medium">Pending Excuse Letters</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingExcuseLetters}</div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedules" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Schedules
          </TabsTrigger>
          <TabsTrigger value="excuseLetters" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Excuse Letters
            {excuseLetters.filter(el => el.InstructorStatus === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-1 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                {excuseLetters.filter(el => el.InstructorStatus === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Class Schedules</h2>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5">
              {schedules.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No schedules assigned yet.</p>
                  </CardContent>
                </Card>
              ) : (
                schedules.map((schedule) => (
                  <ScheduleCard
                    key={schedule.ScheduleID}
                    schedule={schedule}
                    role="instructor"
                    onClick={() => openScheduleHub(schedule)}
                    showActions={false}
                  />
                ))
              )}
            </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Attendance Management</h2>
          </div>

          {!selectedSchedule ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select a Schedule</CardTitle>
                  <CardDescription>Choose a schedule below to manage attendance</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <div className="text-center py-8">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No schedules available for attendance management.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {schedules.map((schedule) => (
                        <div key={schedule.ScheduleID} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="space-y-1">
                            <h4 className="font-medium">{schedule.SubjectCode} - {schedule.SubjectTitle}</h4>
                            <p className="text-sm text-gray-600">
                              {schedule.Course} • Year {schedule.YearLevel} • Section {schedule.Section}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {schedule.Day}
                              </span>
                              <div className="text-xs text-gray-500">
                                <div className="font-medium text-gray-900">{schedule.Room}</div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatScheduleEntry({
                                    Room: schedule.Room ?? undefined,
                                    Day: schedule.Day ?? undefined,
                                    Time: schedule.Time ?? undefined,
                                    Lecture: schedule.Lecture ?? undefined,
                                    Laboratory: schedule.Laboratory ?? undefined,
                                    ClassType: schedule.ClassType ?? undefined
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleScheduleSelect(schedule)}>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Select
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <AttendanceSheetWrapper
              schedule={selectedSchedule}
              students={students}
              excuseLetters={excuseLetters}
              lectureAttendance={lectureAttendance}
              labAttendance={labAttendance}
              onAttendanceMarked={handleAttendanceMarked}
              onBulkMarking={handleBulkMarking}
              onClassCancellation={handleClassCancellation}
            />
          )}
        </TabsContent>

        {/* Excuse Letters Tab */}
        <TabsContent value="excuseLetters" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Excuse Letters</h2>
          </div>

          {excuseLetters.filter(el => el.InstructorStatus === 'pending').length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No pending excuse letters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {excuseLetters.filter(el => el.InstructorStatus === 'pending').map((letter) => (
                                  <Card key={letter.ExcuseLetterID} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {letter.SubjectCode} - {letter.SubjectTitle}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {letter.StudentName}
                            </span>
                            <span className="flex items-center gap-2 mt-1">
                              {letter.Course} - Section {letter.Section}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                      {/* Show Dean and Coordinator Approval Status - Prominent Display */}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                        <span className="text-sm font-semibold text-gray-700">Approval Status:</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`flex items-center gap-1 ${
                            letter.DeanStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                            letter.DeanStatus === 'declined' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {letter.DeanStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                            {letter.DeanStatus === 'declined' && <XCircle className="h-3 w-3" />}
                            {(!letter.DeanStatus || letter.DeanStatus === 'pending') && <Clock className="h-3 w-3" />}
                            <span className="font-medium">Dean: {letter.DeanStatus || 'pending'}</span>
                          </Badge>
                          <Badge className={`flex items-center gap-1 ${
                            letter.CoordinatorStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                            letter.CoordinatorStatus === 'declined' ? 'bg-red-100 text-red-800 border border-red-300' :
                            'bg-gray-100 text-gray-700 border border-gray-300'
                          }`}>
                            {letter.CoordinatorStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                            {letter.CoordinatorStatus === 'declined' && <XCircle className="h-3 w-3" />}
                            {(!letter.CoordinatorStatus || letter.CoordinatorStatus === 'pending') && <Clock className="h-3 w-3" />}
                            <span className="font-medium">Coordinator: {letter.CoordinatorStatus || 'pending'}</span>
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Reason:</p>
                            <p className="text-sm text-gray-600">{letter.Reason}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Submitted: {new Date(letter.SubmissionDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewExcuseLetter(letter)}
                            className="flex-1"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveExcuseLetter(letter)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeclineExcuseLetter(letter)}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Approved Excuse Letters */}
          {excuseLetters.filter(el => el.InstructorStatus === 'approved' || el.InstructorStatus === 'declined').length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Processed Excuse Letters</h3>
              </div>
              <div className="grid gap-4">
                {excuseLetters.filter(el => el.InstructorStatus === 'approved' || el.InstructorStatus === 'declined').map((letter) => (
                                      <Card key={letter.ExcuseLetterID} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {letter.SubjectCode} - {letter.SubjectTitle}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {letter.StudentName}
                              </span>
                            </CardDescription>
                          </div>
                          <Badge variant={letter.InstructorStatus === 'approved' ? 'default' : 'destructive'}>
                            {letter.InstructorStatus === 'approved' ? 'Approved' : 'Declined'}
                          </Badge>
                        </div>
                        {/* Show Dean and Coordinator Approval Status - Prominent Display */}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                          <span className="text-sm font-semibold text-gray-700">Approval Status:</span>
                          <div className="flex items-center gap-2">
                            <Badge className={`flex items-center gap-1 ${
                              letter.DeanStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                              letter.DeanStatus === 'declined' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {letter.DeanStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                              {letter.DeanStatus === 'declined' && <XCircle className="h-3 w-3" />}
                              {(!letter.DeanStatus || letter.DeanStatus === 'pending') && <Clock className="h-3 w-3" />}
                              <span className="font-medium">Dean: {letter.DeanStatus || 'pending'}</span>
                            </Badge>
                            <Badge className={`flex items-center gap-1 ${
                              letter.CoordinatorStatus === 'approved' ? 'bg-green-100 text-green-800 border border-green-300' :
                              letter.CoordinatorStatus === 'declined' ? 'bg-red-100 text-red-800 border border-red-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {letter.CoordinatorStatus === 'approved' && <CheckCircle className="h-3 w-3" />}
                              {letter.CoordinatorStatus === 'declined' && <XCircle className="h-3 w-3" />}
                              {(!letter.CoordinatorStatus || letter.CoordinatorStatus === 'pending') && <Clock className="h-3 w-3" />}
                              <span className="font-medium">Coordinator: {letter.CoordinatorStatus || 'pending'}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                                            <CardContent>
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Reason:</p>
                              <p className="text-sm text-gray-600">{letter.Reason}</p>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}</span>
                              </div>
                            </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewExcuseLetter(letter)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Seat Plan Tab */}
        <TabsContent value="seat-plan" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Seat Plan Management</h2>
          </div>

          {!selectedSchedule ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select a Schedule</CardTitle>
                  <CardDescription>Choose a schedule below to manage seat plan</CardDescription>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No schedules available for seat plan management.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {schedules.map((schedule) => (
                        <div key={schedule.ScheduleID} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                          <div className="space-y-1">
                            <h4 className="font-medium">{schedule.SubjectCode} - {schedule.SubjectTitle}</h4>
                            <p className="text-sm text-gray-600">
                              {schedule.Course} • Year {schedule.YearLevel} • Section {schedule.Section}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {schedule.Day}
                              </span>
                              <div className="text-xs text-gray-500">
                                <div className="font-medium text-gray-900">{schedule.Room}</div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatScheduleEntry({
                                    Room: schedule.Room ?? undefined,
                                    Day: schedule.Day ?? undefined,
                                    Time: schedule.Time ?? undefined,
                                    Lecture: schedule.Lecture ?? undefined,
                                    Laboratory: schedule.Laboratory ?? undefined,
                                    ClassType: schedule.ClassType ?? undefined
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleSeatPlanManagement(schedule)}>
                            <Users className="h-4 w-4 mr-1" />
                            Manage Seat Plan
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <EnhancedSeatPlanModal 
              schedule={{
                ...selectedSchedule,
                SeatCols: selectedSchedule.SeatCols || 4,
                SeatMap: selectedSchedule.SeatMap || '',
                LectureSeatCols: selectedSchedule.LectureSeatCols || 4,
                LaboratorySeatCols: selectedSchedule.LaboratorySeatCols || 2
              }} 
              onClose={handleSeatPlanClose}
              onDataSaved={async () => {
                try {
                  const sessionCookie = document.cookie
                    .split('; ')
                    .find(row => row.startsWith('userSession='));
                  
                  if (sessionCookie) {
                    const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]));
                    await fetchSchedules(session.userId);
                  }
                } catch (error) {
                  console.error('Error refreshing schedules after save:', error);
                }
              }}
            />
          )}
        </TabsContent>

        {/* Excuse Letters Tab */}
        <TabsContent value="excuse-letters" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Student Excuse Letters</h2>
          </div>

          <div className="grid gap-4">
            {excuseLetters.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No excuse letters to review.</p>
                </CardContent>
              </Card>
            ) : (
              excuseLetters.map((letter) => (
                <Card key={letter.ExcuseLetterID}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{letter.Subject}</CardTitle>
                        <CardDescription>{letter.StudentName}</CardDescription>
                      </div>
                      <Badge className={
                        letter.InstructorStatus === 'approved' ? 'bg-green-100 text-green-800' :
                        letter.InstructorStatus === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {letter.InstructorStatus}
                      </Badge>
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

                        {/* Show Dean and Coordinator Approval Status */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-xs font-medium text-gray-600">Other Approvals:</span>
                          <Badge className={`text-xs ${
                            letter.DeanStatus === 'approved' ? 'bg-green-100 text-green-700' :
                            letter.DeanStatus === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            Dean: {letter.DeanStatus || 'pending'}
                          </Badge>
                          <Badge className={`text-xs ${
                            letter.CoordinatorStatus === 'approved' ? 'bg-green-100 text-green-700' :
                            letter.CoordinatorStatus === 'declined' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            Coordinator: {letter.CoordinatorStatus || 'pending'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExcuseLetter(letter)}
                          >
                            View Details
                          </Button>
                          {letter.InstructorStatus === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprovalAction(letter, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
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
                          )}
                        </div>
                      </div>
                    </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Classes - Grade Overview</h2>
            <div className="text-sm text-gray-600">
              {allInstructorGrades.length} classes total
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allInstructorGrades.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allInstructorGrades.reduce((sum, grade) => sum + grade.studentCount, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {allInstructorGrades.length > 0
                    ? Math.round((allInstructorGrades.reduce((sum, grade) => sum + grade.passedCount, 0) /
                        allInstructorGrades.reduce((sum, grade) => sum + grade.studentCount, 0)) * 100) || 0
                    : 0}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {allInstructorGrades.length > 0
                    ? (allInstructorGrades.reduce((sum, grade) => sum + grade.averageGrade, 0) / allInstructorGrades.length).toFixed(2)
                    : '5.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Classes List */}
          <div className="space-y-4">
            {allInstructorGrades.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg mb-2">No classes found</p>
                  <p className="text-gray-500 text-sm">Your class grades will appear here once you have assigned schedules.</p>
                </CardContent>
              </Card>
            ) : (
              allInstructorGrades.map((gradeData) => (
                <Card key={gradeData.ScheduleID} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {gradeData.SubjectCode} - {gradeData.SubjectName}
                        </CardTitle>
                        <CardDescription>
                          {gradeData.Course} • Year {gradeData.YearLevel} • Section {gradeData.Section} • {gradeData.ClassType}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/instructor/grades?scheduleId=${gradeData.ScheduleID}`}
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Grade Sheet
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Student Count */}
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-semibold">{gradeData.studentCount}</div>
                        <div className="text-sm text-gray-600">Students</div>
                      </div>

                      {/* Midterm Average */}
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className={`text-lg font-semibold ${
                          gradeData.midterm !== null ?
                            (gradeData.midterm <= 3.0 ? 'text-green-600' : 'text-red-600') :
                            'text-gray-400'
                        }`}>
                          {gradeData.midterm !== null ? gradeData.midterm.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Midterm Avg</div>
                      </div>

                      {/* Final Average */}
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className={`text-lg font-semibold ${
                          gradeData.final !== null ?
                            (gradeData.final <= 3.0 ? 'text-green-600' : 'text-red-600') :
                            'text-gray-400'
                        }`}>
                          {gradeData.final !== null ? gradeData.final.toFixed(2) : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Final Avg</div>
                      </div>

                      {/* Overall Average */}
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-lg font-semibold text-slate-900">
                          {gradeData.averageGrade.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Overall Avg</div>
                      </div>

                      {/* Pass Rate */}
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-lg font-semibold text-yellow-700">
                          {gradeData.studentCount > 0
                            ? Math.round((gradeData.passedCount / gradeData.studentCount) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm text-gray-600">
                          {gradeData.passedCount}/{gradeData.studentCount} Pass
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session-Based Bulk Attendance Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Mark All Present</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBulkModal(false)}
                disabled={bulkMarkingLoading}
              >
                ✕
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Mark all {students.filter(student => !student.IsDisabled).length} eligible students as present for {currentSessionType} session {currentSessionNumber}?
            </p>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-sm font-medium text-blue-800">
                    {currentSessionType === 'lecture' ? '📚 Lecture Session' : '🧪 Laboratory Session'}
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  This will mark all students as present for {currentSessionType} session {currentSessionNumber}.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowBulkModal(false)}
                disabled={bulkMarkingLoading}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={() => {
                  markAllPresentForSession();
                  setShowBulkModal(false);
                }}
                disabled={bulkMarkingLoading}
              >
                {bulkMarkingLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Marking...</span>
                  </div>
                ) : (
                  'Mark All Present'
                )}
              </Button>
            </div>
            
            {bulkMarkingLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Marking attendance...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drop/Fail Marking Modal */}
      {showDropFailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-red-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Manage Student Status</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mark students as "D - Dropped" or "FA - Failure due to Absences", or restore previously marked students
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDropFailModal(false)}
                disabled={dropFailMarkingLoading}
                className="hover:bg-white/50 rounded-full w-8 h-8 p-0"
              >
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="p-6">
                <div className="mb-4 flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="font-medium">D = Dropped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span className="font-medium">FA = Failure due to Absences</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="font-medium">Restore = Enable Student</span>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {!selectedSchedule ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>Please select a schedule first.</p>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No students found in this schedule.</p>
                    </div>
                  ) : (
                    students.map((student) => (
                      <div key={student.StudentID} className={`rounded-lg p-4 transition-colors ${
                        student.IsDisabled ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className={`font-semibold text-base ${student.IsDisabled ? 'text-red-800' : 'text-gray-800'}`}>
                              {student.StudentName || `${student.FirstName || ''} ${student.MiddleName ? `${student.MiddleName} ` : ''}${student.LastName || ''}`.trim() || `Student ${student.StudentID}`}
                              {student.IsDisabled && (
                                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-200 text-red-800">
                                  {student.IsDropped ? 'DROPPED' : 'FAILED'}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Student ID: {student.StudentID}
                            </div>
                            {student.Course && student.Section && (
                              <div className="text-xs text-gray-500 mt-1">
                                {student.Course} - {student.Section}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-3 ml-4">
                            {student.IsDisabled ? (
                              <Button
                                size="lg"
                                variant="outline"
                                className="w-24 h-12 text-sm font-bold bg-green-50 hover:bg-green-100 text-green-700 border-2 border-green-300 hover:border-green-400 transition-all duration-200 hover:scale-105"
                                onClick={() => restoreStudent(student.StudentID)}
                                disabled={dropFailMarkingLoading}
                              >
                                Restore
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-20 h-12 text-xl font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border-2 border-orange-300 hover:border-orange-400 transition-all duration-200 hover:scale-105"
                                  onClick={() => markStudentAsDropFail(student.StudentID, 'D')}
                                  disabled={dropFailMarkingLoading}
                                >
                                  D
                                </Button>
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-20 h-12 text-xl font-bold bg-red-50 hover:bg-red-100 text-red-700 border-2 border-red-300 hover:border-red-400 transition-all duration-200 hover:scale-105"
                                  onClick={() => markStudentAsDropFail(student.StudentID, 'FA')}
                                  disabled={dropFailMarkingLoading}
                                >
                                  FA
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">{students.length}</span> Total Students
                  <span className="ml-4 text-green-600">
                    {students.filter(student => !student.IsDisabled).length} Active
                  </span>
                  {students.filter(student => student.IsDisabled).length > 0 && (
                    <span className="ml-4 text-red-600">
                      {students.filter(student => student.IsDisabled).length} Disabled
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="px-6 py-2"
                  onClick={() => setShowDropFailModal(false)}
                  disabled={dropFailMarkingLoading}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Loading Overlay */}
            {dropFailMarkingLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600 font-medium">Updating student status...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



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
        isOpen={!!selectedExcuseLetter}
        onClose={() => setSelectedExcuseLetter(null)}
        excuseLetter={selectedExcuseLetter}
        userRole="instructor"
      />

      {/* Class Cancellation Modal */}
      {showCCModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Class Cancellation</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowCCModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {ccStudentId ? 
                `Record class cancellation for individual student for ${ccSessionType} session ${currentSessionNumber}?` :
                `Record class cancellation for ALL students for ${ccSessionType} session ${currentSessionNumber}?`
              }
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation *
                </label>
                <Textarea
                  value={ccReason}
                  onChange={(e) => setCCReason(e.target.value)}
                  placeholder="Enter reason for class cancellation..."
                  className="w-full"
                  rows={3}
                />
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm font-medium text-red-800">
                    Class Cancellation Notice
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  CC status will not count against attendance metrics.
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyStudents"
                  checked={ccNotifyStudents}
                  onChange={(e) => setCCNotifyStudents(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notifyStudents" className="text-sm text-gray-700">
                  Notify enrolled students about the cancellation
                </label>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setShowCCModal(false)}
              >
                Cancel
              </Button>
              {ccStudentId ? (
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700" 
                  onClick={markCCWithReason}
                  disabled={!ccReason.trim()}
                >
                  Mark as CC
                </Button>
              ) : (
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700" 
                  onClick={markAllCCForSession}
                  disabled={!ccReason.trim()}
                >
                  Mark All as CC
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Schedule Hub Modal */}
      {showScheduleHub && selectedScheduleForHub && (
        <ScheduleHub
          schedule={selectedScheduleForHub}
          onClose={() => {
            setShowScheduleHub(false);
            setSelectedScheduleForHub(null);
          }}
        />
      )}

      {showViewExcuseModal && selectedLetter && (
        <ViewExcuseLetterModal
          excuseLetter={selectedLetter}
          isOpen={showViewExcuseModal}
          onClose={() => {
            setShowViewExcuseModal(false);
            setSelectedLetter(null);
          }}
        />
      )}

      {showApprovalModal && selectedLetter && (
        <ApprovalModal
          excuseLetter={selectedLetter}
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedLetter(null);
          }}
          approvalAction={approvalAction}
          onSubmit={async (comment) => {
            try {
              const response = await fetch('/api/excuse-letters', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  excuseLetterID: selectedLetter.ExcuseLetterID,
                  userRole: 'instructor',
                  status: approvalAction === 'approved' ? 'approved' : 'declined',
                  comment: comment || null
                })
              });

              if (response.ok) {
                brandedToast.success(`Excuse letter ${approvalAction === 'approved' ? 'approved' : 'declined'} successfully`);
                if (instructorId) {
                  await fetchExcuseLetters(instructorId);
                }
              } else {
                const errorData = await response.json();
                brandedToast.error(`Failed to ${approvalAction}: ${errorData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error updating excuse letter:', error);
              brandedToast.error('Failed to update excuse letter');
            }
            
            setShowApprovalModal(false);
            setSelectedLetter(null);
          }}
        />
      )}

      {/* Notification Banner Container */}
      <NotificationBannerContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        maxNotifications={3}
      />
    </div>
  );
}
