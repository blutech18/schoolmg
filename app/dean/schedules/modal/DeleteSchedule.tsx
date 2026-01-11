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
import { brandedToast } from '@/components/ui/branded-toast'

export default function DeleteScheduleDialog({
  scheduleId,
  onDeleted,
}: {
  scheduleId: number
  onDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/schedules?id=${scheduleId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete schedule' }))
        throw new Error(errorData.error || 'Failed to delete schedule')
      }

      // Close the modal first
      setOpen(false)
      
      // Show success message after a brief delay to ensure dialog closes
      setTimeout(() => {
        brandedToast.success(
          'Schedule deleted successfully',
          { title: '✅ Success', duration: 4000 }
        )
      }, 100)
      
      // Call the onDeleted callback to refresh the data
      onDeleted()
    } catch (error) {
      console.error('Delete failed:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { title: '❌ Failed to delete schedule' }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={'secondary'}>Delete</Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this schedule? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
