import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

interface AttendanceOverview {
  totalRecords: number;
  attendanceByStatus: {
    present: number;
    absent: number;
    excused: number;
    late: number;
    dropped: number;
    failed: number;
  };
  attendanceBySession: Array<{
    sessionNumber: number;
    sessionType: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  attendanceByCourse: Array<{
    course: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  attendanceBySubject: Array<{
    subjectCode: string;
    subjectName: string;
    present: number;
    absent: number;
    total: number;
    rate: number;
  }>;
  recentActivity: Array<{
    date: string;
    totalRecords: number;
    presentCount: number;
    absentCount: number;
    rate: number;
  }>;
  lowAttendanceAlerts: Array<{
    studentName: string;
    course: string;
    subjectCode: string;
    attendanceRate: number;
    totalRecords: number;
    presentCount: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    console.log("Starting attendance overview API call...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    // Get total attendance records
    const [totalRecordsResult] = await connection.execute(`
      SELECT COUNT(*) as total FROM attendance
    `);
    const totalRecords = (totalRecordsResult as any[])[0]?.total || 0;

    // Get attendance by status
    const [statusResult] = await connection.execute(`
      SELECT 
        Status,
        COUNT(*) as count
      FROM attendance 
      GROUP BY Status
    `);

    const attendanceByStatus = {
      present: 0,
      absent: 0,
      excused: 0,
      late: 0,
      dropped: 0,
      failed: 0
    };

    (statusResult as any[]).forEach(row => {
      switch (row.Status) {
        case 'P': attendanceByStatus.present = row.count; break;
        case 'A': attendanceByStatus.absent = row.count; break;
        case 'E': attendanceByStatus.excused = row.count; break;
        case 'L': attendanceByStatus.late = row.count; break;
        case 'D': attendanceByStatus.dropped = row.count; break;
        case 'FA': attendanceByStatus.failed = row.count; break;
      }
    });

    // Get attendance by session
    console.log("Executing session attendance query...");
    let sessionResult;
    try {
      [sessionResult] = await connection.execute(`
        SELECT 
          COALESCE(a.Week, 1) as sessionNumber,
          COALESCE(a.SessionType, 'lecture') as sessionType,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
          COUNT(*) as total
        FROM attendance a
        WHERE a.Week IS NOT NULL
        GROUP BY a.Week, a.SessionType
        ORDER BY a.Week, a.SessionType
      `);
    } catch (sessionError) {
      console.log("Session query failed, trying fallback query:", sessionError);
      // Fallback query without SessionType if the column doesn't exist
      [sessionResult] = await connection.execute(`
        SELECT 
          COALESCE(a.Week, 1) as sessionNumber,
          'lecture' as sessionType,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
          COUNT(*) as total
        FROM attendance a
        WHERE a.Week IS NOT NULL
        GROUP BY a.Week
        ORDER BY a.Week
      `);
    }
    console.log("Session query completed, result count:", (sessionResult as any[]).length);

    const attendanceBySession = (sessionResult as any[]).map(row => ({
      sessionNumber: row.sessionNumber || 1,
      sessionType: row.sessionType || 'lecture',
      present: row.present || 0,
      absent: row.absent || 0,
      total: row.total || 0,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));
    console.log("Processed attendanceBySession data:", attendanceBySession.length, "records");

    // Get attendance by course
    const [courseResult] = await connection.execute(`
      SELECT
        COALESCE(c.CourseName, COALESCE(NULLIF(s.Course, ''), 'Unknown Course')) as Course,
        SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
        COUNT(*) as total
      FROM attendance a
      JOIN students s ON a.StudentID = s.StudentID
      LEFT JOIN courses c ON s.Course = c.CourseCode
      WHERE s.Course IS NOT NULL AND s.Course != ''
      GROUP BY s.Course, c.CourseName
      ORDER BY COALESCE(c.CourseName, s.Course)
    `);

    const attendanceByCourse = (courseResult as any[]).map(row => ({
      course: row.Course || 'Unknown Course',
      present: row.present || 0,
      absent: row.absent || 0,
      total: row.total || 0,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // Get attendance by subject
    const [subjectResult] = await connection.execute(`
      SELECT
        COALESCE(NULLIF(sch.SubjectCode, ''), CONCAT('UNKNOWN-', sch.ScheduleID)) as SubjectCode,
        COALESCE(
          NULLIF(subj.SubjectName, ''),
          NULLIF(sch.SubjectName, ''),
          NULLIF(sch.SubjectTitle, ''),
          CONCAT('Unknown Subject ', sch.ScheduleID)
        ) as SubjectName,
        SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
        COUNT(*) as total
      FROM attendance a
      JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
      LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
      GROUP BY sch.ScheduleID, sch.SubjectCode, SubjectName
      ORDER BY total DESC
      LIMIT 10
    `);

    const attendanceBySubject = (subjectResult as any[]).map(row => ({
      subjectCode: row.SubjectCode,
      subjectName: row.SubjectName,
      present: row.present,
      absent: row.absent,
      total: row.total,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // Get recent activity (last 7 days)
    const [recentResult] = await connection.execute(`
      SELECT
        DATE(a.Date) as date,
        COUNT(*) as totalRecords,
        SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as presentCount,
        SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absentCount
      FROM attendance a
      WHERE a.Date IS NOT NULL
        AND a.Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND a.Date <= CURDATE()
      GROUP BY DATE(a.Date)
      ORDER BY date DESC
      LIMIT 7
    `);

    const recentActivity = (recentResult as any[]).map(row => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalRecords: row.totalRecords || 0,
      presentCount: row.presentCount || 0,
      absentCount: row.absentCount || 0,
      rate: row.totalRecords > 0 ? Math.round((row.presentCount / row.totalRecords) * 100) : 0
    }));

    // Get low attendance alerts (students with < 75% attendance)
    const [alertsResult] = await connection.execute(`
      SELECT
        COALESCE(
          CONCAT(
            COALESCE(NULLIF(u.FirstName, ''), 'Unknown'),
            ' ',
            COALESCE(NULLIF(u.LastName, ''), 'Student')
          ),
          CONCAT('Student ID: ', s.StudentID)
        ) as StudentName,
        COALESCE(NULLIF(s.Course, ''), 'Unknown Course') as Course,
        COALESCE(NULLIF(sch.SubjectCode, ''), CONCAT('SUBJ-', sch.ScheduleID)) as SubjectCode,
        COUNT(*) as totalRecords,
        SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as presentCount,
        ROUND((SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as attendanceRate
      FROM attendance a
      JOIN students s ON a.StudentID = s.StudentID
      LEFT JOIN users u ON s.StudentID = u.UserID
      JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
      WHERE a.Status IS NOT NULL
      GROUP BY a.StudentID, a.ScheduleID
      HAVING attendanceRate < 75 AND totalRecords >= 5
      ORDER BY attendanceRate ASC
      LIMIT 20
    `);

    const lowAttendanceAlerts = (alertsResult as any[]).map(row => ({
      studentName: row.StudentName || 'Unknown Student',
      course: row.Course || 'Unknown Course',
      subjectCode: row.SubjectCode || 'Unknown Subject',
      attendanceRate: parseFloat(row.attendanceRate) || 0,
      totalRecords: row.totalRecords || 0,
      presentCount: row.presentCount || 0
    }));

    await connection.end();

    const overview: AttendanceOverview = {
      totalRecords,
      attendanceByStatus,
      attendanceBySession,
      attendanceByCourse,
      attendanceBySubject,
      recentActivity,
      lowAttendanceAlerts
    };

    return NextResponse.json({ 
      success: true, 
      data: overview,
      message: "Attendance overview data retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching attendance overview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance overview data" },
      { status: 500 }
    );
  }
}
