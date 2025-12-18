'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Minus,
  AlertCircle,
  Printer,
  Users,
  BookOpen,
  FlaskConical,
  Calendar,
  Clock,
  RotateCcw
} from "lucide-react"
import { brandedToast } from "@/components/ui/branded-toast"
import { printDocument, generateAttendancePrintContent } from "../../lib/printUtils"
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils"

interface Schedule {
  ScheduleID: number
  Course: string
  Section: string
  YearLevel: number
  SubjectCode: string
  SubjectTitle: string
  InstructorName?: string
  Day: string
  Time: string
  Room: string
  ClassType?: string
  Lecture?: number
  Laboratory?: number
  Semester?: string
  AcademicYear?: string
}

interface Student {
  StudentID: number
  StudentName: string
  Course: string
  YearLevel: number
  IsDropped?: boolean
}

interface AttendanceSheetProps {
  schedule: Schedule
  students: Student[]
  excuseLetters: any[]
  lectureAttendance?: {[key: string]: {[sessionNumber: number]: string}}
  labAttendance?: {[key: string]: {[sessionNumber: number]: string}}
  onAttendanceMarked: (studentId: number, status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => void
  onBulkMarking: (status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => void
  onClassCancellation: (reason: string, notifyStudents: boolean, sessionType: 'lecture' | 'lab', sessionNumber: number, studentId?: number) => void
  fixedSessionType?: 'lecture' | 'lab' // When provided, locks the sheet to this session type only
  hideScheduleInfo?: boolean // When true, hides the schedule information card (useful for dual view)
}

export default function AttendanceSheet({
  schedule,
  students,
  excuseLetters,
  lectureAttendance: propLectureAttendance,
  labAttendance: propLabAttendance,
  onAttendanceMarked,
  onBulkMarking,
  onClassCancellation,
  fixedSessionType,
  hideScheduleInfo = false
}: AttendanceSheetProps) {
  // Filter out students with LOA, Drop, or UW status
  const filteredStudents = students.filter((student: any) => {
    const status = student.Status?.toLowerCase();
    return status !== 'loa' && status !== 'drop' && status !== 'uw';
  });
  
  const [currentSessionNumber, setCurrentSessionNumber] = useState(1)
  const [currentSessionType, setCurrentSessionType] = useState<'lecture' | 'lab'>('lecture')
  const [lectureAttendance, setLectureAttendance] = useState<{[key: string]: {[sessionNumber: number]: string}}>(propLectureAttendance || {})
  const [labAttendance, setLabAttendance] = useState<{[key: string]: {[sessionNumber: number]: string}}>(propLabAttendance || {})
  
  // Update local state when props change
  useEffect(() => {
    if (propLectureAttendance) {
      setLectureAttendance(propLectureAttendance)
    }
  }, [propLectureAttendance])

  useEffect(() => {
    if (propLabAttendance) {
      setLabAttendance(propLabAttendance)
    }
  }, [propLabAttendance])
  
  // CC Modal states
  const [showCCModal, setShowCCModal] = useState(false)
  const [ccReason, setCCReason] = useState('')
  const [ccStudentId, setCCStudentId] = useState<number | null>(null)
  const [ccSessionType, setCCSessionType] = useState<'lecture' | 'lab'>('lecture')
  const [ccNotifyStudents, setCCNotifyStudents] = useState(false)

  // Check if current session is cancelled
  const isCurrentSessionCancelled = () => {
    const currentAttendanceData = currentSessionType === 'lecture' ? lectureAttendance : labAttendance
    // A session is cancelled only if ALL records for this session are CC
    const sessionValues = Object.values(currentAttendanceData).map(s => s[currentSessionNumber]).filter(Boolean)
    if (sessionValues.length === 0) return false
    return sessionValues.every(status => status === 'CC')
  }

  // Check if this is a Cisco schedule
  const isCiscoSchedule = (schedule.ClassType || '').toUpperCase() === 'MAJOR' || 
                          (schedule.Room && schedule.Room.toLowerCase().includes('cisco'))
  
  // Only Cisco schedules can show both Lecture and Laboratory sessions
  // Non-Cisco schedules should only show ONE session type (prefer lecture if both have hours)
  const hasLectureHours = (schedule.Lecture || 0) > 0
  const hasLabHours = (schedule.Laboratory || 0) > 0
  
  let hasLecture = false
  let hasLaboratory = false
  
  if (isCiscoSchedule) {
    // Cisco schedules: can have both lecture and laboratory sessions
    hasLecture = hasLectureHours
    hasLaboratory = hasLabHours
  } else {
    // Non-Cisco schedules: only ONE session type
    if (hasLectureHours) {
      hasLecture = true
      hasLaboratory = false
    } else if (hasLabHours) {
      hasLecture = false
      hasLaboratory = true
    }
  }
  
  const hasBothComponents = hasLecture && hasLaboratory

  // Detect Cisco rooms
  const isCiscoRoom = schedule.Room && schedule.Room.toLowerCase().includes('cisco')
  const isCiscoLab = isCiscoRoom && schedule.Room.toLowerCase().includes('lab')

  // Get class type display name
  const getClassTypeDisplay = () => {
    if (isCiscoRoom) {
      if (isCiscoLab) return 'Cisco Lab'
      return 'Cisco Lecture'
    }
    
    const classType = schedule.ClassType || 'LECTURE'
    switch (classType.toUpperCase()) {
      case 'LECTURE':
      case 'LECTURE-ONLY':
        return 'Lecture Only'
      case 'LAB':
      case 'LAB-ONLY':
        return 'Laboratory Only'
      case 'LECTURE+LAB':
      case 'LECTURE-LAB':
        return 'Lecture + Laboratory'
      case 'MAJOR':
        return 'Major Subject (Cisco)'
      case 'NSTP':
        return 'NSTP'
      case 'OJT':
        return 'OJT'
      default:
        return 'Lecture'
    }
  }

  // Get available session types for this schedule
  const getAvailableSessionTypes = () => {
    const types: Array<{value: 'lecture' | 'lab', label: string, icon: string}> = []
    
    if (hasLecture) {
      types.push({
        value: 'lecture',
        label: isCiscoRoom && !isCiscoLab ? 'Cisco Lecture' : 'Lecture',
        icon: '📚'
      })
    }
    
    if (hasLaboratory) {
      types.push({
        value: 'lab',
        label: isCiscoRoom && isCiscoLab ? 'Cisco Lab' : 'Laboratory',
        icon: '🧪'
      })
    }
    
    return types
  }

  // Set default session type based on available types or fixedSessionType
  useEffect(() => {
    if (fixedSessionType) {
      setCurrentSessionType(fixedSessionType)
      return
    }
    const availableTypes = getAvailableSessionTypes()
    if (availableTypes.length > 0 && !availableTypes.some(t => t.value === currentSessionType)) {
      setCurrentSessionType(availableTypes[0].value)
    }
  }, [schedule, fixedSessionType])

  const availableSessionTypes = getAvailableSessionTypes()

  // Mark attendance for a specific student
  const markAttendanceForSession = async (studentId: number, status: string) => {
    if (status === 'CC') {
      setCCStudentId(studentId)
      setCCSessionType(currentSessionType)
      setCCReason('')
      setCCNotifyStudents(false)
      setShowCCModal(true)
      return
    }

    try {
      // Update local state immediately for UI responsiveness
      const studentKey = `${studentId}`
      if (currentSessionType === 'lecture') {
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

      // Call parent handler
      onAttendanceMarked(studentId, status, currentSessionType, currentSessionNumber)
    } catch (error) {
      console.error('Error marking attendance:', error)
      brandedToast.error('Failed to mark attendance')
    }
  }

  // Mark all students present for current session
  const markAllPresentForSession = () => {
    onBulkMarking('P', currentSessionType, currentSessionNumber)
    brandedToast.success(`Marked all students as present for ${currentSessionType} session ${currentSessionNumber}`)
  }

  // Cancel class for current session
  const cancelClassForSession = () => {
    setCCStudentId(null)
    setCCSessionType(currentSessionType)
    setCCReason('')
    setCCNotifyStudents(false)
    setShowCCModal(true)
  }

  // Restore class for current session
  const restoreClassForSession = async () => {
    try {
      const res = await fetch('/api/attendance/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.ScheduleID,
          week: currentSessionNumber,
          sessionType: currentSessionType
        })
      })

      if (res.ok) {
        brandedToast.success('Class restored. You can mark attendance again.')
        // Clear CC statuses locally for this session
        if (currentSessionType === 'lecture') {
          setLectureAttendance(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(studentId => {
              if (updated[studentId]?.[currentSessionNumber] === 'CC') {
                const { [currentSessionNumber]: _, ...rest } = updated[studentId]
                updated[studentId] = rest
              }
            })
            return updated
          })
        } else {
          setLabAttendance(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(studentId => {
              if (updated[studentId]?.[currentSessionNumber] === 'CC') {
                const { [currentSessionNumber]: _, ...rest } = updated[studentId]
                updated[studentId] = rest
              }
            })
            return updated
          })
        }
      } else {
        brandedToast.error('Failed to restore class')
      }
    } catch (error) {
      console.error('Error restoring class:', error)
      brandedToast.error('Error restoring class')
    }
  }

  // Handle CC confirmation
  const handleCCConfirmation = () => {
    if (!ccReason.trim()) {
      brandedToast.error('Please provide a reason for class cancellation')
      return
    }

    onClassCancellation(ccReason, ccNotifyStudents, ccSessionType, currentSessionNumber, ccStudentId || undefined)
    setShowCCModal(false)
    setCCReason('')
    setCCStudentId(null)
  }

  // Print attendance sheet
  const printAttendanceSheet = () => {
    try {
      const attendanceDataMap: {[key: string]: {[sessionNumber: number]: string}} = {}
      
      filteredStudents.forEach(student => {
        const studentKey = `${student.StudentID}`
        const currentAttendanceData = currentSessionType === 'lecture' ? lectureAttendance : labAttendance
        const studentAttendance = currentAttendanceData[studentKey] || {}
        const currentStatus = studentAttendance[currentSessionNumber] || 'A'
        
        if (!attendanceDataMap[studentKey]) {
          attendanceDataMap[studentKey] = {}
        }
        attendanceDataMap[studentKey][currentSessionNumber] = currentStatus
      })

      const scheduleWithCiscoInfo = {
        ...schedule,
        isCiscoRoom,
        isCiscoLab
      }

      const printContent = generateAttendancePrintContent(
        scheduleWithCiscoInfo,
        students,
        attendanceDataMap,
        currentSessionType,
        currentSessionNumber
      )

      printDocument(printContent, `Attendance_${schedule.SubjectCode}_${currentSessionType}_Session${currentSessionNumber}`)
    } catch (error) {
      console.error('Error printing attendance sheet:', error)
      brandedToast.error('Failed to print attendance sheet')
    }
  }

  return (
    <div className="space-y-6">
      {/* Schedule Information - conditionally render */}
      {!hideScheduleInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance Sheet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <div className="text-sm text-gray-900">
                  {schedule.SubjectCode} - {schedule.SubjectTitle}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Course & Section</label>
                <div className="text-sm text-gray-900">
                  {schedule.Course} - {schedule.Section}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Schedule</label>
                <div className="text-sm text-gray-900">
                  {formatScheduleEntry(schedule as ScheduleDisplayData)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Class Type</label>
                <div className="text-sm text-gray-900 flex items-center gap-2">
                  {getClassTypeDisplay()}
                  {isCiscoRoom && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Cisco Room
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6">
            {/* Session Type Selector - Only show if multiple types available and not in fixed mode */}
            {!fixedSessionType && availableSessionTypes.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Session Type:</span>
                <div className={`flex items-center gap-1 p-1 rounded-lg ${isCurrentSessionCancelled() ? 'bg-gray-100 opacity-50' : 'bg-gray-100'}`}>
                  {availableSessionTypes.map((type) => (
                    <Button
                      key={type.value}
                      size="sm"
                      variant={currentSessionType === type.value ? 'default' : 'ghost'}
                      onClick={() => !isCurrentSessionCancelled() && setCurrentSessionType(type.value)}
                      className={`h-8 ${isCurrentSessionCancelled() ? 'cursor-not-allowed' : ''}`}
                      disabled={isCurrentSessionCancelled()}
                    >
                      {type.icon} {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Week Number Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Week:</span>
              <Select 
                value={currentSessionNumber.toString()} 
                onValueChange={(value) => setCurrentSessionNumber(parseInt(value))}
                disabled={isCurrentSessionCancelled()}
              >
                <SelectTrigger className={`w-20 ${isCurrentSessionCancelled() ? 'bg-gray-100 text-gray-500' : ''}`}>
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isCurrentSessionCancelled() && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Cancelled
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllPresentForSession}
                className="flex items-center gap-2"
                disabled={isCurrentSessionCancelled()}
              >
                <Plus className="h-4 w-4" />
                Mark All Present
              </Button>
              {!isCurrentSessionCancelled() ? (
              <Button
                variant="outline"
                size="sm"
                onClick={cancelClassForSession}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <AlertCircle className="h-4 w-4" />
                Cancel Class
              </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restoreClassForSession}
                  className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore Class
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={printAttendanceSheet}
                className="flex items-center gap-2 print-hide"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {availableSessionTypes.find(t => t.value === currentSessionType)?.icon} {availableSessionTypes.find(t => t.value === currentSessionType)?.label} Session {currentSessionNumber} Attendance
            {isCurrentSessionCancelled() && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm ml-2">
                <AlertCircle className="h-4 w-4" />
                Class Cancelled
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {isCurrentSessionCancelled() && (
              <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">This session has been cancelled.</span>
                  <span>All students are marked as CC (Class Cancelled) and attendance cannot be modified.</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={restoreClassForSession}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-r">
                      Student Name
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 border-r">
                      Course & Year
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-medium text-gray-700 border-r">
                      Current Status
                    </th>
                    <th className="px-3 py-3 text-center text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No students enrolled in this schedule.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const currentAttendanceData = currentSessionType === 'lecture' ? lectureAttendance : labAttendance
                      const studentAttendance = currentAttendanceData[`${student.StudentID}`] || {}
                      
                      // Check if student has D or FA status in ANY session (lecture or lab)
                      const allLectureAttendance = lectureAttendance[`${student.StudentID}`] || {}
                      const allLabAttendance = labAttendance[`${student.StudentID}`] || {}
                      
                      // Check for D or FA status across all sessions
                      const hasDroppedStatus = Object.values(allLectureAttendance).includes('D') || 
                                             Object.values(allLabAttendance).includes('D')
                      const hasFailedStatus = Object.values(allLectureAttendance).includes('FA') || 
                                            Object.values(allLabAttendance).includes('FA')
                      
                      // If student has D or FA status, show that status for ALL sessions
                      let currentStatus
                      if (hasDroppedStatus) {
                        currentStatus = 'D'
                      } else if (hasFailedStatus) {
                        currentStatus = 'FA'
                      } else {
                        // Get the current session status for the specific session number
                        currentStatus = studentAttendance[currentSessionNumber] || 'A' // Default to Absent
                      }
                      
                      // Check if student is disabled (has D or FA status)
                      const isStudentDisabled = hasDroppedStatus || hasFailedStatus

                      return (
                        <tr key={student.StudentID} className={`hover:bg-gray-50 ${isStudentDisabled ? 'bg-gray-100 opacity-60' : ''}`}>
                          <td className="px-4 py-3 border-r">
                            <div>
                              <div className={`font-medium ${isStudentDisabled ? 'text-gray-500' : 'text-gray-900'}`}>
                                {student.StudentName}
                                {isStudentDisabled && (
                                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                                    {student.IsDropped ? 'DROPPED' : 'FAILED'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center border-r">
                            <div className="text-sm text-gray-600">
                              {student.Course} • Year {student.YearLevel}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center border-r">
                            <div className="flex justify-center">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                currentStatus === 'P' ? 'bg-green-100 text-green-800' :
                                currentStatus === 'A' ? 'bg-red-100 text-red-800' :
                                currentStatus === 'E' ? 'bg-blue-100 text-blue-800' :
                                currentStatus === 'L' ? 'bg-yellow-100 text-yellow-800' :
                                currentStatus === 'D' ? 'bg-orange-100 text-orange-800' :
                                currentStatus === 'FA' ? 'bg-red-200 text-red-900' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {currentStatus === 'P' ? 'Present' :
                                 currentStatus === 'A' ? 'Absent' :
                                 currentStatus === 'E' ? 'Excused' :
                                 currentStatus === 'L' ? 'Late' :
                                 currentStatus === 'D' ? 'Dropped' :
                                 currentStatus === 'FA' ? 'Failed' : 'Not Marked'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            {isStudentDisabled ? (
                              <div className="text-xs text-gray-500">
                                {hasDroppedStatus ? 'Dropped (All Sessions)' : hasFailedStatus ? 'Failed (All Sessions)' : 'Disabled'}
                              </div>
                            ) : (
                              <div className="flex justify-center gap-1">
                                {['P', 'A', 'L', 'E', 'CC'].map((status) => {
                                  // Check if student has approved excuse letters for Excused status
                                  const hasApprovedExcuseLetters = status === 'E' && excuseLetters.some(letter => 
                                    letter.StudentID === student.StudentID && 
                                    letter.ScheduleID === schedule.ScheduleID &&
                                    letter.InstructorStatus === 'approved'
                                  )

                                  return (
                                    <Button
                                      key={status}
                                      size="sm"
                                      variant={currentStatus === status ? "default" : "outline"}
                                      className={`w-8 h-8 p-0 text-xs relative ${
                                        status === 'P' ? (currentStatus === status ? 'bg-green-600 hover:bg-green-700 text-white' : 'hover:bg-green-100 hover:text-green-700') :
                                        status === 'A' ? (currentStatus === status ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-red-100 hover:text-red-700') :
                                        status === 'E' ? (currentStatus === status ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'hover:bg-blue-100 hover:text-blue-700') :
                                        status === 'CC' ? (currentStatus === status ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'hover:bg-gray-100 hover:text-gray-700') :
                                        (currentStatus === status ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'hover:bg-yellow-100 hover:text-yellow-700')
                                      } ${isCurrentSessionCancelled() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => !isCurrentSessionCancelled() && markAttendanceForSession(student.StudentID, status)}
                                      disabled={isCurrentSessionCancelled()}
                                      title={isCurrentSessionCancelled() ? 'Session cancelled - attendance cannot be modified' : `Mark as ${
                                        status === 'P' ? 'Present' :
                                        status === 'A' ? 'Absent' :
                                        status === 'L' ? 'Late' :
                                        status === 'E' ? 'Excused' :
                                        status === 'CC' ? 'Class Cancelled' :
                                        'Unknown'
                                      } for ${currentSessionType} session`}
                                    >
                                      {status}
                                      {hasApprovedExcuseLetters && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white" 
                                             title="Has approved excuse letter" />
                                      )}
                                    </Button>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between">
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
                <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                <span>Late (L)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span>Excused (E)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <span>Class Cancelled (CC)</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Total Students: {filteredStudents.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CC Modal */}
      <Dialog open={showCCModal} onOpenChange={setShowCCModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Class Cancellation</DialogTitle>
            <DialogDescription>
              Provide a reason for cancelling the {currentSessionType} session {currentSessionNumber}.
              {ccStudentId && " This will only affect the selected student."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ccReason">Reason for Cancellation</Label>
              <Textarea
                id="ccReason"
                placeholder="Enter reason for class cancellation..."
                value={ccReason}
                onChange={(e) => setCCReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ccNotifyStudents"
                checked={ccNotifyStudents}
                onCheckedChange={(checked) => setCCNotifyStudents(checked === true)}
              />
              <Label htmlFor="ccNotifyStudents">
                Notify enrolled students about the cancellation
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCCModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCCConfirmation} className="bg-red-600 hover:bg-red-700">
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
