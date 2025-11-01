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
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash } from 'lucide-react'
import { DialogClose } from '@radix-ui/react-dialog'
import { brandedToast } from '@/components/ui/branded-toast'

export default function DeleteStudentDialog({
  studentId,
  studentName,
  onDeleted
}: {
  studentId: number,
  studentName: string,
  onDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/students?id=${studentId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete student')

      // Close the modal first
      setOpen(false)
      
      // Show success message
      brandedToast.success(
        `Student ${studentName} deleted successfully`,
        { title: 'Success' }
      )
      
      // Call the onDeleted callback to refresh the data
      onDeleted()
    } catch (err) {
      console.error('Delete error:', err)
      brandedToast.error(
        err instanceof Error ? err.message : 'Unknown error',
        { title: 'Failed to delete student' }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{studentId}. {studentName}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
           <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
