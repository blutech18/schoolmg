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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    const courseFilter = searchParams.get('course');
    const yearLevelFilter = searchParams.get('yearLevel');
    const sectionFilter = searchParams.get('section');

    console.log("Starting courses analytics API call...", { schoolYear, semester, courseFilter, yearLevelFilter, sectionFilter });

    // Build filter conditions for students query
    const conditions: string[] = [];
    const params: any[] = [];

    if (courseFilter && courseFilter !== 'all') {
      conditions.push('s.Course = ?');
      params.push(courseFilter);
    }

    if (yearLevelFilter && yearLevelFilter !== 'all') {
      conditions.push('s.YearLevel = ?');
      params.push(parseInt(yearLevelFilter));
    }

    if (sectionFilter && sectionFilter !== 'all') {
      conditions.push('s.Section = ?');
      params.push(sectionFilter);
    }

    const filterCondition = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Build schedule filter for subqueries (school year and semester)
    const scheduleFilters: string[] = [];
    const scheduleParams: any[] = [];
    
    // Only add school year filter if it's not 'all' and not empty
    if (schoolYear && schoolYear !== 'all') {
      scheduleFilters.push('sch.AcademicYear = ?');
      scheduleParams.push(schoolYear);
    }
    if (semester) {
      scheduleFilters.push('sch.Semester = ?');
      scheduleParams.push(semester);
    }
    
    const scheduleFilterClause = scheduleFilters.length > 0 
      ? 'AND ' + scheduleFilters.join(' AND ') 
      : '';

    // Get courses with student counts based on filters
    const [coursesResult] = await db.execute(`
      SELECT 
        c.CourseCode,
        c.CourseName,
        COALESCE(student_data.totalStudents, 0) as totalStudents,
        COALESCE(student_data.totalSubjects, 0) as totalSubjects,
        COALESCE(student_data.averageAttendance, 0) as averageAttendance,
        COALESCE(student_data.passRate, 0) as passRate
      FROM courses c
      LEFT JOIN (
        SELECT 
          s.Course,
          COUNT(DISTINCT s.StudentID) as totalStudents,
          COUNT(DISTINCT sch.SubjectID) as totalSubjects,
          COALESCE(AVG(att.attendance_rate), 0) as averageAttendance,
          COALESCE(AVG(CASE WHEN grade.avg_grade >= 75 THEN 100 ELSE 0 END), 0) as passRate
        FROM students s
        LEFT JOIN schedules sch ON s.Course = sch.Course AND s.Section = sch.Section AND s.YearLevel = sch.YearLevel
          ${scheduleFilterClause}
        LEFT JOIN (
          SELECT a.StudentID, (SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as attendance_rate
          FROM attendance a
          JOIN schedules sch2 ON a.ScheduleID = sch2.ScheduleID
          WHERE 1=1 ${scheduleFilterClause.replace(/sch\./g, 'sch2.')}
          GROUP BY a.StudentID
        ) att ON s.StudentID = att.StudentID
        LEFT JOIN (
          SELECT g.StudentID, AVG(CASE WHEN g.MaxScore > 0 THEN (g.Score / g.MaxScore) * 100 ELSE 0 END) as avg_grade
          FROM grades g
          JOIN schedules sch3 ON g.ScheduleID = sch3.ScheduleID
          WHERE 1=1 ${scheduleFilterClause.replace(/sch\./g, 'sch3.')}
          GROUP BY g.StudentID
        ) grade ON s.StudentID = grade.StudentID
        ${filterCondition}
        GROUP BY s.Course
      ) student_data ON c.CourseCode = student_data.Course
      WHERE c.Status = 'active'
      ORDER BY c.CourseName
    `, [...scheduleParams, ...scheduleParams, ...scheduleParams, ...params]);

    console.log(`Found ${(coursesResult as any[]).length} courses`);

    const analytics: CourseAnalytics[] = (coursesResult as any[]).map(row => ({
      courseCode: row.CourseCode || '',
      courseName: row.CourseName || '',
      totalStudents: row.totalStudents || 0,
      totalSubjects: row.totalSubjects || 0,
      averageAttendance: Math.round(row.averageAttendance || 0),
      passRate: Math.round(row.passRate || 0),
      department: 'General'
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
