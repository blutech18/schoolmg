import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

// POST - Restore student by removing D/FA status records
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const {
      studentId,
      scheduleId,
      recordedBy,
    } = body;

    // Enhanced validation with detailed logging
    console.log("Received restore request:", {
      studentId, scheduleId, recordedBy
    });
    
    if (!studentId || !scheduleId || !recordedBy) {
      const missingFields = [];
      if (!studentId) missingFields.push('studentId');
      if (!scheduleId) missingFields.push('scheduleId');
      if (!recordedBy) missingFields.push('recordedBy');
      
      console.log("Missing required fields:", missingFields);
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    console.log("Attempting to connect to database...");
    const connection = await mysql.createConnection(dbConfig);
    console.log("Database connection successful");

    // Delete D and FA status records for this student in this schedule
    const deleteQuery = `
      DELETE FROM attendance 
      WHERE StudentID = ? AND ScheduleID = ? AND Status IN ('D', 'FA')
    `;

    console.log("Executing delete query with params:", [studentId, scheduleId]);
    const [result] = await connection.execute(deleteQuery, [studentId, scheduleId]);
    console.log("Delete query result:", result);

    // Log the restoration action
    const logQuery = `
      INSERT INTO attendance 
      (StudentID, ScheduleID, Week, Status, Date, Remarks, RecordedBy)
      VALUES (?, ?, 1, 'RESTORED', NOW(), 'Student status restored by instructor', ?)
    `;

    await connection.execute(logQuery, [studentId, scheduleId, recordedBy]);

    await connection.end();

    return NextResponse.json({
      success: true,
      message: "Student restored successfully",
      deletedRecords: (result as any).affectedRows
    });
  } catch (error) {
    console.error("Error restoring student:", error);
    console.error("Request body was:", body);
    
    // Provide more specific error information
    let errorMessage = "Failed to restore student";
    if (error instanceof Error) {
      errorMessage += ": " + error.message;
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
