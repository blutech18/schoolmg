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
import { ERoles, IStudent } from '@/app/models/IUser'
import { DialogClose } from '@radix-ui/react-dialog'
import { capitalizeString } from '@/helpers/helper'
import { brandedToast } from '@/components/ui/branded-toast'

export default function EditInstructorDialog({ student, onUpdated }: { student: IStudent, onUpdated: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<IStudent>({
    ...student,
    IsPWD: Boolean(student.IsPWD) // Convert any truthy value to boolean
  })
  const [showPassword, setIsShowPassword] = useState(false);

  useEffect(() => {
    setForm({
      ...student,
      IsPWD: Boolean(student.IsPWD) // Convert any truthy value to boolean
    }) 
  }, [student])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'IsPWD' ? (value === 'true') : value
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isSubmitting) return
    
    try {
      setIsSubmitting(true)
      const res = await fetch(`/api/users?id=${student.UserID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to update instructor')
      brandedToast.success(
        'Instructor updated successfully',
        { title: 'Success' }
      )
      setOpen(false)
      onUpdated()
    } catch (error) {
      console.error('Update failed:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Unknown error',
        { title: 'Failed to update instructor' }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Instructor</DialogTitle>
          <DialogDescription>
            Update the instructor information below.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-instructor-form" onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input name="FirstName" placeholder="First Name" value={form.FirstName || ''} onChange={handleChange} required />
            <Input name="LastName" placeholder="Last Name" value={form.LastName || ''} onChange={handleChange} required />
          </div>
          
          <Input name="MiddleName" placeholder="Middle Name" value={form.MiddleName || ''} onChange={handleChange} />
          <Input name="EmailAddress" placeholder="Email Address" type="email" value={form.EmailAddress || ''} onChange={handleChange} required />

          <div className='flex gap-2 items-end'>
            <div className='w-full'>
              <Input name="Password" placeholder="Password" type={showPassword ? "text" : "password"} value={form.Password || ''} onChange={handleChange} />
            </div>
            <Button type="button" onClick={() => setIsShowPassword(!showPassword)}>{!showPassword ? "Show" : "Hide"}</Button>
          </div>

          <select
            name="Sex"
            value={form.Sex || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            name="Status"
            value={form.Status || 'active'}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            name="IsPWD"
            value={form.IsPWD ? 'true' : 'false'}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="false">Not PWD</option>
            <option value="true">PWD</option>
          </select>
        </form>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
           <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          <Button 
            type="submit"
            form="edit-instructor-form"
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
