import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch excuse letters based on user role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userRole = searchParams.get("role");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const studentId = searchParams.get("studentId");
    const limit = searchParams.get("limit");

    let query = `
      SELECT DISTINCT
        el.*,
        CONCAT(u.FirstName, ' ', u.LastName) as StudentName,
        s.Course,
        s.Section,
        s.YearLevel,
        CASE 
          WHEN el.IsMultiSubject = 1 THEN 'Multiple Subjects'
          ELSE COALESCE(el.SubjectCode, sch.SubjectCode)
        END as SubjectCode,
        CASE 
          WHEN el.IsMultiSubject = 1 THEN 'Multiple Subjects'
          ELSE COALESCE(el.SubjectTitle, sch.SubjectTitle)
        END as SubjectTitle,
        CASE 
          WHEN el.IsMultiSubject = 1 THEN 'Multiple Instructors'
          ELSE COALESCE(el.InstructorName, CONCAT(inst.FirstName, ' ', inst.LastName))
        END as InstructorName,
        COALESCE(el.ScheduleID, sch.ScheduleID) as ScheduleID,
        (SELECT COUNT(*) FROM excuse_letter_subjects els WHERE els.ExcuseLetterID = el.ExcuseLetterID) as SubjectCount,
        (SELECT GROUP_CONCAT(DISTINCT els.ScheduleID ORDER BY els.ScheduleID) FROM excuse_letter_subjects els WHERE els.ExcuseLetterID = el.ExcuseLetterID) as AllScheduleIds,
        (SELECT GROUP_CONCAT(DISTINCT els.SubjectCode ORDER BY els.SubjectCode) FROM excuse_letter_subjects els WHERE els.ExcuseLetterID = el.ExcuseLetterID) as AllSubjectCodes,
        (SELECT GROUP_CONCAT(DISTINCT els.SubjectTitle ORDER BY els.SubjectTitle) FROM excuse_letter_subjects els WHERE els.ExcuseLetterID = el.ExcuseLetterID) as AllSubjectTitles
      FROM excuse_letters el
      JOIN students s ON el.StudentID = s.StudentID
      JOIN users u ON s.StudentID = u.UserID
      LEFT JOIN schedules sch ON el.ScheduleID = sch.ScheduleID AND el.IsMultiSubject = 0
      LEFT JOIN users inst ON sch.InstructorID = inst.UserID AND el.IsMultiSubject = 0
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter based on user role
    if (userRole === "student" && userId) {
      query += " AND el.StudentID = ?";
      params.push(userId);
    } else if (userRole === "instructor" && userId) {
      // For instructors, we need to check all schedules they teach
      // This includes both single-subject and multi-subject excuse letters
      query += ` AND (
        sch.InstructorID = ? OR 
        el.ScheduleID IN (SELECT ScheduleID FROM schedules WHERE InstructorID = ?) OR
        el.ExcuseLetterID IN (
          SELECT els.ExcuseLetterID 
          FROM excuse_letter_subjects els
          JOIN schedules s ON els.ScheduleID = s.ScheduleID
          WHERE s.InstructorID = ?
        )
      )`;
      params.push(userId, userId, userId);
    }

    // Additional filters
    if (status) {
      query += " AND el.Status = ?";
      params.push(status);
    }

    if (studentId) {
      query += " AND el.StudentID = ?";
      params.push(studentId);
    }

    query += " ORDER BY el.SubmissionDate DESC";

    // Add limit if specified
    if (limit) {
      query += " LIMIT ?";
      params.push(parseInt(limit));
    }

    console.log("Excuse letters query:", query);
    console.log("Query params:", params);
    
    const [rows] = await db.query(query, params);
    
    console.log("Query result count:", (rows as any[]).length);
    console.log("Query result:", rows);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching excuse letters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch excuse letters" },
      { status: 500 }
    );
  }
}

// POST - Create new excuse letter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      scheduleId, // For backward compatibility - single subject
      scheduleIds, // New - multiple subjects
      subject,
      reason,
      dateFrom,
      dateTo,
      subjectCode,
      subjectTitle,
      instructorName
    } = body;

    // Validation
    if (!studentId || !subject || !reason || !dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: "Student ID, subject, reason, and dates are required" },
        { status: 400 }
      );
    }

    // Determine if this is a multi-subject or single-subject excuse letter
    const isMultiSubject = scheduleIds && Array.isArray(scheduleIds) && scheduleIds.length > 0;
    const singleScheduleId = scheduleId || (isMultiSubject ? null : null);

    if (!isMultiSubject && !singleScheduleId) {
      return NextResponse.json(
        { success: false, error: "At least one subject/schedule must be selected" },
        { status: 400 }
      );
    }

    // Validate that all selected schedules belong to the student
    if (isMultiSubject) {
      const validationQuery = `
        SELECT COUNT(*) as count 
        FROM enrollments e 
        WHERE e.StudentID = ? AND e.ScheduleID IN (${scheduleIds.map(() => '?').join(',')})
      `;
      const [validationResult] = await db.query(validationQuery, [studentId, ...scheduleIds]);
      
      if ((validationResult as any[])[0].count !== scheduleIds.length) {
        return NextResponse.json(
          { success: false, error: "One or more selected subjects do not belong to the student" },
          { status: 400 }
        );
      }
    }

    // Start transaction for multi-table insert
    await db.query('START TRANSACTION');

    try {
      // Insert the main excuse letter record
      const insertQuery = `
        INSERT INTO excuse_letters 
        (StudentID, ScheduleID, Subject, Reason, DateFrom, DateTo, SubjectCode, SubjectTitle, InstructorName, Status, IsMultiSubject)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(insertQuery, [
        studentId,
        singleScheduleId, // NULL for multi-subject, actual ID for single subject
        subject,
        reason,
        dateFrom,
        dateTo,
        subjectCode || null,
        subjectTitle || null,
        instructorName || null,
        'pending',
        isMultiSubject ? 1 : 0
      ]);

      const excuseLetterId = (result as any).insertId;

      // If multi-subject, insert records into the junction table
      if (isMultiSubject) {
        for (const scheduleId of scheduleIds) {
          // Get schedule details for each subject
          const [scheduleDetails] = await db.query(`
            SELECT s.SubjectCode, s.SubjectTitle, CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
            FROM schedules s
            LEFT JOIN users u ON s.InstructorID = u.UserID
            WHERE s.ScheduleID = ?
          `, [scheduleId]);

          const schedule = (scheduleDetails as any[])[0];
          
          console.log(`Inserting subject for schedule ${scheduleId}:`, {
            excuseLetterId,
            scheduleId,
            subjectCode: schedule.SubjectCode,
            subjectTitle: schedule.SubjectTitle,
            instructorName: schedule.InstructorName
          });
          
          await db.query(`
            INSERT INTO excuse_letter_subjects 
            (ExcuseLetterID, ScheduleID, SubjectCode, SubjectTitle, InstructorName)
            VALUES (?, ?, ?, ?, ?)
          `, [
            excuseLetterId,
            scheduleId,
            schedule.SubjectCode,
            schedule.SubjectTitle,
            schedule.InstructorName
          ]);
        }
      }

      await db.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: isMultiSubject 
          ? `Excuse letter submitted successfully for ${scheduleIds.length} subjects`
          : "Excuse letter submitted successfully",
        excuseLetterID: excuseLetterId,
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error("Error creating excuse letter:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: "Failed to submit excuse letter" },
      { status: 500 }
    );
  }
}

// PUT - Update excuse letter status (approve/decline)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      excuseLetterID,
      userRole,
      status,
      comment,
    } = body;

    if (!excuseLetterID || !userRole || !status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    let updateFields = "";
    const params: any[] = [];

    // Update based on user role
    switch (userRole) {
      case "dean":
        updateFields = "DeanStatus = ?, DeanComment = ?, DeanActionDate = NOW()";
        params.push(status, comment || null);
        break;
      case "programcoor":
        updateFields = "CoordinatorStatus = ?, CoordinatorComment = ?, CoordinatorActionDate = NOW()";
        params.push(status, comment || null);
        break;
      case "instructor":
        updateFields = "InstructorStatus = ?, InstructorComment = ?, InstructorActionDate = NOW()";
        params.push(status, comment || null);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Invalid user role" },
          { status: 400 }
        );
    }

    params.push(excuseLetterID);

    const updateQuery = `
      UPDATE excuse_letters 
      SET ${updateFields}
      WHERE ExcuseLetterID = ?
    `;

    await db.query(updateQuery, params);

    // If approved by instructor, update attendance records to 'Excused' for all linked subjects
    if (userRole === "instructor" && status === "approved") {
      // Get the excuse letter details and all linked subjects
      const [excuseLetterRows] = await db.query(`
        SELECT 
          el.StudentID, 
          el.DateFrom, 
          el.DateTo,
          COALESCE(el.ScheduleID, els.ScheduleID) as ScheduleID
        FROM excuse_letters el
        LEFT JOIN excuse_letter_subjects els ON el.ExcuseLetterID = els.ExcuseLetterID
        WHERE el.ExcuseLetterID = ?
      `, [excuseLetterID]);

      if ((excuseLetterRows as any[]).length > 0) {
        const excuseLetter = (excuseLetterRows as any[])[0];
        
        // Update attendance records for all linked subjects in the date range
        for (const row of excuseLetterRows as any[]) {
          if (row.ScheduleID) {
            await db.query(`
              UPDATE attendance 
              SET Status = 'E', 
                  Remarks = CONCAT(
                    COALESCE(Remarks, ''), 
                    ' - Excused via approved excuse letter (ID: ', ?, ')'
                  )
              WHERE StudentID = ? 
                AND ScheduleID = ? 
                AND Date BETWEEN ? AND ?
                AND Status = 'A'
            `, [
              excuseLetterID,
              excuseLetter.StudentID,
              row.ScheduleID,
              excuseLetter.DateFrom,
              excuseLetter.DateTo
            ]);
          }
        }
      }
    }

    // Update overall status based on all approvals
    const statusQuery = `
      SELECT DeanStatus, CoordinatorStatus, InstructorStatus
      FROM excuse_letters
      WHERE ExcuseLetterID = ?
    `;

    const [statusRows] = await db.query(statusQuery, [excuseLetterID]);
    const statusData = (statusRows as any[])[0];

    let overallStatus = "pending";
    if (statusData.DeanStatus === "declined" || 
        statusData.CoordinatorStatus === "declined" || 
        statusData.InstructorStatus === "declined") {
      overallStatus = "declined";
    } else if (statusData.DeanStatus === "approved" && 
               statusData.CoordinatorStatus === "approved" && 
               statusData.InstructorStatus === "approved") {
      overallStatus = "approved";
    } else if ((statusData.DeanStatus === "approved" || statusData.DeanStatus === "pending") &&
               (statusData.CoordinatorStatus === "approved" || statusData.CoordinatorStatus === "pending") &&
               (statusData.InstructorStatus === "approved" || statusData.InstructorStatus === "pending") &&
               (statusData.DeanStatus === "approved" || statusData.CoordinatorStatus === "approved" || statusData.InstructorStatus === "approved")) {
      overallStatus = "partial";
    }

    await db.query(
      "UPDATE excuse_letters SET Status = ? WHERE ExcuseLetterID = ?",
      [overallStatus, excuseLetterID]
    );

    return NextResponse.json({
      success: true,
      message: "Excuse letter status updated successfully",
    });
  } catch (error) {
    console.error("Error updating excuse letter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update excuse letter status" },
      { status: 500 }
    );
  }
}
