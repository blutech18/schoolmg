import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Schedule display utilities
export interface ScheduleDisplayData {
  Room?: string;
  Day?: string;
  Time?: string;
  Lecture?: number;
  Laboratory?: number;
  ClassType?: string;
}

export interface FormattedScheduleEntry {
  room: string;
  day: string;
  type: string;
  timeRange: string;
}

/**
 * Formats time string to standardized start-end format
 * Converts various time formats to "HH:MM–HH:MM" format
 */
export function formatTimeRange(timeString?: string): string {
  if (!timeString) return "N/A";
  
  // Handle various time formats
  const time = timeString.trim();
  
  // Format: "7:00AM - 9:00AM" or "7:00 AM - 9:00 AM"
  if (time.includes(' - ') && (time.includes('AM') || time.includes('PM'))) {
    const parts = time.split(' - ');
    if (parts.length === 2) {
      const start = formatTime(parts[0].trim());
      const end = formatTime(parts[1].trim());
      return `${start}–${end}`;
    }
  }
  
  // Format: "7:00-9:00" or "7:00AM-9:00AM"
  if (time.includes('-') && !time.includes(' ')) {
    const parts = time.split('-');
    if (parts.length === 2) {
      const start = formatTime(parts[0].trim());
      const end = formatTime(parts[1].trim());
      return `${start}–${end}`;
    }
  }
  
  // Format: "7:00PM - 7:00PM" (single time with range)
  if (time.includes(' - ') && !time.includes('AM') && !time.includes('PM')) {
    const parts = time.split(' - ');
    if (parts.length === 2) {
      const start = formatTime(parts[0].trim());
      const end = formatTime(parts[1].trim());
      return `${start}–${end}`;
    }
  }
  
  // Single time format - assume it's a start time
  return formatTime(time);
}

/**
 * Formats individual time to HH:MM format
 */
function formatTime(timeStr: string): string {
  const time = timeStr.trim();
  
  // Remove AM/PM and convert to 24-hour format
  let cleanTime = time.replace(/\s*(AM|PM)/i, '');
  const isPM = /PM/i.test(time) && !time.includes('12:');
  const isAM = /AM/i.test(time) && time.includes('12:');
  
  if (cleanTime.includes(':')) {
    const [hours, minutes] = cleanTime.split(':');
    let hour24 = parseInt(hours, 10);
    
    if (isPM && hour24 !== 12) {
      hour24 += 12;
    } else if (isAM && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  return time;
}

/**
 * Determines the class type based on schedule data
 */
function getClassType(schedule: ScheduleDisplayData): string {
  const lecture = schedule.Lecture || 0;
  const laboratory = schedule.Laboratory || 0;
  const classType = schedule.ClassType;
  
  // If both lecture and lab hours exist
  if (lecture > 0 && laboratory > 0) {
    return 'Lecture+Lab';
  }
  
  // If only lab hours exist
  if (laboratory > 0 && lecture === 0) {
    return 'Laboratory';
  }
  
  // If only lecture hours exist or no specific type
  if (lecture > 0 || !classType) {
    return 'Lecture';
  }
  
  // Use the provided class type
  return classType;
}

/**
 * Formats a single schedule entry to the standardized format
 * Returns: "Day – Type – Start–End time"
 */
export function formatScheduleEntry(schedule: ScheduleDisplayData): string {
  const day = schedule.Day || 'N/A';
  const type = getClassType(schedule);
  const timeRange = formatTimeRange(schedule.Time);
  
  return `${day} – ${type} – ${timeRange}`;
}

/**
 * Formats a complete schedule display with room and schedule entries
 * Returns formatted object with room and schedule entries
 */
export function formatScheduleDisplay(schedule: ScheduleDisplayData): {
  room: string;
  entries: string[];
} {
  const room = schedule.Room || 'N/A';
  const entry = formatScheduleEntry(schedule);
  
  return {
    room,
    entries: [entry]
  };
}

/**
 * Formats multiple schedule entries for the same room
 * Useful when a room has multiple time slots
 */
export function formatMultipleSchedules(schedules: ScheduleDisplayData[]): {
  room: string;
  entries: string[];
} {
  if (schedules.length === 0) {
    return { room: 'N/A', entries: [] };
  }
  
  const room = schedules[0].Room || 'N/A';
  const entries = schedules.map(formatScheduleEntry);
  
  return { room, entries };
}

/**
 * Formats schedule display for UI components
 * Returns JSX-friendly format with structured data
 */
export function formatScheduleForDisplay(schedule: ScheduleDisplayData): FormattedScheduleEntry {
  return {
    room: schedule.Room || 'N/A',
    day: schedule.Day || 'N/A',
    type: getClassType(schedule),
    timeRange: formatTimeRange(schedule.Time)
  };
}
