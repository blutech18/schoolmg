import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/app/lib/db";

interface ScheduleAnalytics {
  scheduleId: number;
  subjectCode: string;
  subjectName: string;
  course: string;
  section: string;
  yearLevel: number;
  instructorName: string;
  totalStudents: number;
  attendanceRate: number;
  averageGrade: number;
  day: string;
  time: string;
  room: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters if needed
    const { searchParams } = new URL(request.url);
    const schoolYear = searchParams.get('schoolYear');
    const semester = searchParams.get('semester');
    
    console.log('Schedule analytics request:', { schoolYear, semester });
    
    // Get schedule analytics data
    let query = `
      SELECT 
        sch.ScheduleID,
        COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown') as SubjectCode,
        COALESCE(sch.SubjectName, sch.SubjectTitle, subj.SubjectName, 'Unknown Subject') as SubjectName,
        sch.Course,
        sch.Section,
        sch.YearLevel,
        COALESCE(CONCAT(u.FirstName, ' ', u.LastName), 'No Instructor') as instructorName,
        COUNT(DISTINCT enrollment_data.StudentID) as totalStudents,
        COALESCE(attendance_data.attendance_rate, 0) as attendanceRate,
        COALESCE(grade_data.average_grade, 0) as averageGrade,
        sch.Day,
        sch.Time,
        sch.Room
      FROM schedules sch
      LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
      LEFT JOIN users u ON sch.InstructorID = u.UserID
      LEFT JOIN (
        SELECT DISTINCT a.ScheduleID, s.StudentID
        FROM attendance a
        JOIN students s ON a.StudentID = s.StudentID
      ) enrollment_data ON sch.ScheduleID = enrollment_data.ScheduleID
      LEFT JOIN (
        SELECT 
          a.ScheduleID,
          CASE 
            WHEN COUNT(*) > 0 THEN ROUND((SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2)
            ELSE 0
          END as attendance_rate
        FROM attendance a
        WHERE a.Status != 'CC'
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
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Add filters if provided
    if (schoolYear) {
      query += ` AND sch.AcademicYear = ?`;
      params.push(schoolYear);
    }
    
    if (semester) {
      query += ` AND sch.Semester = ?`;
      params.push(semester);
    }
    
    query += `
      GROUP BY sch.ScheduleID
      ORDER BY sch.Course, sch.YearLevel, sch.Section, SubjectName
    `;
    
    console.log('Executing query with params:', params);
    const [schedulesResult] = await db.execute(query, params);
    console.log(`Found ${(schedulesResult as any[]).length} schedules`);

    const analytics: ScheduleAnalytics[] = (schedulesResult as any[]).map(row => ({
      scheduleId: row.ScheduleID || 0,
      subjectCode: row.SubjectCode || '',
      subjectName: row.SubjectName || '',
      course: row.Course || '',
      section: row.Section || '',
      yearLevel: row.YearLevel || 0,
      instructorName: row.instructorName || 'No Instructor',
      totalStudents: row.totalStudents || 0,
      attendanceRate: Math.round(row.attendanceRate || 0),
      averageGrade: Math.round(row.averageGrade || 0),
      day: row.Day || '',
      time: row.Time || '',
      room: row.Room || ''
    }));

    return NextResponse.json({
      success: true,
      data: analytics,
      message: "Schedule analytics retrieved successfully"
    });

  } catch (error: any) {
    console.error('Error fetching schedule analytics:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch schedule analytics',
        data: [],
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
