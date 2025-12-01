-- Create sequences table for safe, lock-free increments
CREATE TABLE IF NOT EXISTS sequences (
  name VARCHAR(100) NOT NULL PRIMARY KEY,
  val INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Helper: NextVal using LAST_INSERT_ID trick for atomic increments
DROP FUNCTION IF EXISTS NextVal;
DELIMITER $$
CREATE FUNCTION NextVal(seq_name VARCHAR(100)) RETURNS INT
NOT DETERMINISTIC
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  INSERT INTO sequences(name, val) VALUES (seq_name, 0)
  ON DUPLICATE KEY UPDATE val = LAST_INSERT_ID(val + 1);
  RETURN LAST_INSERT_ID();
END $$
DELIMITER ;

-- Seed sequences based on current data (idempotent by using GREATEST)
-- UserID ranges
INSERT INTO sequences(name, val) SELECT 'user_student', COALESCE(MAX(UserID), 99999) FROM users WHERE Role = 'student'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(UserID), 99999) FROM users WHERE Role = 'student'));

INSERT INTO sequences(name, val) SELECT 'user_instructor', COALESCE(MAX(UserID), 999) FROM users WHERE Role = 'instructor'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(UserID), 999) FROM users WHERE Role = 'instructor'));

INSERT INTO sequences(name, val) SELECT 'user_admin', COALESCE(MAX(UserID), 0) FROM users WHERE Role IN ('admin','dean','programcoor')
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(UserID), 0) FROM users WHERE Role IN ('admin','dean','programcoor')));

-- Prefixed IDs per role
INSERT INTO sequences(name, val) SELECT 'prefixed_st', COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'st%'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'st%'));

INSERT INTO sequences(name, val) SELECT 'prefixed_ins', COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 4) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'ins%'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 4) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'ins%'));

INSERT INTO sequences(name, val) SELECT 'prefixed_ad', COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'ad%'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'ad%'));

INSERT INTO sequences(name, val) SELECT 'prefixed_dn', COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'dn%'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'dn%'));

INSERT INTO sequences(name, val) SELECT 'prefixed_pc', COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'pc%'
ON DUPLICATE KEY UPDATE val = GREATEST(val, (SELECT COALESCE(MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)), 0) FROM users WHERE PrefixedID LIKE 'pc%'));

-- StudentNumber per academic year (seed from existing)
-- This seeds to the max existing suffix per year.
INSERT INTO sequences(name, val)
SELECT CONCAT('studentnum_', SUBSTRING(StudentNumber, 1, 4)) as name,
       COALESCE(MAX(CAST(SUBSTRING(StudentNumber, 6) AS UNSIGNED)), 0) as val
FROM students
WHERE StudentNumber REGEXP '^[0-9]{4}-[0-9]+'
GROUP BY SUBSTRING(StudentNumber, 1, 4), CONCAT('studentnum_', SUBSTRING(StudentNumber, 1, 4))
ON DUPLICATE KEY UPDATE val = GREATEST(val, VALUES(val));

-- Functions to get next IDs
DROP FUNCTION IF EXISTS GetNextUserID;
DELIMITER $$
CREATE FUNCTION GetNextUserID(role_name VARCHAR(50)) RETURNS INT
NOT DETERMINISTIC
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE next_id INT;
  IF role_name = 'student' THEN
    SET next_id = NextVal('user_student');
    IF next_id < 100000 THEN SET next_id = 100000; END IF;
  ELSEIF role_name = 'instructor' THEN
    SET next_id = NextVal('user_instructor');
    IF next_id < 1000 THEN SET next_id = 1000; END IF;
  ELSE
    SET next_id = NextVal('user_admin');
    IF next_id < 1 THEN SET next_id = 1; END IF;
  END IF;
  RETURN next_id;
END $$
DELIMITER ;

DROP FUNCTION IF EXISTS GetNextPrefixedID;
DELIMITER $$
CREATE FUNCTION GetNextPrefixedID(role_name VARCHAR(50)) RETURNS VARCHAR(50)
NOT DETERMINISTIC
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE prefix VARCHAR(10);
  DECLARE seq_name VARCHAR(100);
  DECLARE n INT;
  SET prefix = CASE role_name
    WHEN 'admin' THEN 'ad'
    WHEN 'instructor' THEN 'ins'
    WHEN 'student' THEN 'st'
    WHEN 'dean' THEN 'dn'
    WHEN 'programcoor' THEN 'pc'
    ELSE 'us' END;
  SET seq_name = CONCAT('prefixed_', prefix);
  SET n = NextVal(seq_name);
  RETURN CONCAT(prefix, n);
END $$
DELIMITER ;

DROP FUNCTION IF EXISTS GetNextStudentNumber;
DELIMITER $$
CREATE FUNCTION GetNextStudentNumber(year_val INT) RETURNS VARCHAR(20)
NOT DETERMINISTIC
MODIFIES SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE seq_name VARCHAR(100);
  DECLARE n INT;
  SET seq_name = CONCAT('studentnum_', year_val);
  SET n = NextVal(seq_name);
  RETURN CONCAT(year_val, '-', LPAD(n, 4, '0'));
END $$
DELIMITER ;

-- OPTIONAL: Uncomment after data cleanup to enforce uniqueness at DB level
-- ALTER TABLE users ADD UNIQUE KEY uq_users_prefixed (PrefixedID);
-- ALTER TABLE students ADD UNIQUE KEY uq_students_prefixed (PrefixedStudentID);
-- ALTER TABLE students ADD UNIQUE KEY uq_students_studentnumber (StudentNumber);

-- Enable UNIQUE constraints to prevent duplicate account numbers and IDs
-- Note: Run data cleanup first if there are existing duplicates
-- These statements will fail gracefully if constraints already exist

-- Add unique constraint on users.PrefixedID
-- Ignore error if constraint already exists
ALTER TABLE users ADD UNIQUE KEY uq_users_prefixed (PrefixedID);

-- Add unique constraint on students.PrefixedStudentID  
-- Ignore error if constraint already exists
ALTER TABLE students ADD UNIQUE KEY uq_students_prefixed (PrefixedStudentID);

-- Add unique constraint on students.StudentNumber
-- Ignore error if constraint already exists
ALTER TABLE students ADD UNIQUE KEY uq_students_studentnumber (StudentNumber);


