import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

interface SubjectAnalytics {
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  totalSchedules: number;
  averageAttendance: number;
  averageGrade: number;
  instructorName: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    const courseFilter = searchParams.get('course');
    const yearLevelFilter = searchParams.get('yearLevel');
    const sectionFilter = searchParams.get('section');

    console.log("Subjects analytics request:", { schoolYear, semester, courseFilter, yearLevelFilter, sectionFilter });

    // Build filter conditions
    const conditions: string[] = [];
    const params: any[] = [];

    // Add school year and semester filters
    if (schoolYear) {
      conditions.push('sch.AcademicYear = ?');
      params.push(schoolYear);
    }

    if (semester) {
      conditions.push('sch.Semester = ?');
      params.push(semester);
    }

    if (courseFilter && courseFilter !== 'all') {
      conditions.push('sch.Course = ?');
      params.push(courseFilter);
    }

    if (yearLevelFilter && yearLevelFilter !== 'all') {
      conditions.push('sch.YearLevel = ?');
      params.push(parseInt(yearLevelFilter));
    }

    if (sectionFilter && sectionFilter !== 'all') {
      conditions.push('sch.Section = ?');
      params.push(sectionFilter);
    }

    const filterCondition = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    // Get subjects analytics data
    const [subjectsResult] = await db.execute(`
      SELECT 
        COALESCE(subj.SubjectCode, sch.SubjectCode, 'Unknown') as SubjectCode,
        COALESCE(subj.SubjectName, sch.SubjectName, sch.SubjectTitle, 'Unknown Subject') as SubjectName,
        COUNT(DISTINCT enrollment_data.StudentID) as totalStudents,
        COUNT(DISTINCT sch.ScheduleID) as totalSchedules,
        COALESCE(AVG(attendance_data.attendance_rate), 0) as averageAttendance,
        COALESCE(AVG(grade_data.average_grade), 0) as averageGrade,
        COALESCE(GROUP_CONCAT(DISTINCT CONCAT(u.FirstName, ' ', u.LastName) SEPARATOR ', '), 'No Instructor') as instructorName
      FROM subjects subj
      LEFT JOIN schedules sch ON subj.SubjectID = sch.SubjectID
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
      WHERE UPPER(COALESCE(subj.SubjectCode, sch.SubjectCode, '')) NOT LIKE '%NSTP%'
        AND UPPER(COALESCE(subj.SubjectName, sch.SubjectName, sch.SubjectTitle, '')) NOT LIKE '%NSTP%'
        ${filterCondition}
      GROUP BY subj.SubjectID, SubjectCode, SubjectName
      HAVING totalSchedules > 0
      ORDER BY SubjectName
    `, params);

    const analytics: SubjectAnalytics[] = (subjectsResult as any[]).map(row => ({
      subjectCode: row.SubjectCode || '',
      subjectName: row.SubjectName || '',
      totalStudents: row.totalStudents || 0,
      totalSchedules: row.totalSchedules || 0,
      averageAttendance: Math.round(row.averageAttendance || 0),
      averageGrade: Math.round(row.averageGrade || 0),
      instructorName: row.instructorName || 'No Instructor'
    }));

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Subjects analytics retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching subjects analytics:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch subjects analytics',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
