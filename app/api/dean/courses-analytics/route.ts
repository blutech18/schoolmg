import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

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
  try {
    console.log("Starting courses analytics API call...");
    console.log("Database connection established");

    // Get basic courses data
    const [coursesResult] = await db.execute(`
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

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Courses analytics retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching courses analytics:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses analytics',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
