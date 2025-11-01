'use client'
import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    // Only reset form if schedule ID changes (new schedule being edited)
    if (schedule.ScheduleID !== form.ScheduleID) {
      setForm({ ...schedule })
    }
  }, [schedule, form.ScheduleID])

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
    try {
      // Get the selected subject details to extract units
      const selectedSubject = subjects.find(subject => subject.SubjectID === parseInt(form.SubjectID?.toString() || '0'));

      const updatedSchedule = {
        ...form,
        SeatMap: form.SeatMap || JSON.stringify(Array(Number(form.TotalSeats)).fill(0)),
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
              <Input 
                name="YearLevel" 
                value={form.YearLevel ?? ''} 
                onChange={handleChange} 
                type="number" 
                placeholder="Year Level"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
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
                  {subject.ClassType && ` - ${
                    subject.ClassType === 'LECTURE+LAB' ? 'Lecture and Laboratory' :
                    subject.ClassType === 'MAJOR' ? 'Cisco' :
                    subject.ClassType === 'NSTP' ? 'NSTP' :
                    subject.ClassType === 'OJT' ? 'OJT' :
                    'Lecture'}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Day *</label>
              <select
                name="Day"
                value={form.Day ?? ''}
                onChange={handleChange}
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3 py-2"
              >
                <option value="">Select Day</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time *</label>
              <Input 
                name="Time" 
                value={form.Time ?? ''} 
                onChange={handleChange} 
                placeholder="Time (e.g. 08:00 - 10:00)"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lecture Hours</label>
              <input
                name="Lecture"
                value={form.Lecture?.toString() || ''}
                onChange={(e) => setForm(prev => ({ ...prev, Lecture: Number(e.target.value) || 0 }))}
                type="number"
                placeholder="Lecture Hours"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Laboratory Hours</label>
              <input
                name="Laboratory"
                value={form.Laboratory?.toString() || ''}
                onChange={(e) => setForm(prev => ({ ...prev, Laboratory: Number(e.target.value) || 0 }))}
                type="number"
                placeholder="Laboratory Hours"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 px-3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Room</label>
              <Input 
                name="Room" 
                value={form.Room ?? ''} 
                onChange={handleChange} 
                placeholder="Room"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Total Seats</label>
              <Input 
                name="TotalSeats" 
                value={form.TotalSeats ?? ''} 
                onChange={handleChange} 
                type="number" 
                placeholder="Total Seats"
                className="w-full h-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
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
