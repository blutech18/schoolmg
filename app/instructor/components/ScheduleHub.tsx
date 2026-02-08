'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  FlaskConical,
  FileText,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Plus,
  Minus,
  Calculator,
  Printer,
  GraduationCap,
  MessageSquare
} from "lucide-react"
import { brandedToast } from "@/components/ui/branded-toast"
import ViewExcuseLetterModal from "../../student/components/ViewExcuseLetterModal"
import ApprovalModal from "../../student/components/ApprovalModal"
import EnhancedSeatPlanModal from "./EnhancedSeatPlanModal"
import { printDocument, generateSeatPlanPrintContent, generateAttendancePrintContent } from "../../lib/printUtils"
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils"

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
  StudentNumber?: string;
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

interface ExcuseLetter {
  ExcuseLetterID: number;
  StudentID: number;
  StudentName: string;
  Course: string;
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
  ScheduleID: number;
}

interface ScheduleHubProps {
  schedule: Schedule;
  onClose: () => void;
}

export default function ScheduleHub({ schedule, onClose }: ScheduleHubProps) {
  // State management
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<StudentGrades[]>([])
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('attendance')

  // Attendance state
  const [currentSessionNumber, setCurrentSessionNumber] = useState(1)
  const [currentSessionType, setCurrentSessionType] = useState<'lecture' | 'lab'>('lecture')
  const [lectureAttendance, setLectureAttendance] = useState<{ [key: string]: { [sessionNumber: number]: string } }>({})
  const [labAttendance, setLabAttendance] = useState<{ [key: string]: { [sessionNumber: number]: string } }>({})

  // Determine session type based on schedule
  const getSessionType = (): 'lecture' | 'lab' => {
    if (hasLecture && hasLaboratory) {
      // If both exist, default to lecture
      return 'lecture'
    } else if (hasLecture) {
      return 'lecture'
    } else if (hasLaboratory) {
      return 'lab'
    }
    return 'lecture' // fallback
  }

  // CC Modal state
  const [showCCModal, setShowCCModal] = useState(false)
  const [ccReason, setCCReason] = useState('')
  const [ccStudentId, setCCStudentId] = useState<number | null>(null)
  const [ccSessionType, setCCSessionType] = useState<'lecture' | 'lab'>('lecture')
  const [ccNotifyStudents, setCCNotifyStudents] = useState(false)

  // Session cancellation state - tracks which sessions are cancelled
  const [cancelledSessions, setCancelledSessions] = useState<{ [key: string]: { reason: string, cancelledBy: string, cancelledAt: string } }>({})

  // Check if current session is cancelled
  const isCurrentSessionCancelled = () => {
    const sessionKey = `${schedule.ScheduleID}-${currentSessionType}-${currentSessionNumber}`
    return cancelledSessions[sessionKey] !== undefined
  }

  // Seat plan state
  const [showSeatPlanModal, setShowSeatPlanModal] = useState(false)

  // Excuse letter modals
  const [showViewExcuseModal, setShowViewExcuseModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null)

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'drop' | 'fail' | 'undrop' | 'unfailed' | null>(null)
  const [pendingStudent, setPendingStudent] = useState<Student | null>(null)
  const [actionComment, setActionComment] = useState('')

  // Mark All Present confirmation modal state
  const [showMarkAllPresentModal, setShowMarkAllPresentModal] = useState(false)

  // Determine if this schedule has both Lecture and Laboratory components
  const hasLecture = (schedule.Lecture || 0) > 0
  const hasLaboratory = (schedule.Laboratory || 0) > 0
  const hasBothComponents = hasLecture && hasLaboratory

  // Initialize session type when schedule changes
  useEffect(() => {
    if (hasLecture && hasLaboratory) {
      // If both exist, default to lecture
      setCurrentSessionType('lecture')
    } else if (hasLecture) {
      setCurrentSessionType('lecture')
    } else if (hasLaboratory) {
      setCurrentSessionType('lab')
    }
  }, [schedule.ScheduleID, hasLecture, hasLaboratory])

  // Fetch data when component mounts
  useEffect(() => {
    fetchStudents()
    fetchGrades()
    fetchExcuseLetters()
    fetchAttendance()
    fetchCancelledSessions()
  }, [schedule.ScheduleID])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const studentsData = result.success ? result.data : result
        const studentsList = Array.isArray(studentsData) ? studentsData : []

        // Filter out students with LOA, Drop, or UW status
        const filteredStudents = studentsList.filter((student: any) => {
          const status = student.Status?.toLowerCase();
          return status !== 'loa' && status !== 'drop' && status !== 'uw';
        });

        // Check attendance for each student to determine if they're dropped or failed
        for (const student of filteredStudents) {
          const attendanceRes = await fetch(`/api/attendance?scheduleId=${schedule.ScheduleID}&studentId=${student.StudentID}`)
          if (attendanceRes.ok) {
            const attendanceResult = await attendanceRes.json()
            if (attendanceResult.success && Array.isArray(attendanceResult.data) && attendanceResult.data.length > 0) {
              // Check if student has any D or FA status
              const hasDropped = attendanceResult.data.some((record: any) => record.Status === 'D')
              const hasFailed = attendanceResult.data.some((record: any) => record.Status === 'FA')

              student.IsDropped = hasDropped
              student.IsFailed = hasFailed
            } else {
              student.IsDropped = false
              student.IsFailed = false
            }
          } else {
            student.IsDropped = false
            student.IsFailed = false
          }
        }

        setStudents(filteredStudents)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      brandedToast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      // Fetch students first to get their IDs
      const studentsRes = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`)
      if (!studentsRes.ok) return

      const studentsResult = await studentsRes.json()
      const studentsData = studentsResult.success ? studentsResult.data : studentsResult
      const students = Array.isArray(studentsData) ? studentsData : []

      if (students.length === 0) {
        setGrades([])
        return
      }

      // Fetch grades using instructor API for consistency
      const rawGradesResponse = await fetch(`/api/grades?scheduleId=${schedule.ScheduleID}&role=instructor`, {
        credentials: 'include'
      })
      
      if (!rawGradesResponse.ok) {
        console.error('Failed to fetch grades')
        setGrades(students.map((student: any) => ({
          StudentID: student.StudentID,
          StudentName: student.StudentName || `${student.FirstName || ''} ${student.LastName || ''}`.trim() || `Student ${student.StudentID}`,
          Course: student.Course,
          YearLevel: student.YearLevel,
          Section: student.Section,
          midtermGrade: 0,
          finalGrade: 0,
          summaryGrade: 0,
          status: 'Incomplete'
        })))
        return
      }
      
      const rawGradesData = await rawGradesResponse.json()
      
      if (!rawGradesData.success || !rawGradesData.data) {
        console.error('No grades data')
        setGrades(students.map((student: any) => ({
          StudentID: student.StudentID,
          StudentName: student.StudentName || `${student.FirstName || ''} ${student.LastName || ''}`.trim() || `Student ${student.StudentID}`,
          Course: student.Course,
          YearLevel: student.YearLevel,
          Section: student.Section,
          midtermGrade: 0,
          finalGrade: 0,
          summaryGrade: 0,
          status: 'Incomplete'
        })))
        return
      }
      
      // Group grades by student and term
      const studentGradeMap: { [key: number]: { midterm: any[], final: any[] } } = {}
      
      rawGradesData.data.forEach((grade: any) => {
        if (!studentGradeMap[grade.StudentID]) {
          studentGradeMap[grade.StudentID] = { midterm: [], final: [] }
        }
        
        const term = (grade.Term || '').toLowerCase()
        if (term === 'midterm') {
          studentGradeMap[grade.StudentID].midterm.push(grade)
        } else if (term === 'final') {
          studentGradeMap[grade.StudentID].final.push(grade)
        }
      })
      
      // Determine "Active Items": Items where AT LEAST ONE student has a score > 0
      const activeItems = new Set<string>()
      rawGradesData.data.forEach((g: any) => {
        if (g.Score !== null && parseFloat(g.Score) > 0) {
          const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase()
          activeItems.add(key)
        }
      })

      const filterActive = (grades: any[]) => {
        return grades.filter((g: any) => {
          const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase()
          return activeItems.has(key)
        })
      }
      
      // Calculate grades for each student using the same logic as the grades page
      const calculateTermGrade = (termGrades: any[], classType?: string) => {
        if (!termGrades || termGrades.length === 0) return null
        
        // Normalize classType
        const normalizedClassType = (classType || 'LECTURE').replace(/\s+/g, '').toUpperCase()
        
        // Normalize component names
        const normalizeComponentName = (name: string): string => {
          if (!name) return ''
          const lower = name.toLowerCase().trim()
          const componentMap: { [key: string]: string } = {
            'quiz': 'quiz',
            'quizzes': 'quiz',
            'laboratory': 'laboratory',
            'lab': 'laboratory',
            'recitation': 'recitation',
            'seatwork': 'seatwork',
            'assignment': 'assignment',
            'homework': 'assignment',
            'project': 'project',
            'major exam': 'major exam',
            'major': 'major exam',
            'exam': 'major exam',
            'olo': 'olo',
            'online course': 'online course'
          }
          return componentMap[lower] || lower
        }
        
        // Define component weights based on class type
        let componentWeights: { [key: string]: number } = {}
        
        if (normalizedClassType === 'LECTURE') {
          componentWeights = { 'quiz': 60, 'major exam': 40 }
        } else if (normalizedClassType === 'LECTURE+LAB') {
          componentWeights = { 'quiz': 15, 'laboratory': 30, 'olo': 15, 'major exam': 40 }
        } else if (normalizedClassType === 'MAJOR') {
          componentWeights = { 'quiz': 15, 'laboratory': 40, 'olo': 15, 'major exam': 30 }
        } else if (normalizedClassType === 'NSTP') {
          componentWeights = { 'quiz': 60, 'major exam': 40 }
        } else if (normalizedClassType === 'OJT') {
          componentWeights = { 'online course': 50, 'recitation': 20, 'seatwork': 30 }
        } else {
          // Default to LECTURE
          componentWeights = { 'quiz': 60, 'major exam': 40 }
        }
        
        // Group grades by component
        const componentGroups: { [key: string]: any[] } = {}
        termGrades.forEach(grade => {
          const normalizedComponent = normalizeComponentName(grade.Component)
          if (!componentGroups[normalizedComponent]) {
            componentGroups[normalizedComponent] = []
          }
          componentGroups[normalizedComponent].push(grade)
        })
        
        let totalWeightedScore = 0
        let totalWeight = 0
        
        // Calculate weighted average for each component
        Object.keys(componentGroups).forEach(component => {
          const grades = componentGroups[component]
          const weight = componentWeights[component] || 0
          
          if (weight === 0 || grades.length === 0) return
          
          let currentTotalScore = 0
          let currentTotalMaxScore = 0
          
          grades.forEach((grade: any) => {
            const score = parseFloat(grade.Score) || 0
            const max = parseFloat(grade.MaxScore) || 0
            currentTotalScore += score
            currentTotalMaxScore += max
          })
          
          if (currentTotalMaxScore > 0) {
            const componentPercentage = (currentTotalScore / currentTotalMaxScore) * 100
            totalWeightedScore += componentPercentage * (weight / 100)
            totalWeight += weight
          }
        })
        
        if (totalWeight === 0) return null
        
        const finalPercentage = (totalWeightedScore / totalWeight) * 100
        
        // Convert percentage to Filipino grade
        const convertToGrade = (pct: number) => {
          if (pct >= 98) return 1.0
          if (pct >= 95) return 1.25
          if (pct >= 92) return 1.5
          if (pct >= 89) return 1.75
          if (pct >= 86) return 2.0
          if (pct >= 83) return 2.25
          if (pct >= 80) return 2.5
          if (pct >= 77) return 2.75
          if (pct >= 75) return 3.0
          return 5.0
        }
        
        return convertToGrade(finalPercentage)
      }
      
      // Map students to their grades
      const results = students.map((student: any) => {
        const studentGrades = studentGradeMap[student.StudentID]
        
        if (!studentGrades) {
          return {
            StudentID: student.StudentID,
            StudentName: student.StudentName || `${student.FirstName || ''} ${student.LastName || ''}`.trim() || `Student ${student.StudentID}`,
            Course: student.Course,
            YearLevel: student.YearLevel,
            Section: student.Section,
            midtermGrade: 0,
            finalGrade: 0,
            summaryGrade: 0,
            status: 'Incomplete'
          }
        }
        
        const midtermGrade = calculateTermGrade(filterActive(studentGrades.midterm), schedule.ClassType)
        const finalGrade = calculateTermGrade(filterActive(studentGrades.final), schedule.ClassType)
        const summaryGrade = (midtermGrade !== null && finalGrade !== null) 
          ? (midtermGrade + finalGrade) / 2 
          : null
        
        return {
          StudentID: student.StudentID,
          StudentName: student.StudentName || `${student.FirstName || ''} ${student.LastName || ''}`.trim() || `Student ${student.StudentID}`,
          Course: student.Course,
          YearLevel: student.YearLevel,
          Section: student.Section,
          midtermGrade: midtermGrade || 0,
          finalGrade: finalGrade || 0,
          summaryGrade: summaryGrade || 0,
          status: summaryGrade ? (summaryGrade <= 3.0 ? 'Passed' : 'Failed') : 'Incomplete'
        }
      })
      
      console.log('Grades calculated:', results)
      setGrades(results)
    } catch (error) {
      console.error('Error fetching grades:', error)
      setGrades([])
    }
  }

  const fetchExcuseLetters = async () => {
    try {
      const res = await fetch(`/api/excuse-letters?scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const lettersData = result.success ? result.data : result
        setExcuseLetters(Array.isArray(lettersData) ? lettersData : [])
      }
    } catch (error) {
      console.error('Error fetching excuse letters:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`/api/attendance?scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const attendanceData = result.success ? result.data : result

        if (Array.isArray(attendanceData)) {
          // Process attendance data and update local state
          const lectureData: { [key: string]: { [sessionNumber: number]: string } } = {}
          const labData: { [key: string]: { [sessionNumber: number]: string } } = {}

          attendanceData.forEach((record: any) => {
            const studentKey = `${record.StudentID}`
            const sessionNumber = record.Week
            const status = record.Status
            const sessionType = record.SessionType

            if (sessionType === 'lecture') {
              if (!lectureData[studentKey]) {
                lectureData[studentKey] = {}
              }
              lectureData[studentKey][sessionNumber] = status
            } else if (sessionType === 'lab') {
              if (!labData[studentKey]) {
                labData[studentKey] = {}
              }
              labData[studentKey][sessionNumber] = status
            }
          })

          setLectureAttendance(lectureData)
          setLabAttendance(labData)
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const fetchCancelledSessions = async () => {
    try {
      console.log('Fetching cancelled sessions for schedule:', schedule.ScheduleID)
      const res = await fetch(`/api/attendance/cancelled-sessions?scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        console.log('API response:', result)
        const cancelledData = result.success ? result.data : result

        if (Array.isArray(cancelledData) && cancelledData.length > 0) {
          const cancelledSessionsMap: { [key: string]: { reason: string, cancelledBy: string, cancelledAt: string } } = {}

          cancelledData.forEach((record: any) => {
            const sessionKey = `${record.ScheduleID}-${record.SessionType}-${record.Week}`
            cancelledSessionsMap[sessionKey] = {
              reason: (record.CancellationReason || record.Remarks || 'No reason provided').replace(/^Class Cancelled by instructor\. Reason: /, ''),
              cancelledBy: record.RecordedBy || 'Unknown',
              cancelledAt: record.Date || new Date().toISOString()
            }
          })

          console.log('Processed cancelled sessions:', cancelledSessionsMap)
          setCancelledSessions(cancelledSessionsMap)
        } else {
          console.log('No cancelled sessions found in API response, checking localStorage')
          // Fallback to localStorage if API returns empty
          try {
            const stored = localStorage.getItem(`cancelled-sessions-${schedule.ScheduleID}`)
            console.log('Loading from localStorage fallback:', stored)
            if (stored) {
              setCancelledSessions(JSON.parse(stored))
            }
          } catch (localError) {
            console.error('Error loading from localStorage fallback:', localError)
          }
        }
      } else {
        console.log('API request failed:', res.status)
      }
    } catch (error) {
      console.error('Error fetching cancelled sessions:', error)
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem(`cancelled-sessions-${schedule.ScheduleID}`)
        console.log('Loading from localStorage:', stored)
        if (stored) {
          setCancelledSessions(JSON.parse(stored))
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError)
      }
    }
  }

  // Attendance functions (simplified versions from the main instructor page)
  const markAttendanceForSession = async (studentId: number, status: string, sessionType: 'lecture' | 'lab' = 'lecture') => {
    if (status === 'CC') {
      setCCStudentId(studentId)
      setCCSessionType(sessionType)
      setCCReason('')
      setCCNotifyStudents(false)
      setShowCCModal(true)
      return
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

      const requestBody = {
        studentId,
        scheduleId: schedule.ScheduleID,
        week: currentSessionNumber,
        status,
        date: new Date().toISOString().split('T')[0],
        sessionType,
        remarks: `Marked as ${status === 'P' ? 'Present' : status === 'A' ? 'Absent' : status === 'E' ? 'Excused' : status === 'L' ? 'Late' : status === 'D' ? 'Dropped' : status === 'FA' ? 'Failure due to Absences' : status} by instructor`,
        recordedBy: instructorId
      }

      console.log('Sending attendance request:', requestBody)

      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const result = await response.json()
        brandedToast.success(result.message || `Marked ${getStudentName(studentId)} as ${status}`)
        // Update local state immediately for UI responsiveness
        const studentKey = `${studentId}`
        if (sessionType === 'lecture') {
          setLectureAttendance(prev => ({
            ...prev,
            [studentKey]: {
              ...(prev[studentKey] || {}),
              [currentSessionNumber]: status
            }
          }))
        } else {
          setLabAttendance(prev => ({
            ...prev,
            [studentKey]: {
              ...(prev[studentKey] || {}),
              [currentSessionNumber]: status
            }
          }))
        }
        // Refresh attendance data to ensure consistency
        fetchAttendance()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to mark attendance' }))
        console.error('Failed to mark attendance:', errorData)
        brandedToast.error(
          errorData.error || errorData.message || 'Failed to mark attendance',
          {
            title: '❌ Error',
            duration: 5000
          }
        )
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Failed to mark attendance. Please try again.',
        {
          title: '❌ Error',
          duration: 5000
        }
      )
    }
  }

  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.StudentID === studentId)
    return student ? `${student.FirstName} ${student.LastName}` : 'Unknown'
  }

  const getStudentAttendance = (studentId: number, sessionType: 'lecture' | 'lab') => {
    const studentKey = `${studentId}`
    const attendance = sessionType === 'lecture' ? lectureAttendance : labAttendance
    return attendance[studentKey]?.[currentSessionNumber] || 'N/A'
  }

  // Handle CC (Class Cancellation) confirmation
  const handleCCConfirmation = async () => {
    if (!ccReason.trim()) {
      brandedToast.error('Please provide a reason for class cancellation')
      return
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

      if (ccStudentId) {
        // Mark specific student as CC (individual student cancellation)
        const requestBody = {
          studentId: ccStudentId,
          scheduleId: schedule.ScheduleID,
          week: currentSessionNumber,
          status: 'CC',
          date: new Date().toISOString().split('T')[0],
          sessionType: ccSessionType,
          remarks: ccReason,
          recordedBy: instructorId
        }

        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        })

        if (response.ok) {
          brandedToast.success(`Marked ${getStudentName(ccStudentId)} as cancelled`)

          // Update local state immediately for UI responsiveness
          const studentKey = `${ccStudentId}`
          if (ccSessionType === 'lecture') {
            setLectureAttendance(prev => ({
              ...prev,
              [studentKey]: {
                ...(prev[studentKey] || {}),
                [currentSessionNumber]: 'CC'
              }
            }))
          } else {
            setLabAttendance(prev => ({
              ...prev,
              [studentKey]: {
                ...(prev[studentKey] || {}),
                [currentSessionNumber]: 'CC'
              }
            }))
          }
          // Refresh attendance data from server to ensure it's saved and displayed correctly
          fetchAttendance()
        } else {
          throw new Error('Failed to mark individual cancellation')
        }
      } else {
        // CANCEL THE ENTIRE CLASS SESSION
        // First, save to server using the cancelled-sessions API
        const cancelResponse = await fetch('/api/attendance/cancelled-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.ScheduleID,
            week: currentSessionNumber,
            sessionType: ccSessionType,
            reason: ccReason,
            cancelledBy: instructorId
          })
        })

        if (!cancelResponse.ok) {
          throw new Error('Failed to save class cancellation to server')
        }

        const sessionKey = `${schedule.ScheduleID}-${ccSessionType}-${currentSessionNumber}`

        // Update local state to mark session as cancelled
        const cancellationData = {
          reason: ccReason,
          cancelledBy: instructorId,
          cancelledAt: new Date().toISOString()
        }

        setCancelledSessions(prev => {
          const updated = {
            ...prev,
            [sessionKey]: cancellationData
          }

          console.log('Saving cancellation to localStorage:', updated)

          // Also save to localStorage as backup
          try {
            localStorage.setItem(`cancelled-sessions-${schedule.ScheduleID}`, JSON.stringify(updated))
            console.log('Successfully saved to localStorage')
          } catch (error) {
            console.error('Failed to save to localStorage:', error)
          }

          return updated
        })

        // Refresh attendance data from server to ensure all students' CC status is updated
        fetchAttendance()

        brandedToast.success(`${ccSessionType === 'lecture' ? 'Lecture' : 'Laboratory'} Week ${currentSessionNumber} has been cancelled`)

        // Save cancellation to database for persistence
        try {
          const requestData = {
            scheduleId: schedule.ScheduleID,
            week: currentSessionNumber,
            sessionType: ccSessionType,
            reason: ccReason,
            cancelledBy: instructorId
          }

          console.log('Sending cancellation request:', requestData)

          const response = await fetch('/api/attendance/cancelled-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            console.error('Cancellation API error:', errorData)
            console.warn('Failed to save session cancellation to database, but local state updated')
          } else {
            console.log('Session cancellation saved successfully to database')
          }
        } catch (error) {
          console.error('Error saving cancellation to database:', error)
        }
      }

      setShowCCModal(false)
      setCCReason('')
      setCCStudentId(null)
    } catch (error) {
      console.error('Error cancelling session:', error)
      brandedToast.error('Failed to cancel session')
    }
  }

  // Handle resuming a cancelled class
  const handleResumeClass = async () => {
    try {
      const sessionKey = `${schedule.ScheduleID}-${currentSessionType}-${currentSessionNumber}`

      // Remove CC records from database first
      try {
        const response = await fetch('/api/attendance/cancelled-sessions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduleId: schedule.ScheduleID,
            week: currentSessionNumber,
            sessionType: currentSessionType
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to remove cancellation from database')
        }

        // After successfully deleting CC records, refresh attendance data
        await fetchAttendance()

        // Also refresh cancelled sessions to update the state
        await fetchCancelledSessions()

      } catch (error) {
        console.error('Error removing cancellation from database:', error)
        brandedToast.error('Failed to remove cancellation from database')
        return
      }

      // Remove from cancelled sessions state (backup cleanup)
      setCancelledSessions(prev => {
        const updated = { ...prev }
        delete updated[sessionKey]

        // Update localStorage
        try {
          localStorage.setItem(`cancelled-sessions-${schedule.ScheduleID}`, JSON.stringify(updated))
        } catch (error) {
          console.error('Failed to update localStorage:', error)
        }

        return updated
      })

      brandedToast.success(`${currentSessionType === 'lecture' ? 'Lecture' : 'Laboratory'} Week ${currentSessionNumber} has been resumed`)

    } catch (error) {
      console.error('Error resuming class:', error)
      brandedToast.error('Failed to resume class')
    }
  }

  // Handle excuse letter viewing
  const handleViewExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedExcuseLetter(letter)
    setShowViewExcuseModal(true)
  }

  // Handle excuse letter approval
  const handleApproveExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedExcuseLetter(letter)
    setShowApprovalModal(true)
  }

  // Handle bulk marking all students as present
  const handleMarkAllPresent = async () => {
    // Get eligible students (not disabled)
    const eligibleStudents = students.filter(student => !student.IsDisabled);

    if (eligibleStudents.length === 0) {
      brandedToast.info("No eligible students to mark as present.");
      return;
    }

    // Show confirmation modal instead of window.confirm
    setShowMarkAllPresentModal(true);
  }

  // Handle confirmed Mark All Present action
  const handleConfirmMarkAllPresent = async () => {
    setShowMarkAllPresentModal(false);

    const eligibleStudents = students.filter(student => !student.IsDisabled);

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

      console.log(`Marking ${eligibleStudents.length} students as present...`);

      // Process students sequentially to avoid race conditions
      let successCount = 0;
      let errorCount = 0;

      for (const student of eligibleStudents) {
        try {
          const requestBody = {
            studentId: student.StudentID,
            scheduleId: schedule.ScheduleID,
            week: currentSessionNumber,
            status: 'P',
            date: new Date().toISOString().split('T')[0],
            sessionType: currentSessionType,
            remarks: `Marked as Present by instructor (bulk action for ${currentSessionType} week ${currentSessionNumber})`,
            recordedBy: instructorId
          };

          console.log(`Marking student ${student.StudentID} as present:`, requestBody);

          const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          if (response.ok) {
            successCount++;
            console.log(`Successfully marked student ${student.StudentID} as present`);
          } else {
            errorCount++;
            const errorText = await response.text();
            console.error(`Failed to mark student ${student.StudentID}:`, errorText);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error marking student ${student.StudentID}:`, error);
        }
      }

      // Update local state for immediate UI feedback
      const sessionType = currentSessionType
      if (sessionType === 'lecture') {
        setLectureAttendance(prev => {
          const newState = { ...prev };
          eligibleStudents.forEach(student => {
            const studentKey = `${student.StudentID}`;
            newState[studentKey] = {
              ...(newState[studentKey] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return newState;
        });
      } else {
        setLabAttendance(prev => {
          const newState = { ...prev };
          eligibleStudents.forEach(student => {
            const studentKey = `${student.StudentID}`;
            newState[studentKey] = {
              ...(newState[studentKey] || {}),
              [currentSessionNumber]: 'P'
            };
          });
          return newState;
        });
      }

      // Show results
      if (errorCount === 0) {
        brandedToast.success(`Successfully marked all ${successCount} students as present`);
      } else if (successCount > 0) {
        brandedToast.warning(`Marked ${successCount} students as present, ${errorCount} failed`);
      } else {
        brandedToast.error(`Failed to mark any students as present`);
      }

      // Refresh attendance data to ensure consistency
      fetchAttendance()
    } catch (error) {
      console.error('Error marking all students as present:', error);
      brandedToast.error('Failed to mark all students as present');
    }
  }

  const handleMarkStudentDropped = (student: Student) => {
    setPendingStudent(student);
    setConfirmAction('drop');
    setActionComment('');
    setShowConfirmModal(true);
  }

  const executeMarkStudentDropped = async (student: Student) => {
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

      console.log(`Marking student ${student.StudentID} (${student.StudentName}) as DROPPED across all sessions...`);

      // For D and FA status, we need to update ALL sessions (1-18) for both lecture and lab
      const sessionTypes = ['lecture', 'lab'];
      const allUpdates = [];

      for (const sessType of sessionTypes) {
        for (let weekNum = 1; weekNum <= 18; weekNum++) {
          const updateRequestBody = {
            scheduleId: schedule.ScheduleID,
            week: weekNum,
            status: 'D',
            date: new Date().toISOString().split('T')[0],
            recordedBy: instructorId,
            studentIds: [student.StudentID],
            sessionType: sessType,
            overrideExisting: true
          };

          allUpdates.push(
            fetch('/api/attendance', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateRequestBody)
            })
          );
        }
      }

      // Execute all updates in parallel
      const updateResults = await Promise.all(allUpdates);
      console.log(`Completed ${updateResults.length} session updates for Dropped status`);

      brandedToast.success(`Successfully marked ${student.StudentName} as Dropped across all sessions`);

      // Refresh attendance data and reload students to update IsDropped status
      await fetchAttendance()
      await fetchStudents()
    } catch (error) {
      console.error('Error marking student as dropped:', error);
      brandedToast.error('Failed to mark student as dropped');
    }
  }

  const handleMarkStudentFailed = (student: Student) => {
    setPendingStudent(student);
    setConfirmAction('fail');
    setActionComment('');
    setShowConfirmModal(true);
  }

  const executeMarkStudentFailed = async (student: Student) => {
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

      console.log(`Marking student ${student.StudentID} (${student.StudentName}) as FAILED across all sessions...`);

      // For D and FA status, we need to update ALL sessions (1-18) for both lecture and lab
      const sessionTypes = ['lecture', 'lab'];
      const allUpdates = [];

      const remarksText = actionComment.trim()
        ? `Manually marked as F.A. - Reason: ${actionComment}`
        : 'Manually marked as Failed due to Absences';

      for (const sessType of sessionTypes) {
        for (let weekNum = 1; weekNum <= 18; weekNum++) {
          const updateRequestBody = {
            scheduleId: schedule.ScheduleID,
            week: weekNum,
            status: 'FA',
            date: new Date().toISOString().split('T')[0],
            recordedBy: instructorId,
            studentIds: [student.StudentID],
            sessionType: sessType,
            remarks: remarksText,
            overrideExisting: true
          };

          allUpdates.push(
            fetch('/api/attendance', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateRequestBody)
            })
          );
        }
      }

      // Execute all updates in parallel
      const updateResults = await Promise.all(allUpdates);
      console.log(`Completed ${updateResults.length} session updates for Failed status`);

      brandedToast.success(`Successfully marked ${student.StudentName} as Failed across all sessions`);

      // Refresh attendance data and reload students to update IsFailed status
      await fetchAttendance()
      await fetchStudents()
    } catch (error) {
      console.error('Error marking student as failed:', error);
      brandedToast.error('Failed to mark student as failed');
    }
  }

  const handleUnDropStudent = (student: Student) => {
    setPendingStudent(student);
    setConfirmAction('undrop');
    setShowConfirmModal(true);
  }

  const executeUnDropStudent = async (student: Student) => {
    try {
      console.log(`Removing dropped status for student ${student.StudentID} (${student.StudentName})...`);

      // Delete all D status records for this student
      const response = await fetch(`/api/attendance/delete-student-status?studentId=${student.StudentID}&scheduleId=${schedule.ScheduleID}&status=D`);

      if (response.ok) {
        brandedToast.success(`Successfully removed ${student.StudentName} from Dropped status`);
        await fetchAttendance()
        await fetchStudents()
      } else {
        const errorText = await response.text();
        console.error('Failed to remove dropped status:', errorText);
        brandedToast.error('Failed to remove dropped status');
      }
    } catch (error) {
      console.error('Error removing dropped status:', error);
      brandedToast.error('Failed to remove dropped status');
    }
  }

  const handleUnFailedStudent = (student: Student) => {
    setPendingStudent(student);
    setConfirmAction('unfailed');
    setActionComment('');
    setShowConfirmModal(true);
  }

  const executeUnFailedStudent = async (student: Student) => {
    try {
      const reasonText = actionComment.trim()
        ? `Removed F.A. status - Reason: ${actionComment}`
        : 'Removed Failed due to Absences status';

      console.log(`Removing failed status for student ${student.StudentID} (${student.StudentName})... Reason: ${reasonText}`);

      // Delete all FA status records for this student
      const response = await fetch(`/api/attendance/delete-student-status?studentId=${student.StudentID}&scheduleId=${schedule.ScheduleID}&status=FA&reason=${encodeURIComponent(reasonText)}`);

      if (response.ok) {
        brandedToast.success(`Successfully removed ${student.StudentName} from Failed status`);
        await fetchAttendance()
        await fetchStudents()
      } else {
        const errorText = await response.text();
        console.error('Failed to remove failed status:', errorText);
        brandedToast.error('Failed to remove failed status');
      }
    } catch (error) {
      console.error('Error removing failed status:', error);
      brandedToast.error('Failed to remove failed status');
    }
  }

  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const handleConfirmAction = async () => {
    if (!pendingStudent) return;

    setIsProcessingAction(true);
    setShowConfirmModal(true); // Keep modal open to show loading

    try {
      switch (confirmAction) {
        case 'drop':
          await executeMarkStudentDropped(pendingStudent);
          break;
        case 'fail':
          await executeMarkStudentFailed(pendingStudent);
          break;
        case 'undrop':
          await executeUnDropStudent(pendingStudent);
          break;
        case 'unfailed':
          await executeUnFailedStudent(pendingStudent);
          break;
      }

      setShowConfirmModal(false);
    } catch (error) {
      console.error('Error in handleConfirmAction:', error);
      brandedToast.error('Failed to process action');
    } finally {
      setIsProcessingAction(false);
      setPendingStudent(null);
      setConfirmAction(null);
    }
  }

  const printAttendance = () => {
    const attendanceData = currentSessionType === 'lecture' ? lectureAttendance : labAttendance
    const studentsData = students.map(student => ({
      StudentID: student.StudentID,
      FirstName: student.FirstName || '',
      LastName: student.LastName || '',
      StudentNumber: student.StudentNumber || ''
    }))

    const printContent = generateAttendancePrintContent(
      schedule,
      studentsData,
      attendanceData,
      currentSessionType,
      currentSessionNumber
    )

    printDocument(printContent, `${schedule.SubjectCode} - ${currentSessionType} Week ${currentSessionNumber} Attendance`)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-b border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="flex items-start justify-between">
              {/* Left Section - Course Info */}
              <div className="flex-1 pr-6">
                {/* Title Row */}
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-slate-900 mb-1">
                    {schedule.SubjectCode} - {schedule.SubjectTitle}
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-600">
                      {schedule.Course} - Year {schedule.YearLevel} • {schedule.Section}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      <Users className="h-3 w-3" />
                      <span className="font-bold">{schedule.EnrolledStudents}/{schedule.TotalSeats}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Row */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">{schedule.Day} {schedule.Time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-semibold text-slate-900">{schedule.Room} {schedule.ClassType === 'MAJOR' ? 'CISCO' : schedule.ClassType === 'LECTURE+LAB' ? 'LECTURE+LABORATORY' : schedule.ClassType}</span>
                  </div>
                </div>
              </div>

              {/* Right Section - Close Button */}
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-col flex-1 overflow-hidden bg-gray-50/30">
          <div className="px-6 pt-6 pb-0 flex-shrink-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200 shadow-sm h-12">
                <TabsTrigger
                  value="attendance"
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Attendance</span>
                </TabsTrigger>
                <TabsTrigger
                  value="grading"
                  className="flex items-center gap-2 text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-200"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Grading</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Attendance Tab */}
                <TabsContent value="attendance" className="mt-6">
                  <div className="space-y-6">
                    {/* Session Management */}
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-slate-800">
                                Week Management
                              </CardTitle>
                              <CardDescription className="text-slate-600 text-sm">
                                Configure attendance week parameters and manage class activities
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={printAttendance}
                            disabled={!schedule}
                            className="h-9 w-9 p-0 print-hide border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                            title="Print Attendance"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {/* All Controls in One Row */}
                        <div className={`grid grid-cols-1 gap-4 ${hasBothComponents ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
                          {/* Session Type Selector - Only show if schedule has both lecture and lab */}
                          {hasBothComponents && (
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold text-slate-700">Session Type</Label>
                              <Select
                                value={currentSessionType}
                                onValueChange={(value) => setCurrentSessionType(value as 'lecture' | 'lab')}
                              >
                                <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                  <div className="flex items-center gap-2">
                                    {currentSessionType === 'lecture' ? (
                                      <BookOpen className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <FlaskConical className="h-4 w-4 text-purple-600" />
                                    )}
                                    <SelectValue />
                                  </div>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lecture">
                                    Lecture
                                  </SelectItem>
                                  <SelectItem value="lab">
                                    Laboratory
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Week Number */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Week Number</Label>
                            <Select
                              value={currentSessionNumber.toString()}
                              onValueChange={(value) => setCurrentSessionNumber(parseInt(value))}
                            >
                              <SelectTrigger className="h-10 w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 18 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    Week {i + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Mark All Present */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">&nbsp;</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleMarkAllPresent}
                              disabled={!schedule}
                              className="w-full h-10 text-sm border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Mark All Present</span>
                              <span className="sm:hidden">All Present</span>
                            </Button>
                          </div>

                          {/* Seat Plan */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">&nbsp;</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowSeatPlanModal(true)}
                              disabled={!schedule}
                              className="w-full h-10 text-sm border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Seat Plan</span>
                              <span className="sm:hidden">Seats</span>
                            </Button>
                          </div>

                          {/* Cancel Class / Resume Class */}
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">&nbsp;</Label>
                            {isCurrentSessionCancelled() ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResumeClass}
                                disabled={!schedule}
                                className="w-full h-10 text-sm bg-green-50 hover:bg-green-100 text-green-700 border-green-300 hover:border-green-400"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Resume Class</span>
                                <span className="sm:hidden">Resume</span>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCCStudentId(null)
                                  setCCSessionType(currentSessionType)
                                  setCCReason('')
                                  setCCNotifyStudents(false)
                                  setShowCCModal(true)
                                }}
                                disabled={!schedule}
                                className="w-full h-10 text-sm bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400"
                              >
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Cancel Class</span>
                                <span className="sm:hidden">Cancel</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Session Status Indicator */}
                        {isCurrentSessionCancelled() && (() => {
                          const sessionKey = `${schedule.ScheduleID}-${currentSessionType}-${currentSessionNumber}`
                          const cancellationDetails = cancelledSessions[sessionKey]

                          return (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-lg">
                                  <AlertCircle className="h-5 w-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-semibold text-red-800 text-sm">Session Cancelled</h3>
                                  <p className="text-red-700 text-sm mt-1">
                                    <span className="font-medium">Reason:</span> {cancellationDetails?.reason || 'No reason provided'}
                                  </p>
                                  <p className="text-red-600 text-xs mt-1">
                                    <span className="font-medium">Cancelled by:</span> {cancellationDetails?.cancelledBy || 'Unknown'} •
                                    <span className="font-medium"> Time:</span> {cancellationDetails?.cancelledAt ?
                                      new Date(cancellationDetails.cancelledAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                      }) : 'Unknown time'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>

                    {/* Student List */}
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-slate-800">
                                Students - {currentSessionType === 'lecture' ? 'Lecture' : 'Laboratory'} Session {currentSessionNumber}
                              </CardTitle>
                              {isCurrentSessionCancelled() && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold mt-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Session Cancelled
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-slate-600">
                              <span className="font-semibold text-slate-800">{students.length}</span> students
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {isCurrentSessionCancelled() && (
                          <div className="bg-red-50 border border-red-200 px-4 py-3 mb-6 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              <div>
                                <span className="font-medium">This session has been cancelled.</span>
                                <span className="ml-1">Attendance cannot be modified for cancelled sessions.</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {loading ? (
                          <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-600 font-medium">Loading students...</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {students.map((student, index) => {
                              const attendance = getStudentAttendance(student.StudentID, currentSessionType)
                              const hasApprovedExcuseLetters = excuseLetters.some(letter =>
                                letter.StudentID === student.StudentID &&
                                letter.ScheduleID === schedule.ScheduleID &&
                                letter.InstructorStatus === 'approved'
                              )

                              return (
                                <div key={`student-${student.StudentID}-${schedule.ScheduleID}-${index}`} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-semibold text-blue-700">
                                        {student.FirstName?.[0]}{student.LastName?.[0]}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900">{student.FirstName} {student.LastName}</h4>
                                      <p className="text-sm text-slate-600">{student.StudentNumber}</p>
                                    </div>
                                    {hasApprovedExcuseLetters && (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1">
                                        <FileText className="h-3 w-3 mr-1" />
                                        Has Excuse Letter
                                      </Badge>
                                    )}
                                    {student.IsDropped && (
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-2 py-1">
                                        <Minus className="h-3 w-3 mr-1" />
                                        Dropped
                                      </Badge>
                                    )}
                                    {student.IsFailed && (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2 py-1">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Failed
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {['P', 'A', 'L', 'E'].map((status, statusIndex) => {
                                      const isActive = attendance === status
                                      const buttonClass = isActive
                                        ? status === 'P' ? 'bg-green-500 text-white hover:bg-green-600 shadow-sm' :
                                          status === 'A' ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm' :
                                            status === 'L' ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm' :
                                              status === 'E' ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' :
                                                'bg-gray-400 text-white hover:bg-gray-500'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'

                                      const isStudentDisabled = student.IsDisabled || student.IsDropped || student.IsFailed
                                      const isButtonDisabled = isCurrentSessionCancelled() || isStudentDisabled

                                      return (
                                        <Button
                                          key={status}
                                          size="sm"
                                          className={`w-9 h-9 p-0 relative font-semibold transition-all duration-200 ${buttonClass} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          onClick={() => !isButtonDisabled && markAttendanceForSession(student.StudentID, status, currentSessionType)}
                                          disabled={isButtonDisabled}
                                          title={isCurrentSessionCancelled() ? 'Session cancelled - attendance cannot be modified' :
                                            isStudentDisabled ? (student.IsDropped ? 'Student is dropped - attendance locked' : 'Student is failed - attendance locked') :
                                              `Mark as ${status === 'P' ? 'Present' :
                                                status === 'A' ? 'Absent' :
                                                  status === 'L' ? 'Late' :
                                                    status === 'E' ? 'Excused' :
                                                      'Unknown'
                                              } for ${currentSessionType} session`}
                                        >
                                          {status}
                                          {hasApprovedExcuseLetters && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                                              title="Has approved excuse letter" />
                                          )}
                                        </Button>
                                      )
                                    })}

                                    {/* Action Buttons - Drop and Failed OR Undrop and Unfailed */}
                                    {!student.IsDisabled && (
                                      <>
                                        {!student.IsDropped && !student.IsFailed ? (
                                          <>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-12 h-9 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 px-2"
                                              onClick={() => handleMarkStudentDropped(student)}
                                              disabled={isCurrentSessionCancelled()}
                                              title="Mark as Dropped"
                                            >
                                              D
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="w-12 h-9 text-xs border-red-500 text-red-700 hover:bg-red-50 hover:border-red-600 px-2"
                                              onClick={() => handleMarkStudentFailed(student)}
                                              disabled={isCurrentSessionCancelled()}
                                              title="Mark as Failed"
                                            >
                                              FA
                                            </Button>
                                          </>
                                        ) : student.IsDropped ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-20 h-9 text-xs border-green-500 text-green-700 hover:bg-green-50 hover:border-green-600 bg-green-50 px-2"
                                            onClick={() => handleUnDropStudent(student)}
                                            disabled={isCurrentSessionCancelled()}
                                            title="Remove Dropped Status"
                                          >
                                            Undrop
                                          </Button>
                                        ) : student.IsFailed ? (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-22 h-9 text-xs border-green-500 text-green-700 hover:bg-green-50 hover:border-green-600 bg-green-50 px-2"
                                            onClick={() => handleUnFailedStudent(student)}
                                            disabled={isCurrentSessionCancelled()}
                                            title="Remove Failed Status"
                                          >
                                            Unfailed
                                          </Button>
                                        ) : null}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Grading Tab */}
                <TabsContent value="grading" className="mt-6">
                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-white">
                      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Calculator className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-slate-800">
                                Student Grades
                              </CardTitle>
                              <CardDescription className="text-slate-600 text-sm">
                                Manage and view student grades for {schedule.SubjectCode}
                              </CardDescription>
                            </div>
                          </div>
                          <Button
                            onClick={() => window.location.href = `/instructor/grades?scheduleId=${schedule.ScheduleID}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium"
                          >
                            <Calculator className="h-4 w-4 mr-2" />
                            Grade Students
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {grades.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                              <Calculator className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">No grades available yet</h3>
                            <p className="text-slate-600 mb-4">
                              Click "Grade Students" to start entering grades for this subject
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {grades.map((grade, index) => (
                              <div key={`${grade.StudentID}-${grade.Course}-${grade.Section}-${index}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white">
                                {/* Student Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-900 text-sm truncate">{grade.StudentName}</h4>
                                    <p className="text-xs text-slate-600 truncate">{grade.Course} - Year {grade.YearLevel} • {grade.Section}</p>
                                  </div>
                                  <Badge
                                    variant={grade.status === 'Passed' ? 'default' : grade.status === 'Failed' ? 'destructive' : 'secondary'}
                                    className={`text-xs px-2 py-1 font-semibold ${grade.status === 'Passed' ? 'bg-green-500 text-white' :
                                      grade.status === 'Failed' ? 'bg-red-500 text-white' :
                                        'bg-gray-500 text-white'
                                      }`}
                                  >
                                    {grade.status}
                                  </Badge>
                                </div>

                                {/* Grades Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-center p-2 bg-blue-50 rounded">
                                    <p className="text-xs text-gray-600 mb-1">Midterm</p>
                                    <p className="text-lg font-bold text-blue-700">
                                      {grade.midtermGrade > 0 ? grade.midtermGrade.toFixed(1) : 'N/A'}
                                    </p>
                                    {grade.midtermGrade > 0 && (
                                      <div className={`text-xs mt-1 px-1 py-0.5 rounded ${grade.midtermGrade <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {grade.midtermGrade <= 3.0 ? 'Passed' : 'Failed'}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-center p-2 bg-purple-50 rounded">
                                    <p className="text-xs text-gray-600 mb-1">Final</p>
                                    <p className="text-lg font-bold text-purple-700">
                                      {grade.finalGrade > 0 ? grade.finalGrade.toFixed(1) : 'N/A'}
                                    </p>
                                    {grade.finalGrade > 0 && (
                                      <div className={`text-xs mt-1 px-1 py-0.5 rounded ${grade.finalGrade <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {grade.finalGrade <= 3.0 ? 'Passed' : 'Failed'}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-center p-2 bg-green-50 rounded">
                                    <p className="text-xs text-gray-600 mb-1">Overall</p>
                                    <p className="text-lg font-bold text-slate-900">
                                      {grade.summaryGrade > 0 ? grade.summaryGrade.toFixed(1) : 'N/A'}
                                    </p>
                                    {grade.summaryGrade > 0 && (
                                      <div className={`text-xs mt-1 px-1 py-0.5 rounded ${grade.summaryGrade <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {grade.summaryGrade <= 3.0 ? 'Passed' : 'Failed'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Excuse Letters Tab */}
              </Tabs>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showSeatPlanModal && (
          <EnhancedSeatPlanModal
            schedule={schedule}
            onClose={() => setShowSeatPlanModal(false)}
            onDataSaved={async () => {
              console.log('🔍 ScheduleHub: onDataSaved called for schedule:', schedule.ScheduleID)
              // Refresh schedule data to get updated seat maps
              try {
                console.log('🔍 ScheduleHub: Fetching updated schedule data...')
                const res = await fetch(`/api/schedules?id=${schedule.ScheduleID}`)
                console.log('🔍 ScheduleHub: API response status:', res.status)
                if (res.ok) {
                  const result = await res.json()
                  console.log('🔍 ScheduleHub: API response data:', result)
                  if (result.success && result.data.length > 0) {
                    // Update the schedule object with fresh data
                    console.log('🔍 ScheduleHub: Updating schedule object with fresh data')
                    console.log('🔍 ScheduleHub: Old LectureSeatMap:', schedule.LectureSeatMap)
                    console.log('🔍 ScheduleHub: Old LaboratorySeatMap:', schedule.LaboratorySeatMap)
                    console.log('🔍 ScheduleHub: Fresh data from API:', result.data[0])
                    console.log('🔍 ScheduleHub: Fresh LectureSeatMap:', result.data[0].LectureSeatMap)
                    console.log('🔍 ScheduleHub: Fresh LaboratorySeatMap:', result.data[0].LaboratorySeatMap)
                    console.log('🔍 ScheduleHub: Fresh LectureSeatCols:', result.data[0].LectureSeatCols)
                    console.log('🔍 ScheduleHub: Fresh LaboratorySeatCols:', result.data[0].LaboratorySeatCols)
                    Object.assign(schedule, result.data[0])
                    console.log('🔍 ScheduleHub: New LectureSeatMap:', schedule.LectureSeatMap)
                    console.log('🔍 ScheduleHub: New LaboratorySeatMap:', schedule.LaboratorySeatMap)
                    console.log('🔍 ScheduleHub: Updated schedule object:', schedule)
                  }
                }
              } catch (error) {
                console.error('❌ ScheduleHub: Error refreshing schedule data:', error)
              }
            }}
          />
        )}

        {showViewExcuseModal && selectedExcuseLetter && (
          <ViewExcuseLetterModal
            excuseLetter={selectedExcuseLetter}
            isOpen={showViewExcuseModal}
            onClose={() => {
              setShowViewExcuseModal(false)
              setSelectedExcuseLetter(null)
            }}
          />
        )}

        {showApprovalModal && selectedExcuseLetter && (
          <ApprovalModal
            excuseLetter={selectedExcuseLetter}
            isOpen={showApprovalModal}
            onClose={() => {
              setShowApprovalModal(false)
              setSelectedExcuseLetter(null)
            }}
            approvalAction="approved"
            onSubmit={(comment) => {
              // Handle approval logic here
              console.log('Approval comment:', comment)
              fetchExcuseLetters()
              setShowApprovalModal(false)
              setSelectedExcuseLetter(null)
            }}
          />
        )}

        {/* CC Modal */}
        {showCCModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Class Cancellation</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Reason for cancellation</label>
                  <Textarea
                    value={ccReason}
                    onChange={(e) => setCCReason(e.target.value)}
                    placeholder="Enter reason for class cancellation..."
                    className="mt-1"
                  />
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
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setShowCCModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCCConfirmation}
                  disabled={!ccReason.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {ccStudentId ? 'Mark as CC' : 'Cancel Class'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && pendingStudent && (
          <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {confirmAction === 'drop' && <span className="text-orange-600">⚠️ Mark as Dropped</span>}
                  {confirmAction === 'fail' && <span className="text-red-600">⚠️ Mark as Failed</span>}
                  {confirmAction === 'undrop' && <span className="text-green-600">✓ Remove Dropped Status</span>}
                  {confirmAction === 'unfailed' && <span className="text-green-600">✓ Remove Failed Status</span>}
                </DialogTitle>
                <div className="pt-4 space-y-2">
                  {confirmAction === 'drop' && (
                    <>
                      <div className="font-medium text-gray-900 mb-2">Student: {pendingStudent.FirstName} {pendingStudent.LastName}</div>
                      <div className="text-sm text-gray-700">
                        This will mark the student as <span className="font-semibold text-orange-600">DROPPED</span> across ALL sessions (1-18) for both lecture and lab. This action cannot be undone easily.
                      </div>
                    </>
                  )}
                  {confirmAction === 'fail' && (
                    <>
                      <div className="font-medium text-gray-900 mb-2">Student: {pendingStudent.FirstName} {pendingStudent.LastName}</div>
                      <div className="text-sm text-gray-700">
                        This will mark the student as <span className="font-semibold text-red-600">FAILED DUE TO ABSENCES</span> across ALL sessions (1-18) for both lecture and lab. This action cannot be undone easily.
                      </div>
                    </>
                  )}
                  {confirmAction === 'undrop' && (
                    <>
                      <div className="font-medium text-gray-900 mb-2">Student: {pendingStudent.FirstName} {pendingStudent.LastName}</div>
                      <div className="text-sm text-gray-700">
                        This will remove the <span className="font-semibold text-orange-600">DROPPED</span> status and delete all D (Dropped) attendance records across all sessions.
                      </div>
                    </>
                  )}
                  {confirmAction === 'unfailed' && (
                    <>
                      <div className="font-medium text-gray-900 mb-2">Student: {pendingStudent.FirstName} {pendingStudent.LastName}</div>
                      <div className="text-sm text-gray-700">
                        This will remove the <span className="font-semibold text-red-600">FAILED</span> status and delete all FA (Failed) attendance records across all sessions.
                      </div>
                    </>
                  )}
                </div>

                {/* Comment/Reason field for F.A. related actions */}
                {(confirmAction === 'fail' || confirmAction === 'unfailed') && (
                  <div className="px-6 pb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {confirmAction === 'fail' ? 'Reason for marking as F.A. (Optional)' : 'Reason for removing F.A. status (Required)'}
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                      rows={3}
                      placeholder={confirmAction === 'fail'
                        ? "e.g., Excessive absences beyond allowed limit"
                        : "e.g., Medical excuse approved, absences now excused"}
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                    />
                  </div>
                )}
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isProcessingAction) {
                      setShowConfirmModal(false);
                      setPendingStudent(null);
                      setConfirmAction(null);
                      setActionComment('');
                    }
                  }}
                  disabled={isProcessingAction}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmAction}
                  disabled={isProcessingAction || (confirmAction === 'unfailed' && !actionComment.trim())}
                  className={
                    confirmAction === 'drop' ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400' :
                      confirmAction === 'fail' ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' :
                        'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  }
                >
                  {isProcessingAction ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {confirmAction === 'drop' && 'Mark as Dropped'}
                      {confirmAction === 'fail' && 'Mark as Failed'}
                      {confirmAction === 'undrop' && 'Remove Dropped Status'}
                      {confirmAction === 'unfailed' && 'Remove Failed Status'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Mark All Present Confirmation Modal */}
        <Dialog open={showMarkAllPresentModal} onOpenChange={setShowMarkAllPresentModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                Confirm Mark All Present
              </DialogTitle>
              <DialogDescription>
                Review the details below before confirming this action.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to mark all <strong>{students.filter(s => !s.IsDisabled).length} student(s)</strong> as <strong className="text-green-600">PRESENT</strong>?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-blue-900">Session Details:</p>
                    <p className="text-blue-800">
                      <strong>{currentSessionType.toUpperCase()}</strong> - Week {currentSessionNumber}
                    </p>
                    <p className="text-blue-700 text-xs mt-2">
                      This action will mark attendance for all eligible students in this session.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowMarkAllPresentModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmMarkAllPresent}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Mark All Present
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
