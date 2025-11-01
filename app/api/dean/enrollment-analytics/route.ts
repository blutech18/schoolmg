import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

interface EnrollmentAnalytics {
  year: number;
  semester: string;
  totalEnrolled: number;
  newEnrollments: number;
  graduates: number;
  courseBreakdown: {
    course: string;
    enrolled: number;
  }[];
}

export async function GET(request: NextRequest) {
  let connection: any = null;
  
  try {
    console.log("Starting enrollment analytics API call...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Database connection established");

    // Get enrollment data by year level
    const [enrollmentResult] = await connection.execute(`
      SELECT 
        s.YearLevel as year,
        COUNT(DISTINCT s.StudentID) as totalEnrolled,
        COUNT(DISTINCT CASE 
          WHEN s.DateOfEnrollment IS NOT NULL 
          AND YEAR(s.DateOfEnrollment) = YEAR(CURDATE())
          THEN s.StudentID 
        END) as newEnrollments,
        0 as graduates
      FROM students s
      WHERE s.YearLevel IS NOT NULL
      GROUP BY s.YearLevel
      ORDER BY s.YearLevel DESC
    `);

    // Get course breakdown
    const [courseBreakdownResult] = await connection.execute(`
      SELECT 
        s.Course,
        COUNT(DISTINCT s.StudentID) as enrolled
      FROM students s
      WHERE s.Course IS NOT NULL AND s.Course != ''
      GROUP BY s.Course
      ORDER BY enrolled DESC
    `);

    // Process the data - create both 1st and 2nd semester entries for each year
    const enrollmentData: EnrollmentAnalytics[] = [];
    
    (enrollmentResult as any[]).forEach(row => {
      // Add 1st semester entry
      enrollmentData.push({
        year: row.year || 0,
        semester: '1st',
        totalEnrolled: Math.floor((row.totalEnrolled || 0) * 0.6), // Approximate 60% for 1st sem
        newEnrollments: Math.floor((row.newEnrollments || 0) * 0.8), // Most new enrollments in 1st sem
        graduates: 0,
        courseBreakdown: (courseBreakdownResult as any[]).map(course => ({
          course: course.Course || '',
          enrolled: course.enrolled || 0
        }))
      });
      
      // Add 2nd semester entry
      enrollmentData.push({
        year: row.year || 0,
        semester: '2nd',
        totalEnrolled: Math.floor((row.totalEnrolled || 0) * 0.4), // Approximate 40% for 2nd sem
        newEnrollments: Math.floor((row.newEnrollments || 0) * 0.2), // Fewer new enrollments in 2nd sem
        graduates: 0,
        courseBreakdown: (courseBreakdownResult as any[]).map(course => ({
          course: course.Course || '',
          enrolled: course.enrolled || 0
        }))
      });
    });

    await connection.end();

    return NextResponse.json({
      success: true,
      data: enrollmentData,
      message: "Enrollment analytics retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching enrollment analytics:', error);
    
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
        error: 'Failed to fetch enrollment analytics',
        data: []
      },
      { status: 500 }
    );
  }
}
