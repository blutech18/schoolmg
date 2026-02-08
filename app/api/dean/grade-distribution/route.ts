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

    // Get grade distribution
    const [gradesResult] = await db.execute(`
      SELECT 
        CASE 
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 90 THEN 'Excellent'
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 85 THEN 'Very Good'
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 75 THEN 'Good'
          ELSE 'Failed'
        END as grade,
        CASE 
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 90 THEN '1.0-1.5'
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 85 THEN '1.75-2.25'
          WHEN (g.Score / NULLIF(g.MaxScore, 0)) * 100 >= 75 THEN '2.5-3.0'
          ELSE '5.0'
        END as \`range\`,
        COUNT(*) as count
      FROM grades g
      JOIN schedules sch ON g.ScheduleID = sch.ScheduleID
      ${filterCondition}
      GROUP BY grade, \`range\`
      ORDER BY 
        CASE grade
          WHEN 'Excellent' THEN 1
          WHEN 'Very Good' THEN 2
          WHEN 'Good' THEN 3
          WHEN 'Failed' THEN 4
        END
    `, params);

    // Calculate total and percentages
    const total = (gradesResult as any[]).reduce((sum, row) => sum + row.count, 0);
    
    const data = (gradesResult as any[]).map(row => ({
      grade: row.grade,
      range: row.range,
      count: row.count,
      percentage: total > 0 ? Math.round((row.count / total) * 100) : 0
    }));

    return NextResponse.json({
      success: true,
      data: data,
      message: "Grade distribution retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching grade distribution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch grade distribution',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
