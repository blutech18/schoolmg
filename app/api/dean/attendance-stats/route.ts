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
    // Get all records first, then filter CC in calculation
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
    `);

    const stats = (statsResult as any[])[0];
    
    // Calculate average attendance percentage
    // Present (P) and Excused (E) are considered "attended"
    // CC (Cancelled) records are excluded from both numerator and denominator
    const attendedRecords = (stats.presentRecords || 0) + (stats.excusedRecords || 0);
    const cancelledRecords = stats.cancelledRecords || 0;
    const totalRecords = (stats.totalRecords || 0) - cancelledRecords; // Exclude CC from total
    
    // Calculate the actual average attendance based on data
    let averageAttendance = 0;
    if (totalRecords > 0) {
      averageAttendance = (attendedRecords / totalRecords) * 100;
      
      // Ensure percentage is within valid range (0-100)
      // Only cap if calculation error causes impossible values
      if (averageAttendance > 100) {
        console.warn(`Attendance calculation warning: ${averageAttendance}% exceeds 100%. Data may have issues.`);
        // Don't cap - log the issue for investigation
        // The calculation should naturally be <= 100% if data is correct
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
