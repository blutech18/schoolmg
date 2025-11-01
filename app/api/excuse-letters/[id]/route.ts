import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// PUT - Update excuse letter status (approve/decline) by ID
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const excuseLetterID = resolvedParams.id;
    const body = await request.json();

    if (!excuseLetterID) {
      return NextResponse.json(
        { success: false, error: "Excuse letter ID is required" },
        { status: 400 }
      );
    }

    // Handle instructor-specific request format
    if (body.instructorStatus && body.instructorComment !== undefined) {
      const { instructorStatus, instructorComment } = body;

      if (!instructorStatus) {
        return NextResponse.json(
          { success: false, error: "Instructor status is required" },
          { status: 400 }
        );
      }

      const updateQuery = `
        UPDATE excuse_letters
        SET InstructorStatus = ?, InstructorComment = ?, InstructorActionDate = NOW()
        WHERE ExcuseLetterID = ?
      `;

      await db.execute(updateQuery, [
        instructorStatus,
        instructorComment || null,
        excuseLetterID,
      ]);

      // Update overall status based on all approvals
      const statusQuery = `
        SELECT DeanStatus, CoordinatorStatus, InstructorStatus
        FROM excuse_letters
        WHERE ExcuseLetterID = ?
      `;

      const [statusRows] = await db.execute(statusQuery, [excuseLetterID]);
      const statusData = (statusRows as any[])[0];

      if (!statusData) {
        return NextResponse.json(
          { success: false, error: "Excuse letter not found" },
          { status: 404 }
        );
      }

      // Determine overall status
      let overallStatus = "pending";
      
      if (statusData.DeanStatus === "approved" && 
          statusData.CoordinatorStatus === "approved" && 
          statusData.InstructorStatus === "approved") {
        overallStatus = "approved";
      } else if (statusData.DeanStatus === "declined" || 
                 statusData.CoordinatorStatus === "declined" || 
                 statusData.InstructorStatus === "declined") {
        overallStatus = "declined";
      } else if (statusData.DeanStatus === "approved" || 
                 statusData.CoordinatorStatus === "approved" || 
                 statusData.InstructorStatus === "approved") {
        overallStatus = "partial";
      }

      await db.execute(
        "UPDATE excuse_letters SET Status = ? WHERE ExcuseLetterID = ?",
        [overallStatus, excuseLetterID]
      );

      return NextResponse.json({
        success: true,
        message: "Excuse letter status updated successfully",
      });
    }

    // Handle general request format (for dean, coordinator, etc.)
    const { userRole, status, comment } = body;

    if (!userRole || !status) {
      return NextResponse.json(
        { success: false, error: "User role and status are required" },
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

    await db.execute(updateQuery, params);

    // Update overall status based on all approvals
    const statusQuery = `
      SELECT DeanStatus, CoordinatorStatus, InstructorStatus
      FROM excuse_letters
      WHERE ExcuseLetterID = ?
    `;

    const [statusRows] = await db.execute(statusQuery, [excuseLetterID]);
    const statusData = (statusRows as any[])[0];

    if (!statusData) {
      return NextResponse.json(
        { success: false, error: "Excuse letter not found" },
        { status: 404 }
      );
    }

    // Determine overall status
    let overallStatus = "pending";
    
    if (statusData.DeanStatus === "approved" && 
        statusData.CoordinatorStatus === "approved" && 
        statusData.InstructorStatus === "approved") {
      overallStatus = "approved";
    } else if (statusData.DeanStatus === "declined" || 
               statusData.CoordinatorStatus === "declined" || 
               statusData.InstructorStatus === "declined") {
      overallStatus = "declined";
    } else if (statusData.DeanStatus === "approved" || 
               statusData.CoordinatorStatus === "approved" || 
               statusData.InstructorStatus === "approved") {
      overallStatus = "partial";
    }

    await db.execute(
      "UPDATE excuse_letters SET Status = ? WHERE ExcuseLetterID = ?",
      [overallStatus, excuseLetterID]
    );

    return NextResponse.json({
      success: true,
      message: "Excuse letter status updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating excuse letter:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update excuse letter status",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
