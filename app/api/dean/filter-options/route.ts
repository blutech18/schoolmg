import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const [sectionsResult] = await db.execute(`
      SELECT DISTINCT Section 
      FROM students 
      WHERE Section IS NOT NULL AND Section != ''
      ORDER BY Section
    `);

    const [coursesResult] = await db.execute(`
      SELECT DISTINCT Course 
      FROM students 
      WHERE Course IS NOT NULL AND Course != ''
      ORDER BY Course
    `);

    const [yearLevelsResult] = await db.execute(`
      SELECT DISTINCT YearLevel 
      FROM students 
      WHERE YearLevel IS NOT NULL
      ORDER BY YearLevel
    `);

    const [schoolYearsResult] = await db.execute(`
      SELECT DISTINCT AcademicYear 
      FROM schedules 
      WHERE AcademicYear IS NOT NULL AND AcademicYear != ''
      ORDER BY AcademicYear DESC
    `);

    const sections = (sectionsResult as any[]).map(row => row.Section);
    const courses = (coursesResult as any[]).map(row => row.Course);
    const yearLevels = (yearLevelsResult as any[]).map(row => row.YearLevel);
    const schoolYears = (schoolYearsResult as any[]).map(row => row.AcademicYear);

    return NextResponse.json({
      success: true,
      data: {
        sections,
        courses,
        yearLevels,
        schoolYears
      }
    });

  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch filter options',
        data: {
          sections: [],
          courses: [],
          yearLevels: []
        }
      },
      { status: 500 }
    );
  }
}
