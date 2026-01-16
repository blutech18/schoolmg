import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

interface AttendanceStats {
  averageAttendance: number;
  totalRecords: number;
  presentRecords: number;
  absentRecords: number;
  excusedRecords: number;
  lateRecords: number;
  dropRecords: number;
  failedAttendanceRecords: number;
  cancelledRecords: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get overall attendance statistics
    // Calculate based on actual attendance records (excluding cancelled)
    const [statsResult] = await db.execute(`
      SELECT 
        COUNT(CASE WHEN Status != 'CC' THEN 1 END) as totalRecords,
        COUNT(CASE WHEN Status = 'P' THEN 1 END) as presentRecords,
        COUNT(CASE WHEN Status = 'A' THEN 1 END) as absentRecords,
        COUNT(CASE WHEN Status = 'E' THEN 1 END) as excusedRecords,
        COUNT(CASE WHEN Status = 'L' THEN 1 END) as lateRecords,
        COUNT(CASE WHEN Status = 'D' THEN 1 END) as dropRecords,
        COUNT(CASE WHEN Status = 'FA' THEN 1 END) as failedAttendanceRecords,
        COUNT(CASE WHEN Status = 'CC' THEN 1 END) as cancelledRecords
      FROM attendance
    `);

    const stats = (statsResult as any[])[0];

    // Calculate average attendance percentage
    // Present (P), Excused (E), and Late (L) are considered "attended"
    // Drop (D), Failed Attendance (FA), and CC (Cancelled) are NOT considered attended
    const attendedRecords = (stats.presentRecords || 0) + (stats.excusedRecords || 0) + (stats.lateRecords || 0);
    const cancelledRecords = stats.cancelledRecords || 0;
    const totalRecords = stats.totalRecords || 0; // Already excludes CC

    // Calculate the actual average attendance based on data
    let averageAttendance = 0;
    if (totalRecords > 0) {
      averageAttendance = (attendedRecords / totalRecords) * 100;

      // Cap at 100% - each record can only contribute once, so max is 100%
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
      averageAttendance: Math.round(averageAttendance * 10) / 10, // Round to 1 decimal place
      totalRecords: totalRecords,
      presentRecords: stats.presentRecords || 0,
      absentRecords: stats.absentRecords || 0,
      excusedRecords: stats.excusedRecords || 0,
      lateRecords: stats.lateRecords || 0,
      dropRecords: stats.dropRecords || 0,
      failedAttendanceRecords: stats.failedAttendanceRecords || 0,
      cancelledRecords: cancelledRecords
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
