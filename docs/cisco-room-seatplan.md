# Cisco Room Seat Plan Feature

## Overview
The Cisco Room Seat Plan feature provides specialized seat arrangements for Cisco networking laboratory rooms, supporting both lecture and laboratory modes with distinct layouts.

## Features

### 1. Automatic Room Detection
- Rooms containing "cisco" (case-insensitive) in the room name are automatically detected as Cisco rooms
- Visual indicators (blue badges) are displayed to identify Cisco rooms
- Special layout configurations are applied automatically

### 2. Lecture Mode Layout
- **Arrangement**: 6 columns with 2-2-2 seating arrangement
- **Layout**: Three sections with 2 seats each, separated by aisles
- **Visual**: Left section (seats 1-2), Center section (seats 3-4), Right section (seats 5-6)
- **Rows**: Seats are arranged in rows with proper spacing between sections

### 3. Laboratory Mode Layout
- **Arrangement**: 4 columns with 2-2 seating arrangement
- **Layout**: Two sections with 2 seats each, separated by an aisle
- **Visual**: Left section (seats 1-2), Right section (seats 3-4)
- **Rows**: Seats are arranged in rows with proper spacing between sections

### 4. Print Support
- Cisco room layouts are properly formatted for printing
- Special CSS classes ensure correct spacing and arrangement in printouts
- Room type is clearly indicated in print headers

## Implementation Details

### Room Detection Logic
```typescript
const isCiscoRoom = schedule.Room && schedule.Room.toLowerCase().includes('cisco')
const isCiscoLab = isCiscoRoom && schedule.Room.toLowerCase().includes('lab')
```

### Layout Configuration
- **Lecture Mode**: 6 columns (2-2-2 arrangement)
- **Laboratory Mode**: 4 columns (2-2 arrangement)
- **Standard Rooms**: Use existing configuration (4-5 columns)

### Visual Indicators
- Blue "Cisco Room" badges in the room display
- Special headers in seat plan sections
- Distinct layout styling

## Usage

### For Instructors
1. Navigate to the seat plan management for a schedule
2. If the room contains "cisco" in the name, the special layout will be automatically applied
3. Switch between Lecture and Laboratory tabs to see different arrangements
4. Use the print function to generate properly formatted seat plans

### For Administrators
1. Create schedules with room names containing "cisco" to enable the feature
2. Set appropriate seat counts (recommended: 30 seats for Cisco rooms)
3. The system will automatically apply the correct layout configuration

## Database Requirements

### Sample Cisco Room Schedule
```sql
INSERT INTO schedules (
  Room,
  TotalSeats,
  LectureSeatCols,
  LaboratorySeatCols,
  -- ... other fields
) VALUES (
  'Cisco Lab Room',
  30,
  6, -- Lecture mode: 6 columns
  4, -- Lab mode: 4 columns
  -- ... other values
);
```

## Technical Specifications

### CSS Classes
- `.print-seat-grid-cisco-lecture`: Lecture mode print layout
- `.print-seat-grid-cisco-lab`: Laboratory mode print layout
- `.print-seat-section`: Individual seat sections within Cisco layouts

### Component Updates
- `EnhancedSeatPlanModal.tsx`: Main seat plan component with Cisco support
- `printUtils.ts`: Print functionality with Cisco layout support

## Testing

### Test Cases
1. **Room Detection**: Verify rooms with "cisco" in the name are detected
2. **Layout Rendering**: Confirm correct 2-2-2 (lecture) and 2-2 (lab) arrangements
3. **Print Functionality**: Test print output with proper Cisco room formatting
4. **Tab Switching**: Verify smooth switching between lecture and lab modes
5. **Seat Assignment**: Test seat assignment functionality in Cisco layouts

### Sample Test Room
Use the provided migration file `migration/add_cisco_room_sample.sql` to create a test Cisco room.

## Future Enhancements

### Potential Improvements
1. **Custom Layouts**: Support for other specialized room types
2. **Dynamic Configuration**: Allow administrators to configure custom room layouts
3. **Equipment Integration**: Special handling for equipment-based seating
4. **Accessibility Features**: Enhanced support for accessibility requirements

## Troubleshooting

### Common Issues
1. **Layout Not Applied**: Ensure room name contains "cisco" (case-insensitive)
2. **Print Formatting**: Verify CSS classes are properly loaded
3. **Seat Count Mismatch**: Check that TotalSeats matches the expected layout

### Debug Information
- Check browser console for any JavaScript errors
- Verify room detection logic is working correctly
- Confirm CSS classes are being applied properly
