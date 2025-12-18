'use client'

import React from 'react'
import AttendanceSheet from './AttendanceSheet'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, FlaskConical, Users } from "lucide-react"
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

interface AttendanceSheetWrapperProps {
  schedule: Schedule
  students: Student[]
  excuseLetters: any[]
  lectureAttendance?: {[key: string]: {[sessionNumber: number]: string}}
  labAttendance?: {[key: string]: {[sessionNumber: number]: string}}
  onAttendanceMarked: (studentId: number, status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => void
  onBulkMarking: (status: string, sessionType: 'lecture' | 'lab', sessionNumber: number) => void
  onClassCancellation: (reason: string, notifyStudents: boolean, sessionType: 'lecture' | 'lab', sessionNumber: number, studentId?: number) => void
}

export default function AttendanceSheetWrapper({
  schedule,
  students,
  excuseLetters,
  lectureAttendance,
  labAttendance,
  onAttendanceMarked,
  onBulkMarking,
  onClassCancellation
}: AttendanceSheetWrapperProps) {
  
  // Check if this is a Cisco schedule
  const isCiscoSchedule = (schedule.ClassType || '').toUpperCase() === 'MAJOR' || 
                          (schedule.Room && schedule.Room.toLowerCase().includes('cisco'))
  
  // Determine which components to show based on logic
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

  // If only one component, use the original AttendanceSheet without modifications
  if (!hasBothComponents) {
    return (
      <AttendanceSheet
        schedule={schedule}
        students={students}
        excuseLetters={excuseLetters}
        lectureAttendance={lectureAttendance}
        labAttendance={labAttendance}
        onAttendanceMarked={onAttendanceMarked}
        onBulkMarking={onBulkMarking}
        onClassCancellation={onClassCancellation}
      />
    )
  }

  // If both components exist, show them side-by-side in 2 columns (responsive)
  return (
    <div className="space-y-6">
      {/* Shared Schedule Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Sheet - {schedule.SubjectCode}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <div className="text-sm text-gray-900 font-medium">
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
                Lecture + Laboratory
                {isCiscoSchedule && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Cisco
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Attendance Sheets - 2 Columns Responsive */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Lecture Attendance Sheet */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-green-600">
            <BookOpen className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-green-600">📚 Lecture Attendance</h3>
          </div>
          <AttendanceSheet
            schedule={schedule}
            students={students}
            excuseLetters={excuseLetters}
            lectureAttendance={lectureAttendance}
            labAttendance={labAttendance}
            onAttendanceMarked={onAttendanceMarked}
            onBulkMarking={onBulkMarking}
            onClassCancellation={onClassCancellation}
            fixedSessionType="lecture"
            hideScheduleInfo={true}
          />
        </div>

        {/* Laboratory Attendance Sheet */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-600">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-600">🧪 Laboratory Attendance</h3>
          </div>
          <AttendanceSheet
            schedule={schedule}
            students={students}
            excuseLetters={excuseLetters}
            lectureAttendance={lectureAttendance}
            labAttendance={labAttendance}
            onAttendanceMarked={onAttendanceMarked}
            onBulkMarking={onBulkMarking}
            onClassCancellation={onClassCancellation}
            fixedSessionType="lab"
            hideScheduleInfo={true}
          />
        </div>
      </div>
    </div>
  )
}

