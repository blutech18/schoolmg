-- Create table for storing excuse letter file attachments
CREATE TABLE IF NOT EXISTS excuse_letter_files (
  FileID INT AUTO_INCREMENT PRIMARY KEY,
  ExcuseLetterID INT NOT NULL,
  FileName VARCHAR(255) NOT NULL,
  OriginalName VARCHAR(255) NOT NULL,
  FileSize BIGINT NOT NULL,
  FileType VARCHAR(100) NOT NULL,
  FilePath VARCHAR(500) NOT NULL,
  UploadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ExcuseLetterID) REFERENCES excuse_letters(ExcuseLetterID) ON DELETE CASCADE,
  INDEX idx_excuse_letter (ExcuseLetterID),
  INDEX idx_upload_date (UploadDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
