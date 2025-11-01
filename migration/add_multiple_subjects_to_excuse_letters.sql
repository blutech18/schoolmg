-- Migration: Add support for multiple subjects per excuse letter
-- Date: 2025-01-27
-- Description: Updates the excuse letters system to support multiple subjects/schedules per excuse letter

-- Create junction table to link excuse letters with multiple subjects/schedules
-- Use IF NOT EXISTS to avoid errors if table already exists
CREATE TABLE IF NOT EXISTS `excuse_letter_subjects` (
  `ExcuseLetterSubjectID` int(11) NOT NULL AUTO_INCREMENT,
  `ExcuseLetterID` int(11) NOT NULL,
  `ScheduleID` int(11) NOT NULL,
  `SubjectCode` varchar(20) DEFAULT NULL,
  `SubjectTitle` varchar(100) DEFAULT NULL,
  `InstructorName` varchar(100) DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`ExcuseLetterSubjectID`),
  KEY `FK_excuse_letter_subjects_excuse_letter` (`ExcuseLetterID`),
  KEY `FK_excuse_letter_subjects_schedule` (`ScheduleID`),
  CONSTRAINT `FK_excuse_letter_subjects_excuse_letter` FOREIGN KEY (`ExcuseLetterID`) REFERENCES `excuse_letters` (`ExcuseLetterID`) ON DELETE CASCADE,
  CONSTRAINT `FK_excuse_letter_subjects_schedule` FOREIGN KEY (`ScheduleID`) REFERENCES `schedules` (`ScheduleID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate existing data from excuse_letters to the new junction table
-- This preserves existing excuse letters by creating entries in the junction table
-- Use INSERT IGNORE to avoid duplicate key errors if data already exists
INSERT IGNORE INTO `excuse_letter_subjects` (`ExcuseLetterID`, `ScheduleID`, `SubjectCode`, `SubjectTitle`, `InstructorName`)
SELECT 
    `ExcuseLetterID`,
    `ScheduleID`,
    `SubjectCode`,
    `SubjectTitle`,
    `InstructorName`
FROM `excuse_letters`
WHERE `ScheduleID` IS NOT NULL;

-- Update excuse_letters table to add multi-subject support
-- Keep the existing structure for backward compatibility but mark fields as deprecated
-- Use a simple approach to add the column safely
ALTER TABLE `excuse_letters` 
ADD COLUMN IF NOT EXISTS `IsMultiSubject` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indicates if this excuse letter covers multiple subjects';

-- Add comments to existing fields to indicate they're deprecated for new multi-subject letters
-- Note: We'll keep the existing columns as they are to avoid conflicts
-- The columns SubjectCode, SubjectTitle, and InstructorName will remain in their current state
-- for backward compatibility with existing data

-- Update existing excuse letters to mark them as single-subject for backward compatibility
UPDATE `excuse_letters` 
SET `IsMultiSubject` = 0 
WHERE `ScheduleID` IS NOT NULL;

-- Create a view for backward compatibility that includes subject information
-- Use CREATE OR REPLACE to handle if view already exists
CREATE OR REPLACE VIEW `excuse_letters_with_subjects` AS
SELECT 
    el.ExcuseLetterID,
    el.StudentID,
    el.ScheduleID as OriginalScheduleID,
    el.Subject as SubjectTitle,
    el.Reason,
    el.DateFrom,
    el.DateTo,
    el.SubmissionDate,
    el.DeanStatus,
    el.DeanComment,
    el.DeanActionDate,
    el.CoordinatorStatus,
    el.CoordinatorComment,
    el.CoordinatorActionDate,
    el.InstructorStatus,
    el.InstructorComment,
    el.InstructorActionDate,
    el.Status,
    el.IsMultiSubject,
    CASE 
        WHEN el.IsMultiSubject = 1 THEN 'Multiple Subjects'
        ELSE COALESCE(el.SubjectCode, els.SubjectCode)
    END as SubjectCode,
    CASE 
        WHEN el.IsMultiSubject = 1 THEN 'Multiple Subjects'
        ELSE COALESCE(el.SubjectTitle, els.SubjectTitle)
    END as SubjectTitleDisplay,
    CASE 
        WHEN el.IsMultiSubject = 1 THEN 'Multiple Instructors'
        ELSE COALESCE(el.InstructorName, els.InstructorName)
    END as InstructorName,
    COALESCE(el.ScheduleID, els.ScheduleID) as ScheduleID,
    COUNT(els.ExcuseLetterSubjectID) as SubjectCount
FROM `excuse_letters` el
LEFT JOIN `excuse_letter_subjects` els ON el.ExcuseLetterID = els.ExcuseLetterID
GROUP BY el.ExcuseLetterID;

-- Create indexes for better performance
-- Note: If indexes already exist, these statements will show warnings but won't fail
CREATE INDEX `idx_excuse_letter_subjects_excuse_letter` ON `excuse_letter_subjects` (`ExcuseLetterID`);
CREATE INDEX `idx_excuse_letter_subjects_schedule` ON `excuse_letter_subjects` (`ScheduleID`);
CREATE INDEX `idx_excuse_letters_multi_subject` ON `excuse_letters` (`IsMultiSubject`);

-- Add comments to document the migration
-- This migration adds support for multiple subjects per excuse letter
-- The junction table excuse_letter_subjects links excuse letters to multiple schedules
-- Existing data is preserved and marked as single-subject for backward compatibility
-- The view excuse_letters_with_subjects provides a unified interface for both old and new formats

-- Verification queries to check the migration
-- Check if the new table was created successfully
SHOW TABLES LIKE 'excuse_letter_subjects';

-- Check the structure of the new table
SHOW COLUMNS FROM `excuse_letter_subjects`;

-- Check that existing data was migrated correctly
SELECT 
    COUNT(*) as total_excuse_letters,
    COUNT(els.ExcuseLetterSubjectID) as total_subject_links,
    SUM(CASE WHEN el.IsMultiSubject = 1 THEN 1 ELSE 0 END) as multi_subject_letters
FROM `excuse_letters` el
LEFT JOIN `excuse_letter_subjects` els ON el.ExcuseLetterID = els.ExcuseLetterID;

-- Verify the IsMultiSubject column was added
SHOW COLUMNS FROM `excuse_letters` WHERE Field = 'IsMultiSubject';
