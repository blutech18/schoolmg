import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

interface SectionAnalytics {
  course: string;
  section: string;
  yearLevel: number;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  averageGrade: number;
  atRiskStudents: number;
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get sections analytics data
    const [sectionsResult] = await connection.execute(`
      SELECT 
        s.Course,
        s.Section,
        s.YearLevel,
        COUNT(DISTINCT s.StudentID) as totalStudents,
        COUNT(DISTINCT sch.SubjectID) as totalSubjects,
        COALESCE(AVG(attendance_data.attendance_rate), 0) as averageAttendance,
        COALESCE(AVG(grade_data.average_grade), 0) as averageGrade,
        COUNT(DISTINCT risk_data.StudentID) as atRiskStudents
      FROM students s
      LEFT JOIN schedules sch ON s.Course = sch.Course AND s.Section = sch.Section AND s.YearLevel = sch.YearLevel
      LEFT JOIN (
        SELECT 
          a.StudentID,
          (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
        FROM attendance a
        GROUP BY a.StudentID
      ) attendance_data ON s.StudentID = attendance_data.StudentID
      LEFT JOIN (
        SELECT 
          g.StudentID,
          AVG(CASE 
            WHEN g.MaxScore > 0 THEN (g.Score / g.MaxScore) * 100
            ELSE 0
          END) as average_grade
        FROM grades g
        GROUP BY g.StudentID
      ) grade_data ON s.StudentID = grade_data.StudentID
      LEFT JOIN (
        SELECT DISTINCT
          a.StudentID
        FROM attendance a
        GROUP BY a.StudentID
        HAVING (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 < 75
      ) risk_data ON s.StudentID = risk_data.StudentID
      WHERE s.Course IS NOT NULL AND s.Course != ''
        AND s.Section IS NOT NULL AND s.Section != ''
        AND s.YearLevel IS NOT NULL
      GROUP BY s.Course, s.Section, s.YearLevel
      ORDER BY s.Course, s.YearLevel, s.Section
    `);

    const analytics: SectionAnalytics[] = (sectionsResult as any[]).map(row => ({
      course: row.Course || '',
      section: row.Section || '',
      yearLevel: row.YearLevel || 0,
      totalStudents: row.totalStudents || 0,
      totalSubjects: row.totalSubjects || 0,
      averageAttendance: Math.round(row.averageAttendance || 0),
      averageGrade: Math.round(row.averageGrade || 0),
      atRiskStudents: row.atRiskStudents || 0
    }));

    await connection.end();

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Sections analytics retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching sections analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sections analytics',
        data: []
      },
      { status: 500 }
    );
  }
}
