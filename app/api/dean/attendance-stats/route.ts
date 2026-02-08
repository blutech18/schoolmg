import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    const yearLevel = searchParams.get('yearLevel');

    // Build filter conditions
    const conditions: string[] = [];
    const params: any[] = [];

    if (schoolYear && schoolYear !== 'all') {
      conditions.push('sch.AcademicYear = ?');
      params.push(schoolYear);
    }

    if (semester) {
      conditions.push('sch.Semester = ?');
      params.push(semester);
    }

    if (yearLevel && yearLevel !== 'all') {
      conditions.push('sch.YearLevel = ?');
      params.push(parseInt(yearLevel));
    }

    const filterCondition = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Get attendance data grouped by month
    const [attendanceResult] = await db.execute(`
      SELECT 
        DATE_FORMAT(a.Date, '%b') as month,
        MONTH(a.Date) as monthNum,
        ROUND(AVG(CASE WHEN a.Status = 'P' THEN 100 ELSE 0 END), 0) as attendance
      FROM attendance a
      JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
      ${filterCondition}
      GROUP BY MONTH(a.Date), DATE_FORMAT(a.Date, '%b')
      ORDER BY monthNum
    `, params);

    const data = (attendanceResult as any[]).map(row => ({
      month: row.month,
      attendance: row.attendance || 0
    }));

    return NextResponse.json({
      success: true,
      data: data,
      message: "Attendance stats retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch attendance stats',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
