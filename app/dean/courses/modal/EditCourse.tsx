'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../components/ui/select";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface Course {
  CourseID: number;
  CourseCode: string;
  CourseName: string;
  Description?: string;
  TotalUnits: number;
  DurationYears: number;
  Status: 'active' | 'inactive';
}

interface EditCourseDialogProps {
  course: Course;
  onUpdated: () => void;
}

export default function EditCourseDialog({ course, onUpdated }: EditCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Course>({
    ...course,
    TotalUnits: course.TotalUnits || 180,
    DurationYears: course.DurationYears || 4,
    Status: course.Status || 'active'
  });

  useEffect(() => {
    if (open) {
      setFormData({
        ...course,
        TotalUnits: course.TotalUnits || 180,
        DurationYears: course.DurationYears || 4,
        Status: course.Status || 'active'
      });
    }
  }, [open, course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update course');
      }

      toast.success('Course updated successfully');
      setOpen(false);
      onUpdated();
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Degree Program</DialogTitle>
          <DialogDescription>
            Update the details for {course.CourseCode} - {course.CourseName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-CourseCode">Course Code *</Label>
              <Input
                id="edit-CourseCode"
                value={formData.CourseCode}
                onChange={(e) => setFormData({ ...formData, CourseCode: e.target.value.toUpperCase() })}
                placeholder="e.g., BSCS, BSIT"
                required
                maxLength={10}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-CourseName">Course Name *</Label>
              <Input
                id="edit-CourseName"
                value={formData.CourseName}
                onChange={(e) => setFormData({ ...formData, CourseName: e.target.value })}
                placeholder="e.g., Bachelor of Science in Computer Science"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-Description">Description</Label>
              <Textarea
                id="edit-Description"
                value={formData.Description || ''}
                onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                placeholder="Brief description of the course program..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-TotalUnits">Total Units *</Label>
                <Input
                  id="edit-TotalUnits"
                  type="number"
                  min="0"
                  max="300"
                  value={formData.TotalUnits}
                  onChange={(e) => setFormData({ ...formData, TotalUnits: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-DurationYears">Duration (Years) *</Label>
                <Input
                  id="edit-DurationYears"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.DurationYears}
                  onChange={(e) => setFormData({ ...formData, DurationYears: parseInt(e.target.value) || 4 })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-Status">Status</Label>
                <Select
                  value={formData.Status}
                  onValueChange={(value) => setFormData({ ...formData, Status: value as 'active' | 'inactive' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
