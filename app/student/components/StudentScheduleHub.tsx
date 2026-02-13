'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp,
  UserCheck,
  AlertCircle,
  GraduationCap,
  MessageSquare,
  CheckCircle,
  XCircle,
  BookOpen,
  Printer
} from "lucide-react"
import { brandedToast } from "@/components/ui/branded-toast"
import SubmitExcuseLetterModal from "./SubmitExcuseLetterModal"
import ViewExcuseLetterModal from "./ViewExcuseLetterModal"
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils"
import { printDocument, generateStudentAttendancePrintContent, generateStudentGradePrintContent } from "@/lib/printUtils"

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

interface AttendanceData {
  AttendanceID: number;
  ScheduleID: number;
  Week: number;
  Status: string;
  Date: string;
  SubjectCode: string;
  SubjectName?: string;
  SubjectTitle?: string;
  Remarks: string;
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
  ScheduleID: number;
}

interface StudentScheduleHubProps {
  schedule: Schedule;
  studentId: number;
  studentName?: string;
  studentNumber?: string;
  onClose: () => void;
}

export default function StudentScheduleHub({ schedule, studentId, studentName, studentNumber, onClose }: StudentScheduleHubProps) {
  // State management
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [detailedGrades, setDetailedGrades] = useState<any[]>([])
  const [gradeSummary, setGradeSummary] = useState<GradeData | null>(null)
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('attendance')
  const [studentInfo, setStudentInfo] = useState<{name: string, number: string}>({
    name: studentName || 'Loading...',
    number: studentNumber || 'Loading...'
  })
  
  // Modals
  const [showSubmitExcuseModal, setShowSubmitExcuseModal] = useState(false)
  const [showViewExcuseModal, setShowViewExcuseModal] = useState(false)
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null)

  // Fetch data when component mounts
  useEffect(() => {
    fetchStudentInfo()
    fetchAttendance()
    fetchGrades()
    fetchExcuseLetters()
  }, [schedule.ScheduleID, studentId])

  const fetchStudentInfo = async () => {
    if (studentName && studentNumber) {
      setStudentInfo({ name: studentName, number: studentNumber })
      return
    }
    
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userSession='))
      
      if (!sessionCookie) return
      
      const session = JSON.parse(decodeURIComponent(sessionCookie.split('=')[1]))
      const res = await fetch(`/api/students?userId=${session.userId}`)
      
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const student = data[0]
          setStudentInfo({
            name: `${student.FirstName || ''} ${student.LastName || ''}`.trim() || 'N/A',
            number: student.StudentNumber || 'N/A'
          })
        }
      }
    } catch (error) {
      console.error('Error fetching student info:', error)
      setStudentInfo({ name: 'N/A', number: 'N/A' })
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance?studentId=${studentId}&scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const attendanceData = result.success ? result.data : result
        const filtered = Array.isArray(attendanceData) ? attendanceData.filter((rec: any) => {
          const status = (rec.Status || '').toLowerCase()
          return status !== 'loa' && status !== 'drop' && status !== 'uw'
        }) : []
        setAttendance(filtered)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      brandedToast.error('Failed to load attendance records')
    } finally {
      setLoading(false)
    }
  }

  const fetchGrades = async () => {
    try {
      const res = await fetch(`/api/grades?role=student&userId=${studentId}&scheduleId=${schedule.ScheduleID}`)
      if (!res.ok) return

        const result = await res.json()
      const rawData = result.success ? result.data : []
      const summaryMap = result.summary || {}
      const scheduleKey = schedule.ScheduleID?.toString()

      const filteredRaw = Array.isArray(rawData) ? rawData.filter((row: any) => {
        const status = (row.Status || '').toLowerCase()
        return status !== 'loa' && status !== 'drop' && status !== 'uw'
      }) : []

      setDetailedGrades(filteredRaw)

      if (scheduleKey && summaryMap[scheduleKey]) {
        const summary = summaryMap[scheduleKey]
        setGradeSummary({
          ScheduleID: schedule.ScheduleID,
          SubjectCode: summary.SubjectCode || schedule.SubjectCode,
          SubjectName: summary.SubjectName || schedule.SubjectTitle,
          ClassType: summary.ClassType || schedule.ClassType || 'LECTURE',
          midterm: summary.midterm ?? null,
          final: summary.final ?? null,
          summary: summary.summary ?? null,
        })
        setGrades([
          {
            ScheduleID: schedule.ScheduleID,
            SubjectCode: summary.SubjectCode || schedule.SubjectCode,
            SubjectName: summary.SubjectName || schedule.SubjectTitle,
            ClassType: summary.ClassType || schedule.ClassType || 'LECTURE',
            midterm: summary.midterm ?? null,
            final: summary.final ?? null,
            summary: summary.summary ?? null,
          },
        ])
      } else {
        setGradeSummary(null)
        setGrades([])
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const fetchExcuseLetters = async () => {
    try {
      const res = await fetch(`/api/excuse-letters?studentId=${studentId}&scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const lettersData = result.success ? result.data : result
        setExcuseLetters(Array.isArray(lettersData) ? lettersData : [])
      }
    } catch (error) {
      console.error('Error fetching excuse letters:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'P': return 'bg-green-100 text-green-800'
      case 'A': return 'bg-red-100 text-red-800'
      case 'E': return 'bg-blue-100 text-blue-800'
      case 'L': return 'bg-yellow-100 text-yellow-800'
      case 'CC': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'P': return 'Present'
      case 'A': return 'Absent'
      case 'E': return 'Excused'
      case 'L': return 'Late'
      case 'CC': return 'Class Cancelled'
      default: return status
    }
  }

  // Build session maps for quick lookup: { weekNumber: status }
  const buildSessionMap = (sessionType: 'lecture' | 'lab') => {
    const map: Record<number, string> = {}
    attendance
      .filter((rec) => (rec as any).SessionType ? (rec as any).SessionType === sessionType : true) // backward compat if SessionType missing
      .forEach((rec) => {
        map[rec.Week] = rec.Status
      })
    return map
  }

  const lectureMap = buildSessionMap('lecture')
  const labMap = buildSessionMap('lab')

  const maxWeek = 18 // Fixed to 18 weeks as per semester requirement

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade > 3.0) return 'text-red-600'  // Failed - red
    return 'text-slate-900'  // Passed - black
  }

  // Helper function to round to nearest valid Filipino grade (matches instructor grading logic)
  const roundToValidGrade = (grade: number): number => {
    const validGrades = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 5.00]
    
    if (validGrades.includes(grade)) return grade
    if (grade > 3.0) return 5.00
    
    let nearest = validGrades[0]
    let minDiff = Math.abs(grade - nearest)
    
    for (const validGrade of validGrades) {
      const diff = Math.abs(grade - validGrade)
      if (diff < minDiff) {
        minDiff = diff
        nearest = validGrade
      }
    }
    
    return nearest
  }

  const getExcuseLetterStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewExcuseLetter = (letter: ExcuseLetter) => {
    setSelectedExcuseLetter(letter)
    setShowViewExcuseModal(true)
  }

  const printAttendance = () => {
    const printContent = generateStudentAttendancePrintContent(
      schedule,
      studentInfo.name,
      studentInfo.number,
      attendance
    )
    printDocument(printContent, `${schedule.SubjectCode} - Attendance Report`)
  }

  const printGrades = () => {
    if (!gradeSummary) {
      brandedToast.error('No grades available to print')
      return
    }
    
    const printContent = generateStudentGradePrintContent(
      schedule,
      studentInfo.name,
      studentInfo.number,
      gradeSummary
    )
    printDocument(printContent, `${schedule.SubjectCode} - Grade Report`)
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
                    <span className="font-semibold text-slate-900">{schedule.Room} {schedule.ClassType === 'MAJOR' ? 'CISCO' : schedule.ClassType === 'LECTURE+LAB' ? 'LECTURE+LABORATORY' : schedule.ClassType || ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">{schedule.InstructorName}</span>
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
                  <TrendingUp className="h-4 w-4" />
                  <span>Grades</span>
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
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-800">
                            Attendance Records
                          </CardTitle>
                          <CardDescription className="text-slate-600 text-sm">
                            Your attendance history for {schedule.SubjectCode}
                          </CardDescription>
                        </div>
                      </div>
                      {attendance.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printAttendance}
                          className="h-9 w-9 p-0 print-hide border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          title="Print Attendance"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600 font-medium">Loading attendance records...</p>
                      </div>
                    ) : attendance.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <UserCheck className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No attendance records found</h3>
                        <p className="text-slate-600">
                          Attendance records will appear here once classes begin
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {attendance.map((record) => (
                          <div key={record.AttendanceID} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-700">
                                  {record.Week}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{new Date(record.Date).toLocaleDateString()}</h4>
                                <p className="text-sm text-slate-600">{record.Remarks}</p>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(record.Status)} px-3 py-1 font-semibold`}>
                              {getStatusText(record.Status)}
                            </Badge>
                          </div>
                        ))}
                        
                        {/* Full attendance sheet (read-only) */}
                        <div className="mt-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <h4 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            Attendance Sheet (Read-only)
                          </h4>
                          <p className="text-sm text-slate-600 mb-4">
                            Status per week for Lecture and Laboratory sessions.
                          </p>

                          {(() => {
                            const renderRow = (label: string, map: Record<number, string>) => (
                              <div className="mb-3">
                                <div className="text-sm font-semibold text-slate-700 mb-2">{label}</div>
                                <div className="grid grid-cols-9 gap-2 md:grid-cols-12">
                                  {Array.from({ length: maxWeek }, (_, idx) => {
                                    const weekNum = idx + 1
                                    const status = map[weekNum] || '—'
                                    const colorClass = getStatusColor(status as any)
                                    return (
                                      <div
                                        key={`${label}-${weekNum}`}
                                        className={`rounded-lg border text-center py-2 text-xs font-semibold ${status === '—' ? 'bg-gray-50 text-gray-400 border-gray-200' : `${colorClass} border-transparent`} `}
                                      >
                                        <div className="text-[10px] uppercase tracking-wide text-gray-500">W{weekNum}</div>
                                        <div className="text-sm">
                                          {status === '—' ? '—' : getStatusText(status)}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )

                            // Check if this is a Cisco schedule
                            const isCiscoSchedule = (schedule.ClassType || '').toUpperCase() === 'MAJOR' || 
                                                    (schedule.Room && schedule.Room.toLowerCase().includes('cisco'))
                            
                            // Only Cisco schedules can show both sections
                            // Non-Cisco schedules should only show ONE section
                            const hasLectureHours = (schedule.Lecture || 0) > 0
                            const hasLabHours = (schedule.Laboratory || 0) > 0
                            
                            let hasLecture = false
                            let hasLab = false
                            
                            if (isCiscoSchedule) {
                              // Cisco: show both if both hours configured
                              hasLecture = hasLectureHours
                              hasLab = hasLabHours
                            } else {
                              // Non-Cisco: only ONE section
                              if (hasLectureHours) {
                                hasLecture = true
                                hasLab = false
                              } else if (hasLabHours) {
                                hasLecture = false
                                hasLab = true
                              }
                            }

                            return (
                              <div className="space-y-4">
                                {hasLecture && renderRow('Lecture Sessions', lectureMap)}
                                {hasLab && renderRow('Laboratory Sessions', labMap)}
                              </div>
                            )
                          })()}

                          {/* Legend */}
                          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                            {['P','A','E','L','CC'].map((s) => (
                              <div key={s} className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded ${getStatusColor(s as any)} font-semibold`}>{s}</span>
                                <span>{getStatusText(s)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Attendance Summary */}
                        <div className="mt-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-gray-200">
                          <h4 className="font-semibold text-slate-800 mb-4 text-lg">Attendance Summary</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                              <p className="text-3xl font-bold text-green-600">
                                {attendance.filter(r => r.Status === 'P').length}
                              </p>
                              <p className="text-sm text-slate-600 font-medium mt-1">Present</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                              <p className="text-3xl font-bold text-red-600">
                                {attendance.filter(r => r.Status === 'A').length}
                              </p>
                              <p className="text-sm text-slate-600 font-medium mt-1">Absent</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                              <p className="text-3xl font-bold text-blue-600">
                                {attendance.filter(r => r.Status === 'E').length}
                              </p>
                              <p className="text-sm text-slate-600 font-medium mt-1">Excused</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-lg border border-gray-200">
                              <p className="text-3xl font-bold text-yellow-600">
                                {attendance.filter(r => r.Status === 'L').length}
                              </p>
                              <p className="text-sm text-slate-600 font-medium mt-1">Late</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Grades Tab */}
            <TabsContent value="grading" className="mt-6">
              <div className="space-y-6">
                <Card className="border-0 shadow-lg bg-white">
                  <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-slate-800">
                            Grade Report
                          </CardTitle>
                          <CardDescription className="text-slate-600 text-sm">
                            Your academic performance in {schedule.SubjectCode}
                          </CardDescription>
                        </div>
                      </div>
                      {grades.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={printGrades}
                          className="h-9 w-9 p-0 print-hide border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                          title="Print Grades"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {grades.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <TrendingUp className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No grades available yet</h3>
                        <p className="text-slate-600">
                          Grades will appear here once they are posted by your instructor
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {(gradeSummary ? [gradeSummary] : grades).map((grade) => {
                          // Round overall grade to nearest valid Filipino grade (matches instructor grading sheet)
                          const roundedSummary = grade.summary ? roundToValidGrade(grade.summary) : null
                          return (
                          <div key={grade.ScheduleID} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-lg text-slate-900">{grade.SubjectCode} - {grade.SubjectName}</h4>
                                <p className="text-sm text-slate-600">{grade.ClassType}</p>
                              </div>
                              <Badge 
                                variant={roundedSummary !== null && roundedSummary <= 3.0 ? 'default' : 'destructive'}
                                className={`text-lg px-3 py-1 font-semibold ${
                                  roundedSummary !== null && roundedSummary <= 3.0 ? 'bg-green-500 text-white' : 
                                  roundedSummary !== null ? 'bg-red-500 text-white' : 
                                  'bg-gray-500 text-white'
                                }`}
                              >
                                {roundedSummary !== null ? roundedSummary.toFixed(2) : 'N/A'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-slate-600 mb-1 font-medium">Midterm Grade</p>
                                <p className={`text-2xl font-bold ${getGradeColor(grade.midterm)}`}>
                                  {grade.midterm ? grade.midterm.toFixed(2) : 'N/A'}
                                </p>
                                {grade.midterm && (
                                  <div className={`text-xs mt-1 px-2 py-0.5 rounded ${
                                    grade.midterm <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {grade.midterm <= 3.0 ? 'Passed' : 'Failed'}
                                  </div>
                                )}
                              </div>
                              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs text-slate-600 mb-1 font-medium">Final Grade</p>
                                <p className={`text-2xl font-bold ${getGradeColor(grade.final)}`}>
                                  {grade.final ? grade.final.toFixed(2) : 'N/A'}
                                </p>
                                {grade.final && (
                                  <div className={`text-xs mt-1 px-2 py-0.5 rounded ${
                                    grade.final <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {grade.final <= 3.0 ? 'Passed' : 'Failed'}
                                  </div>
                                )}
                              </div>
                              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs text-slate-600 mb-1 font-medium">Overall Average</p>
                                <p className={`text-2xl font-bold ${getGradeColor(roundedSummary)}`}>
                                  {roundedSummary !== null ? roundedSummary.toFixed(2) : 'N/A'}
                                </p>
                                {roundedSummary !== null && (
                                  <div className={`text-xs mt-1 px-2 py-0.5 rounded ${
                                    roundedSummary <= 3.0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                  }`}>
                                    {roundedSummary <= 3.0 ? 'Passed' : 'Failed'}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Detailed component scores */}
                            <div className="mt-6">
                              <h5 className="font-semibold text-slate-900 mb-3 text-sm">Per-component scores</h5>
                              {['midterm', 'final'].map((term) => {
                                const termGrades = detailedGrades.filter(
                                  (g) => (g.Term || '').toLowerCase() === term.toLowerCase()
                                )

                                if (termGrades.length === 0) {
                                  return (
                                    <div key={term} className="text-sm text-slate-500 mb-4">
                                      {term === 'midterm' ? 'Midterm' : 'Final'} grades not yet available.
                                    </div>
                                  )
                                }

                                // Group by component then sort by item
                                const grouped: Record<string, any[]> = {}
                                termGrades.forEach((g) => {
                                  const comp = g.Component || 'Component'
                                  if (!grouped[comp]) grouped[comp] = []
                                  grouped[comp].push(g)
                                })

                                Object.keys(grouped).forEach((key) => {
                                  grouped[key].sort((a, b) => (a.ItemNumber || 0) - (b.ItemNumber || 0))
                                })

                                return (
                                  <div key={term} className="mb-4">
                                    <div className="text-sm font-semibold text-slate-800 mb-2 capitalize">{term} breakdown</div>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                      <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                          <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b">Component</th>
                                            <th className="px-3 py-2 text-left font-semibold text-slate-700 border-b">Item</th>
                                            <th className="px-3 py-2 text-center font-semibold text-slate-700 border-b">TOTAL ITEMS</th>
                                            <th className="px-3 py-2 text-center font-semibold text-slate-700 border-b">Score</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {Object.keys(grouped).map((comp) =>
                                            grouped[comp].map((row, idx) => (
                                              <tr key={`${comp}-${row.ItemNumber}-${term}-${idx}`} className="odd:bg-white even:bg-gray-50">
                                                <td className="px-3 py-2 border-b text-slate-800">{comp}</td>
                                                <td className="px-3 py-2 border-b text-slate-700"># {row.ItemNumber || 1}</td>
                                                <td className="px-3 py-2 border-b text-center text-slate-700">
                                                  {row.MaxScore !== null && row.MaxScore !== undefined ? row.MaxScore : '—'}
                                                </td>
                                                <td className="px-3 py-2 border-b text-center font-semibold text-slate-900">
                                                  {row.Score !== null && row.Score !== undefined ? Math.round(row.Score) : '—'}
                                                </td>
                                              </tr>
                                            ))
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )
                              })}
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

              </Tabs>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showSubmitExcuseModal && (
          <SubmitExcuseLetterModal
            isOpen={showSubmitExcuseModal}
            onClose={() => setShowSubmitExcuseModal(false)}
            studentId={studentId}
            onSuccess={() => {
              fetchExcuseLetters()
              setShowSubmitExcuseModal(false)
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
      </div>
    </div>
  )
}

