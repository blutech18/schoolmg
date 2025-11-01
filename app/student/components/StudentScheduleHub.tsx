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
  BookOpen
} from "lucide-react"
import { brandedToast } from "@/components/ui/branded-toast"
import SubmitExcuseLetterModal from "./SubmitExcuseLetterModal"
import ViewExcuseLetterModal from "./ViewExcuseLetterModal"
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils"

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
  onClose: () => void;
}

export default function StudentScheduleHub({ schedule, studentId, onClose }: StudentScheduleHubProps) {
  // State management
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [grades, setGrades] = useState<GradeData[]>([])
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetter[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('attendance')
  
  // Modals
  const [showSubmitExcuseModal, setShowSubmitExcuseModal] = useState(false)
  const [showViewExcuseModal, setShowViewExcuseModal] = useState(false)
  const [selectedExcuseLetter, setSelectedExcuseLetter] = useState<ExcuseLetter | null>(null)

  // Fetch data when component mounts
  useEffect(() => {
    fetchAttendance()
    fetchGrades()
    fetchExcuseLetters()
  }, [schedule.ScheduleID, studentId])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/attendance?studentId=${studentId}&scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const attendanceData = result.success ? result.data : result
        setAttendance(Array.isArray(attendanceData) ? attendanceData : [])
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
      const res = await fetch(`/api/grades?studentId=${studentId}&scheduleId=${schedule.ScheduleID}`)
      if (res.ok) {
        const result = await res.json()
        const gradesData = result.success ? result.data : result
        setGrades(Array.isArray(gradesData) ? gradesData : [])
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

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 75) return 'text-yellow-600'
    return 'text-red-600'
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {schedule.SubjectCode} - {schedule.SubjectTitle}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {schedule.Day}
                </span>
                <div className="text-sm text-gray-600">
                  <div className="font-medium text-gray-900">{schedule.Room}</div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
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
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" />
                  {schedule.InstructorName}
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              <XCircle className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="attendance" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="grading" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Grades
              </TabsTrigger>
              <TabsTrigger value="excuse-letters" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Excuse Letters
                {excuseLetters.filter(letter => letter.Status === 'pending').length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {excuseLetters.filter(letter => letter.Status === 'pending').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Attendance Records
                    </CardTitle>
                    <CardDescription>
                      Your attendance history for {schedule.SubjectCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading attendance records...</p>
                      </div>
                    ) : attendance.length === 0 ? (
                      <div className="text-center py-8">
                        <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No attendance records found</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Attendance records will appear here once classes begin
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {attendance.map((record) => (
                          <div key={record.AttendanceID} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Week</p>
                                <p className="font-semibold">{record.Week}</p>
                              </div>
                              <div>
                                <p className="font-medium">{new Date(record.Date).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-500">{record.Remarks}</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(record.Status)}>
                              {getStatusText(record.Status)}
                            </Badge>
                          </div>
                        ))}
                        
                        {/* Attendance Summary */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold mb-3">Attendance Summary</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">
                                {attendance.filter(r => r.Status === 'P').length}
                              </p>
                              <p className="text-sm text-gray-500">Present</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">
                                {attendance.filter(r => r.Status === 'A').length}
                              </p>
                              <p className="text-sm text-gray-500">Absent</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-blue-600">
                                {attendance.filter(r => r.Status === 'E').length}
                              </p>
                              <p className="text-sm text-gray-500">Excused</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-yellow-600">
                                {attendance.filter(r => r.Status === 'L').length}
                              </p>
                              <p className="text-sm text-gray-500">Late</p>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Grade Report
                    </CardTitle>
                    <CardDescription>
                      Your academic performance in {schedule.SubjectCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {grades.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No grades available yet</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Grades will appear here once they are posted by your instructor
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {grades.map((grade) => (
                          <div key={grade.ScheduleID} className="border rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold text-lg">{grade.SubjectCode} - {grade.SubjectName}</h4>
                                <p className="text-sm text-gray-500">{grade.ClassType}</p>
                              </div>
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                {grade.summary || 'N/A'}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Midterm Grade</p>
                                <p className={`text-3xl font-bold ${getGradeColor(grade.midterm)}`}>
                                  {grade.midterm || 'N/A'}
                                </p>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Final Grade</p>
                                <p className={`text-3xl font-bold ${getGradeColor(grade.final)}`}>
                                  {grade.final || 'N/A'}
                                </p>
                              </div>
                              <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Final Grade</p>
                                <p className={`text-3xl font-bold ${getGradeColor(grade.summary)}`}>
                                  {grade.summary || 'N/A'}
                                </p>
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
            <TabsContent value="excuse-letters" className="mt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Excuse Letters
                        {excuseLetters.filter(letter => letter.Status === 'pending').length > 0 && (
                          <Badge variant="destructive">
                            {excuseLetters.filter(letter => letter.Status === 'pending').length} Pending
                          </Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowSubmitExcuseModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Submit New
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Submit and track excuse letters for {schedule.SubjectCode}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {excuseLetters.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No excuse letters submitted yet</p>
                        <p className="text-sm text-gray-500 mt-2 mb-4">
                          Submit an excuse letter if you need to be absent from class
                        </p>
                        <Button
                          onClick={() => setShowSubmitExcuseModal(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Submit Excuse Letter
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {excuseLetters.map((letter) => (
                          <div key={letter.ExcuseLetterID} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium">{letter.Subject}</h4>
                                <p className="text-sm text-gray-500">
                                  Submitted: {new Date(letter.SubmissionDate).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className={getExcuseLetterStatusColor(letter.Status)}>
                                {letter.Status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-3">
                              <p><strong>Reason:</strong> {letter.Reason}</p>
                              <p><strong>Date Range:</strong> {new Date(letter.DateFrom).toLocaleDateString()} - {new Date(letter.DateTo).toLocaleDateString()}</p>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Dean: {letter.DeanStatus}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Coordinator: {letter.CoordinatorStatus}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  Instructor: {letter.InstructorStatus}
                                </Badge>
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
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
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
