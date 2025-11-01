-- Migration: Add CC (Class Cancellation) status to attendance table
-- Date: 2025-01-27
-- Description: Updates the attendance table to support the new CC status for class cancellations

-- Update the Status enum to include 'CC' (Class Cancellation)
ALTER TABLE `attendance` 
MODIFY COLUMN `Status` ENUM('P','A','E','L','D','FA','CC') NOT NULL DEFAULT 'A';

-- Add comment to document the new status
ALTER TABLE `attendance` 
MODIFY COLUMN `Status` ENUM('P','A','E','L','D','FA','CC') NOT NULL DEFAULT 'A' 
COMMENT 'P=Present, A=Absent, E=Excused, L=Late, D=Dropped, FA=Failure due to Absences, CC=Class Cancelled';

-- Optional: Create an index on Status for better query performance
CREATE INDEX `idx_attendance_status` ON `attendance` (`Status`);

-- Optional: Create a view for attendance statistics that excludes CC from calculations
CREATE OR REPLACE VIEW `attendance_stats_view` AS
SELECT 
    StudentID,
    ScheduleID,
    SessionType,
    COUNT(CASE WHEN Status != 'CC' THEN 1 END) as total_sessions,
    COUNT(CASE WHEN Status = 'P' THEN 1 END) as present_count,
    COUNT(CASE WHEN Status = 'A' THEN 1 END) as absent_count,
    COUNT(CASE WHEN Status = 'E' THEN 1 END) as excused_count,
    COUNT(CASE WHEN Status = 'L' THEN 1 END) as late_count,
    COUNT(CASE WHEN Status = 'D' THEN 1 END) as dropped_count,
    COUNT(CASE WHEN Status = 'FA' THEN 1 END) as failed_count,
    COUNT(CASE WHEN Status = 'CC' THEN 1 END) as cancelled_count,
    ROUND(
        (COUNT(CASE WHEN Status = 'P' THEN 1 END) + COUNT(CASE WHEN Status = 'E' THEN 1 END)) * 100.0 / 
        NULLIF(COUNT(CASE WHEN Status != 'CC' THEN 1 END), 0), 
        2
    ) as attendance_percentage
FROM `attendance`
GROUP BY StudentID, ScheduleID, SessionType;

-- Add comments to document the migration
-- This migration adds support for Class Cancellation (CC) status
-- CC records are excluded from attendance percentage calculations
-- Excused (E) status counts as attended (same as Present)
-- The view provides pre-calculated statistics for better performance

-- Verification query to check the migration (simplified version)
-- This query will show the current structure of the attendance table
SHOW COLUMNS FROM `attendance` WHERE Field = 'Status';

-- Alternative verification: Check if CC status is accepted by trying to insert a test record
-- (This will fail if the enum doesn't include 'CC', confirming the migration worked)
-- Uncomment the lines below if you want to test the enum values:
-- INSERT INTO `attendance` (StudentID, ScheduleID, SessionType, Week, Status, Date, RecordedBy) 
-- VALUES (999999, 999999, 'lecture', 1, 'CC', '2025-01-27', 1);
-- DELETE FROM `attendance` WHERE StudentID = 999999 AND ScheduleID = 999999;
