'use client'
import { ISchedule } from '@/app/models/ISchedule';
import { Button } from '@/components/ui/button';
import EnhancedSeatPlan from './modal/EnhancedSeatPlan';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatScheduleEntry, parseRooms, parseTimes, parseDays } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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

  const isCiscoSchedule = (schedule.ClassType || '').toUpperCase() === 'MAJOR' || 
                          (schedule.Room && schedule.Room.toLowerCase().includes('cisco'));
  const hasLecture = (schedule.Lecture || 0) > 0 || isCiscoSchedule;
  const hasLab = (schedule.Laboratory || 0) > 0 || 
                 (schedule.ClassType || '').toUpperCase().includes('LAB') || 
                 isCiscoSchedule;
  const hasBoth = hasLecture && hasLab;

  const rooms = parseRooms(schedule.Room ?? undefined);
  const times = parseTimes(schedule.Time ?? undefined);
  const days = parseDays(schedule.Day ?? undefined);

  const lectureInfo = {
    day: days.lecture || schedule.Day || 'N/A',
    time: times.lecture || schedule.Time || 'N/A',
    room: rooms.lecture || schedule.Room || 'N/A',
  };

  const labInfo = {
    day: days.laboratory || schedule.Day || 'N/A',
    time: times.laboratory || schedule.Time || 'N/A',
    room: rooms.laboratory || schedule.Room || 'N/A',
  };

  return (
    <div className="border rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
      {/* Header - unified brand color */}
      <div className="bg-green-800 text-white px-4 py-3 font-semibold rounded-t-lg">
        <div className="flex justify-between items-center">
          <span className="text-base">
            {schedule.YearLevel ? `Year ${schedule.YearLevel}` : ''} {schedule.YearLevel && schedule.Course ? '•' : ''} {schedule.Course || ''}
          </span>
          <span className="font-semibold text-sm">{schedule.Day || 'N/A'}</span>
        </div>
        <div className="text-xs mt-1 opacity-95">
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

      {/* Card Body */}
      <div className="p-4 space-y-2 text-sm bg-white">
        <div className="space-y-1.5">
          <div className="font-semibold text-base text-gray-900">
            {schedule.SubjectCode} - {schedule.SubjectName || 'N/A'}
          </div>
          <div className="text-gray-700">
            <strong>Instructor:</strong> {schedule.InstructorName || `ID: ${schedule.InstructorID || 'N/A'}`}
          </div>
          <div className="text-gray-700">
            <strong>Section:</strong> {schedule.Section || 'N/A'}
          </div>
          <div className="text-gray-700">
            <strong>Schedule:</strong>
          </div>
          <div className={`grid ${hasBoth ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-3`}>
            {/* Lecture block */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-green-800 text-white px-3 py-2 text-sm font-semibold">Lecture</div>
              <div className="grid grid-cols-3 text-center text-xs border-t border-gray-200">
                <div className="bg-gray-50 font-semibold p-2">Day</div>
                <div className="bg-gray-50 font-semibold p-2">Time</div>
                <div className="bg-gray-50 font-semibold p-2">Room</div>
                <div className="p-2">{lectureInfo.day}</div>
                <div className="p-2">{lectureInfo.time}</div>
                <div className="p-2">{lectureInfo.room}</div>
              </div>
            </div>

            {/* Laboratory block */}
            {hasLab && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-green-800 text-white px-3 py-2 text-sm font-semibold">Laboratory</div>
                <div className="grid grid-cols-3 text-center text-xs border-t border-gray-200">
                  <div className="bg-gray-50 font-semibold p-2">Day</div>
                  <div className="bg-gray-50 font-semibold p-2">Time</div>
                  <div className="bg-gray-50 font-semibold p-2">Room</div>
                  <div className="p-2">{labInfo.day}</div>
                  <div className="p-2">{labInfo.time}</div>
                  <div className="p-2">{labInfo.room}</div>
                </div>
              </div>
            )}
          </div>
          <div className="text-gray-700">
            <strong>Enrolled Students:</strong> {enrolledCount}
          </div>
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
      <div className="bg-gray-100 px-4 py-3 rounded-b-lg grid grid-cols-3 gap-2">
        <Button 
          className="w-full bg-green-800 hover:bg-green-900 text-white text-sm" 
          onClick={handleAttendanceClick}
        >
          Attendance
        </Button>
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
        <Button 
          className="w-full bg-green-800 hover:bg-green-900 text-white text-sm" 
          onClick={handleGradesClick}
        >
          Grades
        </Button>
      </div>
    </div>
  )
}
