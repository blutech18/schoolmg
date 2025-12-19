import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch attendance records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const studentId = searchParams.get("studentId");
    const week = searchParams.get("week");
    const sessionType = searchParams.get("sessionType");
    const userRole = searchParams.get("role");
    const userId = searchParams.get("userId");

    let query = `
      SELECT 
        a.*,
        CONCAT(u.FirstName, ' ', u.LastName) as StudentName,
        s.Course,
        s.Section,
        s.YearLevel,
        COALESCE(NULLIF(sch.SubjectCode, ''), NULLIF(sch.SubjectCode, 'null'), 'UNKNOWN') as SubjectCode,
        COALESCE(
          NULLIF(subj.SubjectName, ''),
          NULLIF(subj.SubjectName, 'null'),
          NULLIF(sch.SubjectName, ''),
          NULLIF(sch.SubjectName, 'null'),
          NULLIF(sch.SubjectTitle, ''),
          NULLIF(sch.SubjectTitle, 'null'),
          'Unknown Subject'
        ) as SubjectTitle,
        COALESCE(
          NULLIF(subj.SubjectName, ''),
          NULLIF(subj.SubjectName, 'null'),
          NULLIF(sch.SubjectName, ''),
          NULLIF(sch.SubjectName, 'null'),
          NULLIF(sch.SubjectTitle, ''),
          NULLIF(sch.SubjectTitle, 'null'),
          'Unknown Subject'
        ) as SubjectName,
        CONCAT(recorder.FirstName, ' ', recorder.LastName) as RecorderName,
        COALESCE(CONCAT(instructor.FirstName, ' ', instructor.LastName), 'No Instructor') as InstructorName
      FROM attendance a
      JOIN students s ON a.StudentID = s.StudentID
      JOIN users u ON s.StudentID = u.UserID
      JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
      LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
      LEFT JOIN users recorder ON a.RecordedBy = recorder.UserID
      LEFT JOIN users instructor ON sch.InstructorID = instructor.UserID
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter based on user role
    if (userRole === "student" && userId) {
      query += " AND a.StudentID = ?";
      params.push(userId);
    } else if (userRole === "instructor" && userId) {
      query += " AND sch.InstructorID = ?";
      params.push(userId);
    }

    // Additional filters
    if (scheduleId) {
      query += " AND a.ScheduleID = ?";
      params.push(scheduleId);
    }

    if (studentId) {
      query += " AND a.StudentID = ?";
      params.push(studentId);
    }

    if (week) {
      query += " AND a.Week = ?";
      params.push(week);
    }

    if (sessionType) {
      query += " AND a.SessionType = ?";
      params.push(sessionType);
    }

    query += " ORDER BY a.Week ASC, a.SessionType ASC, u.LastName ASC, u.FirstName ASC";

    const [rows] = await db.execute(query, params);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("Error fetching attendance:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch attendance records",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create or update attendance record
export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
    const {
      studentId,
      scheduleId,
      week,
      status,
      date,
      remarks,
      recordedBy,
      sessionType = 'lecture', // Default to lecture for backward compatibility
    } = body;

    // Enhanced validation with detailed logging
    console.log("Received attendance data:", {
      studentId, scheduleId, week, status, date, remarks, recordedBy, sessionType
    });
    
    if (!studentId || !scheduleId || !week || !status || !date || !recordedBy) {
      const missingFields = [];
      if (!studentId) missingFields.push('studentId');
      if (!scheduleId) missingFields.push('scheduleId');
      if (!week) missingFields.push('week');
      if (!status) missingFields.push('status');
      if (!date) missingFields.push('date');
      if (!recordedBy) missingFields.push('recordedBy');
      
      console.log("Missing required fields:", missingFields);
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    if (week < 1 || week > 18) {
      return NextResponse.json(
        { success: false, error: "Week must be between 1 and 18" },
        { status: 400 }
      );
    }

    const validStatuses = ['P', 'A', 'E', 'L', 'D', 'FA', 'CC'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status code" },
        { status: 400 }
      );
    }

    const validSessionTypes = ['lecture', 'lab'];
    if (!validSessionTypes.includes(sessionType)) {
      return NextResponse.json(
        { success: false, error: "Invalid session type. Must be 'lecture' or 'lab'" },
        { status: 400 }
      );
    }

    console.log("Attempting to connect to database...");
    console.log("Database connection successful");

    // Check if record already exists for this specific date and session type
    const checkQuery = `
      SELECT AttendanceID FROM attendance 
      WHERE StudentID = ? AND ScheduleID = ? AND Week = ? AND SessionType = ? AND Date = ?
    `;

    console.log("Executing check query with params:", [studentId, scheduleId, week, sessionType, date]);
    const [existingRows] = await db.execute(checkQuery, [
      studentId, scheduleId, week, sessionType, date
    ]);
    console.log("Check query result:", existingRows);

    let result;
    if ((existingRows as any[]).length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE attendance 
        SET Status = ?, Remarks = ?, RecordedBy = ?, LastModified = NOW()
        WHERE StudentID = ? AND ScheduleID = ? AND Week = ? AND SessionType = ? AND Date = ?
      `;

      result = await db.execute(updateQuery, [
        status, remarks, recordedBy, studentId, scheduleId, week, sessionType, date
      ]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO attendance 
        (StudentID, ScheduleID, Week, SessionType, Status, Date, Remarks, RecordedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      result = await db.execute(insertQuery, [
        studentId, scheduleId, week, sessionType, status, date, remarks, recordedBy
      ]);
    }

    // Auto-check for F.A. based on absence count
    // Get schedule class type to determine absence threshold
    const [scheduleRows] = await db.execute(
      `SELECT ClassType FROM schedules WHERE ScheduleID = ?`,
      [scheduleId]
    );
    const classType = (scheduleRows as any[])[0]?.ClassType?.toUpperCase() || 'LECTURE';
    
    // Count absences for this student in the current session type
    const [absenceRows] = await db.execute(
      `SELECT COUNT(*) as absenceCount 
       FROM attendance 
       WHERE StudentID = ? AND ScheduleID = ? AND SessionType = ? AND Status = 'A'`,
      [studentId, scheduleId, sessionType]
    );
    const absenceCount = (absenceRows as any[])[0]?.absenceCount || 0;
    
    // Determine threshold based on class type and session type
    let absenceThreshold = 3; // Default for LECTURE
    if (classType.includes('LAB') || classType.includes('CISCO')) {
      absenceThreshold = 7;
    }
    
    // Auto-mark as F.A. if threshold is exceeded
    let autoMarkedFA = false;
    if (absenceCount >= absenceThreshold && status !== 'FA' && status !== 'D') {
      console.log(`Student ${studentId} has ${absenceCount} absences (threshold: ${absenceThreshold}). Auto-marking as F.A.`);
      
      // Update current record to F.A.
      await db.execute(
        `UPDATE attendance 
         SET Status = 'FA', Remarks = ?, LastModified = NOW()
         WHERE StudentID = ? AND ScheduleID = ? AND Week = ? AND SessionType = ? AND Date = ?`,
        [`Auto-marked F.A.: ${absenceCount} absences exceeded threshold of ${absenceThreshold}`, studentId, scheduleId, week, sessionType, date]
      );
      
      autoMarkedFA = true;
    }

    // If student is marked as D (Dropped) or FA (Failed due to Absences), 
    // mark them with the same status for ALL sessions (1-18) in both lecture and lab
    if (status === 'D' || status === 'FA' || autoMarkedFA) {
      const finalStatus = autoMarkedFA ? 'FA' : status;
      console.log(`Student marked as ${finalStatus}, updating all sessions...`);
      
      const sessionTypes = ['lecture', 'lab'];
      const bulkUpdatePromises = [];
      
      for (const sessionTypeToUpdate of sessionTypes) {
        for (let sessionWeek = 1; sessionWeek <= 18; sessionWeek++) {
          // Skip the current record we just inserted/updated
          if (sessionTypeToUpdate === sessionType && sessionWeek === week) {
            continue;
          }
          
          const bulkUpdateQuery = `
            INSERT INTO attendance 
            (StudentID, ScheduleID, Week, SessionType, Status, Date, Remarks, RecordedBy)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            Status = VALUES(Status),
            Remarks = VALUES(Remarks),
            RecordedBy = VALUES(RecordedBy),
            LastModified = NOW()
          `;
          
          const bulkRemarks = autoMarkedFA 
            ? `Auto-marked F.A.: ${absenceCount} absences exceeded threshold of ${absenceThreshold}`
            : `Manually marked as ${finalStatus === 'D' ? 'Dropped' : 'Failed due to Absences'} across all sessions`;
          
          bulkUpdatePromises.push(
            db.execute(bulkUpdateQuery, [
              studentId, scheduleId, sessionWeek, sessionTypeToUpdate, finalStatus, date, bulkRemarks, recordedBy
            ])
          );
        }
      }
      
      // Execute all bulk updates
      console.log(`About to execute ${bulkUpdatePromises.length} bulk update queries...`);
      const bulkResults = await Promise.all(bulkUpdatePromises);
      console.log(`Bulk update results:`, bulkResults.map((result: any) => ({
        affectedRows: result[0].affectedRows,
        insertId: result[0].insertId
      })));
      console.log(`Successfully updated ${finalStatus} status across all sessions for student ${studentId}`);
    }

    return NextResponse.json({
      success: true,
      message: status === 'D' || status === 'FA' 
        ? `Student marked as ${status === 'D' ? 'Dropped' : 'Failed due to Absences'} across all sessions`
        : "Attendance record saved successfully",
    });
  } catch (error) {
    console.error("Error saving attendance:", error);
    console.error("Request body was:", body);
    
    // Provide more specific error information
    let errorMessage = "Failed to save attendance record";
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

// PUT - Bulk update attendance (for quick marking)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scheduleId,
      week,
      status,
      date,
      recordedBy,
      studentIds, // Array of student IDs to update
      sessionType = 'lecture', // Default to lecture for backward compatibility
      overrideExisting = false,
      ccReason = null // For Class Cancellation reason
    } = body;

    // Validation
    if (!scheduleId || !week || !status || !date || !recordedBy || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { success: false, error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    if (week < 1 || week > 18) {
      return NextResponse.json(
        { success: false, error: "Week must be between 1 and 18" },
        { status: 400 }
      );
    }

    const validStatuses = ['P', 'A', 'E', 'L', 'D', 'FA', 'CC'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status code" },
        { status: 400 }
      );
    }

    // Special validation for CC (Class Cancellation)
    if (status === 'CC' && !ccReason) {
      return NextResponse.json(
        { success: false, error: "Class cancellation requires a reason" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (const studentId of studentIds) {
      // Check if record exists
      const checkQuery = `
        SELECT AttendanceID FROM attendance 
        WHERE StudentID = ? AND ScheduleID = ? AND Week = ? AND SessionType = ?
      `;

      const [existingRows] = await db.execute(checkQuery, [
        studentId, scheduleId, week, sessionType
      ]);

      if ((existingRows as any[]).length > 0) {
        if (overrideExisting) {
          // Update existing record
          const statusText = status === 'P' ? 'Present' : 
                           status === 'A' ? 'Absent' : 
                           status === 'E' ? 'Excused' : 
                           status === 'L' ? 'Late' : 
                           status === 'D' ? 'Dropped' : 
                           status === 'FA' ? 'Failure due to Absences' : 
                           status === 'CC' ? 'Class Cancelled' : status;
          
          const remarks = status === 'CC' 
            ? `Class Cancelled by instructor (bulk action for ${sessionType} session ${week}). Reason: ${ccReason}`
            : `Marked as ${statusText} by instructor (bulk action for ${sessionType} session ${week})`;

          const updateQuery = `
            UPDATE attendance 
            SET Status = ?, Date = ?, RecordedBy = ?, Remarks = ?, LastModified = NOW()
            WHERE StudentID = ? AND ScheduleID = ? AND Week = ? AND SessionType = ?
          `;

          await db.execute(updateQuery, [
            status, date, recordedBy, remarks, studentId, scheduleId, week, sessionType
          ]);
          updatedCount++;
        }
      } else {
        // Insert new record
        const statusText = status === 'P' ? 'Present' : 
                         status === 'A' ? 'Absent' : 
                         status === 'E' ? 'Excused' : 
                         status === 'L' ? 'Late' : 
                         status === 'D' ? 'Dropped' : 
                         status === 'FA' ? 'Failure due to Absences' : 
                         status === 'CC' ? 'Class Cancelled' : status;
        
        const remarks = status === 'CC' 
          ? `Class Cancelled by instructor (bulk action for ${sessionType} session ${week}). Reason: ${ccReason}`
          : `Marked as ${statusText} by instructor (bulk action for ${sessionType} session ${week})`;

        const insertQuery = `
          INSERT INTO attendance 
          (StudentID, ScheduleID, Week, SessionType, Status, Date, RecordedBy, Remarks)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(insertQuery, [
          studentId, scheduleId, week, sessionType, status, date, recordedBy, remarks
        ]);
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk attendance update completed`,
      summary: {
        inserted: insertedCount,
        updated: updatedCount,
        total: studentIds.length
      }
    });
  } catch (error: any) {
    console.error("Error bulk updating attendance:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to bulk update attendance",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove attendance record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attendanceId = searchParams.get("attendanceId");

    if (!attendanceId) {
      return NextResponse.json(
        { success: false, error: "Attendance ID is required" },
        { status: 400 }
      );
    }

    const deleteQuery = "DELETE FROM attendance WHERE AttendanceID = ?";
    await db.execute(deleteQuery, [attendanceId]);

    return NextResponse.json({
      success: true,
      message: "Attendance record deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting attendance:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete attendance record",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
