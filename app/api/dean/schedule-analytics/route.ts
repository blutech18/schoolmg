import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

interface ScheduleAnalytics {
  scheduleId: number;
  subjectCode: string;
  subjectName: string;
  course: string;
  section: string;
  yearLevel: number;
  instructorName: string;
  totalStudents: number;
  attendanceRate: number;
  averageGrade: number;
  day: string;
  time: string;
  room: string;
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get schedule analytics data
    const [schedulesResult] = await connection.execute(`
      SELECT 
        sch.ScheduleID,
        COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown') as SubjectCode,
        COALESCE(sch.SubjectName, sch.SubjectTitle, subj.SubjectName, 'Unknown Subject') as SubjectName,
        sch.Course,
        sch.Section,
        sch.YearLevel,
        COALESCE(CONCAT(u.FirstName, ' ', u.LastName), 'No Instructor') as instructorName,
        COUNT(DISTINCT enrollment_data.StudentID) as totalStudents,
        COALESCE(attendance_data.attendance_rate, 0) as attendanceRate,
        COALESCE(grade_data.average_grade, 0) as averageGrade,
        sch.Day,
        sch.Time,
        sch.Room
      FROM schedules sch
      LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
      LEFT JOIN users u ON sch.InstructorID = u.UserID
      LEFT JOIN (
        SELECT DISTINCT a.ScheduleID, s.StudentID
        FROM attendance a
        JOIN students s ON a.StudentID = s.StudentID
      ) enrollment_data ON sch.ScheduleID = enrollment_data.ScheduleID
      LEFT JOIN (
        SELECT 
          a.ScheduleID,
          (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
        FROM attendance a
        GROUP BY a.ScheduleID
      ) attendance_data ON sch.ScheduleID = attendance_data.ScheduleID
      LEFT JOIN (
        SELECT 
          g.ScheduleID,
          AVG(CASE 
            WHEN g.MaxScore > 0 THEN (g.Score / g.MaxScore) * 100
            ELSE 0
          END) as average_grade
        FROM grades g
        GROUP BY g.ScheduleID
      ) grade_data ON sch.ScheduleID = grade_data.ScheduleID
      GROUP BY sch.ScheduleID
      ORDER BY sch.Course, sch.YearLevel, sch.Section, SubjectName
    `);

    const analytics: ScheduleAnalytics[] = (schedulesResult as any[]).map(row => ({
      scheduleId: row.ScheduleID || 0,
      subjectCode: row.SubjectCode || '',
      subjectName: row.SubjectName || '',
      course: row.Course || '',
      section: row.Section || '',
      yearLevel: row.YearLevel || 0,
      instructorName: row.instructorName || 'No Instructor',
      totalStudents: row.totalStudents || 0,
      attendanceRate: Math.round(row.attendanceRate || 0),
      averageGrade: Math.round(row.averageGrade || 0),
      day: row.Day || '',
      time: row.Time || '',
      room: row.Room || ''
    }));

    await connection.end();

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Schedule analytics retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching schedule analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schedule analytics',
        data: []
      },
      { status: 500 }
    );
  }
}
