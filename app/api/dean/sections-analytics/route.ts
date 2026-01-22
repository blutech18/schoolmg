import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

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

export async function GET(request: NextRequest) {
  try {
    // Get filter parameters from query string
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    const sectionFilter = searchParams.get('section');

    // Parse school year to get the year range (e.g., "2024-2025" -> 2024, 2025)
    let startYear: number | null = null;
    let endYear: number | null = null;
    if (schoolYear) {
      const [start, end] = schoolYear.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        startYear = start;
        endYear = end;
      }
    }

    // Build the section filter condition
    let sectionCondition = '';
    const params: any[] = [];

    if (sectionFilter && sectionFilter !== 'all') {
      sectionCondition = 'AND s.Section = ?';
      params.push(sectionFilter);
    }

    // Get sections analytics data with optional filtering
    const [sectionsResult] = await db.execute(`
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
        AND UPPER(COALESCE(sch.SubjectCode, '')) NOT LIKE '%NSTP%'
        AND UPPER(COALESCE(sch.SubjectName, sch.SubjectTitle, '')) NOT LIKE '%NSTP%'
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
        ${sectionCondition}
      GROUP BY s.Course, s.Section, s.YearLevel
      ORDER BY s.Course, s.YearLevel, s.Section
    `, params);

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

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Sections analytics retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching sections analytics:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sections analytics',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
