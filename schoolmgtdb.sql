-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 06, 2025 at 08:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `schoolmgtdb`
--

DELIMITER $$
--
-- Functions
--
CREATE DEFINER=`root`@`localhost` FUNCTION `GetNextPrefixedID` (`role_name` VARCHAR(50)) RETURNS VARCHAR(50) CHARSET utf8mb4 COLLATE utf8mb4_general_ci MODIFIES SQL DATA BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `GetNextStudentNumber` (`year_val` INT) RETURNS VARCHAR(20) CHARSET utf8mb4 COLLATE utf8mb4_general_ci MODIFIES SQL DATA BEGIN
  DECLARE seq_name VARCHAR(100);
  DECLARE n INT;
  SET seq_name = CONCAT('studentnum_', year_val);
  SET n = NextVal(seq_name);
  RETURN CONCAT(year_val, '-', LPAD(n, 4, '0'));
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `NextVal` (`seq_name` VARCHAR(100)) RETURNS INT(11) MODIFIES SQL DATA BEGIN
  INSERT INTO sequences(name, val) VALUES (seq_name, 0)
  ON DUPLICATE KEY UPDATE val = LAST_INSERT_ID(val + 1);
  RETURN LAST_INSERT_ID();
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `academic_periods`
--

CREATE TABLE `academic_periods` (
  `PeriodID` int(11) NOT NULL,
  `AcademicYear` varchar(20) NOT NULL,
  `Semester` enum('1st','2nd','summer') NOT NULL,
  `StartDate` date NOT NULL,
  `EndDate` date NOT NULL,
  `IsActive` tinyint(1) DEFAULT 0,
  `IsCurrent` tinyint(1) DEFAULT 0,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `AttendanceID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ScheduleID` int(11) NOT NULL,
  `SessionType` enum('lecture','lab') NOT NULL DEFAULT 'lecture',
  `Week` int(11) NOT NULL CHECK (`Week` >= 1 and `Week` <= 18),
  `Status` enum('P','A','E','L','D','FA','CC') NOT NULL DEFAULT 'A' COMMENT 'P=Present, A=Absent, E=Excused, L=Late, D=Dropped, FA=Failure due to Absences, CC=Class Cancelled',
  `Date` date NOT NULL,
  `Remarks` text DEFAULT NULL,
  `RecordedBy` int(11) NOT NULL,
  `RecordedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `LastModified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`AttendanceID`, `StudentID`, `ScheduleID`, `SessionType`, `Week`, `Status`, `Date`, `Remarks`, `RecordedBy`, `RecordedDate`, `LastModified`) VALUES
(9, 100008, 6, 'lecture', 1, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-12 14:12:13', '2025-10-12 14:12:20'),
(10, 100007, 6, 'lecture', 1, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-12 14:12:14', '2025-10-12 14:12:20'),
(11, 100006, 6, 'lecture', 1, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-12 14:12:15', '2025-10-12 14:12:20'),
(12, 100005, 6, 'lecture', 1, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-12 14:12:16', '2025-10-12 14:12:20'),
(13, 100008, 6, 'lecture', 2, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 2)', 1000, '2025-10-12 14:12:28', '2025-10-12 14:12:28'),
(14, 100006, 6, 'lecture', 2, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 2)', 1000, '2025-10-12 14:12:28', '2025-10-12 14:12:28'),
(15, 100007, 6, 'lecture', 2, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 2)', 1000, '2025-10-12 14:12:28', '2025-10-12 14:12:28'),
(16, 100005, 6, 'lecture', 2, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 2)', 1000, '2025-10-12 14:12:28', '2025-10-12 14:12:28'),
(17, 100007, 6, 'lecture', 3, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 3)', 1000, '2025-10-12 14:12:37', '2025-10-12 14:12:37'),
(18, 100006, 6, 'lecture', 3, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 3)', 1000, '2025-10-12 14:12:37', '2025-10-12 14:12:37'),
(19, 100005, 6, 'lecture', 3, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 3)', 1000, '2025-10-12 14:12:37', '2025-10-12 14:12:37'),
(22, 100007, 6, 'lecture', 4, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 4)', 1000, '2025-10-12 14:12:41', '2025-10-12 14:12:41'),
(23, 100005, 6, 'lecture', 4, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 4)', 1000, '2025-10-12 14:12:41', '2025-10-12 14:12:41'),
(24, 100006, 6, 'lecture', 4, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 4)', 1000, '2025-10-12 14:12:41', '2025-10-12 14:12:41'),
(25, 100005, 6, 'lecture', 6, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 6)', 1000, '2025-10-12 14:12:44', '2025-10-12 14:13:31'),
(27, 100006, 6, 'lecture', 6, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 6)', 1000, '2025-10-12 14:12:44', '2025-10-12 14:13:31'),
(30, 100006, 6, 'lecture', 18, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 18)', 1000, '2025-10-12 14:12:50', '2025-10-12 14:12:50'),
(32, 100005, 6, 'lecture', 18, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 18)', 1000, '2025-10-12 14:12:50', '2025-10-12 14:12:50'),
(33, 100006, 6, 'lecture', 17, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 17)', 1000, '2025-10-12 14:12:54', '2025-10-12 14:12:54'),
(36, 100005, 6, 'lecture', 17, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 17)', 1000, '2025-10-12 14:12:54', '2025-10-12 14:12:54'),
(39, 100006, 6, 'lecture', 15, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 15)', 1000, '2025-10-12 14:13:01', '2025-10-12 14:13:01'),
(40, 100005, 6, 'lecture', 15, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 15)', 1000, '2025-10-12 14:13:01', '2025-10-12 14:13:01'),
(43, 100006, 6, 'lecture', 13, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 13)', 1000, '2025-10-12 14:13:06', '2025-10-12 14:13:06'),
(44, 100005, 6, 'lecture', 13, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 13)', 1000, '2025-10-12 14:13:06', '2025-10-12 14:13:06'),
(47, 100005, 6, 'lecture', 10, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 10)', 1000, '2025-10-12 14:13:10', '2025-10-12 14:13:10'),
(48, 100006, 6, 'lecture', 10, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 10)', 1000, '2025-10-12 14:13:10', '2025-10-12 14:13:10'),
(50, 100006, 6, 'lecture', 9, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 9)', 1000, '2025-10-12 14:13:15', '2025-10-12 14:13:15'),
(51, 100005, 6, 'lecture', 9, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 9)', 1000, '2025-10-12 14:13:15', '2025-10-12 14:13:15'),
(55, 100005, 6, 'lecture', 8, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 8)', 1000, '2025-10-12 14:13:19', '2025-10-12 14:13:19'),
(56, 100006, 6, 'lecture', 8, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 8)', 1000, '2025-10-12 14:13:19', '2025-10-12 14:13:19'),
(58, 100006, 6, 'lecture', 7, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 7)', 1000, '2025-10-12 14:13:26', '2025-10-12 14:13:26'),
(59, 100005, 6, 'lecture', 7, 'P', '2025-10-12', 'Marked as Present by instructor (bulk action for lecture session 7)', 1000, '2025-10-12 14:13:26', '2025-10-12 14:13:26'),
(64, 100006, 6, 'lab', 1, 'E', '2025-10-20', 'Marked as Excused by instructor for lab session 1', 1000, '2025-10-20 14:42:31', '2025-10-20 14:42:31'),
(65, 100005, 6, 'lab', 1, 'E', '2025-10-20', 'Marked as Excused by instructor for lab session 1', 1000, '2025-10-20 14:42:31', '2025-10-20 14:42:31'),
(68, 100008, 6, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:44:43', '2025-10-23 17:55:07'),
(69, 100007, 6, 'lecture', 1, 'L', '2025-10-23', 'Marked as Late by instructor', 1000, '2025-10-23 17:44:43', '2025-10-23 17:55:09'),
(70, 100006, 6, 'lecture', 1, 'E', '2025-10-23', 'Marked as Excused by instructor', 1000, '2025-10-23 17:44:43', '2025-10-23 17:55:14'),
(71, 100005, 6, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:44:43', '2025-10-23 17:55:07'),
(72, 100008, 6, 'lecture', 2, 'L', '2025-10-23', 'Marked as Late by instructor', 1000, '2025-10-23 17:55:23', '2025-10-23 17:55:23'),
(73, 100007, 6, 'lecture', 2, 'L', '2025-10-23', 'Marked as Late by instructor', 1000, '2025-10-23 17:55:23', '2025-10-23 17:55:23'),
(74, 100006, 6, 'lecture', 2, 'A', '2025-10-23', 'Marked as Absent by instructor', 1000, '2025-10-23 17:55:26', '2025-10-23 17:55:26'),
(75, 100008, 15, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:56:26', '2025-10-23 17:56:26'),
(76, 100007, 15, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:56:26', '2025-10-23 17:56:26'),
(77, 100006, 15, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:56:26', '2025-10-23 17:56:26'),
(78, 100005, 15, 'lecture', 1, 'P', '2025-10-23', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-23 17:56:26', '2025-10-23 17:56:26'),
(79, 100008, 6, 'lecture', 1, 'A', '2025-10-24', 'Marked as Absent by instructor', 1000, '2025-10-24 15:40:20', '2025-10-24 17:04:21'),
(80, 100007, 6, 'lecture', 1, 'L', '2025-10-24', 'Marked as Late by instructor', 1000, '2025-10-24 16:24:18', '2025-10-24 17:04:23'),
(81, 100006, 6, 'lecture', 1, 'P', '2025-10-24', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-24 16:24:18', '2025-10-24 16:24:18'),
(82, 100005, 6, 'lecture', 1, 'P', '2025-10-24', 'Marked as Present by instructor (bulk action for lecture session 1)', 1000, '2025-10-24 16:24:18', '2025-10-24 16:24:18'),
(87, 100005, 6, 'lecture', 1, 'CC', '2025-10-25', 'Deded', 1000, '2025-10-25 04:31:54', '2025-10-25 04:40:09'),
(88, 100006, 6, 'lecture', 1, 'CC', '2025-10-25', 'Deded', 1000, '2025-10-25 04:31:54', '2025-10-25 04:40:09'),
(89, 100007, 6, 'lecture', 1, 'CC', '2025-10-25', 'Deded', 1000, '2025-10-25 04:31:54', '2025-10-25 04:40:09'),
(90, 100008, 6, 'lecture', 1, 'CC', '2025-10-25', 'Deded', 1000, '2025-10-25 04:31:54', '2025-10-25 04:40:09'),
(103, 100008, 6, 'lecture', 2, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 04:42:56', '2025-10-25 05:05:58'),
(104, 100007, 6, 'lecture', 2, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 04:42:57', '2025-10-25 05:05:58'),
(105, 100006, 6, 'lecture', 2, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 04:43:04', '2025-10-25 05:05:58'),
(106, 100005, 6, 'lecture', 2, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 04:43:04', '2025-10-25 05:05:58'),
(111, 100007, 15, 'lecture', 1, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 10:48:39', '2025-10-25 10:48:52'),
(112, 100006, 15, 'lecture', 1, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 10:48:40', '2025-10-25 10:48:52'),
(113, 100005, 15, 'lecture', 1, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 10:48:41', '2025-10-25 10:48:52'),
(117, 100008, 15, 'lecture', 1, 'CC', '2025-10-25', 'ASDASD', 1000, '2025-10-25 10:48:52', '2025-10-25 10:48:52'),
(118, 100008, 7, 'lecture', 1, 'E', '2025-10-25', 'Marked as Excused by instructor', 1000, '2025-10-25 10:49:09', '2025-10-25 10:49:09'),
(119, 100007, 7, 'lecture', 1, 'E', '2025-10-25', 'Marked as Excused by instructor', 1000, '2025-10-25 10:49:09', '2025-10-25 10:49:09'),
(120, 100006, 7, 'lecture', 1, 'E', '2025-10-25', 'Marked as Excused by instructor', 1000, '2025-10-25 10:49:10', '2025-10-25 10:49:10'),
(121, 100005, 7, 'lecture', 1, 'E', '2025-10-25', 'Marked as Excused by instructor', 1000, '2025-10-25 10:49:10', '2025-10-25 10:49:10'),
(123, 100007, 6, 'lecture', 3, 'L', '2025-10-26', 'Marked as Late by instructor', 1000, '2025-10-26 02:50:24', '2025-10-26 03:25:12'),
(124, 100006, 6, 'lecture', 3, 'P', '2025-10-26', 'Marked as Present by instructor', 1000, '2025-10-26 02:50:24', '2025-10-26 03:25:13'),
(125, 100005, 6, 'lecture', 3, 'E', '2025-10-26', 'Marked as Excused by instructor', 1000, '2025-10-26 02:50:24', '2025-10-26 03:25:13'),
(324, 100007, 6, 'lecture', 4, 'P', '2025-10-26', 'Marked as Present by instructor', 1000, '2025-10-26 03:19:06', '2025-10-26 03:19:51'),
(417, 100008, 6, 'lecture', 3, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 3)', 1000, '2025-10-26 03:23:46', '2025-10-26 03:25:15'),
(453, 100008, 6, 'lecture', 4, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 4)', 1000, '2025-10-26 03:25:15', '2025-10-26 03:25:15'),
(454, 100008, 6, 'lecture', 6, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 6)', 1000, '2025-10-26 03:25:15', '2025-10-26 03:25:15'),
(455, 100008, 6, 'lecture', 5, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 5)', 1000, '2025-10-26 03:25:15', '2025-10-26 03:25:15'),
(456, 100008, 6, 'lecture', 7, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 7)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(457, 100008, 6, 'lecture', 8, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 8)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(458, 100008, 6, 'lecture', 9, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 9)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(459, 100008, 6, 'lecture', 10, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 10)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(460, 100008, 6, 'lecture', 11, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 11)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(461, 100008, 6, 'lecture', 12, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 12)', 1000, '2025-10-26 03:25:16', '2025-10-26 03:25:16'),
(462, 100008, 6, 'lecture', 13, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 13)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(463, 100008, 6, 'lecture', 14, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 14)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(464, 100008, 6, 'lecture', 15, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 15)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(465, 100008, 6, 'lecture', 16, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 16)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(466, 100008, 6, 'lecture', 17, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 17)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(467, 100008, 6, 'lecture', 18, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lecture session 18)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(468, 100008, 6, 'lab', 1, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 1)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(469, 100008, 6, 'lab', 2, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 2)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(470, 100008, 6, 'lab', 3, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 3)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(471, 100008, 6, 'lab', 4, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 4)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(472, 100008, 6, 'lab', 5, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 5)', 1000, '2025-10-26 03:25:17', '2025-10-26 03:25:17'),
(473, 100008, 6, 'lab', 6, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 6)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(474, 100008, 6, 'lab', 7, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 7)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(475, 100008, 6, 'lab', 8, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 8)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(476, 100008, 6, 'lab', 9, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 9)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(477, 100008, 6, 'lab', 10, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 10)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(478, 100008, 6, 'lab', 11, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 11)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(479, 100008, 6, 'lab', 12, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 12)', 1000, '2025-10-26 03:25:18', '2025-10-26 03:25:18'),
(480, 100008, 6, 'lab', 13, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 13)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(481, 100008, 6, 'lab', 14, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 14)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(482, 100008, 6, 'lab', 15, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 15)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(483, 100008, 6, 'lab', 16, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 16)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(484, 100008, 6, 'lab', 17, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 17)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(485, 100008, 6, 'lab', 18, 'D', '2025-10-26', 'Marked as Dropped by instructor (bulk action for lab session 18)', 1000, '2025-10-26 03:25:19', '2025-10-26 03:25:19'),
(486, 100007, 6, 'lecture', 5, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 5)', 1000, '2025-10-26 03:25:26', '2025-10-26 03:25:26'),
(487, 100007, 6, 'lecture', 6, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 6)', 1000, '2025-10-26 03:25:26', '2025-10-26 03:25:26'),
(488, 100007, 6, 'lecture', 7, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 7)', 1000, '2025-10-26 03:25:27', '2025-10-26 03:25:27'),
(489, 100007, 6, 'lecture', 8, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 8)', 1000, '2025-10-26 03:25:27', '2025-10-26 03:25:27'),
(490, 100007, 6, 'lecture', 9, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 9)', 1000, '2025-10-26 03:25:27', '2025-10-26 03:25:27'),
(491, 100007, 6, 'lecture', 10, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 10)', 1000, '2025-10-26 03:25:27', '2025-10-26 03:25:27'),
(492, 100007, 6, 'lecture', 11, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 11)', 1000, '2025-10-26 03:25:27', '2025-10-26 03:25:27'),
(493, 100007, 6, 'lecture', 12, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 12)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(494, 100007, 6, 'lecture', 13, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 13)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(495, 100007, 6, 'lecture', 15, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 15)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(496, 100007, 6, 'lecture', 14, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 14)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(497, 100007, 6, 'lecture', 16, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 16)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(498, 100007, 6, 'lecture', 17, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 17)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(499, 100007, 6, 'lecture', 18, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lecture session 18)', 1000, '2025-10-26 03:25:28', '2025-10-26 03:25:28'),
(500, 100007, 6, 'lab', 1, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 1)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(501, 100007, 6, 'lab', 3, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 3)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(502, 100007, 6, 'lab', 2, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 2)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(503, 100007, 6, 'lab', 4, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 4)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(504, 100007, 6, 'lab', 5, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 5)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(505, 100007, 6, 'lab', 6, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 6)', 1000, '2025-10-26 03:25:29', '2025-10-26 03:25:29'),
(506, 100007, 6, 'lab', 7, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 7)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(507, 100007, 6, 'lab', 9, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 9)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(508, 100007, 6, 'lab', 8, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 8)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(509, 100007, 6, 'lab', 10, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 10)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(510, 100007, 6, 'lab', 11, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 11)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(511, 100007, 6, 'lab', 12, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 12)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(512, 100007, 6, 'lab', 13, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 13)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(513, 100007, 6, 'lab', 14, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 14)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(514, 100007, 6, 'lab', 15, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 15)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(515, 100007, 6, 'lab', 16, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 16)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(516, 100007, 6, 'lab', 17, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 17)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(517, 100007, 6, 'lab', 18, 'FA', '2025-10-26', 'Marked as Failure due to Absences by instructor (bulk action for lab session 18)', 1000, '2025-10-26 03:25:30', '2025-10-26 03:25:30'),
(518, 100005, 7, 'lecture', 1, 'CC', '2025-10-30', 'asdasd', 1000, '2025-10-30 02:01:06', '2025-10-30 02:01:06'),
(519, 100006, 7, 'lecture', 1, 'CC', '2025-10-30', 'asdasd', 1000, '2025-10-30 02:01:06', '2025-10-30 02:01:06'),
(520, 100007, 7, 'lecture', 1, 'CC', '2025-10-30', 'asdasd', 1000, '2025-10-30 02:01:06', '2025-10-30 02:01:06'),
(521, 100008, 7, 'lecture', 1, 'CC', '2025-10-30', 'asdasd', 1000, '2025-10-30 02:01:06', '2025-10-30 02:01:06'),
(522, 100005, 16, 'lecture', 1, 'CC', '2025-10-30', 'asdasasdasd', 1000, '2025-10-30 04:06:41', '2025-10-30 04:06:41'),
(523, 100006, 16, 'lecture', 1, 'CC', '2025-10-30', 'asdasasdasd', 1000, '2025-10-30 04:06:41', '2025-10-30 04:06:41'),
(524, 100007, 16, 'lecture', 1, 'CC', '2025-10-30', 'asdasasdasd', 1000, '2025-10-30 04:06:41', '2025-10-30 04:06:41'),
(525, 100008, 16, 'lecture', 1, 'CC', '2025-10-30', 'asdasasdasd', 1000, '2025-10-30 04:06:41', '2025-10-30 04:06:41');

-- --------------------------------------------------------

--
-- Stand-in structure for view `attendance_stats_view`
-- (See below for the actual view)
--
CREATE TABLE `attendance_stats_view` (
`StudentID` int(11)
,`ScheduleID` int(11)
,`SessionType` enum('lecture','lab')
,`total_sessions` bigint(21)
,`present_count` bigint(21)
,`absent_count` bigint(21)
,`excused_count` bigint(21)
,`late_count` bigint(21)
,`dropped_count` bigint(21)
,`failed_count` bigint(21)
,`cancelled_count` bigint(21)
,`attendance_percentage` decimal(27,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `LogID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Action` varchar(100) NOT NULL,
  `TableName` varchar(50) NOT NULL,
  `RecordID` int(11) DEFAULT NULL,
  `OldValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`OldValues`)),
  `NewValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`NewValues`)),
  `IPAddress` varchar(45) DEFAULT NULL,
  `UserAgent` text DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `component_total_scores`
--

CREATE TABLE `component_total_scores` (
  `ComponentTotalScoreID` int(11) NOT NULL,
  `SubjectID` int(11) NOT NULL,
  `ComponentName` varchar(50) NOT NULL,
  `TotalScore` decimal(5,2) NOT NULL DEFAULT 100.00,
  `Weight` decimal(5,2) NOT NULL DEFAULT 0.00,
  `Items` int(11) NOT NULL DEFAULT 1,
  `ClassType` varchar(20) NOT NULL DEFAULT 'LECTURE',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Stores editable total scores for grade components per subject and class type';

--
-- Dumping data for table `component_total_scores`
--

INSERT INTO `component_total_scores` (`ComponentTotalScoreID`, `SubjectID`, `ComponentName`, `TotalScore`, `Weight`, `Items`, `ClassType`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 11, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(4, 14, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(6, 16, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(7, 17, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(8, 18, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(9, 19, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(12, 22, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(13, 23, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(14, 25, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(15, 26, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(16, 27, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(17, 28, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(18, 29, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(19, 30, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(20, 31, 'Quiz', 10.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:54:19'),
(21, 32, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(22, 33, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(23, 34, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(24, 35, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(25, 36, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(27, 38, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(29, 40, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(30, 41, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(31, 42, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(32, 44, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(33, 45, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(34, 46, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(35, 47, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(36, 48, 'Quiz', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(37, 49, 'Quiz', 20.00, 60.00, 15, 'LECTURE', '2025-09-16 01:18:19', '2025-09-16 01:18:19'),
(64, 11, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(67, 14, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(69, 16, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(70, 17, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(71, 18, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(72, 19, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(75, 22, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(76, 23, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(77, 25, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(78, 26, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(79, 27, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(80, 28, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(81, 29, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(82, 30, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(83, 31, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(84, 32, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(85, 33, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(86, 34, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(87, 35, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(88, 36, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(90, 38, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(92, 40, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(93, 41, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(94, 42, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(95, 44, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(96, 45, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(97, 46, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(98, 47, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(99, 48, 'Exam', 60.00, 30.00, 1, 'MAJOR', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(100, 50, 'Exam', 60.00, 40.00, 1, 'LECTURE', '2025-09-16 01:18:29', '2025-09-16 01:18:29'),
(132, 22, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(133, 31, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(136, 44, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(137, 45, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(138, 46, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(139, 47, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(140, 48, 'Laboratory', 20.00, 40.00, 5, 'MAJOR', '2025-09-16 01:18:42', '2025-09-16 01:18:42'),
(142, 22, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(143, 31, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(144, 44, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(145, 45, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(146, 46, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(147, 47, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(148, 48, 'OLO', 20.00, 15.00, 5, 'MAJOR', '2025-09-16 01:18:53', '2025-09-16 01:18:53'),
(178, 12, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(179, 12, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(180, 12, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(181, 12, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(182, 13, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(183, 13, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(184, 13, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(185, 13, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(186, 15, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(187, 15, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(188, 15, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(189, 15, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(190, 20, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(191, 20, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(192, 20, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(193, 20, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(194, 21, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(195, 21, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(196, 21, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(197, 21, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(198, 37, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(199, 37, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(200, 37, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(201, 37, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(202, 39, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(203, 39, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(204, 39, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(205, 39, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-09-16 04:18:18', '2025-09-16 04:18:18'),
(206, 19, 'Quiz', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-10-04 18:03:05', '2025-10-04 18:03:05'),
(207, 19, 'Laboratory', 20.00, 30.00, 5, 'LECTURE+LAB', '2025-10-04 18:03:05', '2025-10-04 18:03:05'),
(208, 19, 'OLO', 20.00, 15.00, 5, 'LECTURE+LAB', '2025-10-04 18:03:05', '2025-10-04 18:03:05'),
(209, 19, 'Exam', 60.00, 40.00, 1, 'LECTURE+LAB', '2025-10-04 18:03:05', '2025-10-04 18:03:05');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `CourseID` int(11) NOT NULL,
  `CourseCode` varchar(20) NOT NULL,
  `CourseName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `TotalUnits` int(11) DEFAULT 0,
  `DurationYears` int(11) DEFAULT 4,
  `Status` enum('active','inactive') DEFAULT 'active',
  `CreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `UpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`CourseID`, `CourseCode`, `CourseName`, `Description`, `TotalUnits`, `DurationYears`, `Status`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 'ACT', 'Associate in Computer Technology', 'A two-year program that provides students with fundamental knowledge and skills in computer technology, programming, and information systems.', 72, 2, 'active', '2025-10-04 17:04:50', '2025-10-04 17:04:50'),
(2, 'BLIS', 'Bachelor of Library and Information Science', 'A four-year degree program that prepares students for careers in library science, information management, and knowledge organization.', 144, 4, 'active', '2025-10-04 17:04:50', '2025-10-04 17:04:50'),
(3, 'BSCS', 'Bachelor of Science in Computer Science', 'A four-year program that focuses on the theoretical foundations of computing, algorithms, data structures, and software development.', 144, 4, 'active', '2025-10-04 17:04:50', '2025-10-04 17:04:50'),
(4, 'BSIS', 'Bachelor of Science in Information Science', 'A four-year program that combines computer science with information management, focusing on data analysis, information systems, and technology applications.', 144, 4, 'active', '2025-10-04 17:04:50', '2025-10-04 17:04:50');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `EnrollmentID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ScheduleID` int(11) NOT NULL,
  `EnrollmentDate` date NOT NULL,
  `Status` enum('enrolled','dropped','completed','transferred') DEFAULT 'enrolled',
  `FinalGrade` decimal(5,2) DEFAULT NULL,
  `Remarks` text DEFAULT NULL,
  `EnrolledBy` int(11) DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`EnrollmentID`, `StudentID`, `ScheduleID`, `EnrollmentDate`, `Status`, `FinalGrade`, `Remarks`, `EnrolledBy`, `CreatedDate`, `ModifiedDate`) VALUES
(52, 100005, 6, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:08:48', '2025-10-12 14:08:48'),
(53, 100006, 6, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:08:48', '2025-10-12 14:08:48'),
(54, 100007, 6, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:08:48', '2025-10-12 14:08:48'),
(55, 100008, 6, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:08:48', '2025-10-12 14:08:48'),
(56, 100005, 15, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:08:59', '2025-10-12 14:08:59'),
(57, 100006, 15, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:00', '2025-10-12 14:09:00'),
(58, 100007, 15, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:00', '2025-10-12 14:09:00'),
(59, 100008, 15, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:00', '2025-10-12 14:09:00'),
(60, 100005, 7, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:29', '2025-10-12 14:09:29'),
(61, 100006, 7, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:29', '2025-10-12 14:09:29'),
(62, 100007, 7, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:29', '2025-10-12 14:09:29'),
(63, 100008, 7, '2025-10-12', 'enrolled', NULL, NULL, NULL, '2025-10-12 14:09:29', '2025-10-12 14:09:29'),
(64, 100005, 16, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:09:50', '2025-10-30 02:09:50'),
(65, 100006, 16, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:09:50', '2025-10-30 02:09:50'),
(66, 100007, 16, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:09:50', '2025-10-30 02:09:50'),
(67, 100008, 16, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:09:50', '2025-10-30 02:09:50'),
(68, 100005, 17, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:15:19', '2025-10-30 02:15:19'),
(69, 100006, 17, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:15:19', '2025-10-30 02:15:19'),
(70, 100007, 17, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:15:19', '2025-10-30 02:15:19'),
(71, 100008, 17, '2025-10-30', 'enrolled', NULL, NULL, NULL, '2025-10-30 02:15:19', '2025-10-30 02:15:19');

-- --------------------------------------------------------

--
-- Table structure for table `excuse_letters`
--

CREATE TABLE `excuse_letters` (
  `ExcuseLetterID` int(11) NOT NULL,
  `StudentID` int(11) NOT NULL,
  `ScheduleID` int(11) DEFAULT NULL COMMENT 'DEPRECATED: Use excuse_letter_subjects table for multi-subject support',
  `Subject` varchar(200) NOT NULL,
  `Reason` text NOT NULL,
  `DateFrom` date NOT NULL,
  `DateTo` date NOT NULL,
  `SubjectCode` varchar(20) DEFAULT NULL COMMENT 'DEPRECATED: Use excuse_letter_subjects table for multi-subject support',
  `SubjectTitle` varchar(100) DEFAULT NULL COMMENT 'DEPRECATED: Use excuse_letter_subjects table for multi-subject support',
  `InstructorName` varchar(100) DEFAULT NULL COMMENT 'DEPRECATED: Use excuse_letter_subjects table for multi-subject support',
  `SubmissionDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `DeanStatus` enum('pending','approved','declined') DEFAULT 'pending',
  `DeanComment` text DEFAULT NULL,
  `DeanActionDate` timestamp NULL DEFAULT NULL,
  `CoordinatorStatus` enum('pending','approved','declined') DEFAULT 'pending',
  `CoordinatorComment` text DEFAULT NULL,
  `CoordinatorActionDate` timestamp NULL DEFAULT NULL,
  `InstructorStatus` enum('pending','approved','declined') DEFAULT 'pending',
  `InstructorComment` text DEFAULT NULL,
  `InstructorActionDate` timestamp NULL DEFAULT NULL,
  `Status` enum('pending','approved','declined','partial') DEFAULT 'pending',
  `IsMultiSubject` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Indicates if this excuse letter covers multiple subjects'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `excuse_letters`
--

INSERT INTO `excuse_letters` (`ExcuseLetterID`, `StudentID`, `ScheduleID`, `Subject`, `Reason`, `DateFrom`, `DateTo`, `SubjectCode`, `SubjectTitle`, `InstructorName`, `SubmissionDate`, `DeanStatus`, `DeanComment`, `DeanActionDate`, `CoordinatorStatus`, `CoordinatorComment`, `CoordinatorActionDate`, `InstructorStatus`, `InstructorComment`, `InstructorActionDate`, `Status`, `IsMultiSubject`) VALUES
(15, 100006, 6, 'xzxxz', 'dssadsada', '2025-09-23', '2025-09-29', 'ALGO', 'Data Structures and Algorithms', 'Stephen Curry', '2025-10-12 14:39:48', 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', 0),
(16, 100006, NULL, 'ASDASD', 'ASDAS', '2025-10-25', '2025-10-31', 'Multiple Subjects', 'Multiple Subjects', 'Multiple Instructors', '2025-10-25 11:07:38', 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', 1),
(17, 100006, NULL, 'ASDASDASD', 'ASDASDASD', '2025-10-25', '2025-10-26', 'Multiple Subjects', 'Multiple Subjects', 'Multiple Instructors', '2025-10-25 11:08:11', 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', NULL, NULL, 'pending', 1),
(18, 100006, NULL, 'ASDASDASD', 'ASDASDASDASD', '2025-10-25', '2025-10-26', 'Multiple Subjects', 'Multiple Subjects', 'Multiple Instructors', '2025-10-25 11:10:17', 'pending', NULL, NULL, 'pending', NULL, NULL, 'approved', 'dddddddddddddd', '2025-10-26 04:30:13', 'partial', 1),
(19, 100006, NULL, 'ASDASDASD', 'ASDASD', '2025-10-25', '2025-10-27', 'Multiple Subjects', 'Multiple Subjects', 'Multiple Instructors', '2025-10-25 11:12:21', 'pending', NULL, NULL, 'approved', NULL, '2025-10-26 04:12:38', 'approved', 'asdasdas', '2025-10-26 04:30:05', 'partial', 1),
(20, 100006, NULL, 'asdasdasd', 'asdasdasdas', '2025-10-26', '2025-10-29', 'Multiple Subjects', 'Multiple Subjects', 'Multiple Instructors', '2025-10-26 02:34:29', 'pending', NULL, NULL, 'approved', NULL, '2025-10-26 04:12:21', 'approved', 'dasdasd', '2025-10-26 04:27:03', 'partial', 1);

-- --------------------------------------------------------

--
-- Stand-in structure for view `excuse_letters_with_subjects`
-- (See below for the actual view)
--
CREATE TABLE `excuse_letters_with_subjects` (
`ExcuseLetterID` int(11)
,`StudentID` int(11)
,`OriginalScheduleID` int(11)
,`SubjectTitle` varchar(200)
,`Reason` text
,`DateFrom` date
,`DateTo` date
,`SubmissionDate` timestamp
,`DeanStatus` enum('pending','approved','declined')
,`DeanComment` text
,`DeanActionDate` timestamp
,`CoordinatorStatus` enum('pending','approved','declined')
,`CoordinatorComment` text
,`CoordinatorActionDate` timestamp
,`InstructorStatus` enum('pending','approved','declined')
,`InstructorComment` text
,`InstructorActionDate` timestamp
,`Status` enum('pending','approved','declined','partial')
,`IsMultiSubject` tinyint(1)
,`SubjectCode` varchar(20)
,`SubjectTitleDisplay` varchar(100)
,`InstructorName` varchar(100)
,`ScheduleID` int(11)
,`SubjectCount` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `excuse_letter_files`
--

CREATE TABLE `excuse_letter_files` (
  `FileID` int(11) NOT NULL,
  `ExcuseLetterID` int(11) NOT NULL,
  `FileName` varchar(255) NOT NULL,
  `OriginalName` varchar(255) NOT NULL,
  `FileSize` int(11) NOT NULL,
  `FileType` varchar(100) NOT NULL,
  `FilePath` varchar(500) NOT NULL,
  `UploadDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `excuse_letter_files`
--

INSERT INTO `excuse_letter_files` (`FileID`, `ExcuseLetterID`, `FileName`, `OriginalName`, `FileSize`, `FileType`, `FilePath`, `UploadDate`) VALUES
(6, 14, '14_1759591303452_zartrye4zdo.png', '554042646_1304040531466927_2038606374842211849_n.png', 397973, 'image/png', '/uploads/excuse-letters/14_1759591303452_zartrye4zdo.png', '2025-10-04 15:21:43'),
(7, 15, '15_1760279990878_e203ymvso3m.docx', 'act4 (1).docx', 13946, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/excuse-letters/15_1760279990878_e203ymvso3m.docx', '2025-10-12 14:39:50'),
(8, 15, '15_1760279990943_ms55wtb6erp.docx', 'act3.docx', 15512, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/excuse-letters/15_1760279990943_ms55wtb6erp.docx', '2025-10-12 14:39:50'),
(9, 15, '15_1760279990951_gcci598awmp.docx', 'act2.docx', 13686, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/excuse-letters/15_1760279990951_gcci598awmp.docx', '2025-10-12 14:39:50'),
(10, 15, '15_1760279990958_2t44ctxqytt.docx', 'act1.docx', 14925, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/excuse-letters/15_1760279990958_2t44ctxqytt.docx', '2025-10-12 14:39:50'),
(11, 16, '16_1761390458689_ff621kyig1l.png', 'Screenshot 2025-10-22 230352.png', 77954, 'image/png', '/uploads/excuse-letters/16_1761390458689_ff621kyig1l.png', '2025-10-25 11:07:38'),
(12, 17, '17_1761390491879_aryp6kru5pn.png', 'Screenshot 2025-10-22 230352.png', 77954, 'image/png', '/uploads/excuse-letters/17_1761390491879_aryp6kru5pn.png', '2025-10-25 11:08:11'),
(13, 18, '18_1761390617808_64hrqe6lc7.png', 'Screenshot 2025-10-22 230352.png', 77954, 'image/png', '/uploads/excuse-letters/18_1761390617808_64hrqe6lc7.png', '2025-10-25 11:10:17'),
(14, 19, '19_1761390741913_qzib95xfpfp.png', 'Screenshot 2025-10-22 230352.png', 77954, 'image/png', '/uploads/excuse-letters/19_1761390741913_qzib95xfpfp.png', '2025-10-25 11:12:21'),
(15, 19, '19_1761390741917_kqra3n9ed3l.pdf', 'lreb Receipt.pdf', 1194582, 'application/pdf', '/uploads/excuse-letters/19_1761390741917_kqra3n9ed3l.pdf', '2025-10-25 11:12:21'),
(16, 20, '20_1761446070334_68dffrf1cfi.png', 'Screenshot 2025-10-22 230352.png', 77954, 'image/png', '/uploads/excuse-letters/20_1761446070334_68dffrf1cfi.png', '2025-10-26 02:34:30'),
(17, 20, '20_1761446070337_u53qvtrah4f.docx', 'Y3T1_20CTSYSINL_20Course_20Project_20Specification_20(2).docx', 229580, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '/uploads/excuse-letters/20_1761446070337_u53qvtrah4f.docx', '2025-10-26 02:34:30');

-- --------------------------------------------------------

--
-- Table structure for table `excuse_letter_subjects`
--

CREATE TABLE `excuse_letter_subjects` (
  `ExcuseLetterSubjectID` int(11) NOT NULL,
  `ExcuseLetterID` int(11) NOT NULL,
  `ScheduleID` int(11) NOT NULL,
  `SubjectCode` varchar(20) DEFAULT NULL,
  `SubjectTitle` varchar(100) DEFAULT NULL,
  `InstructorName` varchar(100) DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `excuse_letter_subjects`
--

INSERT INTO `excuse_letter_subjects` (`ExcuseLetterSubjectID`, `ExcuseLetterID`, `ScheduleID`, `SubjectCode`, `SubjectTitle`, `InstructorName`, `CreatedDate`) VALUES
(1, 15, 6, 'ALGO', 'Data Structures and Algorithms', 'Stephen Curry', '2025-10-21 00:50:34'),
(2, 15, 6, 'ALGO', 'Data Structures and Algorithms', 'Stephen Curry', '2025-10-21 00:52:55'),
(3, 15, 6, 'ALGO', 'Data Structures and Algorithms', 'Stephen Curry', '2025-10-21 00:53:44'),
(4, 15, 6, 'ALGO', 'Data Structures and Algorithms', 'Stephen Curry', '2025-10-21 00:55:39'),
(5, 16, 15, 'NET1', NULL, 'Stephen Curry', '2025-10-25 11:07:38'),
(6, 16, 6, 'ALGO', NULL, 'Stephen Curry', '2025-10-25 11:07:38'),
(7, 16, 7, 'OOP1', NULL, 'Stephen Curry', '2025-10-25 11:07:38'),
(8, 17, 6, 'ALGO', NULL, 'Stephen Curry', '2025-10-25 11:08:11'),
(9, 17, 15, 'NET1', NULL, 'Stephen Curry', '2025-10-25 11:08:11'),
(10, 17, 7, 'OOP1', NULL, 'Stephen Curry', '2025-10-25 11:08:11'),
(11, 18, 6, 'ALGO', NULL, 'Stephen Curry', '2025-10-25 11:10:17'),
(12, 18, 15, 'NET1', NULL, 'Stephen Curry', '2025-10-25 11:10:17'),
(13, 18, 7, 'OOP1', NULL, 'Stephen Curry', '2025-10-25 11:10:17'),
(14, 19, 6, 'ALGO', NULL, 'Stephen Curry', '2025-10-25 11:12:21'),
(15, 19, 15, 'NET1', NULL, 'Stephen Curry', '2025-10-25 11:12:21'),
(16, 19, 7, 'OOP1', NULL, 'Stephen Curry', '2025-10-25 11:12:21'),
(17, 20, 6, 'ALGO', NULL, 'Stephen Curry', '2025-10-26 02:34:29'),
(18, 20, 15, 'NET1', NULL, 'Stephen Curry', '2025-10-26 02:34:29'),
(19, 20, 7, 'OOP1', NULL, 'Stephen Curry', '2025-10-26 02:34:29');

-- --------------------------------------------------------

--
-- Table structure for table `grades`
--

CREATE TABLE `grades` (
  `GradeID` int(11) NOT NULL,
  `StudentID` int(11) DEFAULT NULL,
  `ScheduleID` int(11) DEFAULT NULL,
  `GradeValue` decimal(5,2) DEFAULT NULL,
  `Term` enum('midterm','final') NOT NULL DEFAULT 'midterm',
  `Component` varchar(50) NOT NULL DEFAULT 'overall',
  `ItemNumber` int(11) DEFAULT NULL,
  `MaxScore` decimal(5,2) DEFAULT 100.00,
  `Score` decimal(5,2) DEFAULT NULL,
  `Percentage` decimal(5,2) DEFAULT NULL,
  `RecordedBy` int(11) DEFAULT NULL,
  `RecordedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `LastModified` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ManualTermGrade` decimal(5,2) DEFAULT NULL,
  `UseManualGrade` tinyint(1) DEFAULT 0,
  `ManualGradeReason` text DEFAULT NULL,
  `ManualComponentTotal` decimal(5,2) DEFAULT NULL,
  `UseManualComponentTotal` tinyint(1) DEFAULT 0,
  `ManualComponentReason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grades`
--

INSERT INTO `grades` (`GradeID`, `StudentID`, `ScheduleID`, `GradeValue`, `Term`, `Component`, `ItemNumber`, `MaxScore`, `Score`, `Percentage`, `RecordedBy`, `RecordedDate`, `LastModified`, `ManualTermGrade`, `UseManualGrade`, `ManualGradeReason`, `ManualComponentTotal`, `UseManualComponentTotal`, `ManualComponentReason`) VALUES
(31, 100007, 6, NULL, 'midterm', 'Quiz', 1, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(32, 100008, 6, NULL, 'midterm', 'Quiz', 1, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(33, 100006, 6, NULL, 'midterm', 'Quiz', 1, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(34, 100005, 6, NULL, 'midterm', 'Quiz', 1, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(35, 100008, 6, NULL, 'midterm', 'Quiz', 2, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(36, 100008, 6, NULL, 'midterm', 'Quiz', 3, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(37, 100008, 6, NULL, 'midterm', 'Quiz', 4, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(38, 100008, 6, NULL, 'midterm', 'Quiz', 5, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(39, 100008, 6, NULL, 'midterm', 'Quiz', 6, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(40, 100008, 6, NULL, 'midterm', 'Quiz', 7, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(41, 100008, 6, NULL, 'midterm', 'Quiz', 8, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(42, 100008, 6, NULL, 'midterm', 'Quiz', 9, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(43, 100008, 6, NULL, 'midterm', 'Quiz', 10, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(44, 100008, 6, NULL, 'midterm', 'Quiz', 11, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(45, 100008, 6, NULL, 'midterm', 'Quiz', 12, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(46, 100008, 6, NULL, 'midterm', 'Quiz', 13, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(47, 100008, 6, NULL, 'midterm', 'Quiz', 14, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(48, 100008, 6, NULL, 'midterm', 'Quiz', 15, 20.00, 20.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(49, 100008, 6, NULL, 'midterm', 'Exam', 1, 60.00, 60.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(50, 100007, 6, NULL, 'midterm', 'Quiz', 6, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(51, 100006, 6, NULL, 'midterm', 'Quiz', 7, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(52, 100005, 6, NULL, 'midterm', 'Quiz', 9, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(53, 100005, 6, NULL, 'midterm', 'Quiz', 11, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(54, 100006, 6, NULL, 'midterm', 'Quiz', 12, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(55, 100007, 6, NULL, 'midterm', 'Quiz', 13, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(56, 100007, 6, NULL, 'midterm', 'Quiz', 14, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(57, 100006, 6, NULL, 'midterm', 'Quiz', 14, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(58, 100005, 6, NULL, 'midterm', 'Quiz', 14, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(59, 100007, 6, NULL, 'midterm', 'Quiz', 3, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(60, 100006, 6, NULL, 'midterm', 'Quiz', 3, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(61, 100005, 6, NULL, 'midterm', 'Quiz', 3, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(62, 100006, 6, NULL, 'midterm', 'Quiz', 9, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(63, 100007, 6, NULL, 'midterm', 'Quiz', 9, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(64, 100007, 6, NULL, 'midterm', 'Quiz', 11, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(65, 100007, 6, NULL, 'midterm', 'Quiz', 7, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(66, 100007, 6, NULL, 'midterm', 'Quiz', 4, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(67, 100007, 6, NULL, 'midterm', 'Quiz', 5, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(68, 100005, 6, NULL, 'midterm', 'Quiz', 6, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(69, 100005, 6, NULL, 'midterm', 'Quiz', 5, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(70, 100005, 6, NULL, 'midterm', 'Quiz', 4, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(71, 100005, 6, NULL, 'midterm', 'Quiz', 2, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(72, 100005, 6, NULL, 'midterm', 'Quiz', 8, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(73, 100005, 6, NULL, 'midterm', 'Quiz', 15, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(74, 100007, 6, NULL, 'midterm', 'Quiz', 15, 20.00, 15.00, 75.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(75, 100007, 6, NULL, 'midterm', 'Exam', 1, 60.00, 60.00, 100.00, 1000, '2025-10-12 14:37:09', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(76, 100006, 6, NULL, 'midterm', 'Exam', 1, 60.00, 60.00, 100.00, 1000, '2025-10-12 14:37:24', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL),
(77, 100005, 6, NULL, 'midterm', 'Exam', 1, 60.00, 59.00, 98.33, 1000, '2025-10-12 14:37:24', '2025-10-12 14:37:24', NULL, 0, NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `grading_configs`
--

CREATE TABLE `grading_configs` (
  `ConfigID` int(11) NOT NULL,
  `ClassType` enum('lecture-only','lecture-lab','nstp','cisco') NOT NULL,
  `Term` enum('midterm','final') NOT NULL,
  `Component` varchar(50) NOT NULL,
  `Weight` decimal(5,2) NOT NULL,
  `MaxItems` int(11) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grading_configs`
--

INSERT INTO `grading_configs` (`ConfigID`, `ClassType`, `Term`, `Component`, `Weight`, `MaxItems`, `Description`, `IsActive`) VALUES
(1, 'nstp', 'midterm', 'quizzes', 60.00, 15, 'Quizzes 1-15 for NSTP midterm', 1),
(2, 'nstp', 'midterm', 'exam', 40.00, 1, 'Midterm exam for NSTP', 1),
(3, 'nstp', 'final', 'quizzes', 60.00, 15, 'Quizzes 1-15 for NSTP final', 1),
(4, 'nstp', 'final', 'exam', 40.00, 1, 'Final exam for NSTP', 1),
(5, 'lecture-only', 'midterm', 'quizzes', 60.00, 15, 'Quizzes 1-15 for lecture-only midterm', 1),
(6, 'lecture-only', 'midterm', 'exam', 40.00, 1, 'Midterm exam for lecture-only', 1),
(7, 'lecture-only', 'final', 'quizzes', 60.00, 15, 'Quizzes 1-15 for lecture-only final', 1),
(8, 'lecture-only', 'final', 'exam', 40.00, 1, 'Final exam for lecture-only', 1),
(9, 'lecture-lab', 'midterm', 'quizzes', 15.00, 5, 'Quizzes 1-5 for lecture-lab midterm', 1),
(10, 'lecture-lab', 'midterm', 'laboratory', 30.00, 5, 'Laboratory 1-5 for lecture-lab midterm', 1),
(11, 'lecture-lab', 'midterm', 'olo', 15.00, 5, 'Other Learning Outcomes 1-5 for lecture-lab midterm', 1),
(12, 'lecture-lab', 'midterm', 'exam', 40.00, 1, 'Midterm exam for lecture-lab', 1),
(13, 'lecture-lab', 'final', 'quizzes', 15.00, 5, 'Quizzes 1-5 for lecture-lab final', 1),
(14, 'lecture-lab', 'final', 'laboratory', 30.00, 5, 'Laboratory 1-5 for lecture-lab final', 1),
(15, 'lecture-lab', 'final', 'olo', 15.00, 5, 'Other Learning Outcomes 1-5 for lecture-lab final', 1),
(16, 'lecture-lab', 'final', 'exam', 40.00, 1, 'Final exam for lecture-lab', 1),
(17, 'cisco', 'midterm', 'quizzes', 15.00, 5, 'Quizzes 1-5 for Cisco midterm', 1),
(18, 'cisco', 'midterm', 'laboratory', 40.00, 5, 'Laboratory 1-5 for Cisco midterm', 1),
(19, 'cisco', 'midterm', 'olo', 15.00, 5, 'Other Learning Outcomes 1-5 for Cisco midterm', 1),
(20, 'cisco', 'midterm', 'exam', 30.00, 1, 'Midterm exam for Cisco', 1),
(21, 'cisco', 'final', 'quizzes', 15.00, 5, 'Quizzes 1-5 for Cisco final', 1),
(22, 'cisco', 'final', 'laboratory', 40.00, 5, 'Laboratory 1-5 for Cisco final', 1),
(23, 'cisco', 'final', 'olo', 15.00, 5, 'Other Learning Outcomes 1-5 for Cisco final', 1),
(24, 'cisco', 'final', 'exam', 30.00, 1, 'Final exam for Cisco', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `NotificationID` int(11) NOT NULL,
  `UserID` int(11) NOT NULL,
  `Title` varchar(200) NOT NULL,
  `Message` text NOT NULL,
  `Type` enum('info','warning','success','error') DEFAULT 'info',
  `RelatedTable` varchar(50) DEFAULT NULL,
  `RelatedID` int(11) DEFAULT NULL,
  `IsRead` tinyint(1) DEFAULT 0,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `ScheduleID` int(11) NOT NULL,
  `SubjectID` int(11) DEFAULT NULL,
  `Course` varchar(100) DEFAULT NULL,
  `Lecture` int(11) NOT NULL,
  `Laboratory` int(11) NOT NULL,
  `Units` int(11) NOT NULL,
  `InstructorID` int(11) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `YearLevel` int(11) DEFAULT NULL,
  `Day` varchar(20) DEFAULT NULL,
  `Time` varchar(20) DEFAULT NULL,
  `Room` varchar(50) DEFAULT NULL,
  `TotalSeats` int(11) NOT NULL,
  `SeatCols` int(11) NOT NULL,
  `SeatMap` varchar(255) NOT NULL,
  `LectureSeatMap` text DEFAULT NULL,
  `LaboratorySeatMap` text DEFAULT NULL,
  `LectureSeatCols` int(11) DEFAULT NULL,
  `LaboratorySeatCols` int(11) DEFAULT NULL,
  `SubjectCode` varchar(20) DEFAULT NULL,
  `SubjectName` varchar(200) DEFAULT NULL,
  `SubjectTitle` varchar(200) DEFAULT NULL,
  `Semester` enum('1st','2nd','summer') DEFAULT '1st',
  `AcademicYear` varchar(20) DEFAULT NULL,
  `StartDate` date DEFAULT NULL,
  `EndDate` date DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1,
  `CreatedBy` int(11) DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Status` enum('active','inactive','completed') DEFAULT 'active',
  `CustomGradingConfig` text DEFAULT NULL COMMENT 'JSON configuration for custom grading systems when ClassType is "custom"'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`ScheduleID`, `SubjectID`, `Course`, `Lecture`, `Laboratory`, `Units`, `InstructorID`, `Section`, `YearLevel`, `Day`, `Time`, `Room`, `TotalSeats`, `SeatCols`, `SeatMap`, `LectureSeatMap`, `LaboratorySeatMap`, `LectureSeatCols`, `LaboratorySeatCols`, `SubjectCode`, `SubjectName`, `SubjectTitle`, `Semester`, `AcademicYear`, `StartDate`, `EndDate`, `IsActive`, `CreatedBy`, `CreatedDate`, `ModifiedDate`, `Status`, `CustomGradingConfig`) VALUES
(6, 13, 'BSCS', 2, 0, 3, 1000, 'C408', 1, 'Monday', '5:00PM - 7:00PM', 'R201 CLAB1', 40, 4, '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', '[100007,100008,0,0,0,0,0,0,0,0,0,0,100006,100005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', NULL, 4, 2, 'ALGO', 'Data Structures and Algorithms', NULL, '1st', '2025-2026', NULL, NULL, 1, NULL, '2025-10-12 13:37:14', '2025-10-25 10:01:32', 'active', NULL),
(7, 14, 'BSCS', 2, 3, 3, 1000, 'C408', 1, 'Tuesday', '10:00-12:00', 'R201 CLAB1', 40, 2, '[100007,100005,100008,100006,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', NULL, '[100007,100005,100006,100008,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 4, 2, 'OOP1', 'Object-Oriented Programming', NULL, '1st', '2025-2026', NULL, NULL, 1, NULL, '2025-10-12 13:38:15', '2025-10-25 10:33:31', 'active', NULL),
(15, 49, 'BSCS', 8, 0, 3, 1000, 'C408', 1, 'Wednesday', '7:00AM - 10:00AM', 'L404', 40, 2, '[100007,100006,100008,100005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', NULL, '[100007,100008,100006,100005,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]', 4, 4, 'NET1', 'Networking', NULL, '1st', '2025-2026', NULL, NULL, 1, NULL, '2025-10-12 14:03:24', '2025-10-25 10:16:25', 'active', NULL),
(16, 47, 'BSIS', 3, 3, 3, 1000, '3', 2, 'Thursday', '8:00-10:00', '123', 40, 4, '', NULL, NULL, 4, 2, 'PHILHIS', 'Philippine History', NULL, '2nd', '2024-2025', NULL, NULL, 1, NULL, '2025-10-30 02:06:02', '2025-10-30 02:06:02', 'active', NULL),
(17, 50, 'BLIS', 3, 3, 3, 1000, 'A', 2, 'Monday', '10:00-12:00', '2', 40, 4, '', NULL, NULL, 4, 2, 'OJT', 'OJT', NULL, '1st', '2024-2025', NULL, NULL, 1, NULL, '2025-10-30 02:09:14', '2025-10-30 02:09:14', 'active', NULL),
(18, 14, 'BSCS', 3, 3, 3, 1000, '2', 2, 'Friday', '10:00-12:00', '123', 40, 4, '', NULL, NULL, 4, 2, 'OOP1', 'Object-Oriented Programming', NULL, 'summer', '2024-2025', NULL, NULL, 1, NULL, '2025-10-30 02:15:50', '2025-10-30 02:15:50', 'active', NULL),
(19, 16, 'ACT', 3, 3, 3, 1000, 'A', 3, 'Wednesday', '10:00-12:00', '123333', 40, 4, '', NULL, NULL, 4, 2, 'SOFTENG1', 'Software Engineering', NULL, '2nd', '2024-2025', NULL, NULL, 1, NULL, '2025-10-30 02:18:45', '2025-10-30 02:18:45', 'active', NULL),
(20, 13, 'BLIS', 3, 3, 3, 1001, '4', 4, 'Saturday', '8:00-10:00', '3', 40, 4, '', NULL, NULL, 4, 2, 'ALGO', 'Data Structures and Algorithms', NULL, '2nd', '2024-2025', NULL, NULL, 1, NULL, '2025-10-30 02:22:57', '2025-10-30 02:22:57', 'active', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sequences`
--

CREATE TABLE `sequences` (
  `name` varchar(100) NOT NULL,
  `val` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sequences`
--

INSERT INTO `sequences` (`name`, `val`) VALUES
('prefixed_ad', 1),
('prefixed_dn', 1),
('prefixed_ins', 6),
('prefixed_pc', 1),
('prefixed_st', 10),
('studentnum_2025', 8),
('user_admin', 5),
('user_instructor', 1005),
('user_student', 100009);

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `StudentID` int(11) NOT NULL,
  `PrefixedStudentID` varchar(20) DEFAULT NULL,
  `StudentNumber` varchar(20) DEFAULT NULL,
  `FirstName` varchar(50) DEFAULT NULL,
  `LastName` varchar(50) DEFAULT NULL,
  `MiddleName` varchar(50) DEFAULT NULL,
  `Sex` enum('Male','Female') DEFAULT NULL,
  `DateOfBirth` date DEFAULT NULL,
  `ContactNumber` varchar(20) DEFAULT NULL,
  `EmailAddress` varchar(100) DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `GuardianName` varchar(100) DEFAULT NULL,
  `GuardianContact` varchar(20) DEFAULT NULL,
  `IsPWD` enum('Yes','No') DEFAULT 'No',
  `Status` enum('active','inactive','graduated','dropped') DEFAULT 'active',
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `Course` varchar(100) DEFAULT NULL,
  `YearLevel` int(11) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `DateOfEnrollment` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`StudentID`, `PrefixedStudentID`, `StudentNumber`, `FirstName`, `LastName`, `MiddleName`, `Sex`, `DateOfBirth`, `ContactNumber`, `EmailAddress`, `Address`, `GuardianName`, `GuardianContact`, `IsPWD`, `Status`, `CreatedDate`, `ModifiedDate`, `Course`, `YearLevel`, `Section`, `DateOfEnrollment`) VALUES
(100005, 'st6', '2025-0006', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'No', 'active', '2025-10-12 13:29:43', '2025-10-12 13:32:15', 'BLIS', 1, 'C408', '2025-10-11'),
(100006, 'st7', '2025-0006', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'No', 'active', '2025-10-12 13:31:23', '2025-10-12 13:31:23', 'BSCS', 1, 'C-408', '2025-10-12'),
(100007, 'st8', '2025-0007', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'No', 'active', '2025-10-12 13:32:02', '2025-10-12 13:32:02', 'BSCS', 1, 'C408', '2025-10-12'),
(100008, 'st9', '2025-0008', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'No', 'active', '2025-10-12 13:33:02', '2025-10-12 13:33:02', 'BSCS', 1, 'C408', '2025-10-12'),
(100009, 'st10', '2025-0005', NULL, NULL, NULL, NULL, NULL, '09123456783', NULL, 'asdasdasdasdas', NULL, NULL, 'No', 'active', '2025-10-30 03:55:21', '2025-10-30 03:55:21', 'ACT', 3, 'A', '2025-10-14');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `SubjectID` int(11) NOT NULL,
  `SubjectCode` varchar(20) NOT NULL,
  `SubjectName` varchar(200) NOT NULL,
  `Description` text DEFAULT NULL,
  `Units` int(11) NOT NULL DEFAULT 3,
  `LectureHours` int(11) DEFAULT 0,
  `LaboratoryHours` int(11) DEFAULT 0,
  `Department` varchar(100) DEFAULT NULL,
  `PreRequisites` text DEFAULT NULL,
  `YearLevel` int(11) DEFAULT NULL,
  `Semester` enum('1st','2nd','summer') DEFAULT '1st',
  `IsActive` tinyint(1) DEFAULT 1,
  `InstructorID` int(11) DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ClassType` enum('LECTURE','LECTURE+LAB','MAJOR','NSTP','OJT') DEFAULT 'LECTURE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`SubjectID`, `SubjectCode`, `SubjectName`, `Description`, `Units`, `LectureHours`, `LaboratoryHours`, `Department`, `PreRequisites`, `YearLevel`, `Semester`, `IsActive`, `InstructorID`, `CreatedDate`, `ModifiedDate`, `ClassType`) VALUES
(13, 'ALGO', 'Data Structures and Algorithms', 'Study of fundamental data structures and algorithms. Includes arrays, linked lists, stacks, queues, trees, and sorting algorithms.', 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-08-03 07:28:12', '2025-10-12 13:22:13', 'LECTURE'),
(14, 'OOP1', 'Object-Oriented Programming', 'Principles of object-oriented programming including encapsulation, inheritance, polymorphism, and design patterns.', 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-08-03 07:28:12', '2025-10-12 13:22:41', 'LECTURE+LAB'),
(16, 'SOFTENG1', 'Software Engineering', 'Software development methodologies, project management, testing, and maintenance of large software systems.', 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-08-03 07:28:13', '2025-10-12 13:23:02', 'LECTURE+LAB'),
(47, 'PHILHIS', 'Philippine History', 'Study of Philippine history from pre-colonial times to the present, emphasizing national identity and heritage.', 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-08-03 07:28:19', '2025-10-12 13:22:02', 'LECTURE'),
(49, 'NET1', 'Networking', NULL, 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-10-12 13:52:51', '2025-10-12 13:52:51', 'MAJOR'),
(50, 'OJT', 'OJT', 'sadsadada', 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-10-12 13:53:55', '2025-10-12 13:53:55', 'OJT'),
(51, 'NSTP1', 'NSTP', NULL, 3, 0, 0, NULL, NULL, NULL, '1st', 1, NULL, '2025-10-12 13:59:06', '2025-10-12 13:59:06', 'NSTP');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `SettingID` int(11) NOT NULL,
  `SettingKey` varchar(100) NOT NULL,
  `SettingValue` text NOT NULL,
  `Description` text DEFAULT NULL,
  `ModifiedBy` int(11) DEFAULT NULL,
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`SettingID`, `SettingKey`, `SettingValue`, `Description`, `ModifiedBy`, `ModifiedDate`) VALUES
(1, 'current_academic_year', '2024-2025', 'Current academic year', NULL, '2025-07-27 04:51:40'),
(2, 'current_semester', '1st', 'Current semester', NULL, '2025-07-27 04:51:40'),
(3, 'attendance_weeks', '18', 'Number of weeks for attendance tracking', NULL, '2025-07-27 04:51:40'),
(4, 'excuse_letter_file_types', 'doc,docx,pdf,png,jpg,jpeg', 'Allowed file types for excuse letters', NULL, '2025-07-27 04:51:40'),
(5, 'max_file_size_mb', '10', 'Maximum file size in MB for uploads', NULL, '2025-07-27 04:51:40'),
(6, 'grading_scale_passing', '75', 'Minimum passing grade', NULL, '2025-07-27 04:51:46'),
(7, 'grading_scale_excellent', '90', 'Minimum grade for excellent rating', NULL, '2025-07-27 04:51:46'),
(8, 'attendance_required_percentage', '75', 'Required attendance percentage to pass', NULL, '2025-07-27 04:51:46'),
(9, 'excuse_letter_approval_required', 'all', 'Approval requirement: all, majority, or any', NULL, '2025-07-27 04:51:46'),
(10, 'file_upload_max_size', '10485760', 'Maximum file upload size in bytes (10MB)', NULL, '2025-07-27 04:51:46'),
(11, 'academic_calendar_weeks', '18', 'Number of weeks in academic calendar', NULL, '2025-07-27 04:51:46'),
(12, 'grade_submission_deadline_days', '7', 'Days before deadline for grade submission', NULL, '2025-07-27 04:51:46'),
(13, 'attendance_late_minutes', '15', 'Minutes after which student is marked late', NULL, '2025-07-27 04:51:46');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `PrefixedID` varchar(20) DEFAULT NULL,
  `LastName` varchar(50) DEFAULT NULL,
  `FirstName` varchar(50) DEFAULT NULL,
  `MiddleName` varchar(50) DEFAULT NULL,
  `EmailAddress` varchar(100) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `Sex` varchar(50) DEFAULT NULL,
  `Role` varchar(50) DEFAULT 'user',
  `Status` varchar(50) DEFAULT 'active',
  `IsPWD` varchar(50) DEFAULT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Position` varchar(100) DEFAULT NULL,
  `ContactNumber` varchar(20) DEFAULT NULL,
  `Address` text DEFAULT NULL,
  `DateHired` date DEFAULT NULL,
  `LastLogin` timestamp NULL DEFAULT NULL,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp(),
  `ModifiedDate` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `PrefixedID`, `LastName`, `FirstName`, `MiddleName`, `EmailAddress`, `Password`, `Sex`, `Role`, `Status`, `IsPWD`, `Department`, `Position`, `ContactNumber`, `Address`, `DateHired`, `LastLogin`, `CreatedDate`, `ModifiedDate`) VALUES
(3, 'pc1', 'Lim', 'Samantha', 'Grace', 'progcoor@cca.edu.ph', 'sha256$3$77F919B0FFF753C0A6169C8ADFE2E7A570321D7009894D9D121BA77E2684F647', 'Female', 'programcoor', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-03 06:36:07', '2025-10-30 03:57:19'),
(4, 'ad1', 'Delos Reyes', 'Miguel', 'Jose', 'admin@cca.edu.ph', 'sha256$4$12D27E106AF46B4B9CA8772D97F1855329A420D873CA738B7B11C68D285CA71D', 'Male', 'admin', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-03 06:36:07', '2025-10-30 03:57:19'),
(5, 'dn1', 'Dean', 'James', 'Lebron', 'dean@cca.edu.ph', 'sha256$5$FC1F09AB08EBDD072EA6DA53A5691ABCC18C9163B1BE1F0921A5ADB50E3F5077', 'Male', 'dean', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-08-03 06:36:07', '2025-10-30 03:57:19'),
(1000, 'ins1', 'Curry', 'Stephen', 'Wardell', 'curry@cca.edu.ph', 'sha256$1000$95E2C863C620AEDE269561DDEEB2217E38E29BFE0897D16F05DC1C45509FDB6D', 'Male', 'instructor', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-09-13 17:08:39', '2025-10-30 03:57:19'),
(100005, 'st6', 'Acopio', 'Ross Jhem', '', 'racopio22-0002@cca.edu..ph', 'sha256$100005$57C0B07754FA14FC0B1E6F20AABECC4D70A20038ACD6EFCA8A2DFFDFD64EF9C0', 'Female', 'student', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-12 13:29:43', '2025-10-30 03:57:19'),
(100006, 'st7', 'Zapanta', 'Ricci Neil', '', 'rzapanta22-0504@cca.edu.ph', 'sha256$100006$E4A12DA0027F933AFAFB14A1E4A3C95B0813D4987DE66759371C9E6F4E978408', 'Male', 'student', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-12 13:31:23', '2025-10-30 03:57:19'),
(100007, 'st8', 'Dela Cruz', 'John Edson', '', 'edson22-0003@cca.edu.ph', 'sha256$100007$351C0E7721D3551064EB63B5D09935CE0DCFE88E8E1244C3D9B9CB2C4D654C2D', 'Male', 'student', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-12 13:32:02', '2025-10-30 03:57:19'),
(100008, 'st9', 'Cacatian', 'Kurt', '', 'kcacatian22-0004@cca.edu.ph', 'sha256$100008$49693E0E199483713E351C1580979F5585AB7D48FF601E289675D9D3264290C1', 'Male', 'student', 'active', 'No', NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-12 13:33:02', '2025-10-30 03:57:19'),
(1001, 'ins2', 'James', 'Bronny', 'D', 'bronny@cca.edu.ph', 'sha256$1001$84D679AAD761816864D244BC1249292F77B4E3AAC0C9C5D4CA3758ED32465A62', 'Male', 'instructor', 'active', 'No', NULL, NULL, '09123456781', NULL, NULL, NULL, '2025-10-30 01:39:08', '2025-10-30 03:57:19'),
(1002, 'ins3', 'Bronn', 'Wardell', 'S', 'wardell@cca.edu.ph', 'sha256$1002$1AF2D9FB1B3A83E9D1D008935BE1A3BFDA36C8E35970E98D35A615019DB054BA', 'Male', 'instructor', 'active', 'No', NULL, NULL, '09123456782', NULL, NULL, NULL, '2025-10-30 01:41:16', '2025-10-30 03:57:19'),
(1003, 'ins4', 'Mae', 'Krystal', 'S', 'krystal@cca.edu.ph', 'sha256$1003$28B354AA9F4AC9B88DDFDA1C3787940CFC831DD57AEAE41367CB1F331CF8042A', 'Male', 'instructor', 'active', 'No', NULL, NULL, '09123456782', NULL, NULL, NULL, '2025-10-30 01:43:17', '2025-10-30 03:57:19'),
(1004, 'ins5', 'Yulo', 'Carlos', 'Z', 'carlos@cca.edu.ph', 'sha256$1004$D8A14D67995D2CF22114AEA4BE343B4456CA5CDCE644DED1F80FDA00C3C7EA38', 'Female', 'instructor', 'active', 'No', NULL, NULL, '09123456781', NULL, NULL, NULL, '2025-10-30 01:55:05', '2025-10-30 03:57:19'),
(1005, 'ins6', 'Flagg', 'Cooper', 'D', 'cooper@cca.edu.ph', 'sha256$1005$1FFBF2C48B47C18CD3A98E48A72228C3351FA3A7162F0E10930ADE417DCA629F', 'Male', 'instructor', 'active', 'No', NULL, NULL, '09123456782', NULL, NULL, NULL, '2025-10-30 01:58:38', '2025-10-30 03:57:19'),
(100009, 'st10', 'Jokic', 'Nikola', 'D', 'nikola@cca.edu.ph', 'scrypt$tvX9MyoDkh2NW5ry+d+rng==$brjFKu4X8msHGUPiDFpb1b1D4JoOW+PQuZMZQgz0ROtYv3DTS+MEZ1IBikKaPuVPCE1CC5HvRKG+/MI8RkHbcg==', 'Male', 'student', 'active', 'No', NULL, NULL, '09123456783', NULL, NULL, NULL, '2025-10-30 03:55:21', '2025-10-30 03:55:21');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `RoleID` int(11) NOT NULL,
  `RoleName` varchar(50) NOT NULL,
  `DisplayName` varchar(100) NOT NULL,
  `Description` text DEFAULT NULL,
  `Permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`Permissions`)),
  `IsActive` tinyint(1) DEFAULT 1,
  `CreatedDate` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`RoleID`, `RoleName`, `DisplayName`, `Description`, `Permissions`, `IsActive`, `CreatedDate`) VALUES
(1, 'admin', 'Administrator', 'Full system access - can manage all users, subjects, attendance, and grades', '{\"users\": [\"create\", \"read\", \"update\", \"delete\"], \"subjects\": [\"create\", \"read\", \"update\", \"delete\"], \"schedules\": [\"create\", \"read\", \"update\", \"delete\"], \"grades\": [\"create\", \"read\", \"update\", \"delete\"], \"attendance\": [\"create\", \"read\", \"update\", \"delete\"], \"excuse_letters\": [\"read\", \"update\"], \"system\": [\"manage\"]}', 1, '2025-07-27 04:51:46'),
(2, 'dean', 'Dean', 'Can monitor student performance, view attendance and grading per subject', '{\"students\": [\"read\"], \"grades\": [\"read\"], \"attendance\": [\"read\"], \"excuse_letters\": [\"read\", \"update\"], \"schedules\": [\"read\"], \"reports\": [\"read\"]}', 1, '2025-07-27 04:51:46'),
(3, 'programcoor', 'Program Coordinator', 'Can view excuse letters and approve/decline them; can monitor student data', '{\"students\": [\"read\"], \"excuse_letters\": [\"read\", \"update\"], \"attendance\": [\"read\"], \"grades\": [\"read\"], \"schedules\": [\"read\"]}', 1, '2025-07-27 04:51:46'),
(4, 'instructor', 'Instructor', 'Can access assigned subjects only; can manage attendance and grades', '{\"grades\": [\"create\", \"read\", \"update\"], \"attendance\": [\"create\", \"read\", \"update\"], \"excuse_letters\": [\"read\", \"update\"], \"schedules\": [\"read\"], \"students\": [\"read\"]}', 1, '2025-07-27 04:51:46'),
(5, 'student', 'Student', 'Can view own grades, attendance, and submit excuse letters', '{\"grades\": [\"read_own\"], \"attendance\": [\"read_own\"], \"excuse_letters\": [\"create\", \"read_own\"], \"schedules\": [\"read_own\"]}', 1, '2025-07-27 04:51:46');

-- --------------------------------------------------------

--
-- Structure for view `attendance_stats_view`
--
DROP TABLE IF EXISTS `attendance_stats_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `attendance_stats_view`  AS SELECT `attendance`.`StudentID` AS `StudentID`, `attendance`.`ScheduleID` AS `ScheduleID`, `attendance`.`SessionType` AS `SessionType`, count(case when `attendance`.`Status` <> 'CC' then 1 end) AS `total_sessions`, count(case when `attendance`.`Status` = 'P' then 1 end) AS `present_count`, count(case when `attendance`.`Status` = 'A' then 1 end) AS `absent_count`, count(case when `attendance`.`Status` = 'E' then 1 end) AS `excused_count`, count(case when `attendance`.`Status` = 'L' then 1 end) AS `late_count`, count(case when `attendance`.`Status` = 'D' then 1 end) AS `dropped_count`, count(case when `attendance`.`Status` = 'FA' then 1 end) AS `failed_count`, count(case when `attendance`.`Status` = 'CC' then 1 end) AS `cancelled_count`, round((count(case when `attendance`.`Status` = 'P' then 1 end) + count(case when `attendance`.`Status` = 'E' then 1 end)) * 100.0 / nullif(count(case when `attendance`.`Status` <> 'CC' then 1 end),0),2) AS `attendance_percentage` FROM `attendance` GROUP BY `attendance`.`StudentID`, `attendance`.`ScheduleID`, `attendance`.`SessionType` ;

-- --------------------------------------------------------

--
-- Structure for view `excuse_letters_with_subjects`
--
DROP TABLE IF EXISTS `excuse_letters_with_subjects`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `excuse_letters_with_subjects`  AS SELECT `el`.`ExcuseLetterID` AS `ExcuseLetterID`, `el`.`StudentID` AS `StudentID`, `el`.`ScheduleID` AS `OriginalScheduleID`, `el`.`Subject` AS `SubjectTitle`, `el`.`Reason` AS `Reason`, `el`.`DateFrom` AS `DateFrom`, `el`.`DateTo` AS `DateTo`, `el`.`SubmissionDate` AS `SubmissionDate`, `el`.`DeanStatus` AS `DeanStatus`, `el`.`DeanComment` AS `DeanComment`, `el`.`DeanActionDate` AS `DeanActionDate`, `el`.`CoordinatorStatus` AS `CoordinatorStatus`, `el`.`CoordinatorComment` AS `CoordinatorComment`, `el`.`CoordinatorActionDate` AS `CoordinatorActionDate`, `el`.`InstructorStatus` AS `InstructorStatus`, `el`.`InstructorComment` AS `InstructorComment`, `el`.`InstructorActionDate` AS `InstructorActionDate`, `el`.`Status` AS `Status`, `el`.`IsMultiSubject` AS `IsMultiSubject`, CASE WHEN `el`.`IsMultiSubject` = 1 THEN 'Multiple Subjects' ELSE coalesce(`el`.`SubjectCode`,`els`.`SubjectCode`) END AS `SubjectCode`, CASE WHEN `el`.`IsMultiSubject` = 1 THEN 'Multiple Subjects' ELSE coalesce(`el`.`SubjectTitle`,`els`.`SubjectTitle`) END AS `SubjectTitleDisplay`, CASE WHEN `el`.`IsMultiSubject` = 1 THEN 'Multiple Instructors' ELSE coalesce(`el`.`InstructorName`,`els`.`InstructorName`) END AS `InstructorName`, coalesce(`el`.`ScheduleID`,`els`.`ScheduleID`) AS `ScheduleID`, count(`els`.`ExcuseLetterSubjectID`) AS `SubjectCount` FROM (`excuse_letters` `el` left join `excuse_letter_subjects` `els` on(`el`.`ExcuseLetterID` = `els`.`ExcuseLetterID`)) GROUP BY `el`.`ExcuseLetterID` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_periods`
--
ALTER TABLE `academic_periods`
  ADD PRIMARY KEY (`PeriodID`),
  ADD UNIQUE KEY `unique_period` (`AcademicYear`,`Semester`),
  ADD KEY `idx_current` (`IsCurrent`),
  ADD KEY `idx_active` (`IsActive`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`AttendanceID`),
  ADD UNIQUE KEY `unique_student_schedule_week_session_date` (`StudentID`,`ScheduleID`,`Week`,`SessionType`,`Date`),
  ADD KEY `idx_student_schedule` (`StudentID`,`ScheduleID`),
  ADD KEY `idx_schedule_week` (`ScheduleID`,`Week`),
  ADD KEY `idx_status` (`Status`),
  ADD KEY `fk_attendance_recorder` (`RecordedBy`),
  ADD KEY `idx_student_week` (`StudentID`,`Week`),
  ADD KEY `idx_date` (`Date`),
  ADD KEY `idx_session_type` (`SessionType`),
  ADD KEY `idx_schedule_week_session` (`ScheduleID`,`Week`,`SessionType`),
  ADD KEY `idx_attendance_status` (`Status`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`LogID`),
  ADD KEY `idx_user` (`UserID`),
  ADD KEY `idx_table` (`TableName`),
  ADD KEY `idx_action` (`Action`),
  ADD KEY `idx_date` (`CreatedDate`);

--
-- Indexes for table `component_total_scores`
--
ALTER TABLE `component_total_scores`
  ADD PRIMARY KEY (`ComponentTotalScoreID`),
  ADD UNIQUE KEY `unique_subject_component` (`SubjectID`,`ComponentName`,`ClassType`),
  ADD KEY `idx_subject_id` (`SubjectID`),
  ADD KEY `idx_component_name` (`ComponentName`),
  ADD KEY `idx_class_type` (`ClassType`),
  ADD KEY `idx_subject_class_type` (`SubjectID`,`ClassType`),
  ADD KEY `idx_component_class_type` (`ComponentName`,`ClassType`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`CourseID`),
  ADD UNIQUE KEY `CourseCode` (`CourseCode`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`EnrollmentID`),
  ADD UNIQUE KEY `unique_student_schedule` (`StudentID`,`ScheduleID`),
  ADD KEY `idx_student` (`StudentID`),
  ADD KEY `idx_schedule` (`ScheduleID`),
  ADD KEY `idx_status` (`Status`),
  ADD KEY `fk_enrollment_user` (`EnrolledBy`);

--
-- Indexes for table `excuse_letters`
--
ALTER TABLE `excuse_letters`
  ADD PRIMARY KEY (`ExcuseLetterID`),
  ADD KEY `idx_student` (`StudentID`),
  ADD KEY `idx_schedule` (`ScheduleID`),
  ADD KEY `idx_status` (`Status`),
  ADD KEY `idx_excuse_letters_multi_subject` (`IsMultiSubject`);

--
-- Indexes for table `excuse_letter_files`
--
ALTER TABLE `excuse_letter_files`
  ADD PRIMARY KEY (`FileID`),
  ADD KEY `idx_excuse_letter` (`ExcuseLetterID`);

--
-- Indexes for table `excuse_letter_subjects`
--
ALTER TABLE `excuse_letter_subjects`
  ADD PRIMARY KEY (`ExcuseLetterSubjectID`),
  ADD KEY `FK_excuse_letter_subjects_excuse_letter` (`ExcuseLetterID`),
  ADD KEY `FK_excuse_letter_subjects_schedule` (`ScheduleID`),
  ADD KEY `idx_excuse_letter_subjects_excuse_letter` (`ExcuseLetterID`),
  ADD KEY `idx_excuse_letter_subjects_schedule` (`ScheduleID`);

--
-- Indexes for table `grades`
--
ALTER TABLE `grades`
  ADD PRIMARY KEY (`GradeID`),
  ADD KEY `idx_student_schedule_term` (`StudentID`,`ScheduleID`,`Term`),
  ADD KEY `idx_component` (`Component`),
  ADD KEY `idx_term` (`Term`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`ScheduleID`);

--
-- Indexes for table `sequences`
--
ALTER TABLE `sequences`
  ADD PRIMARY KEY (`name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `AttendanceID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=526;

--
-- AUTO_INCREMENT for table `component_total_scores`
--
ALTER TABLE `component_total_scores`
  MODIFY `ComponentTotalScoreID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=210;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `CourseID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `EnrollmentID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `excuse_letters`
--
ALTER TABLE `excuse_letters`
  MODIFY `ExcuseLetterID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `excuse_letter_files`
--
ALTER TABLE `excuse_letter_files`
  MODIFY `FileID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `excuse_letter_subjects`
--
ALTER TABLE `excuse_letter_subjects`
  MODIFY `ExcuseLetterSubjectID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `grades`
--
ALTER TABLE `grades`
  MODIFY `GradeID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `ScheduleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `excuse_letter_subjects`
--
ALTER TABLE `excuse_letter_subjects`
  ADD CONSTRAINT `FK_excuse_letter_subjects_excuse_letter` FOREIGN KEY (`ExcuseLetterID`) REFERENCES `excuse_letters` (`ExcuseLetterID`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_excuse_letter_subjects_schedule` FOREIGN KEY (`ScheduleID`) REFERENCES `schedules` (`ScheduleID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
