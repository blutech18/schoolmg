import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

interface AttendanceStats {
  averageAttendance: number;
  totalRecords: number;
  presentRecords: number;
  absentRecords: number;
  excusedRecords: number;
  lateRecords: number;
  unmarkedRecords: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get overall attendance statistics
    const [statsResult] = await db.execute(`
      SELECT 
        COUNT(*) as totalActualRecords,
        COUNT(CASE WHEN Status = 'P' THEN 1 END) as presentRecords,
        COUNT(CASE WHEN Status = 'A' THEN 1 END) as absentRecords,
        COUNT(CASE WHEN Status = 'E' THEN 1 END) as excusedRecords,
        COUNT(CASE WHEN Status = 'L' THEN 1 END) as lateRecords
      FROM attendance
      WHERE Status IN ('P', 'A', 'E', 'L')
    `);

    const stats = (statsResult as any[])[0];

    // Calculate expected attendance records
    // For each enrollment, we expect attendance records for weeks 1-18 for both lecture and lab sessions
    // However, we'll use a simpler approach: count distinct student-schedule combinations
    const [expectedResult] = await db.execute(`
      SELECT 
        COUNT(DISTINCT CONCAT(e.StudentID, '-', e.ScheduleID)) as totalEnrollments
      FROM enrollments e
      WHERE e.Status = 'enrolled'
    `);

    const expectedStats = (expectedResult as any[])[0];
    const totalEnrollments = expectedStats.totalEnrollments || 0;

    // For a more accurate calculation, we need to know how many weeks/sessions have been conducted
    // Let's get the maximum week number from attendance records
    const [maxWeekResult] = await db.execute(`
      SELECT COALESCE(MAX(Week), 0) as maxWeek
      FROM attendance
    `);

    const maxWeek = (maxWeekResult as any[])[0]?.maxWeek || 0;

    // Calculate expected records: enrollments × max week × 2 (lecture + lab sessions)
    // This assumes each schedule can have both lecture and lab sessions
    const expectedTotalRecords = totalEnrollments * maxWeek * 2;

    // Unmarked = Expected records - Actual records taken
    const actualRecordsTaken = stats.totalActualRecords || 0;
    const unmarkedRecords = Math.max(0, expectedTotalRecords - actualRecordsTaken);

    // Total records for percentage calculation includes both actual and unmarked
    const totalRecords = actualRecordsTaken + unmarkedRecords;

    // Calculate average attendance percentage
    // Only Present (P), Excused (E), and Late (L) are considered "attended"
    const attendedRecords = (stats.presentRecords || 0) + (stats.excusedRecords || 0) + (stats.lateRecords || 0);

    // Calculate the actual average attendance based on data
    let averageAttendance = 0;
    if (totalRecords > 0) {
      averageAttendance = (attendedRecords / totalRecords) * 100;

      // Cap at 100%
      if (averageAttendance > 100) {
        console.warn(`Attendance calculation exceeded 100%: ${averageAttendance}%. Capping at 100%.`);
        console.warn(`Debug: attendedRecords=${attendedRecords}, totalRecords=${totalRecords}`);
        averageAttendance = 100;
      }
      if (averageAttendance < 0) {
        averageAttendance = 0;
      }
    }

    const attendanceStats: AttendanceStats = {
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      totalRecords: totalRecords,
      presentRecords: stats.presentRecords || 0,
      absentRecords: stats.absentRecords || 0,
      excusedRecords: stats.excusedRecords || 0,
      lateRecords: stats.lateRecords || 0,
      unmarkedRecords: unmarkedRecords
    };

    return NextResponse.json({
      success: true,
      data: attendanceStats,
      message: "Attendance statistics retrieved successfully"
    });

  } catch (error: any) {
    console.error("Error fetching attendance statistics:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch attendance statistics",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
