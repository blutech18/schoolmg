'use client'
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Calendar, UserCheck, GraduationCap, Clock, MapPin, User } from 'lucide-react'
import { brandedToast } from '@/components/ui/branded-toast'

interface Student {
  UserID: string;
  FirstName: string;
  LastName: string;
  StudentNumber: string;
}

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectName: string;
  SubjectTitle: string;
  Course: string;
  Section: string;
  Semester: string;
  AcademicYear: string;
  InstructorName: string;
  Day: string;
  Time: string;
  Room: string;
  Units: number;
  ClassType: string;
}

export default function AddEnrollmentDialog({ onAdded }: { onAdded: () => void }) {
  const [students, setStudents] = useState<Student[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState('')
  const [enrollmentMode, setEnrollmentMode] = useState<'single' | 'bulk'>('single')
  const [loading, setLoading] = useState(false)
  const [existingEnrollments, setExistingEnrollments] = useState<string[]>([])

  useEffect(() => {
    fetchStudents()
    fetchSchedules()
  }, [])

  // Check for existing enrollments when students or schedule changes
  useEffect(() => {
    if (selectedStudents.length > 0 && selectedSchedule !== '') {
      checkExistingEnrollments()
    } else {
      setExistingEnrollments([])
    }
  }, [selectedStudents, selectedSchedule])

  const checkExistingEnrollments = async () => {
    if (selectedStudents.length === 0 || selectedSchedule === '') return

    try {
      console.log('Checking existing enrollments for students:', selectedStudents, 'schedule:', selectedSchedule)
      
      const existingEnrollmentsData = await Promise.all(
        selectedStudents.map(async (studentId) => {
          try {
            const res = await fetch(`/api/enrollments?studentId=${studentId}&scheduleId=${selectedSchedule}`, {
              credentials: 'include'
            })
            
            if (!res.ok) {
              console.error(`Failed to check enrollment for student ${studentId}:`, res.status, res.statusText)
              return null
            }
            
            const result = await res.json()
            console.log(`Enrollment check result for student ${studentId}:`, result)
            
            return result.success && result.data.length > 0 ? studentId : null
          } catch (error) {
            console.error(`Error checking enrollment for student ${studentId}:`, error)
            return null
          }
        })
      )

      const existing = existingEnrollmentsData.filter(id => id !== null) as string[]
      console.log('Existing enrollments found:', existing)
      setExistingEnrollments(existing)
    } catch (error) {
      console.error('Error checking existing enrollments:', error)
      setExistingEnrollments([])
    }
  }

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students', {
        credentials: 'include'
      })
      const result = await res.json()
      
      if (result.success && Array.isArray(result.data)) {
        setStudents(result.data)
      } else if (Array.isArray(result)) {
        setStudents(result)
      } else {
        console.error('Unexpected students response format:', result)
        setStudents([])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      brandedToast.error('Failed to load students', { title: 'Error' })
      setStudents([])
    }
  }

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules', {
        credentials: 'include'
      })
      const result = await res.json()
      
      console.log('Schedules API response:', result)
      
      if (result.success && Array.isArray(result.data)) {
        // Filter out invalid schedules (ScheduleID should be a valid number)
        const validSchedules = result.data.filter((schedule: any) => 
          schedule.ScheduleID !== null && 
          schedule.ScheduleID !== undefined && 
          !isNaN(schedule.ScheduleID) &&
          schedule.ScheduleID >= 0
        )
        if (validSchedules.length !== result.data.length) {
          console.warn('Filtered out invalid schedules with null/undefined/invalid ScheduleID')
        }
        console.log('Valid schedules loaded:', validSchedules.length)
        console.log('Valid schedules:', validSchedules.map((s: any) => ({ id: s.ScheduleID, name: s.SubjectCode })))
        setSchedules(validSchedules)
      } else if (Array.isArray(result)) {
        // Filter out invalid schedules
        const validSchedules = result.filter(schedule => 
          schedule.ScheduleID !== null && 
          schedule.ScheduleID !== undefined && 
          !isNaN(schedule.ScheduleID) &&
          schedule.ScheduleID >= 0
        )
        setSchedules(validSchedules)
      } else {
        console.error('Unexpected schedules response format:', result)
        setSchedules([])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      brandedToast.error('Failed to load schedules', { title: 'Error' })
      setSchedules([])
    }
  }

  const handleSubmit = async () => {
    try {
      console.log('=== ENROLLMENT SUBMISSION STARTED ===')
      console.log('Enrollment mode:', enrollmentMode)
      console.log('Selected students:', selectedStudents)
      console.log('Selected schedule:', selectedSchedule)
      console.log('Existing enrollments:', existingEnrollments)
      
      setLoading(true)

      if (enrollmentMode === 'single') {
        if (selectedStudents.length === 0 || selectedSchedule === '') {
          brandedToast.error('Please select both student and schedule', { title: 'Validation Error' })
          return
        }

        // Validate schedule ID
        const scheduleId = parseInt(selectedSchedule)
        if (isNaN(scheduleId) || scheduleId < 0) {
          brandedToast.error('Invalid schedule selected. Please select a valid schedule.', { title: 'Validation Error' })
          return
        }

        const enrollmentData = {
          StudentID: selectedStudents[0],
          ScheduleID: scheduleId,
          Status: 'enrolled'
        }
        
        console.log('Single enrollment payload:', enrollmentData)
        
        const res = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(enrollmentData),
        })

        console.log('Single enrollment response status:', res.status)
        const result = await res.json()
        console.log('Single enrollment response:', JSON.stringify(result, null, 2))

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to enroll students. Please log in and try again.')
          }
          throw new Error(result.error || 'Failed to create enrollment')
        }

        // Check for specific enrollment errors
        if (result.failureCount > 0 && result.errors) {
          result.errors.forEach((error: string) => {
            brandedToast.error(error, { title: 'Enrollment Error' })
          })
          return
        }

        brandedToast.success('Enrollment added successfully', { title: 'Success', duration: 5000 })
      } else {
        // Bulk enrollment
        if (selectedStudents.length === 0 || selectedSchedule === '') {
          brandedToast.error('Please select students and schedule for bulk enrollment', { title: 'Validation Error' })
          return
        }

        // Validate schedule ID
        const scheduleId = parseInt(selectedSchedule)
        if (isNaN(scheduleId) || scheduleId < 0) {
          brandedToast.error('Invalid schedule selected. Please select a valid schedule.', { title: 'Validation Error' })
          return
        }

        // Filter out already enrolled students
        const studentsToEnroll = selectedStudents.filter(studentId => !existingEnrollments.includes(studentId))
        
        if (studentsToEnroll.length === 0) {
          brandedToast.warning('All selected students are already enrolled in this schedule', { title: 'Warning' })
          return
        }

        // Create bulk enrollment payload only for students not already enrolled
        const bulkEnrollments = studentsToEnroll.map(studentId => ({
          StudentID: studentId,
          ScheduleID: scheduleId,
          Status: 'enrolled'
        }))

        console.log('Bulk enrollment payload:', bulkEnrollments)
        console.log('Students to enroll:', studentsToEnroll.length)

        const res = await fetch('/api/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bulkEnrollments),
        })

        console.log('Bulk enrollment response status:', res.status)
        const result = await res.json()
        console.log('Bulk enrollment response:', JSON.stringify(result, null, 2))

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You must be logged in to enroll students. Please log in and try again.')
          }
          throw new Error(result.error || 'Failed to create bulk enrollments')
        }

        // Handle bulk enrollment results with detailed error messages
        if (result.failureCount > 0) {
          // Show summary first
          if (result.successCount > 0) {
            brandedToast.success(`${result.successCount} enrollment${result.successCount !== 1 ? 's' : ''} added successfully`, { title: 'Success', duration: 5000 })
          }
          
          // Show detailed error messages for each failed enrollment
          if (result.errors && result.errors.length > 0) {
            result.errors.forEach((error: string) => {
              brandedToast.error(error, { title: 'Enrollment Error' })
            })
          }
          
          // Show final summary
          brandedToast.warning(`${result.failureCount} enrollment${result.failureCount !== 1 ? 's' : ''} failed`, { title: 'Partial Success' })
        } else {
          brandedToast.success(`${result.successCount} enrollment${result.successCount !== 1 ? 's' : ''} added successfully`, { title: 'Success', duration: 5000 })
        }

        // Show message about skipped enrollments if any
        if (existingEnrollments.length > 0) {
          brandedToast.info(`${existingEnrollments.length} student${existingEnrollments.length !== 1 ? 's' : ''} were already enrolled and skipped`, { title: 'Info' })
        }
      }

      onAdded()

      // Reset form
      setSelectedStudents([])
      setSelectedSchedule('')
    } catch (error) {
      console.error('=== ENROLLMENT SUBMISSION ERROR ===')
      console.error('Error details:', error)
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
      brandedToast.error(error instanceof Error ? error.message : 'Failed to create enrollment', { title: 'Error' })
    } finally {
      setLoading(false)
      console.log('=== ENROLLMENT SUBMISSION COMPLETED ===')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-green-900 hover:bg-green-800">
          <UserCheck className="h-4 w-4 mr-2" />
          Add Enrollment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-5 w-5 text-green-900" />
            Add New Enrollment
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Enroll students in class schedules with flexible single or bulk enrollment options.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Enrollment Mode Selection */}
          <Card className="border-l-4 border-l-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-4 w-4" />
                Enrollment Mode
              </CardTitle>
              <CardDescription>Choose between single student or bulk enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={enrollmentMode} onValueChange={(value: 'single' | 'bulk') => setEnrollmentMode(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Single Student Enrollment
                    </div>
                  </SelectItem>
                  <SelectItem value="bulk">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Bulk Student Enrollment
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                {enrollmentMode === 'bulk' ? 'Select Students (Multiple)' : 'Select Student'}
              </CardTitle>
              <CardDescription>
                {enrollmentMode === 'bulk'
                  ? 'Choose multiple students to enroll in the selected schedule'
                  : 'Choose a student to enroll in the selected schedule'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrollmentMode === 'single' ? (
                <Select
                  value={selectedStudents[0] || ''}
                  onValueChange={(value) => setSelectedStudents([value])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student, index) => (
                      <SelectItem key={`student-${student.UserID}-${index}`} value={student.UserID}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{student.FirstName} {student.LastName}</span>
                          <Badge variant="outline" className="ml-auto">
                            {student.StudentNumber}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Available Students: {students.length}</span>
                    <span>Selected: {selectedStudents.length}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allStudentIds = students.map(student => student.UserID);
                        setSelectedStudents(allStudentIds);
                      }}
                      className="text-xs h-8 px-3 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStudents([])}
                      className="text-xs h-8 px-3 bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Deselect All
                    </Button>
                    <div className="text-xs text-gray-500 ml-auto">
                      {selectedStudents.length === students.length && students.length > 0 ? (
                        <span className="text-green-600 font-medium">All students selected</span>
                      ) : selectedStudents.length > 0 ? (
                        <span className="text-blue-600 font-medium">{selectedStudents.length} of {students.length} selected</span>
                      ) : (
                        <span>No students selected</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3 bg-gray-50">
                    {students.map((student, index) => {
                      const isAlreadyEnrolled = existingEnrollments.includes(student.UserID);
                      return (
                        <label key={`bulk-student-${student.UserID}-${index}`} className={`flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors ${
                          isAlreadyEnrolled ? 'bg-yellow-50 border border-yellow-200' : ''
                        }`}>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.UserID)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.UserID])
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.UserID))
                              }
                            }}
                            className="rounded text-green-900 focus:ring-green-900"
                          />
                          <div className="flex items-center gap-2 flex-1">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className={`text-sm font-medium ${
                              isAlreadyEnrolled ? 'text-yellow-700' : ''
                            }`}>
                              {student.FirstName} {student.LastName}
                            </span>
                            <Badge variant="outline" className="ml-auto">
                              {student.StudentNumber}
                            </Badge>
                            {isAlreadyEnrolled && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                                Already Enrolled
                              </Badge>
                            )}
                          </div>
                        </label>
                      );
                    })}
                    {students.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">No students available</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Selection */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-4 w-4" />
                Select Schedule
              </CardTitle>
              <CardDescription>Choose the class schedule for enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger className="w-full min-h-[60px] p-3">
                  <SelectValue placeholder="Choose a schedule">
                    {selectedSchedule !== '' && (() => {
                      const schedule = schedules.find(s => s.ScheduleID.toString() === selectedSchedule);
                      return schedule ? (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <div className="flex flex-col items-start">
                              <span className="font-semibold text-sm">
                                {schedule.SubjectCode} - {schedule.SubjectTitle || schedule.SubjectName}
                              </span>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span>{schedule.Course} {schedule.Section}</span>
                                <span>•</span>
                                <span>{schedule.Day} {schedule.Time}</span>
                                <span>•</span>
                                <span>{schedule.Room}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {schedule.Units} units
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {schedule.ClassType === 'MAJOR' ? 'Cisco' : schedule.ClassType}
                            </Badge>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-lg">
                  {schedules.map((schedule, index) => (
                    <SelectItem key={`schedule-${schedule.ScheduleID}-${index}`} value={schedule.ScheduleID.toString()}>
                      <div className="flex items-center justify-between w-full py-1">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {schedule.SubjectCode} - {schedule.SubjectTitle || schedule.SubjectName}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                              <span>{schedule.Course} {schedule.Section}</span>
                              <span>•</span>
                              <span>{schedule.Day} {schedule.Time}</span>
                              <span>•</span>
                              <span>{schedule.Room}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Badge variant="secondary" className="text-xs">
                            {schedule.Units}u
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {schedule.ClassType === 'MAJOR' ? 'Cisco' : schedule.ClassType}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Existing Enrollments Warning */}
          {existingEnrollments.length > 0 && (
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-yellow-800">
                  <UserCheck className="h-4 w-4" />
                  Already Enrolled Students
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  The following students are already enrolled in this schedule and will be skipped:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {existingEnrollments.map((studentId, index) => {
                    const student = students.find(s => s.UserID === studentId);
                    return student ? (
                      <div key={`existing-${studentId}-${index}`} className="flex items-center gap-2 p-2 bg-yellow-100 rounded-md">
                        <User className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {student.FirstName} {student.LastName}
                        </span>
                        <Badge variant="outline" className="ml-auto text-yellow-700 border-yellow-400">
                          {student.StudentNumber}
                        </Badge>
                      </div>
                    ) : null;
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-8 pt-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {enrollmentMode === 'bulk' && selectedStudents.length > 0 && (
              <span>Ready to enroll {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}</span>
            )}
            {existingEnrollments.length > 0 && (
              <div className="text-yellow-600 font-medium">
                ⚠️ {existingEnrollments.length} student{existingEnrollments.length !== 1 ? 's' : ''} already enrolled
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              className={`min-w-[140px] ${
                existingEnrollments.length > 0 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-green-900 hover:bg-green-800 text-white'
              }`}
              disabled={loading || (enrollmentMode === 'single' ? selectedStudents.length === 0 || selectedSchedule === '' : selectedStudents.length === 0 || selectedSchedule === '')}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {existingEnrollments.length > 0 
                    ? `Enroll (${selectedStudents.length - existingEnrollments.length} new)`
                    : enrollmentMode === 'bulk' 
                      ? 'Enroll Students' 
                      : 'Add Enrollment'
                  }
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
