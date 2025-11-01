import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch cancelled sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID is required" }, { status: 400 });
    }

    // Query to get all CC records for this schedule and detect cancelled sessions
    const query = `
      SELECT 
        ScheduleID,
        Week,
        SessionType,
        Date,
        RecordedBy,
        Remarks as CancellationReason,
        COUNT(DISTINCT StudentID) as StudentCount
      FROM attendance 
      WHERE ScheduleID = ? 
        AND Status = 'CC'
      GROUP BY ScheduleID, Week, SessionType, Date, RecordedBy, Remarks
      ORDER BY Week, SessionType
    `;

    const [rows] = await db.execute(query, [scheduleId]);

    return NextResponse.json({ 
      success: true, 
      data: rows 
    });

  } catch (error: any) {
    console.error("Error fetching cancelled sessions:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch cancelled sessions",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

// POST - Save cancelled session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, week, sessionType, reason, cancelledBy } = body;

    if (!scheduleId || !week || !sessionType || !reason || !cancelledBy) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // First, get all students enrolled in this schedule
    const studentsQuery = `
      SELECT DISTINCT StudentID 
      FROM enrollments 
      WHERE ScheduleID = ?
    `;
    
    const [students] = await db.execute(studentsQuery, [scheduleId]);
    const studentIds = (students as any[]).map(s => s.StudentID);

    if (studentIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No students found for this schedule" 
      }, { status: 400 });
    }

    // Insert CC records for all students
    const insertQuery = `
      INSERT INTO attendance (
        StudentID, ScheduleID, Week, SessionType, Status, Date, Remarks, RecordedBy
      ) VALUES (?, ?, ?, ?, 'CC', NOW(), ?, ?)
      ON DUPLICATE KEY UPDATE
        Status = 'CC',
        Remarks = VALUES(Remarks),
        RecordedBy = VALUES(RecordedBy),
        LastModified = NOW()
    `;

    const remarks = reason;
    
    for (const studentId of studentIds) {
      await db.execute(insertQuery, [
        studentId, scheduleId, week, sessionType, remarks, cancelledBy
      ]);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Session cancellation saved successfully" 
    });

  } catch (error: any) {
    console.error("Error saving cancelled session:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save cancelled session",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Remove cancelled session (resume class)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { scheduleId, week, sessionType } = body;

    if (!scheduleId || !week || !sessionType) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Remove CC records for all students for this specific session
    const deleteQuery = `
      DELETE FROM attendance 
      WHERE ScheduleID = ? 
        AND Week = ? 
        AND SessionType = ? 
        AND Status = 'CC'
        AND Remarks LIKE '%Class cancelled%'
    `;

    await db.execute(deleteQuery, [scheduleId, week, sessionType]);

    return NextResponse.json({ 
      success: true, 
      message: "Session cancellation removed successfully" 
    });

  } catch (error: any) {
    console.error("Error removing cancelled session:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to remove cancelled session",
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}