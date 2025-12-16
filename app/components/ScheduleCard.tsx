'use client'
import { ISchedule } from '@/app/models/ISchedule'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { parseRooms, parseTimes, parseDays } from '@/lib/utils'

type ScheduleLike = Partial<ISchedule> & {
  ScheduleID: number
  SubjectTitle?: string
  SubjectName?: string
  InstructorName?: string
  EnrolledStudents?: number | null
  TotalSeats?: number | null
}

interface ScheduleCardProps {
  readonly schedule: ScheduleLike
  readonly role?: 'student' | 'instructor' | 'dean' | 'admin'
  readonly onClick?: () => void
  readonly onAttendanceClick?: () => void
  readonly onGradesClick?: () => void
  readonly showActions?: boolean
}

export default function ScheduleCard({
  schedule,
  role = 'student',
  onClick,
  onAttendanceClick,
  onGradesClick,
  showActions = true,
}: ScheduleCardProps) {
  const router = useRouter()
  const [enrolledCount, setEnrolledCount] = useState<number>(0)
  const isPrivileged = useMemo(
    () => role === 'dean' || role === 'instructor' || role === 'admin',
    [role],
  )

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

    if (!isPrivileged) {
      setEnrolledCount(schedule.EnrolledStudents || 0)
      return
    }

    fetchEnrolledCount()
  }, [schedule.ScheduleID, schedule.EnrolledStudents, isPrivileged])

  const handleAttendanceClick = () => {
    if (onAttendanceClick) return onAttendanceClick()
    if (role === 'dean') router.push(`/dean/attendance?scheduleId=${schedule.ScheduleID}`)
  }

  const handleGradesClick = () => {
    if (onGradesClick) return onGradesClick()
    if (role === 'dean') router.push(`/dean/grades?scheduleId=${schedule.ScheduleID}`)
  }

  const hasLab =
    (schedule.Laboratory || 0) > 0 ||
    (schedule.ClassType || '').toUpperCase().includes('LAB') ||
    (schedule.ClassType || '').toUpperCase() === 'MAJOR' ||
    (schedule.Room && schedule.Room.toLowerCase().includes('cisco'))

  const rooms = parseRooms(schedule.Room ?? undefined)
  const times = parseTimes(schedule.Time ?? undefined)
  const days = parseDays(schedule.Day ?? undefined)

  const lectureInfo = {
    day: days.lecture || schedule.Day || 'N/A',
    time: times.lecture || schedule.Time || 'N/A',
    room: rooms.lecture || schedule.Room || 'N/A',
  }

  const labInfo = {
    day: days.laboratory || schedule.Day || 'N/A',
    time: times.laboratory || schedule.Time || 'N/A',
    room: rooms.laboratory || schedule.Room || 'N/A',
  }

  const secondaryLineParts = [
    schedule.SubjectCode,
    schedule.Course || schedule.SubjectTitle || schedule.SubjectName,
  ].filter(Boolean)

  const secondaryLine =
    secondaryLineParts.length > 0 ? secondaryLineParts.join(' • ') : undefined

  const classTypeLabel = () => {
    const type = schedule.ClassType
    const lectureHours = schedule.Lecture || 0
    const labHours = schedule.Laboratory || 0

    // If both lecture and lab hours are configured, always show Lecture + Laboratory
    if (lectureHours > 0 && labHours > 0) return 'Lecture + Laboratory'
    if (lectureHours > 0 && labHours === 0) return 'Lecture Only'
    if (lectureHours === 0 && labHours > 0) return 'Laboratory Only'

    if (!type) return null

    const upper = type.toUpperCase()
    if (upper === 'LECTURE+LAB' || upper === 'LECTURE-LAB') return 'Lecture + Laboratory'
    if (upper === 'LECTURE-ONLY' || upper === 'LECTURE' || upper === 'LECTURE_ONLY' || upper === 'LECTURE-ONLY ') return 'Lecture Only'
    if (upper === 'LAB-ONLY' || upper === 'LAB' || upper === 'LAB_ONLY') return 'Laboratory Only'
    if (upper === 'MAJOR') return 'Cisco'
    if (upper === 'NSTP') return 'NSTP'
    if (upper === 'OJT') return 'OJT'
    if (upper === 'LECTURE-ONLY' || upper === 'LECTUREONLY' || upper === 'LECTURE ONLY') return 'Lecture Only'
    if (upper === 'LECTURE+LABORATORY') return 'Lecture + Laboratory'

    return type
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  const cardInteractionProps = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: () => onClick(),
        onKeyDown: handleKeyDown,
      }
    : {}

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      {...cardInteractionProps}
    >
      <div className="px-6 pt-6 pb-4 text-center border-b">
        <div className="text-2xl font-semibold text-gray-900">
          {schedule.Section || schedule.SubjectCode || '—'}
        </div>
        {secondaryLine && (
          <div className="text-sm text-gray-600 mt-1">
            {secondaryLine}
          </div>
        )}
      </div>

      <div className="px-6 py-5 grid grid-cols-3 gap-4 text-center">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Lec Hours</div>
          <div className="text-xl font-semibold text-gray-900">{schedule.Lecture || 0}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Lab Hours</div>
          <div className="text-xl font-semibold text-gray-900">{schedule.Laboratory || 0}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Units</div>
          <div className="text-xl font-semibold text-gray-900">{schedule.Units || 0}</div>
        </div>
      </div>

      <div className={`px-6 pb-6 grid gap-4 ${hasLab ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-green-800 text-white text-center font-semibold py-2">Lecture</div>
          <div className="grid grid-cols-3 text-center text-sm border-t border-gray-200">
            <div className="bg-gray-50 font-semibold p-2 text-gray-700">Day</div>
            <div className="bg-gray-50 font-semibold p-2 text-gray-700">Time</div>
            <div className="bg-gray-50 font-semibold p-2 text-gray-700">Room</div>
            <div className="p-2 text-gray-900">{lectureInfo.day}</div>
            <div className="p-2 text-gray-900">{lectureInfo.time}</div>
            <div className="p-2 text-gray-900">{lectureInfo.room}</div>
          </div>
        </div>

        {hasLab && (
          <div className="border rounded-xl overflow-hidden">
            <div className="bg-green-800 text-white text-center font-semibold py-2">Laboratory</div>
            <div className="grid grid-cols-3 text-center text-sm border-t border-gray-200">
              <div className="bg-gray-50 font-semibold p-2 text-gray-700">Day</div>
              <div className="bg-gray-50 font-semibold p-2 text-gray-700">Time</div>
              <div className="bg-gray-50 font-semibold p-2 text-gray-700">Room</div>
              <div className="p-2 text-gray-900">{labInfo.day}</div>
              <div className="p-2 text-gray-900">{labInfo.time}</div>
              <div className="p-2 text-gray-900">{labInfo.room}</div>
            </div>
          </div>
        )}
      </div>

      {isPrivileged && (
        <div className="px-6 pb-4">
          <div className="text-sm text-gray-700 flex items-center justify-center gap-2">
            <span className="font-semibold">Enrolled Students:</span>
            <span>{enrolledCount}{schedule.TotalSeats ? ` / ${schedule.TotalSeats}` : ''}</span>
          </div>
        </div>
      )}

      {showActions && isPrivileged && (
        <div className="bg-gray-50 px-6 py-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {classTypeLabel() && (
        <div className="px-6 pb-5">
          <Badge variant="outline" className="text-xs">
            {classTypeLabel()}
          </Badge>
        </div>
      )}
    </div>
  )
}
