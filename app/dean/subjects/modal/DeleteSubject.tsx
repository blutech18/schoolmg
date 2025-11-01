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
} from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Trash } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteSubjectDialogProps {
  onDeleted: () => void;
  subjectId: number;
  subjectName: string;
}

export default function DeleteSubjectDialog({ onDeleted, subjectId, subjectName }: DeleteSubjectDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)

      const res = await fetch(`/api/subjects?id=${subjectId}`, {
        method: 'DELETE',
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete subject')
      }

      toast.success('Subject deleted successfully')
      onDeleted()
    } catch (error) {
      console.error('Delete subject failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete subject')
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
          <DialogTitle>Delete Subject</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the subject "{subjectName}"? This action cannot be undone.
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
            {loading ? 'Deleting...' : 'Delete Subject'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
