import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

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

    console.log(`Deleting attendance records for student ${studentId}, schedule ${scheduleId}, status ${status}`);

    // Delete all records for this student with the specified status
    const deleteQuery = "DELETE FROM attendance WHERE StudentID = ? AND ScheduleID = ? AND Status = ?";
    const [result]: any = await db.execute(deleteQuery, [studentId, scheduleId, status]);

    console.log(`Deleted ${result.affectedRows} attendance records for student ${studentId} with status ${status}`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} attendance records`,
      affectedRows: result.affectedRows
    });
  } catch (error: any) {
    console.error("Error deleting attendance records:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete attendance records",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

