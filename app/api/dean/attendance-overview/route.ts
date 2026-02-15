import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

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
    
    // Get filter parameters
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    const yearLevel = searchParams.get('yearLevel');
    const course = searchParams.get('course');
    const section = searchParams.get('section');
    
    console.log("Filters:", { schoolYear, semester, yearLevel, course, section });

    // Build filter conditions for schedules - more flexible approach
    const scheduleFilters: string[] = [];
    const scheduleParams: any[] = [];
    
    // Try different possible column names for academic year
    if (schoolYear && schoolYear !== 'all') {
      scheduleFilters.push('(sch.AcademicYear = ? OR sch.SchoolYear = ? OR sch.Year = ?)');
      scheduleParams.push(schoolYear, schoolYear, schoolYear);
    }
    if (semester) {
      scheduleFilters.push('sch.Semester = ?');
      scheduleParams.push(semester);
    }
    if (yearLevel && yearLevel !== 'all') {
      scheduleFilters.push('sch.YearLevel = ?');
      scheduleParams.push(parseInt(yearLevel));
    }
    if (course && course !== 'all') {
      scheduleFilters.push('(sch.Course = ? OR s.Course = ?)');
      scheduleParams.push(course, course);
    }
    if (section && section !== 'all') {
      scheduleFilters.push('(sch.Section = ? OR s.Section = ?)');
      scheduleParams.push(section, section);
    }
    
    const scheduleFilterClause = scheduleFilters.length > 0 
      ? 'AND ' + scheduleFilters.join(' AND ') 
      : '';

    // Get total records with filters - with fallback
    console.log("Fetching total records...");
    let totalRecords = 0;
    try {
      const [totalRecordsResult] = await db.execute(`
        SELECT COUNT(*) as total 
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        LEFT JOIN students s ON a.StudentID = s.StudentID
        WHERE 1=1 ${scheduleFilterClause}
      `, scheduleParams);
      totalRecords = (totalRecordsResult as any[])[0]?.total || 0;
    } catch (error: any) {
      console.log("Total records query failed, using fallback:", error.message);
      const [fallbackResult] = await db.execute(`SELECT COUNT(*) as total FROM attendance`);
      totalRecords = (fallbackResult as any[])[0]?.total || 0;
    }
    console.log("Total records:", totalRecords);

    // Get attendance by status with filters - with fallback
    console.log("Fetching attendance by status...");
    let statusResult;
    try {
      [statusResult] = await db.execute(`
        SELECT 
          a.Status,
          COUNT(*) as count
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        LEFT JOIN students s ON a.StudentID = s.StudentID
        WHERE 1=1 ${scheduleFilterClause}
        GROUP BY a.Status
      `, scheduleParams);
    } catch (error: any) {
      console.log("Status query failed, using fallback:", error.message);
      [statusResult] = await db.execute(`
        SELECT 
          a.Status,
          COUNT(*) as count
        FROM attendance a
        GROUP BY a.Status
      `);
    }
    console.log("Status result:", statusResult);

    const attendanceByStatus = {
      present: 0,
      absent: 0,
      excused: 0,
      late: 0,
      dropped: 0,
      failed: 0
    };

    (statusResult as any[]).forEach(row => {
      console.log("Processing status row:", row);
      switch (row.Status) {
        case 'P': attendanceByStatus.present = row.count; break;
        case 'A': attendanceByStatus.absent = row.count; break;
        case 'E': attendanceByStatus.excused = row.count; break;
        case 'L': attendanceByStatus.late = row.count; break;
        case 'D': attendanceByStatus.dropped = row.count; break;
        case 'FA': attendanceByStatus.failed = row.count; break;
      }
    });
    console.log("Attendance by status:", attendanceByStatus);

    // Get attendance by session with filters
    console.log("Executing session attendance query...");
    let sessionResult = [];
    try {
      // Try with SessionType column first
      const [result] = await db.execute(`
        SELECT 
          COALESCE(a.Week, 1) as sessionNumber,
          COALESCE(a.SessionType, 'lecture') as sessionType,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
          COUNT(*) as total
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        WHERE a.Week IS NOT NULL ${scheduleFilterClause}
        GROUP BY a.Week, a.SessionType
        ORDER BY a.Week, a.SessionType
        LIMIT 20
      `, scheduleParams);
      sessionResult = result as any[];
    } catch (sessionError: any) {
      console.log("Session query with SessionType failed:", sessionError.message);
      // Fallback query without SessionType if the column doesn't exist
      try {
        const [result] = await db.execute(`
          SELECT 
            COALESCE(a.Week, 1) as sessionNumber,
            'lecture' as sessionType,
            SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
            COUNT(*) as total
          FROM attendance a
          JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
          WHERE a.Week IS NOT NULL ${scheduleFilterClause}
          GROUP BY a.Week
          ORDER BY a.Week
          LIMIT 20
        `, scheduleParams);
        sessionResult = result as any[];
      } catch (fallbackError: any) {
        console.error("Fallback session query also failed:", fallbackError.message);
        sessionResult = [];
      }
    }
    console.log("Session query completed, result count:", sessionResult.length);

    const attendanceBySession = sessionResult.map(row => ({
      sessionNumber: row.sessionNumber || 1,
      sessionType: row.sessionType || 'lecture',
      present: row.present || 0,
      absent: row.absent || 0,
      total: row.total || 0,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // Get attendance by course with filters
    console.log("Fetching attendance by course...");
    let courseResult = [];
    try {
      const [result] = await db.execute(`
        SELECT
          COALESCE(c.CourseName, COALESCE(NULLIF(s.Course, ''), 'Unknown Course')) as Course,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absent,
          COUNT(*) as total
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        JOIN students s ON a.StudentID = s.StudentID
        LEFT JOIN courses c ON s.Course = c.CourseCode
        WHERE s.Course IS NOT NULL AND s.Course != '' ${scheduleFilterClause}
        GROUP BY s.Course, c.CourseName
        ORDER BY COALESCE(c.CourseName, s.Course)
        LIMIT 20
      `, scheduleParams);
      courseResult = result as any[];
    } catch (courseError: any) {
      console.error("Course query failed:", courseError.message);
      courseResult = [];
    }

    const attendanceByCourse = courseResult.map(row => ({
      course: row.Course || 'Unknown Course',
      present: row.present || 0,
      absent: row.absent || 0,
      total: row.total || 0,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // Get attendance by subject with filters
    console.log("Fetching attendance by subject...");
    let subjectResult = [];
    try {
      const [result] = await db.execute(`
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
        WHERE 1=1 ${scheduleFilterClause}
        GROUP BY sch.ScheduleID, sch.SubjectCode, SubjectName
        ORDER BY total DESC
        LIMIT 10
      `, scheduleParams);
      subjectResult = result as any[];
    } catch (subjectError: any) {
      console.error("Subject query failed:", subjectError.message);
      subjectResult = [];
    }

    const attendanceBySubject = subjectResult.map(row => ({
      subjectCode: row.SubjectCode,
      subjectName: row.SubjectName,
      present: row.present,
      absent: row.absent,
      total: row.total,
      rate: row.total > 0 ? Math.round((row.present / row.total) * 100) : 0
    }));

    // Get recent activity (last 7 days) with filters
    console.log("Fetching recent activity...");
    let recentResult = [];
    try {
      const [result] = await db.execute(`
        SELECT
          DATE(a.Date) as date,
          COUNT(*) as totalRecords,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as presentCount,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as absentCount
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        WHERE a.Date IS NOT NULL
          AND a.Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND a.Date <= CURDATE()
          ${scheduleFilterClause}
        GROUP BY DATE(a.Date)
        ORDER BY date DESC
        LIMIT 7
      `, scheduleParams);
      recentResult = result as any[];
    } catch (recentError: any) {
      console.error("Recent activity query failed:", recentError.message);
      recentResult = [];
    }

    const recentActivity = recentResult.map(row => ({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      totalRecords: row.totalRecords || 0,
      presentCount: row.presentCount || 0,
      absentCount: row.absentCount || 0,
      rate: row.totalRecords > 0 ? Math.round((row.presentCount / row.totalRecords) * 100) : 0
    }));

    // Get low attendance alerts (students with < 75% attendance) with filters
    console.log("Fetching low attendance alerts...");
    let alertsResult = [];
    try {
      const [result] = await db.execute(`
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
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        JOIN students s ON a.StudentID = s.StudentID
        LEFT JOIN users u ON s.StudentID = u.UserID
        WHERE a.Status IS NOT NULL ${scheduleFilterClause}
        GROUP BY a.StudentID, a.ScheduleID
        HAVING attendanceRate < 75 AND totalRecords >= 5
        ORDER BY attendanceRate ASC
        LIMIT 20
      `, scheduleParams);
      alertsResult = result as any[];
    } catch (alertsError: any) {
      console.error("Alerts query failed:", alertsError.message);
      alertsResult = [];
    }

    const lowAttendanceAlerts = alertsResult.map(row => ({
      studentName: row.StudentName || 'Unknown Student',
      course: row.Course || 'Unknown Course',
      subjectCode: row.SubjectCode || 'Unknown Subject',
      attendanceRate: parseFloat(row.attendanceRate) || 0,
      totalRecords: row.totalRecords || 0,
      presentCount: row.presentCount || 0
    }));

    const overview: AttendanceOverview = {
      totalRecords,
      attendanceByStatus,
      attendanceBySession,
      attendanceByCourse,
      attendanceBySubject,
      recentActivity,
      lowAttendanceAlerts
    };

    console.log("Returning overview data:", JSON.stringify(overview, null, 2));

    return NextResponse.json({ 
      success: true, 
      data: overview,
      message: "Attendance overview data retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching attendance overview:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch attendance overview data",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
