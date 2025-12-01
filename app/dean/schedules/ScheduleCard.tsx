'use client'
import { ISchedule } from '@/app/models/ISchedule';
import { Button } from '@/components/ui/button';
import EnhancedSeatPlan from './modal/EnhancedSeatPlan';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatScheduleEntry, type ScheduleDisplayData } from '@/lib/utils';

interface IScheduleCardProps {
    schedule: ISchedule;
}

export default function ScheduleCard({ schedule } : IScheduleCardProps) {
  const router = useRouter();
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  
  const parsedSeatMap = (() => {
    try {
      // Handle null, undefined, or empty string
      if (!schedule.SeatMap || schedule.SeatMap.trim() === '') {
        return [];
      }
      
      // Try to parse the JSON
      const parsed = JSON.parse(schedule.SeatMap);
      
      // Ensure it's an array
      if (Array.isArray(parsed)) {
        return parsed;
      } else {
        console.warn('SeatMap is not an array:', schedule.SeatMap);
        return [];
      }
    } catch (error) {
      console.warn('Invalid JSON in SeatMap:', schedule.SeatMap, error);
      return [];
    }
  })();

  // Fetch enrolled students count
  useEffect(() => {
    async function fetchEnrolledCount() {
      try {
        const res = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`);
        if (res.ok) {
          const result = await res.json();
          const students = result.success ? result.data : result;
          setEnrolledCount(Array.isArray(students) ? students.length : 0);
        }
      } catch (error) {
        console.error('Error fetching enrolled students count:', error);
      }
    }

    fetchEnrolledCount();
  }, [schedule.ScheduleID]);

  const handleAttendanceClick = () => {
    router.push(`/dean/attendance?scheduleId=${schedule.ScheduleID}`);
  };

  const handleGradesClick = () => {
    router.push(`/dean/grades?scheduleId=${schedule.ScheduleID}`);
  };

  return (
    <div className="border rounded-xl shadow-md overflow-hidden z-1">
        {/* Header - Using green-800 to match logo/brand */}
        <div className="bg-green-800 text-white px-4 py-2 font-semibold rounded-t-lg">
          <div className="flex justify-between items-center">
            <span> {schedule.YearLevel} - {schedule.Course}</span>
            <span className='font-semibold text-sm'>{schedule.Day}</span>
          </div>
          <div className="text-xs mt-1">
            {formatScheduleEntry({
              Room: schedule.Room ?? undefined,
              Day: schedule.Day ?? undefined,
              Time: schedule.Time ?? undefined,
              Lecture: schedule.Lecture ?? undefined,
              Laboratory: schedule.Laboratory ?? undefined,
              ClassType: schedule.ClassType ?? undefined
            })}
          </div>
        </div>

        <div className="p-4 space-y-1 text-sm">
        <div><strong>Subject:</strong> {schedule.SubjectCode} - {schedule.SubjectName}</div>
        <div><strong>Instructor:</strong> {schedule.InstructorName || `ID: ${schedule.InstructorID}`}</div>
        <div><strong>Section:</strong> {schedule.Section}</div>
        <div><strong>Room:</strong> {schedule.Room}</div>
        <div><strong>Enrolled Students:</strong> {enrolledCount}</div>
          <div className='grid md:grid-cols-3 gap-3'>
            <div className='bg-gray-100 rounded-lg p-5 flex flex-col items-center'><b>{schedule.Lecture || 0} hrs</b><small>Lecture</small></div>
            <div className='bg-gray-100 rounded-lg p-5 flex flex-col items-center'><b>{schedule.Laboratory || 0} hrs</b> <small>Laboratory</small></div>
            <div className='bg-gray-100 rounded-lg p-5 flex flex-col items-center'><b>{schedule.Units || 0}</b> <small>Units</small></div>
          </div>
        </div>

        <div className="bg-gray-100 px-4 py-2 font-semibold rounded-b-lg grid md:grid-cols-3 gap-3">
            <Button className='w-full bg-green-800 hover:bg-green-900' onClick={handleAttendanceClick}>Attendance</Button>
            <EnhancedSeatPlan 
              cols={schedule.SeatCols ?? 0} 
              numberOfSeats={schedule.TotalSeats ?? 0} 
              studentSeatMap={parsedSeatMap} 
              scheduleId={schedule.ScheduleID}
              classType={schedule.ClassType}
              lectureSeatMap={schedule.LectureSeatMap ?? undefined}
              laboratorySeatMap={schedule.LaboratorySeatMap ?? undefined}
              lectureSeatCols={schedule.LectureSeatCols || 4}
              laboratorySeatCols={schedule.LaboratorySeatCols || 2}
              lecture={schedule.Lecture || 0}
              laboratory={schedule.Laboratory || 0}
            />
            <Button className='w-full bg-green-800 hover:bg-green-900' onClick={handleGradesClick}>Grades</Button>
        </div>
    </div>
  )
}
