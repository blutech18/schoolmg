'use client'
import React, { useState } from 'react'
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
import { Trash } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteEnrollmentDialogProps {
  onDeleted: () => void;
  enrollmentId: number;
  studentName: string;
  subjectCode: string;
}

export default function DeleteEnrollmentDialog({ onDeleted, enrollmentId, studentName, subjectCode }: DeleteEnrollmentDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)

      const res = await fetch(`/api/enrollments?id=${enrollmentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete enrollment')
      }

      toast.success('Enrollment deleted successfully')
      onDeleted()
    } catch (error) {
      console.error('Delete enrollment failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete enrollment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Enrollment</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the enrollment for "{studentName}" in "{subjectCode}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleDelete} 
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Enrollment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
