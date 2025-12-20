'use client';
import React, { useEffect, useState } from 'react';
import ScheduleCard from '@/app/components/ScheduleCard';
import { ISchedule } from '@/app/models/ISchedule';

interface ISessionData {
  userId: number;
  role: string;
  email: string;
  name: string;
}

export default function ScheduleCardView() {
  const [schedules, setSchedules] = useState<ISchedule[]>([]);
  const [session, setSession] = useState<ISessionData | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/session');
        if (!res.ok) throw new Error('Failed to fetch session');
        const data = await res.json();
        setSession(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchSession();
  }, []);

  useEffect(() => {
    async function fetchSchedules() {
      try {
        console.log('Fetching schedules for admin/schedules page');
        const res = await fetch('/api/schedules');
        
        if (!res.ok) {
          console.error(`Schedules API failed: ${res.status} ${res.statusText}`);
          throw new Error('Failed to fetch schedules');
        }
        
        const result = await res.json();
        console.log('Schedules API response:', result);
        
        // Handle the API response format { success: true, data: [...] }
        if (result.success && Array.isArray(result.data)) {
          setSchedules(result.data);
          console.log('Set schedules data:', result.data);
        } else if (Array.isArray(result)) {
          // Fallback for direct array response
          setSchedules(result);
          console.log('Set schedules data (direct array):', result);
        } else {
          console.error('Invalid schedules response format:', result);
          setSchedules([]);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]); // Ensure schedules is always an array
      }
    }

    if (session) {
      fetchSchedules();
    }
  }, [session]);

  // Ensure schedules is always an array before filtering
  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  
  const filteredSchedules = safeSchedules.filter(schedule => {
    if (session?.role === "admin" || session?.role === "dean") return true;

    if (session?.role === "instructor") {
      return schedule.InstructorID === session?.userId;
    }
    
    return false;
  });
  
  console.log('Filtered schedules:', filteredSchedules);

  const getRole = (): 'student' | 'instructor' | 'dean' | 'admin' => {
    if (session?.role === 'admin' || session?.role === 'dean') return 'dean';
    if (session?.role === 'instructor') return 'instructor';
    return 'student';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5 mb-10">
      {session &&
        filteredSchedules
          .map((schedule, idx) => (
            <ScheduleCard key={idx} schedule={schedule} role={getRole()} showActions={true} />
          ))}
    </div>
  );
}
