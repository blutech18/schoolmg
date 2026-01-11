'use client'
import React, { useEffect, useState } from 'react'

// Flexible time options - user can select start and end times
const START_TIME_OPTIONS = [
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM',
];

const END_TIME_OPTIONS = [
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM',
  '11:00 PM',
];

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { brandedToast } from '@/components/ui/branded-toast'

import { IUser } from '@/app/models/IUser'
import { ISchedule } from '@/app/models/ISchedule'

interface ISubject {
  SubjectID: number;
  SubjectCode: string;
  SubjectName: string;
  Units: number;
  LectureHours?: number;
  LaboratoryHours?: number;
  Prerequisites?: string;
  Description?: string;
  ClassType?: string;
}

interface ICourse {
  CourseID: number;
  CourseCode: string;
  CourseName: string;
  Department: string;
}

export default function EditScheduleDialog({
  schedule,
  onUpdated,
}: {
  schedule: ISchedule
  onUpdated: () => void
}) {
  const [instructors, setInstructors] = useState<IUser[]>([])
  const [subjects, setSubjects] = useState<ISubject[]>([])
  const [courses, setCourses] = useState<ICourse[]>([])
  const [form, setForm] = useState<ISchedule>({ ...schedule })

  // Separate fields for lecture and lab with flexible time
  const [lectureDay, setLectureDay] = useState('')
  const [lectureStartTime, setLectureStartTime] = useState('')
  const [lectureEndTime, setLectureEndTime] = useState('')
  const [lectureRoom, setLectureRoom] = useState('')
  const [labDay, setLabDay] = useState('')
  const [labStartTime, setLabStartTime] = useState('')
  const [labEndTime, setLabEndTime] = useState('')
  const [labRoom, setLabRoom] = useState('')

  useEffect(() => {
    // Parse existing schedule data to populate lecture/lab fields
    setForm({ ...schedule })

    // Parse Day field (e.g., "Mon/Tue" or "Monday/Tuesday")
    if (schedule.Day) {
      const dayParts = schedule.Day.split('/');
      if (dayParts.length >= 2) {
        // Expand 3-letter abbreviations
        const expandDay = (abbr: string) => {
          const dayMap: { [key: string]: string } = {
            'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
            'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
          };
          return dayMap[abbr] || abbr;
        };
        setLectureDay(expandDay(dayParts[0].trim()));
        setLabDay(expandDay(dayParts[1].trim()));
      } else {
        setLectureDay(schedule.Day);
        setLabDay('');
      }
    }

    // Parse Time field (e.g., "06:30AM-10:00AM/07:00AM-09:00AM")
    if (schedule.Time) {
      const timeParts = schedule.Time.split('/');
      if (timeParts.length >= 2) {
        // Parse lecture time
        const lectureTimeParts = timeParts[0].split('-');
        if (lectureTimeParts.length === 2) {
          // Add space before AM/PM if missing
          const formatTime = (t: string) => {
            const cleaned = t.trim();
            return cleaned.replace(/(\d)(AM|PM)/i, '$1 $2');
          };
          setLectureStartTime(formatTime(lectureTimeParts[0]));
          setLectureEndTime(formatTime(lectureTimeParts[1]));
        }
        // Parse lab time
        const labTimeParts = timeParts[1].split('-');
        if (labTimeParts.length === 2) {
          const formatTime = (t: string) => {
            const cleaned = t.trim();
            return cleaned.replace(/(\d)(AM|PM)/i, '$1 $2');
          };
          setLabStartTime(formatTime(labTimeParts[0]));
          setLabEndTime(formatTime(labTimeParts[1]));
        }
      } else if (timeParts.length === 1) {
        // Single time range
        const singleTimeParts = schedule.Time.split('-');
        if (singleTimeParts.length === 2) {
          const formatTime = (t: string) => {
            const cleaned = t.trim();
            return cleaned.replace(/(\d)(AM|PM)/i, '$1 $2');
          };
          setLectureStartTime(formatTime(singleTimeParts[0]));
          setLectureEndTime(formatTime(singleTimeParts[1]));
        }
      }
    }

    // Parse Room field (e.g., "R201/CLAB2")
    if (schedule.Room) {
      const roomParts = schedule.Room.split('/');
      if (roomParts.length >= 2) {
        setLectureRoom(roomParts[0].trim());
        setLabRoom(roomParts[1].trim());
      } else {
        setLectureRoom(schedule.Room);
        setLabRoom('');
      }
    }
  }, [schedule])

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch instructors
        const instructorRes = await fetch('/api/users')
        if (!instructorRes.ok) throw new Error('Failed to fetch instructors')
        const instructorData: IUser[] = await instructorRes.json()
        setInstructors(instructorData.filter(u => u.Role === 'instructor'))

        // Fetch subjects
        const subjectRes = await fetch('/api/subjects')
        if (!subjectRes.ok) throw new Error('Failed to fetch subjects')
        const subjectResult = await subjectRes.json()
        const subjectData = subjectResult.success ? subjectResult.data : subjectResult
        setSubjects(Array.isArray(subjectData) ? subjectData : [])

        // Fetch courses
        const coursesRes = await fetch('/api/courses')
        if (!coursesRes.ok) throw new Error('Failed to fetch courses')
        const coursesResult = await coursesRes.json()
        const coursesData = Array.isArray(coursesResult) ? coursesResult : (coursesResult.data || [])
        setCourses(Array.isArray(coursesData) ? coursesData : [])
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    const numericFields = ['InstructorID', 'YearLevel', 'TotalSeats', 'Lecture', 'Laboratory', 'Units', 'SubjectID']
    const newValue = numericFields.includes(name) ? Number(value) : value

    setForm(prev => ({
      ...prev,
      [name]: newValue,
    }))
  }



  const handleSubmit = async () => {
    // Validate required fields
    if (!form.Course || !form.Section || !form.YearLevel) {
      brandedToast.error('Please fill in all required fields (Course, Section, Year Level)', { title: 'Validation Error' });
      return;
    }
    if (!form.InstructorID) {
      brandedToast.error('Please select an instructor', { title: 'Validation Error' });
      return;
    }
    if (!form.SubjectID) {
      brandedToast.error('Please select a subject', { title: 'Validation Error' });
      return;
    }
    if (!form.Semester) {
      brandedToast.error('Please select a semester', { title: 'Validation Error' });
      return;
    }

    try {
      // Build combined day/time/room strings using ultra-compact format
      const combinedDay = [lectureDay ? lectureDay.substring(0, 3) : null, labDay ? labDay.substring(0, 3) : null]
        .filter(Boolean)
        .join('/');

      // Build flexible time strings - keep 12-hour format but remove spaces
      const lectureTimeStr = (lectureStartTime && lectureEndTime)
        ? `${lectureStartTime.replace(/\s/g, '')}-${lectureEndTime.replace(/\s/g, '')}`
        : '';
      const labTimeStr = (labStartTime && labEndTime)
        ? `${labStartTime.replace(/\s/g, '')}-${labEndTime.replace(/\s/g, '')}`
        : '';

      const combinedTime = [lectureTimeStr, labTimeStr]
        .filter(Boolean)
        .join('/');
      const combinedRoom = [lectureRoom, labRoom]
        .filter(Boolean)
        .join('/');

      // Get the selected subject details to extract units
      const selectedSubject = subjects.find(subject => subject.SubjectID === parseInt(form.SubjectID?.toString() || '0'));

      const updatedSchedule = {
        ...form,
        Day: combinedDay || form.Day,
        Time: combinedTime || form.Time,
        Room: combinedRoom || form.Room,
        TotalSeats: 40, // Always set to 40
        SeatMap: form.SeatMap || JSON.stringify(Array(40).fill(0)),
        Lecture: Number(form.Lecture) || 0,
        Laboratory: Number(form.Laboratory) || 0,
        // Include units from subject if a subject is selected
        ...(selectedSubject && {
          Units: selectedSubject.Units || 3,
        })
      }

      const res = await fetch(`/api/schedules?id=${form.ScheduleID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSchedule),
      })

      if (!res.ok) throw new Error('Failed to update schedule')
      brandedToast.success('Schedule updated', { title: 'Success' })
      onUpdated()
    } catch (err) {
      console.error('Error updating schedule:', err)
      brandedToast.error(
        err instanceof Error ? err.message : 'Failed to update schedule',
        { title: 'Error' }
      )
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Edit Schedule</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Update the schedule details below. All changes will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Course *</label>
              <Select
                name="Course"
                value={form.Course ?? ''}
                onValueChange={(value) => setForm(prev => ({ ...prev, Course: value }))}
              >
                <SelectTrigger className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select Course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.CourseID} value={course.CourseCode}>
                      {course.CourseCode} - {course.CourseName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Year Level *</label>
              <Select
                value={form.YearLevel ? String(form.YearLevel) : ''}
                onValueChange={(value) => setForm(prev => ({ ...prev, YearLevel: Number(value) }))}
              >
                <SelectTrigger className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Section *</label>
              <Input
                name="Section"
                value={form.Section ?? ''}
                onChange={handleChange}
                placeholder="Section"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Instructor *</label>
              <select
                name="InstructorID"
                value={form.InstructorID ?? ''}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3 py-2"
              >
                <option value="">Select Instructor</option>
                {instructors.map(instr => (
                  <option key={instr.UserID} value={instr.UserID}>
                    {instr.FirstName} {instr.LastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Subject *</label>
            <select
              name="SubjectID"
              value={form.SubjectID ?? ''}
              onChange={handleChange}
              className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3 py-2"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject.SubjectID} value={subject.SubjectID}>
                  {subject.SubjectCode} - {subject.SubjectName} ({subject.Units} units)
                  {subject.ClassType && ` - ${subject.ClassType === 'LECTURE+LAB' ? 'Lecture and Laboratory' :
                    subject.ClassType === 'MAJOR' ? 'Cisco' :
                      subject.ClassType === 'NSTP' ? 'NSTP' :
                        subject.ClassType === 'OJT' ? 'OJT' :
                          'Lecture'}`}
                </option>
              ))}
            </select>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lecture Hours</label>
              <input
                name="Lecture"
                type="number"
                value={form.Lecture?.toString() || ''}
                onChange={(e) => setForm(prev => ({ ...prev, Lecture: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter lecture hours"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Laboratory Hours</label>
              <input
                name="Laboratory"
                type="number"
                value={form.Laboratory?.toString() || ''}
                onChange={(e) => setForm(prev => ({ ...prev, Laboratory: Number(e.target.value) || 0 }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter laboratory hours"
              />
            </div>
          </div>

          {/* Lecture / Laboratory panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white px-3 py-2 font-semibold">Lecture</div>
              <div className="p-3 space-y-2 bg-white">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Day</label>
                  <Select value={lectureDay} onValueChange={setLectureDay}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Start Time</label>
                  <Select value={lectureStartTime} onValueChange={setLectureStartTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {START_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">End Time</label>
                  <Select value={lectureEndTime} onValueChange={setLectureEndTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {END_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Room</label>
                  <Input value={lectureRoom} onChange={(e) => setLectureRoom(e.target.value)} placeholder="e.g., R201" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white px-3 py-2 font-semibold">Laboratory</div>
              <div className="p-3 space-y-2 bg-white">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Day</label>
                  <Select value={labDay} onValueChange={setLabDay}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Start Time</label>
                  <Select value={labStartTime} onValueChange={setLabStartTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {START_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">End Time</label>
                  <Select value={labEndTime} onValueChange={setLabEndTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {END_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Room</label>
                  <Input value={labRoom} onChange={(e) => setLabRoom(e.target.value)} placeholder="e.g., CLAB2" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Total Seats (Fixed)</label>
              <Input
                value="40"
                readOnly
                className="w-full h-10 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500">Total Seats is automatically set to 40</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Semester *</label>
              <select
                name="Semester"
                value={form.Semester ?? ''}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3 py-2"
              >
                <option value="">Select Semester</option>
                <option value="1st">1st Semester</option>
                <option value="2nd">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Academic Year</label>
              <Input
                name="AcademicYear"
                value={form.AcademicYear ?? ''}
                onChange={handleChange}
                placeholder="Academic Year (e.g., 2023-2024)"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8 flex justify-end space-x-3 border-t pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="px-4 py-2">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 transition-colors"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
