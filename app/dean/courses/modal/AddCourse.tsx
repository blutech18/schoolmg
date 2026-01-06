'use client';

import { useState } from 'react';
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
import { Plus } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface AddCourseDialogProps {
  onAdded: () => void;
}

export default function AddCourseDialog({ onAdded }: AddCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    CourseCode: '',
    CourseName: '',
    Description: '',
    TotalUnits: 180,
    DurationYears: 4,
    Status: 'active' as 'active' | 'inactive'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create course');
      }

      brandedToast.success('Course created successfully');
      setOpen(false);
      setFormData({
        CourseCode: '',
        CourseName: '',
        Description: '',
        TotalUnits: 180,
        DurationYears: 4,
        Status: 'active'
      });
      onAdded();
    } catch (error) {
      console.error('Error creating course:', error);
      brandedToast.error(error instanceof Error ? error.message : 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Degree Program</DialogTitle>
          <DialogDescription>
            Create a new degree program or course offering for the institution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="CourseCode">Course Code *</Label>
              <Input
                id="CourseCode"
                value={formData.CourseCode}
                onChange={(e) => setFormData({ ...formData, CourseCode: e.target.value.toUpperCase() })}
                placeholder="e.g., BSCS, BSIT"
                required
                maxLength={10}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="CourseName">Course Name *</Label>
              <Input
                id="CourseName"
                value={formData.CourseName}
                onChange={(e) => setFormData({ ...formData, CourseName: e.target.value })}
                placeholder="e.g., Bachelor of Science in Computer Science"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="Description">Description</Label>
              <Textarea
                id="Description"
                value={formData.Description}
                onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                placeholder="Brief description of the course program..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="TotalUnits">Total Units *</Label>
                <Input
                  id="TotalUnits"
                  type="number"
                  min="0"
                  max="300"
                  value={formData.TotalUnits}
                  onChange={(e) => setFormData({ ...formData, TotalUnits: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="DurationYears">Duration (Years) *</Label>
                <Input
                  id="DurationYears"
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
                <Label htmlFor="Status">Status</Label>
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
              {loading ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
