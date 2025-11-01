import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

// DELETE - Remove all attendance records with specific status for a student
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const scheduleId = searchParams.get("scheduleId");
    const status = searchParams.get("status");

    if (!studentId || !scheduleId || !status) {
      return NextResponse.json(
        { success: false, error: "All parameters are required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['D', 'FA'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be 'D' or 'FA'" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // Delete all records for this student with the specified status
    const deleteQuery = "DELETE FROM attendance WHERE StudentID = ? AND ScheduleID = ? AND Status = ?";
    const [result]: any = await connection.execute(deleteQuery, [studentId, scheduleId, status]);

    await connection.end();

    console.log(`Deleted ${result.affectedRows} attendance records for student ${studentId} with status ${status}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} attendance records`,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error("Error deleting attendance records:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete attendance records" },
      { status: 500 }
    );
  }
}

