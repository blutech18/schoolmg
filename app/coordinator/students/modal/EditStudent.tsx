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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ERoles, IStudent, IStudentOnly } from '@/app/models/IUser'
import { DialogClose } from '@radix-ui/react-dialog'
import { capitalizeString } from '@/helpers/helper'
import { Label } from '@/components/ui/label'
import { brandedToast } from '@/components/ui/branded-toast'

export default function EditStudentDialog({ student, onUpdated }: { student: any, onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courses, setCourses] = useState<any[]>([])
  const [form, setForm] = useState<any>({
    ...student,
    IsPWD: Boolean(student.IsPWD) // Convert any truthy value to boolean
  })

  useEffect(() => {
    setForm({
      ...student,
      IsPWD: Boolean(student.IsPWD) // Convert any truthy value to boolean
    }) // Rehydrate form if student changes
  }, [student])

  // Fetch courses from API
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses')
        if (!res.ok) throw new Error('Failed to fetch courses')
        const data = await res.json()
        setCourses(Array.isArray(data) ? data : (data.data || []))
      } catch (error) {
        console.error('Error fetching courses:', error)
        setCourses([])
      }
    }
    fetchCourses()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev: any) => ({
      ...prev,
      [name]: name === 'YearLevel' ? Number(value) :
        name === 'IsPWD' ? (value === 'true') : value
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault() // Prevent form default submission
    if (isSubmitting) return // Prevent double submission

    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/students?id=${student.StudentID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to update student')
      brandedToast.success(
        'Student updated successfully',
        { title: 'Success' }
      )
      setOpen(false) // Close modal after successful update
      onUpdated()
    } catch (error) {
      console.error('Update failed:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Unknown error',
        { title: 'Failed to update student' }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Update the student information below.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-student-form" onSubmit={handleSubmit} className="space-y-4 mt-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input name="FirstName" placeholder="First Name" value={form.FirstName || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input name="LastName" placeholder="Last Name" value={form.LastName || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Middle Name</Label>
            <Input name="MiddleName" placeholder="Middle Name" value={form.MiddleName || ''} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Student Number</Label>
            <div className="px-3 py-2 bg-gray-100 border rounded text-gray-700 font-medium">
              {form.StudentNumber}
            </div>
            <p className="text-xs text-gray-500">Student number is automatically generated and cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input name="EmailAddress" placeholder="Email Address" type="email" value={form.EmailAddress || ''} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Contact Number</Label>
            <Input name="ContactNumber" placeholder="Contact Number" value={form.ContactNumber || ''} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sex</Label>
              <select name="Sex" value={form.Sex || ''} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="">Select Sex</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select name="Status" value={form.Status || 'active'} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>PWD Status</Label>
            <select name="IsPWD" value={form.IsPWD ? 'true' : 'false'} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="false">Not PWD</option>
              <option value="true">PWD</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <select name="Course" value={form.Course || ''} onChange={handleChange} className="w-full border rounded px-3 py-2">
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.CourseID} value={course.CourseCode}>
                    {course.CourseName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Year Level</Label>
              <Input
                name="YearLevel"
                placeholder="Year Level"
                type="number"
                min={1}
                max={4}
                value={form.YearLevel || 1}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Input name="Section" placeholder="Section" value={form.Section || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Date of Enrollment</Label>
              <Input
                name="DateOfEnrollment"
                type="date"
                value={form.DateOfEnrollment ? form.DateOfEnrollment.split('T')[0] : ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Input name="Address" placeholder="Address" value={form.Address || ''} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Guardian Name</Label>
              <Input name="GuardianName" placeholder="Guardian Name" value={form.GuardianName || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Guardian Contact</Label>
              <Input name="GuardianContact" placeholder="Guardian Contact" value={form.GuardianContact || ''} onChange={handleChange} />
            </div>
          </div>
        </form>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            form="edit-student-form"
            className="bg-green-900 text-white"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
