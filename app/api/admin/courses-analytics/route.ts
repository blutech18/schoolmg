import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

interface CourseAnalytics {
  courseCode: string;
  courseName: string;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  passRate: number;
}

interface CourseStats {
  totalCourses: number;
  totalStudents: number;
  averageAttendance: number;
  averagePassRate: number;
  topPerformingCourse: string;
  lowestPerformingCourse: string;
}

export async function GET() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Get courses analytics data
    const [coursesResult] = await connection.execute(`
      SELECT 
        c.CourseCode,
        c.CourseName,
        COUNT(DISTINCT s.StudentID) as totalStudents,
        COUNT(DISTINCT sch.SubjectID) as totalSubjects,
        COALESCE(AVG(attendance_data.attendance_rate), 0) as averageAttendance,
        COALESCE(AVG(grade_data.pass_rate), 0) as passRate
      FROM courses c
      LEFT JOIN students s ON c.CourseCode = s.Course
      LEFT JOIN schedules sch ON c.CourseCode = sch.Course
        AND UPPER(COALESCE(sch.SubjectCode, '')) NOT LIKE '%NSTP%'
        AND UPPER(COALESCE(sch.SubjectName, sch.SubjectTitle, '')) NOT LIKE '%NSTP%'
      LEFT JOIN (
        SELECT 
          s.Course,
          (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
        FROM attendance a
        JOIN students s ON a.StudentID = s.StudentID
        WHERE s.Course IS NOT NULL AND s.Course != ''
        GROUP BY s.Course
      ) attendance_data ON c.CourseCode = attendance_data.Course
      LEFT JOIN (
        SELECT 
          s.Course,
          (SUM(CASE WHEN g.summary >= 75 THEN 1 ELSE 0 END) / COUNT(*)) * 100 as pass_rate
        FROM (
          SELECT 
            StudentID,
            ScheduleID,
            AVG(CASE 
              WHEN Term = 'midterm' THEN (Score / MaxScore) * 100
              WHEN Term = 'final' THEN (Score / MaxScore) * 100
              ELSE NULL
            END) as summary
          FROM grades
          WHERE Term IN ('midterm', 'final')
          GROUP BY StudentID, ScheduleID
          HAVING COUNT(DISTINCT Term) = 2
        ) g
        JOIN students s ON g.StudentID = s.StudentID
        WHERE s.Course IS NOT NULL AND s.Course != ''
        GROUP BY s.Course
      ) grade_data ON c.CourseCode = grade_data.Course
      WHERE c.Status = 'active'
      GROUP BY c.CourseID, c.CourseCode, c.CourseName
      ORDER BY c.CourseName
    `);

    const analytics: CourseAnalytics[] = (coursesResult as any[]).map(row => ({
      courseCode: row.CourseCode || '',
      courseName: row.CourseName || '',
      totalStudents: row.totalStudents || 0,
      totalSubjects: row.totalSubjects || 0,
      averageAttendance: Math.round(row.averageAttendance || 0),
      passRate: Math.round(row.passRate || 0)
    }));

    // Calculate overall statistics
    const totalCourses = analytics.length;
    const totalStudents = analytics.reduce((sum, course) => sum + course.totalStudents, 0);
    const averageAttendance = analytics.length > 0 
      ? Math.round(analytics.reduce((sum, course) => sum + course.averageAttendance, 0) / analytics.length)
      : 0;
    const averagePassRate = analytics.length > 0 
      ? Math.round(analytics.reduce((sum, course) => sum + course.passRate, 0) / analytics.length)
      : 0;

    // Find top and lowest performing courses
    const sortedByPassRate = [...analytics].sort((a, b) => b.passRate - a.passRate);
    const topPerformingCourse = sortedByPassRate.length > 0 ? sortedByPassRate[0].courseName : 'N/A';
    const lowestPerformingCourse = sortedByPassRate.length > 0 ? sortedByPassRate[sortedByPassRate.length - 1].courseName : 'N/A';

    const stats: CourseStats = {
      totalCourses,
      totalStudents,
      averageAttendance,
      averagePassRate,
      topPerformingCourse,
      lowestPerformingCourse
    };

    await connection.end();

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        stats
      },
      message: "Courses analytics retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching courses analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses analytics',
        data: {
          analytics: [],
          stats: {
            totalCourses: 0,
            totalStudents: 0,
            averageAttendance: 0,
            averagePassRate: 0,
            topPerformingCourse: 'N/A',
            lowestPerformingCourse: 'N/A'
          }
        }
      },
      { status: 500 }
    );
  }
}
