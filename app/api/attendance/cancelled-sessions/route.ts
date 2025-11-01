import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

// GET - Fetch cancelled sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

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

    const [rows] = await connection.execute(query, [scheduleId]);
    await connection.end();

    return NextResponse.json({ 
      success: true, 
      data: rows 
    });

  } catch (error) {
    console.error("Error fetching cancelled sessions:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch cancelled sessions" 
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

    const connection = await mysql.createConnection(dbConfig);

    // First, get all students enrolled in this schedule
    const studentsQuery = `
      SELECT DISTINCT StudentID 
      FROM enrollments 
      WHERE ScheduleID = ?
    `;
    
    const [students] = await connection.execute(studentsQuery, [scheduleId]);
    const studentIds = (students as any[]).map(s => s.StudentID);

    if (studentIds.length === 0) {
      await connection.end();
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
      await connection.execute(insertQuery, [
        studentId, scheduleId, week, sessionType, remarks, cancelledBy
      ]);
    }

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      message: "Session cancellation saved successfully" 
    });

  } catch (error) {
    console.error("Error saving cancelled session:", error);
    
    let errorMessage = "Failed to save cancelled session";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
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

    const connection = await mysql.createConnection(dbConfig);

    // Remove CC records for all students for this specific session
    const deleteQuery = `
      DELETE FROM attendance 
      WHERE ScheduleID = ? 
        AND Week = ? 
        AND SessionType = ? 
        AND Status = 'CC'
        AND Remarks LIKE '%Class cancelled%'
    `;

    const result = await connection.execute(deleteQuery, [scheduleId, week, sessionType]);
    await connection.end();

    return NextResponse.json({ 
      success: true, 
      message: "Session cancellation removed successfully" 
    });

  } catch (error) {
    console.error("Error removing cancelled session:", error);
    
    let errorMessage = "Failed to remove cancelled session";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}