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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pen, User, BookOpen, Calendar, Clock, MapPin, GraduationCap, Save, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Enrollment {
  EnrollmentID: number;
  StudentID: string;
  ScheduleID: number;
  EnrollmentDate: string;
  Status: string;
  StudentName?: string;
  StudentNumber?: string;
  SubjectCode?: string;
  SubjectName?: string;
  Course?: string;
  Section?: string;
  Semester?: string;
  AcademicYear?: string;
}

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

interface EditEnrollmentDialogProps {
  onUpdated: () => void;
  enrollment: Enrollment;
}

export default function EditEnrollmentDialog({ onUpdated, enrollment }: EditEnrollmentDialogProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedStudent, setSelectedStudent] = useState(enrollment.StudentID)
  const [selectedSchedule, setSelectedSchedule] = useState(enrollment.ScheduleID.toString())
  const [enrollmentDate, setEnrollmentDate] = useState(enrollment.EnrollmentDate.split('T')[0])
  const [status, setStatus] = useState(enrollment.Status)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchSchedules()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (!selectedStudent || !selectedSchedule) {
        toast.error('Please select both student and schedule')
        return
      }

      const res = await fetch(`/api/enrollments`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          EnrollmentID: enrollment.EnrollmentID,
          StudentID: selectedStudent,
          ScheduleID: parseInt(selectedSchedule),
          EnrollmentDate: enrollmentDate,
          Status: status
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update enrollment')
      }

      toast.success('Enrollment updated successfully')
      onUpdated()
    } catch (error) {
      console.error('Update enrollment failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update enrollment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-blue-50">
          <Pen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pen className="h-5 w-5 text-blue-600" />
            Edit Enrollment
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Update enrollment details for <span className="font-semibold text-blue-600">{enrollment.StudentName}</span> in <span className="font-semibold text-purple-600">{enrollment.SubjectCode}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Student Selection */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-4 w-4" />
                Student Information
              </CardTitle>
              <CardDescription>Select the student for this enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.UserID} value={student.UserID}>
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
            </CardContent>
          </Card>

          {/* Schedule Selection */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-4 w-4" />
                Class Schedule
              </CardTitle>
              <CardDescription>Select the class schedule for this enrollment</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger className="w-full min-h-[60px] p-3">
                  <SelectValue placeholder="Select schedule">
                    {selectedSchedule && (() => {
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
                              {schedule.ClassType}
                            </Badge>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-w-lg">
                  {schedules.map((schedule) => (
                    <SelectItem key={schedule.ScheduleID} value={schedule.ScheduleID.toString()}>
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
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Enrollment Details */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4" />
                Enrollment Details
              </CardTitle>
              <CardDescription>Set enrollment date and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Enrollment Date
                  </Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Enrollment Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          Enrolled
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="dropped">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          Dropped
                        </div>
                      </SelectItem>
                      <SelectItem value="withdrawn">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          Withdrawn
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="mt-8 pt-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>Updating enrollment for {enrollment.StudentName}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <DialogClose asChild>
              <Button variant="outline" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
              disabled={loading || !selectedStudent || !selectedSchedule}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Update Enrollment
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
