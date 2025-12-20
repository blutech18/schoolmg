'use client'
import React from 'react'
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
  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/schedules?id=${scheduleId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete schedule')

      brandedToast.success(
        'Schedule deleted successfully',
        { title: 'Success' }
      )
      onDeleted()
    } catch (error) {
      console.error('Delete failed:', error)
      brandedToast.error(
        error instanceof Error ? error.message : 'Unknown error',
        { title: 'Failed to delete schedule' }
      )
    }
  }

  return (
    <Dialog>
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
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
