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
    const courseFilter = searchParams.get('course');
    const yearLevelFilter = searchParams.get('yearLevel');

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

    // Build filter conditions dynamically (for student-level filters only)
    const conditions: string[] = [];
    const studentParams: any[] = [];

    if (sectionFilter && sectionFilter !== 'all') {
      conditions.push('s.Section = ?');
      studentParams.push(sectionFilter);
    }

    if (courseFilter && courseFilter !== 'all') {
      conditions.push('s.Course = ?');
      studentParams.push(courseFilter);
    }

    if (yearLevelFilter && yearLevelFilter !== 'all') {
      conditions.push('s.YearLevel = ?');
      studentParams.push(parseInt(yearLevelFilter));
    }

    const filterCondition = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    // Build schedule filter for subqueries (school year and semester)
    const scheduleFilters: string[] = [];
    const scheduleParams: any[] = [];
    
    // Only add school year filter if it's not 'all' and not empty
    if (schoolYear && schoolYear !== 'all') {
      scheduleFilters.push('sch_inner.AcademicYear = ?');
      scheduleParams.push(schoolYear);
    }
    if (semester) {
      scheduleFilters.push('sch_inner.Semester = ?');
      scheduleParams.push(semester);
    }
    
    const scheduleFilterClause = scheduleFilters.length > 0 
      ? 'AND ' + scheduleFilters.join(' AND ') 
      : '';

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
        ${schoolYear && schoolYear !== 'all' ? 'AND sch.AcademicYear = ?' : ''}
        ${semester ? 'AND sch.Semester = ?' : ''}
      LEFT JOIN (
        SELECT 
          a.StudentID,
          (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
        FROM attendance a
        JOIN schedules sch_inner ON a.ScheduleID = sch_inner.ScheduleID
        WHERE 1=1 ${scheduleFilterClause}
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
        JOIN schedules sch_inner ON g.ScheduleID = sch_inner.ScheduleID
        WHERE 1=1 ${scheduleFilterClause}
        GROUP BY g.StudentID
      ) grade_data ON s.StudentID = grade_data.StudentID
      LEFT JOIN (
        SELECT DISTINCT
          a.StudentID
        FROM attendance a
        JOIN schedules sch_inner ON a.ScheduleID = sch_inner.ScheduleID
        WHERE 1=1 ${scheduleFilterClause}
        GROUP BY a.StudentID
        HAVING (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 < 75
      ) risk_data ON s.StudentID = risk_data.StudentID
      WHERE s.Course IS NOT NULL AND s.Course != ''
        AND s.Section IS NOT NULL AND s.Section != ''
        AND s.YearLevel IS NOT NULL
        ${filterCondition}
      GROUP BY s.Course, s.Section, s.YearLevel
      ORDER BY s.Course, s.YearLevel, s.Section
    `, [...(schoolYear && schoolYear !== 'all' ? [schoolYear] : []), ...(semester ? [semester] : []), ...scheduleParams, ...scheduleParams, ...scheduleParams, ...studentParams]);

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
