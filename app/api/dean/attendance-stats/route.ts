import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

interface AttendanceStats {
  averageAttendance: number;
  totalRecords: number;
  presentRecords: number;
  absentRecords: number;
  excusedRecords: number;
  lateRecords: number;
  dismissedRecords: number;
  failedAttendanceRecords: number;
  cancelledRecords: number;
}

export async function GET(request: NextRequest) {
  try {
    // Get overall attendance statistics
    // Filter out cancelled records and count distinct attendance sessions
    const [statsResult] = await db.execute(`
      SELECT 
        COUNT(*) as totalRecords,
        SUM(CASE WHEN Status = 'P' THEN 1 ELSE 0 END) as presentRecords,
        SUM(CASE WHEN Status = 'A' THEN 1 ELSE 0 END) as absentRecords,
        SUM(CASE WHEN Status = 'E' THEN 1 ELSE 0 END) as excusedRecords,
        SUM(CASE WHEN Status = 'L' THEN 1 ELSE 0 END) as lateRecords,
        SUM(CASE WHEN Status = 'D' THEN 1 ELSE 0 END) as dismissedRecords,
        SUM(CASE WHEN Status = 'FA' THEN 1 ELSE 0 END) as failedAttendanceRecords,
        SUM(CASE WHEN Status = 'CC' THEN 1 ELSE 0 END) as cancelledRecords
      FROM attendance
      WHERE Status != 'CC'
    `);

    const stats = (statsResult as any[])[0];
    
    // Calculate average attendance percentage
    // Present (P) and Excused (E) are considered "attended", CC is excluded from calculations
    const attendedRecords = (stats.presentRecords || 0) + (stats.excusedRecords || 0);
    const totalRecords = stats.totalRecords || 0; // Already excludes CC from WHERE clause
    
    // Calculate percentage and cap it at 100% to prevent values exceeding 100%
    let averageAttendance = 0;
    if (totalRecords > 0) {
      averageAttendance = (attendedRecords / totalRecords) * 100;
      // Cap at 100% to handle any data inconsistencies or calculation errors
      if (averageAttendance > 100) {
        console.warn(`Attendance percentage exceeded 100%: ${averageAttendance}%. Capping at 100%.`);
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
      dismissedRecords: stats.dismissedRecords || 0,
      failedAttendanceRecords: stats.failedAttendanceRecords || 0,
      cancelledRecords: stats.cancelledRecords || 0
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
