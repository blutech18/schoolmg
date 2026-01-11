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
 * Parses Room field to extract separate Lecture and Laboratory rooms
 * Handles formats like: "L404, l305" or "Lecture: L404, Lab: l305" or "L404/l305"
 */
export function parseRooms(roomString?: string): { lecture?: string; laboratory?: string } {
  if (!roomString) return {};

  const room = roomString.trim();

  // Check for explicit labels (including compact format L: and Lab:)
  const lectureMatch = room.match(/(?:lecture|lec|L)[\s:]*([A-Za-z0-9]+)/i);
  const labMatch = room.match(/(?:laboratory|lab)[\s:]*([A-Za-z0-9]+)/i);

  if (lectureMatch && labMatch) {
    return {
      lecture: lectureMatch[1].trim(),
      laboratory: labMatch[1].trim()
    };
  }

  // Check for pipe-separated values (new compact format)
  if (room.includes('|')) {
    const parts = room.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      // Extract values after L: and Lab: prefixes
      const lecturePart = parts.find(p => /^L:/i.test(p));
      const labPart = parts.find(p => /^Lab:/i.test(p));
      return {
        lecture: lecturePart ? lecturePart.replace(/^L:/i, '').trim() : parts[0],
        laboratory: labPart ? labPart.replace(/^Lab:/i, '').trim() : parts[1]
      };
    }
  }

  // Check for comma-separated values (assume first is lecture, second is lab)
  if (room.includes(',')) {
    const parts = room.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: parts[0],
        laboratory: parts[1]
      };
    }
  }

  // Check for slash-separated values
  if (room.includes('/')) {
    const parts = room.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: parts[0],
        laboratory: parts[1]
      };
    }
  }

  // If no separator found, return single room for both
  return { lecture: room, laboratory: room };
}

/**
 * Parses Time field to extract separate Lecture and Laboratory times
 * Handles formats like: "10:00AM - 1:00PM, 12:00PM - 3:00PM" or "Lecture: 10:00AM - 1:00PM, Lab: 12:00PM - 3:00PM"
 */
export function parseTimes(timeString?: string): { lecture?: string; laboratory?: string } {
  if (!timeString) return {};

  const time = timeString.trim();

  // Check for explicit labels (including compact format L: and Lab:)
  const lectureMatch = time.match(/(?:lecture|lec|L)[\s:]*([0-9:APM\s\-]+)/i);
  const labMatch = time.match(/(?:laboratory|lab)[\s:]*([0-9:APM\s\-]+)/i);

  if (lectureMatch && labMatch) {
    return {
      lecture: lectureMatch[1].trim(),
      laboratory: labMatch[1].trim()
    };
  }

  // Check for slash-separated time ranges (compact format: "08:00AM-10:00AM/07:00AM-09:30AM")
  if (time.includes('/')) {
    const parts = time.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: parts[0],
        laboratory: parts[1]
      };
    }
  }

  // Check for pipe-separated time ranges (new compact format)
  if (time.includes('|')) {
    const parts = time.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      // Extract values after L: and Lab: prefixes
      const lecturePart = parts.find(p => /^L:/i.test(p));
      const labPart = parts.find(p => /^Lab:/i.test(p));
      return {
        lecture: lecturePart ? lecturePart.replace(/^L:/i, '').trim() : parts[0],
        laboratory: labPart ? labPart.replace(/^Lab:/i, '').trim() : parts[1]
      };
    }
  }

  // Check for comma-separated time ranges
  if (time.includes(',')) {
    const parts = time.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: parts[0],
        laboratory: parts[1]
      };
    }
  }

  // Check for semicolon-separated time ranges
  if (time.includes(';')) {
    const parts = time.split(';').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: parts[0],
        laboratory: parts[1]
      };
    }
  }

  // If no separator found, return single time for both
  return { lecture: time, laboratory: time };
}

/**
 * Parses Day field to extract separate Lecture and Laboratory days
 * Handles formats like: "Monday, Friday" or "Lecture: Monday, Lab: Friday"
 */
export function parseDays(dayString?: string): { lecture?: string; laboratory?: string } {
  if (!dayString) return {};

  const day = dayString.trim();

  // Expand 3-letter day abbreviations
  const expandDay = (abbr: string): string => {
    const dayMap: { [key: string]: string } = {
      'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
      'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
    };
    return dayMap[abbr] || abbr;
  };

  // Check for explicit labels (including compact format L: and Lab:)
  const lectureMatch = day.match(/(?:lecture|lec|L)[\s:]*([A-Za-z]+)/i);
  const labMatch = day.match(/(?:laboratory|lab)[\s:]*([A-Za-z]+)/i);

  if (lectureMatch && labMatch) {
    return {
      lecture: expandDay(lectureMatch[1].trim()),
      laboratory: expandDay(labMatch[1].trim())
    };
  }

  // Check for slash-separated days (compact format: "Mon/Tue")
  if (day.includes('/')) {
    const parts = day.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: expandDay(parts[0]),
        laboratory: expandDay(parts[1])
      };
    }
  }

  // Check for pipe-separated days (new compact format)
  if (day.includes('|')) {
    const parts = day.split('|').map(p => p.trim());
    if (parts.length >= 2) {
      // Extract values after L: and Lab: prefixes
      const lecturePart = parts.find(p => /^L:/i.test(p));
      const labPart = parts.find(p => /^Lab:/i.test(p));
      return {
        lecture: expandDay(lecturePart ? lecturePart.replace(/^L:/i, '').trim() : parts[0]),
        laboratory: expandDay(labPart ? labPart.replace(/^Lab:/i, '').trim() : parts[1])
      };
    }
  }

  // Check for comma-separated days
  if (day.includes(',')) {
    const parts = day.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return {
        lecture: expandDay(parts[0]),
        laboratory: expandDay(parts[1])
      };
    }
  }

  // If no separator found, return single day for both
  return { lecture: expandDay(day), laboratory: expandDay(day) };
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
