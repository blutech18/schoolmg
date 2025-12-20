'use client'
import { IUser } from '@/app/models/IUser'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { brandedToast } from '@/components/ui/branded-toast'

import React, { useEffect, useState } from 'react'

// Flexible time options - user can select start and end times
const START_TIME_OPTIONS = [
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM',
];

const END_TIME_OPTIONS = [
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM', '10:30 PM',
  '11:00 PM',
];

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ISubject {
  SubjectID: number;
  SubjectCode: string;
  SubjectName: string;
  Units: number;
  LectureHours?: number;
  LaboratoryHours?: number;
  Prerequisites?: string;
  Description?: string;
  ClassType?: string;
}

interface ICourse {
  CourseID: number;
  CourseCode: string;
  CourseName: string;
  Department: string;
}

export default function AddScheduleDialog({ onAdd } : {onAdd: () => void}) {
  const [open, setOpen] = useState(false)
  const [instructors, setInstructors] = useState<IUser[]>([]);
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [form, setForm] = useState({
    Course: '',
    InstructorID: '',
    Section: '',
    YearLevel: '',
    Day: '',
    Time: '',
    Room: '',
    TotalSeats: '40',
    SeatMap: '',
    Lecture: '',
    Laboratory: '',
    SubjectID: '',
    Semester: '',
    AcademicYear: '',
  })
  // Separate fields for lecture and lab with flexible time
  const [lectureDay, setLectureDay] = useState('')
  const [lectureStartTime, setLectureStartTime] = useState('')
  const [lectureEndTime, setLectureEndTime] = useState('')
  const [lectureRoom, setLectureRoom] = useState('')
  const [labDay, setLabDay] = useState('')
  const [labStartTime, setLabStartTime] = useState('')
  const [labEndTime, setLabEndTime] = useState('')
  const [labRoom, setLabRoom] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch instructors
        const instructorResponse = await fetch('/api/users');
        if (!instructorResponse.ok) {
          throw new Error(`Network response was not ok: ${instructorResponse.status}`);
        }
        const instructorData = await instructorResponse.json();
        setInstructors(instructorData);
        
        // Fetch subjects
        const subjectResponse = await fetch('/api/subjects');
        if (!subjectResponse.ok) {
          throw new Error(`Subjects API response was not ok: ${subjectResponse.status}`);
        }
        const subjectResult = await subjectResponse.json();
        const subjectData = subjectResult.success ? subjectResult.data : subjectResult;
        setSubjects(Array.isArray(subjectData) ? subjectData : []);

        // Fetch courses
        const coursesResponse = await fetch('/api/courses');
        if (!coursesResponse.ok) {
          throw new Error(`Courses API response was not ok: ${coursesResponse.status}`);
        }
        const coursesResult = await coursesResponse.json();
        const coursesData = Array.isArray(coursesResult) ? coursesResult : (coursesResult.data || []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData(); 
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!form.SubjectID) {
      brandedToast.error('Please select a subject', { title: 'Validation Error' });
      return;
    }
    if (!form.InstructorID) {
      brandedToast.error('Please select an instructor', { title: 'Validation Error' });
      return;
    }
    if (!form.Course || !form.Section || !form.YearLevel) {
      brandedToast.error('Please fill in all required fields (Course, Section, Year Level)', { title: 'Validation Error' });
      return;
    }

    try {
      // Build combined day/time/room strings for lecture + lab
      const combinedDay = [lectureDay ? `Lecture: ${lectureDay}` : null, labDay ? `Laboratory: ${labDay}` : null]
        .filter(Boolean)
        .join(', ');
      
      // Build flexible time strings
      const lectureTimeStr = (lectureStartTime && lectureEndTime) ? `${lectureStartTime} - ${lectureEndTime}` : '';
      const labTimeStr = (labStartTime && labEndTime) ? `${labStartTime} - ${labEndTime}` : '';
      
      const combinedTime = [lectureTimeStr ? `Lecture: ${lectureTimeStr}` : null, labTimeStr ? `Laboratory: ${labTimeStr}` : null]
        .filter(Boolean)
        .join(', ');
      const combinedRoom = [lectureRoom ? `Lecture: ${lectureRoom}` : null, labRoom ? `Laboratory: ${labRoom}` : null]
        .filter(Boolean)
        .join(', ');

      // Get the selected subject details to extract units
      const selectedSubject = subjects.find(subject => subject.SubjectID === parseInt(form.SubjectID));
      if (!selectedSubject) {
        brandedToast.error('Selected subject not found', { title: 'Validation Error' });
        return;
      }

      // Create the schedule data with subject units and numeric conversion for hours
      const scheduleData = {
        ...form,
        YearLevel: Number(form.YearLevel), // Convert YearLevel to number
        Lecture: Number(form.Lecture) || 0,
        Laboratory: Number(form.Laboratory) || 0,
        Units: selectedSubject.Units || 3,
        Day: combinedDay || form.Day,
        Time: combinedTime || form.Time,
        Room: combinedRoom || form.Room,
      };



      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }

      const result = await response.json();
      console.log('Schedule created successfully:', result);

      // Show success message with auto-enrollment info
      if (result.autoEnrolled) {
        brandedToast.success(
          'Students matching the course, year level, and section have been automatically enrolled.',
          { title: 'Schedule Created Successfully', duration: 6000 }
        );
      } else {
        brandedToast.success(
          'Schedule created successfully!',
          { title: 'Success', duration: 4000 }
        );
      }

      // Clear form and close modal
      clearForm();
      setOpen(false);
      
      // Trigger data refresh after a brief delay to show toast
      setTimeout(() => {
        onAdd(); // This triggers the data refresh
      }, 3000);
    } catch (error) {
      console.error('Error creating schedule:', error);
      brandedToast.error(
        error instanceof Error ? error.message : 'Failed to create schedule. Please try again.',
        { title: 'Error' }
      );
    }
  }

  const clearForm = () => {
    setForm({
      Course: '',
      InstructorID: '',
      Section: '',
      YearLevel: '',
      Day: '',
      Time: '',
      Room: '',
      TotalSeats: '40',
      SeatMap: '',
      Lecture: '',
      Laboratory: '',
      SubjectID: '',
      Semester: '',
      AcademicYear: '',
    });
    setLectureDay('');
    setLectureStartTime('');
    setLectureEndTime('');
    setLectureRoom('');
    setLabDay('');
    setLabStartTime('');
    setLabEndTime('');
    setLabRoom('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Schedule</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>
            Create a new class schedule. The grading configuration will be inherited from the selected subject.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-4">
          {/* Subject Selection */}
          <div className="space-y-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Subject *</label>
            <Select value={form.SubjectID} onValueChange={(value) => setForm(prev => ({ ...prev, SubjectID: value }))}>
              <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.SubjectID} value={String(subject.SubjectID)}>
                    {subject.SubjectCode} - {subject.SubjectName} ({subject.Units} units)
                    {subject.ClassType && ` - ${
                      subject.ClassType === 'LECTURE+LAB' ? 'Lecture and Laboratory' :
                      subject.ClassType === 'MAJOR' ? 'Cisco' :
                      subject.ClassType === 'NSTP' ? 'NSTP' :
                      subject.ClassType === 'OJT' ? 'OJT' :
                      'Lecture'}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Instructor Selection */}
          <div className="space-y-2 mb-2">
            <label className="text-sm font-medium text-gray-700">Instructor *</label>
            <Select value={form.InstructorID} onValueChange={(value) => setForm(prev => ({ ...prev, InstructorID: value }))}>
              <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.filter(user => user.Role === 'instructor').map((instructor) => (
                  <SelectItem key={instructor.UserID} value={String(instructor.UserID)}>
                    {instructor.FirstName} {instructor.LastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Basic Schedule Information */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course *</label>
            <Select value={form.Course} onValueChange={(value) => setForm(prev => ({ ...prev, Course: value }))}>
              <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.CourseID} value={course.CourseCode}>
                    {course.CourseCode} - {course.CourseName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Year Level *</label>
              <Select value={form.YearLevel} onValueChange={(value) => setForm(prev => ({ ...prev, YearLevel: value }))}>
                <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Section *</label>
              <Input name="Section" value={form.Section} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Semester *</label>
              <Select value={form.Semester} onValueChange={(value) => setForm(prev => ({ ...prev, Semester: value }))}>
                <SelectTrigger className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Semester</SelectItem>
                  <SelectItem value="2nd">2nd Semester</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Academic Year</label>
              <Input name="AcademicYear" placeholder="e.g., 2023-2024" value={form.AcademicYear} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
            </div>
          </div>

          {/* Units - Total Seats automatically set to 40 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Units (auto)</label>
            <Input value={subjects.find(s => String(s.SubjectID) === form.SubjectID)?.Units || ''} readOnly className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700" />
            <p className="text-xs text-gray-500">Total Seats automatically set to 40</p>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lecture Hours</label>
              <input
                name="Lecture"
                type="number"
                value={form.Lecture}
                onChange={(e) => setForm(prev => ({ ...prev, Lecture: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter lecture hours"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Laboratory Hours</label>
              <input
                name="Laboratory"
                type="number"
                value={form.Laboratory}
                onChange={(e) => setForm(prev => ({ ...prev, Laboratory: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter laboratory hours"
              />
            </div>
          </div>

          {/* Lecture / Laboratory panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white px-3 py-2 font-semibold">Lecture</div>
              <div className="p-3 space-y-2 bg-white">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Day</label>
                  <Select value={lectureDay} onValueChange={setLectureDay}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Start Time</label>
                  <Select value={lectureStartTime} onValueChange={setLectureStartTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {START_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">End Time</label>
                  <Select value={lectureEndTime} onValueChange={setLectureEndTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {END_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Room</label>
                  <Input value={lectureRoom} onChange={(e) => setLectureRoom(e.target.value)} placeholder="e.g., R201" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white px-3 py-2 font-semibold">Laboratory</div>
              <div className="p-3 space-y-2 bg-white">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Day</label>
                  <Select value={labDay} onValueChange={setLabDay}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OPTIONS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Start Time</label>
                  <Select value={labStartTime} onValueChange={setLabStartTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {START_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">End Time</label>
                  <Select value={labEndTime} onValueChange={setLabEndTime}>
                    <SelectTrigger className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {END_TIME_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Room</label>
                  <Input value={labRoom} onChange={(e) => setLabRoom(e.target.value)} placeholder="e.g., CLAB2" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button variant="secondary" onClick={clearForm}>Clear</Button>
          <Button onClick={handleSubmit} className="bg-green-900">Add Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
