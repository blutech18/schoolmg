'use client'

'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Pen } from 'lucide-react'
import { toast } from 'sonner'

interface Subject {
  SubjectID: number
  SubjectCode: string
  SubjectName: string
  Units: number
  Prerequisites?: string
  Description?: string
  InstructorID?: number
  InstructorName?: string
  ClassType?: string
}

interface Instructor {
  UserID: number
  Name: string
  FirstName: string
  LastName: string
}

interface EditSubjectDialogProps {
  onUpdated: () => void
  subject: Subject
}

export default function EditSubjectDialog({ onUpdated, subject }: EditSubjectDialogProps) {
  const [form, setForm] = useState({
    SubjectCode: subject.SubjectCode,
    SubjectName: subject.SubjectName,
    Units: subject.Units,
    Prerequisites: subject.Prerequisites || '',
    Description: subject.Description || '',
    InstructorID: subject.InstructorID || null,
    ClassType: subject.ClassType && subject.ClassType !== '' ? subject.ClassType : 'LECTURE',
  })
  const [loading, setLoading] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch instructors on component mount
  useEffect(() => {
    fetchInstructors()
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

  const handleSubmit = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/subjects/${subject.SubjectID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (response.ok) {
        toast.success('Subject updated successfully!')
        setDialogOpen(false)
        onUpdated()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update subject')
      }
    } catch (error) {
      console.error('Error updating subject:', error)
      toast.error('Failed to update subject')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pen className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>Update subject information in the curriculum.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              name="SubjectCode" 
              placeholder="Subject Code" 
              value={form.SubjectCode} 
              onChange={(e) => setForm({ ...form, SubjectCode: e.target.value })} 
              required 
            />
            <Input
              name="Units"
              placeholder="Units"
              type="number"
              min={1}
              max={6}
              value={form.Units}
              onChange={(e) => setForm({ ...form, Units: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <Input 
            name="SubjectName" 
            placeholder="Subject Name" 
            value={form.SubjectName} 
            onChange={(e) => setForm({ ...form, SubjectName: e.target.value })} 
            required 
          />
          
          <Input 
            name="Prerequisites" 
            placeholder="Prerequisites (optional)" 
            value={form.Prerequisites} 
            onChange={(e) => setForm({ ...form, Prerequisites: e.target.value })} 
          />
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class Type</label>
              <Select value={form.ClassType} onValueChange={(value) => setForm({ ...form, ClassType: value })}>
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
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Assigned Instructor (optional)</label>
              <Select value={form.InstructorID !== null ? form.InstructorID.toString() : 'none'} onValueChange={(value) => setForm({ ...form, InstructorID: value === 'none' ? null : parseInt(value) })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No instructor assigned</SelectItem>
                  {instructors.map((instructor) => (
                    <SelectItem key={instructor.UserID} value={instructor.UserID.toString()}>
                    {instructor.Name}
                  </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Textarea 
            name="Description" 
            placeholder="Subject Description (optional)" 
            value={form.Description} 
            onChange={(e) => setForm({ ...form, Description: e.target.value })}
            rows={3}
          />

        </div>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              disabled={loading}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            className="bg-green-900 text-white"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Subject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
