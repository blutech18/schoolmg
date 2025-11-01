# Standardized Schedule Display Format

## Overview
The standardized schedule display format provides a consistent way to display schedule information across the entire school management system. The format follows the pattern:

**Room/Building**  
**Day – Type – Start–End time**

## Format Examples

### Standard Format
```
Cisco Lab Room
Monday – Lecture – 07:00–09:00
```

### Multiple Sessions
```
R201 CLAB1
Monday – Lecture – 17:00–19:00
Wednesday – Laboratory – 10:00–13:00
```

### Different Class Types
```
L404
Friday – Lecture+Lab – 08:00–11:00
```

## Implementation

### Utility Functions

#### `formatScheduleEntry(schedule: ScheduleDisplayData): string`
Formats a single schedule entry to the standardized format.

```typescript
import { formatScheduleEntry } from '@/lib/utils';

const formattedSchedule = formatScheduleEntry({
  Room: 'Cisco Lab Room',
  Day: 'Monday',
  Time: '7:00AM - 9:00AM',
  Lecture: 2,
  Laboratory: 0,
  ClassType: 'LECTURE'
});
// Returns: "Monday – Lecture – 07:00–09:00"
```

#### `formatScheduleForDisplay(schedule: ScheduleDisplayData): FormattedScheduleEntry`
Returns structured data for UI components.

```typescript
import { formatScheduleForDisplay } from '@/lib/utils';

const displayData = formatScheduleForDisplay({
  Room: 'R201 CLAB1',
  Day: 'Wednesday',
  Time: '2:00PM - 5:00PM',
  Lecture: 0,
  Laboratory: 3,
  ClassType: 'LABORATORY'
});
// Returns: {
//   room: 'R201 CLAB1',
//   day: 'Wednesday',
//   type: 'Laboratory',
//   timeRange: '14:00–17:00'
// }
```

### Time Format Conversion

The utility automatically converts various time formats to the standardized HH:MM–HH:MM format:

#### Input Formats Supported
- `"7:00AM - 9:00AM"` → `"07:00–09:00"`
- `"7:00 AM - 9:00 AM"` → `"07:00–09:00"`
- `"7:00-9:00"` → `"07:00–09:00"`
- `"7:00PM - 7:00PM"` → `"19:00–19:00"`
- `"14:00 - 17:00"` → `"14:00–17:00"`

#### Class Type Detection
The system automatically determines the class type based on available data:

- **Lecture**: When `Lecture > 0` and `Laboratory = 0`
- **Laboratory**: When `Laboratory > 0` and `Lecture = 0`
- **Lecture+Lab**: When both `Lecture > 0` and `Laboratory > 0`
- **Custom**: Uses `ClassType` field when available

## Usage Across Components

### 1. Instructor Dashboard
```typescript
// Before
<span>Room: {schedule.Room}</span>
<span>{schedule.Time}</span>

// After
<div className="font-medium text-gray-900">{schedule.Room}</div>
<div className="flex items-center gap-1">
  <Clock className="h-4 w-4" />
  {formatScheduleEntry({
    Room: schedule.Room,
    Day: schedule.Day,
    Time: schedule.Time,
    Lecture: schedule.Lecture,
    Laboratory: schedule.Laboratory,
    ClassType: schedule.ClassType
  })}
</div>
```

### 2. Admin Schedule Tables
```typescript
// Before
<TableCell>{schedule.Day}</TableCell>
<TableCell>{schedule.Time}</TableCell>
<TableCell>{schedule.Room}</TableCell>

// After
<TableCell>
  <div className="space-y-1">
    <div className="font-medium text-gray-900">{schedule.Room}</div>
    <div className="text-sm text-gray-600">
      {formatScheduleEntry({
        Room: schedule.Room,
        Day: schedule.Day,
        Time: schedule.Time,
        Lecture: schedule.Lecture,
        Laboratory: schedule.Laboratory,
        ClassType: schedule.ClassType
      })}
    </div>
  </div>
</TableCell>
```

### 3. Student Dashboard
```typescript
// Before
<div>{schedule.Day} | {schedule.Time}</div>
<div>Room {schedule.Room}</div>

// After
<div className="font-medium text-gray-900">{schedule.Room}</div>
<div className="flex items-center gap-1">
  <Clock className="h-4 w-4" />
  {formatScheduleEntry({
    Room: schedule.Room,
    Day: schedule.Day,
    Time: schedule.Time,
    Lecture: schedule.Lecture,
    Laboratory: schedule.Laboratory,
    ClassType: schedule.ClassType
  })}
</div>
```

### 4. Dean Analytics
```typescript
// Before
<div>Schedule: {schedule.day} {schedule.time}</div>
<div>Room: {schedule.room}</div>

// After
<div>Schedule: {schedule.room}</div>
<div className="text-sm text-gray-600">
  {formatScheduleEntry({
    Room: schedule.room,
    Day: schedule.day,
    Time: schedule.time,
    Lecture: 0,
    Laboratory: 0,
    ClassType: 'LECTURE'
  })}
</div>
```

## Benefits

### 1. Consistency
- Uniform display format across all components
- Standardized time format (24-hour with proper separators)
- Consistent room and schedule information layout

### 2. User Experience
- Clear, readable schedule information
- Proper visual hierarchy with room names prominent
- Consistent iconography and spacing

### 3. Maintainability
- Centralized formatting logic
- Easy to update format across entire system
- Reduced code duplication

### 4. Accessibility
- Proper semantic structure
- Clear visual hierarchy
- Consistent navigation patterns

## Technical Details

### Data Interface
```typescript
interface ScheduleDisplayData {
  Room?: string;
  Day?: string;
  Time?: string;
  Lecture?: number;
  Laboratory?: number;
  ClassType?: string;
}

interface FormattedScheduleEntry {
  room: string;
  day: string;
  type: string;
  timeRange: string;
}
```

### Time Conversion Logic
- Handles 12-hour and 24-hour formats
- Converts AM/PM to 24-hour format
- Handles various separator formats (-, –, |)
- Properly formats single times and time ranges

### Class Type Logic
- Prioritizes Lecture/Laboratory hours over ClassType
- Falls back to ClassType when hours not available
- Handles combined Lecture+Lab scenarios

## Migration Notes

### Files Updated
- `lib/utils.ts` - Added schedule formatting utilities
- `app/instructor/page.tsx` - Updated schedule displays
- `app/admin/schedules/SchedulesTable.tsx` - Updated table format
- `app/admin/schedules/ScheduleCard.tsx` - Updated card format
- `app/student/page.tsx` - Updated student schedule views
- `app/dean/schedule-analytics/page.tsx` - Updated analytics display

### Backward Compatibility
- All existing schedule data remains compatible
- Graceful handling of missing or malformed data
- Fallback to "N/A" for missing information

## Future Enhancements

### Potential Improvements
1. **Localization**: Support for different date/time formats
2. **Customization**: Allow users to choose display preferences
3. **Accessibility**: Enhanced screen reader support
4. **Print Optimization**: Special formatting for print media

### Integration Points
- Schedule creation/editing forms
- Calendar integrations
- Mobile app displays
- Export/import functionality
