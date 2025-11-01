import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

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
    const connection = await mysql.createConnection(dbConfig);

    // Get overall attendance statistics
    const [statsResult] = await connection.execute(`
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
    // Present (P) and Excused (E) are considered "attended", CC is excluded from calculations
    const attendedRecords = (stats.presentRecords || 0) + (stats.excusedRecords || 0);
    const totalRecords = (stats.totalRecords || 0) - (stats.cancelledRecords || 0); // Exclude CC from total
    const averageAttendance = totalRecords > 0 ? (attendedRecords / totalRecords) * 100 : 0;

    await connection.end();

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

  } catch (error) {
    console.error("Error fetching attendance statistics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance statistics" },
      { status: 500 }
    );
  }
}
