'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { brandedToast } from '@/components/ui/branded-toast'

interface Subject {
  SubjectCode: string
  SubjectName: string
  Units: number
  Prerequisites: string
  Description: string
  InstructorID: number | null
  ClassType: string
}

interface Instructor {
  UserID: number
  Name: string
  FirstName: string
  LastName: string
}

interface SubjectOption {
  SubjectID?: number
  SubjectCode: string
  SubjectName: string
}

export default function AddSubjectDialog({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState<Subject>({
    SubjectCode: '',
    SubjectName: '',
    Units: 3,
    Prerequisites: '',
    Description: '',
    InstructorID: null,
    ClassType: 'LECTURE',
  })
  const [loading, setLoading] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchInstructors()
    fetchSubjects()
  }, [])

  const fetchInstructors = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const users = await response.json()
        const instructorUsers = users.filter((user: any) => user.Role === 'instructor')
        const formattedInstructors = instructorUsers.map((user: any) => ({
          UserID: user.UserID,
          Name: `${user.FirstName} ${user.LastName}`,
          FirstName: user.FirstName,
          LastName: user.LastName,
        }))
        setInstructors(formattedInstructors)
      }
    } catch (error) {
      console.error('Failed to fetch instructors:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects')
      if (response.ok) {
        const result = await response.json()
        const data = result.success ? result.data : result
        if (Array.isArray(data)) {
          const options = data.map((s: any) => ({
            SubjectID: s.SubjectID,
            SubjectCode: s.SubjectCode,
            SubjectName: s.SubjectName,
          }))
          setSubjects(options)
        }
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: name === 'Units' ? Number(value) : value,
    }))
  }

  const handleInstructorChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      InstructorID: value === 'none' ? null : Number(value),
    }))
  }

  const handleClassTypeChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      ClassType: value,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        brandedToast.success('Subject added successfully!')
        setForm({
          SubjectCode: '',
          SubjectName: '',
          Units: 3,
          Prerequisites: '',
          Description: '',
          InstructorID: null,
          ClassType: 'LECTURE',
        })
        setDialogOpen(false)
        onAdded()
      } else {
        const error = await response.json()
        brandedToast.error(error.error || 'Failed to add subject')
      }
    } catch (error) {
      brandedToast.error('Failed to add subject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-900 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>Enter subject information to add to the curriculum.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="SubjectCode"
              placeholder="Subject Code"
              value={form.SubjectCode}
              onChange={handleChange}
              required
            />
            <Input
              name="Units"
              placeholder="Units"
              type="number"
              min={1}
              max={6}
              value={form.Units}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            name="SubjectName"
            placeholder="Subject Name"
            value={form.SubjectName}
            onChange={handleChange}
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prerequisite (optional)</label>
            <Select
              value={form.Prerequisites || 'none'}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, Prerequisites: value === 'none' ? '' : value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select prerequisite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subjects
                  .filter((s) => s.SubjectCode !== form.SubjectCode) // avoid self-reference
                  .map((subject) => (
                    <SelectItem key={subject.SubjectCode} value={subject.SubjectCode}>
                      {subject.SubjectCode} - {subject.SubjectName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Class Type</label>
            <Select value={form.ClassType} onValueChange={handleClassTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select class type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LECTURE">Lecture</SelectItem>
                <SelectItem value="LECTURE+LAB">Lecture and Laboratory</SelectItem>
                <SelectItem value="MAJOR">Cisco</SelectItem>
                <SelectItem value="NSTP">NSTP</SelectItem>
                <SelectItem value="OJT">OJT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            name="Description"
            placeholder="Subject Description (optional)"
            value={form.Description}
            onChange={handleChange}
            rows={3}
          />


        </div>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-green-900 text-white"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Subject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
