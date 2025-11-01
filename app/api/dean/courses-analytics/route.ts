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
  department: string;
}

export async function GET() {
  let connection: any = null;
  
  try {
    console.log("Starting courses analytics API call...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    // Get basic courses data
    const [coursesResult] = await connection.execute(`
      SELECT 
        CourseCode,
        CourseName
      FROM courses 
      WHERE Status = 'active'
      ORDER BY CourseName
    `);

    console.log(`Found ${(coursesResult as any[]).length} courses`);

    const analytics: CourseAnalytics[] = (coursesResult as any[]).map(row => ({
      courseCode: row.CourseCode || '',
      courseName: row.CourseName || '',
      totalStudents: 0, // Will be calculated separately if needed
      totalSubjects: 0, // Will be calculated separately if needed
      averageAttendance: 0, // Will be calculated separately if needed
      passRate: 0, // Will be calculated separately if needed
      department: 'General' // Default department since it's not in the courses table
    }));

    await connection.end();

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Courses analytics retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching courses analytics:', error);
    
    if (connection) {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing connection:', endError);
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses analytics',
        data: []
      },
      { status: 500 }
    );
  }
}
