'use client'
import { ISchedule } from '@/app/models/ISchedule'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { formatScheduleEntry, parseRooms, parseTimes, parseDays, type ScheduleDisplayData } from '@/lib/utils'
import { Clock, Users, BookOpen, GraduationCap } from 'lucide-react'

interface ScheduleCardProps {
  schedule: ISchedule | any // Accept both ISchedule and local Schedule types
  role?: 'student' | 'instructor' | 'dean' | 'admin'
  onClick?: () => void
  onAttendanceClick?: () => void
  onGradesClick?: () => void
  showActions?: boolean
}

export default function ScheduleCard({ 
  schedule, 
  role = 'student',
  onClick,
  onAttendanceClick,
  onGradesClick,
  showActions = true
}: ScheduleCardProps) {
  const router = useRouter()
  const [enrolledCount, setEnrolledCount] = useState<number>(0)

  // Fetch enrolled students count
  useEffect(() => {
    async function fetchEnrolledCount() {
      try {
        const res = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`)
        if (res.ok) {
          const result = await res.json()
          const students = result.success ? result.data : result
          setEnrolledCount(Array.isArray(students) ? students.length : schedule.EnrolledStudents || 0)
        }
      } catch (error) {
        console.error('Error fetching enrolled students count:', error)
        setEnrolledCount(schedule.EnrolledStudents || 0)
      }
    }

    if (role === 'dean' || role === 'instructor' || role === 'admin') {
      fetchEnrolledCount()
    } else {
      setEnrolledCount(schedule.EnrolledStudents || 0)
    }
  }, [schedule.ScheduleID, schedule.EnrolledStudents, role])

  const handleAttendanceClick = () => {
    if (onAttendanceClick) {
      onAttendanceClick()
    } else if (role === 'dean') {
      router.push(`/dean/attendance?scheduleId=${schedule.ScheduleID}`)
    }
  }

  const handleGradesClick = () => {
    if (onGradesClick) {
      onGradesClick()
    } else if (role === 'dean') {
      router.push(`/dean/grades?scheduleId=${schedule.ScheduleID}`)
    }
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div className={`border rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`} onClick={handleCardClick}>
      {/* Colored Header - Using green-800 to match logo/brand */}
      <div className="bg-green-800 text-white px-4 py-3 font-semibold rounded-t-lg">
        <div className="flex justify-between items-center">
          <span className="text-base">
            {schedule.YearLevel ? `Year ${schedule.YearLevel}` : ''} {schedule.YearLevel && schedule.Course ? '•' : ''} {schedule.Course || ''}
          </span>
          <span className="font-semibold text-sm">{schedule.Day || 'N/A'}</span>
        </div>
        <div className="text-xs mt-1 opacity-95">
          {(() => {
            // Check if this is a Cisco class (MAJOR type or room contains "cisco")
            const isCisco = schedule.ClassType === 'MAJOR' || 
                           (schedule.Room && schedule.Room.toLowerCase().includes('cisco'));
            
            // Only apply separate room/time display for Cisco classes with both Lecture and Lab
            const hasBoth = isCisco &&
                           (schedule.Lecture && schedule.Lecture > 0) && 
                           (schedule.Laboratory && schedule.Laboratory > 0);
            
            if (hasBoth) {
              // Parse separate rooms, times, and days
              const rooms = parseRooms(schedule.Room);
              const times = parseTimes(schedule.Time);
              const days = parseDays(schedule.Day);
              
              const lectureRoom = rooms.lecture || schedule.Room || 'N/A';
              const labRoom = rooms.laboratory || schedule.Room || 'N/A';
              const lectureTime = times.lecture || schedule.Time || 'N/A';
              const labTime = times.laboratory || schedule.Time || 'N/A';
              const lectureDay = days.lecture || schedule.Day || 'N/A';
              const labDay = days.laboratory || schedule.Day || 'N/A';
              
              return (
                <div className="space-y-1">
                  <div>Laboratory Room | {labRoom} {labTime} {labDay}</div>
                  <div>Lecture Room | {lectureRoom} {lectureTime} {lectureDay}</div>
                </div>
              );
            } else {
              // Use standard format for single room/time schedules
              return formatScheduleEntry({
                Room: schedule.Room ?? undefined,
                Day: schedule.Day ?? undefined,
                Time: schedule.Time ?? undefined,
                Lecture: schedule.Lecture ?? undefined,
                Laboratory: schedule.Laboratory ?? undefined,
                ClassType: schedule.ClassType ?? undefined
              });
            }
          })()}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2 text-sm bg-white">
        <div className="space-y-1.5">
          <div className="font-semibold text-base text-gray-900">
            {schedule.SubjectCode} - {(schedule.SubjectTitle || schedule.SubjectName) || 'N/A'}
          </div>
          <div className="text-gray-700">
            <strong>Instructor:</strong> {schedule.InstructorName || `ID: ${schedule.InstructorID || 'N/A'}`}
          </div>
          <div className="text-gray-700">
            <strong>Section:</strong> {schedule.Section || 'N/A'}
          </div>
          {(() => {
            // Check if this is a Cisco class (MAJOR type or room contains "cisco")
            const isCisco = schedule.ClassType === 'MAJOR' || 
                           (schedule.Room && schedule.Room.toLowerCase().includes('cisco'));
            
            // Only apply separate room display for Cisco classes with both Lecture and Lab
            const hasBoth = isCisco &&
                           (schedule.Lecture && schedule.Lecture > 0) && 
                           (schedule.Laboratory && schedule.Laboratory > 0);
            
            if (hasBoth) {
              // Parse separate rooms
              const rooms = parseRooms(schedule.Room);
              const lectureRoom = rooms.lecture || schedule.Room || 'N/A';
              const labRoom = rooms.laboratory || schedule.Room || 'N/A';
              
              return (
                <>
                  <div className="text-gray-700">
                    <strong>Lecture Room:</strong> {lectureRoom}
                  </div>
                  <div className="text-gray-700">
                    <strong>Laboratory Room:</strong> {labRoom}
                  </div>
                </>
              );
            } else {
              return (
                <div className="text-gray-700">
                  <strong>Room:</strong> {schedule.Room || 'N/A'}
                </div>
              );
            }
          })()}
          {(role === 'dean' || role === 'instructor' || role === 'admin') && (
            <div className="text-gray-700">
              <strong>Enrolled Students:</strong> {enrolledCount} / {schedule.TotalSeats || 'N/A'}
            </div>
          )}
        </div>

        {/* Hours/Units Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-200">
          <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
            <b className="text-base text-gray-900">{schedule.Lecture || 0}</b>
            <small className="text-xs text-gray-600">Lecture hrs</small>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
            <b className="text-base text-gray-900">{schedule.Laboratory || 0}</b>
            <small className="text-xs text-gray-600">Lab hrs</small>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex flex-col items-center">
            <b className="text-base text-gray-900">{schedule.Units || 0}</b>
            <small className="text-xs text-gray-600">Units</small>
          </div>
        </div>

        {/* Class Type Badge */}
        {schedule.ClassType && (
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {schedule.ClassType === 'LECTURE+LAB' || schedule.ClassType === 'LECTURE-LAB' ? 'Lecture + Laboratory' : 
               schedule.ClassType === 'LECTURE-ONLY' || schedule.ClassType === 'LECTURE' ? 'Lecture Only' :
               schedule.ClassType === 'LAB-ONLY' || schedule.ClassType === 'LAB' ? 'Laboratory Only' :
               schedule.ClassType === 'MAJOR' ? 'Cisco' : 
               schedule.ClassType === 'NSTP' ? 'NSTP' : 
               schedule.ClassType === 'OJT' ? 'OJT' : 
               schedule.ClassType}
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {showActions && (role === 'dean' || role === 'instructor' || role === 'admin') && (
        <div className="bg-gray-100 px-4 py-3 rounded-b-lg grid grid-cols-2 gap-2">
          <Button 
            className="w-full bg-green-800 hover:bg-green-900 text-white text-sm" 
            onClick={(e) => {
              e.stopPropagation()
              handleAttendanceClick()
            }}
          >
            Attendance
          </Button>
          <Button 
            className="w-full bg-green-800 hover:bg-green-900 text-white text-sm" 
            onClick={(e) => {
              e.stopPropagation()
              handleGradesClick()
            }}
          >
            Grades
          </Button>
        </div>
      )}
    </div>
  )
}
