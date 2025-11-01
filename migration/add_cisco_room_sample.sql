-- Migration: Add sample Cisco room for testing seat plan functionality
-- Date: 2025-01-27
-- Description: Adds a sample Cisco room schedule to test the new Cisco room seat plan layouts

-- Insert a sample Cisco room schedule
INSERT INTO `schedules` (
  `ScheduleID`, 
  `SubjectID`, 
  `Course`, 
  `Lecture`, 
  `Laboratory`, 
  `Units`, 
  `InstructorID`, 
  `Section`, 
  `YearLevel`, 
  `Day`, 
  `Time`, 
  `Room`, 
  `TotalSeats`, 
  `SeatCols`, 
  `SeatMap`, 
  `LectureSeatMap`, 
  `LaboratorySeatMap`, 
  `LectureSeatCols`, 
  `LaboratorySeatCols`, 
  `SubjectCode`, 
  `SubjectName`, 
  `SubjectTitle`, 
  `Semester`, 
  `AcademicYear`, 
  `StartDate`, 
  `EndDate`, 
  `IsActive`, 
  `CreatedBy`, 
  `CreatedDate`, 
  `ModifiedDate`, 
  `Status`, 
  `CustomGradingConfig`
) VALUES (
  99, 
  49, -- NET1 subject
  'BSCS', 
  2, 
  3, 
  3, 
  1000, 
  'C409', 
  1, 
  'Thursday', 
  '2:00PM - 5:00PM', 
  'Cisco Lab Room', 
  30, 
  6, -- February 6 columns for Cisco lecture mode
  '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 
  '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 
  '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 
  6, -- Cisco lecture mode: 6 columns
  4, -- Cisco lab mode: 4 columns
  'NET1', 
  'Networking', 
  NULL, 
  '1st', 
  '2025-2026', 
  NULL, 
  NULL, 
  1, 
  NULL, 
  NOW(), 
  NOW(), 
  'active', 
  NULL
);

-- Add comments to document the migration
-- This migration adds a sample Cisco room schedule to test the new seat plan functionality
-- The Cisco room has:
-- - 30 total seats
-- - 6 columns for lecture mode (2-2-2 arrangement)
-- - 4 columns for lab mode (2-2 arrangement)
-- - Room name contains "Cisco" to trigger the special layout

-- Verification query to check the migration
SELECT 
  ScheduleID,
  SubjectCode,
  Room,
  TotalSeats,
  LectureSeatCols,
  LaboratorySeatCols
FROM `schedules` 
WHERE Room LIKE '%Cisco%';
