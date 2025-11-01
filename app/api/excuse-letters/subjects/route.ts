import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch subjects for a specific excuse letter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excuseLetterId = searchParams.get("excuseLetterId");

    if (!excuseLetterId) {
      return NextResponse.json(
        { success: false, error: "Excuse letter ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        els.*,
        s.Section,
        s.Course,
        s.YearLevel,
        COALESCE(els.SubjectCode, s.SubjectCode) as SubjectCode,
        COALESCE(els.SubjectTitle, s.SubjectTitle) as SubjectTitle,
        COALESCE(els.InstructorName, CONCAT(u.FirstName, ' ', u.LastName)) as InstructorName
      FROM excuse_letter_subjects els
      LEFT JOIN schedules s ON els.ScheduleID = s.ScheduleID
      LEFT JOIN users u ON s.InstructorID = u.UserID
      WHERE els.ExcuseLetterID = ?
      ORDER BY els.SubjectCode, els.SubjectTitle
    `;

    console.log("Subjects query:", query);
    console.log("Excuse letter ID:", excuseLetterId);
    
    // First, let's check what's in the excuse_letter_subjects table
    const [rawRows] = await db.query(`
      SELECT * FROM excuse_letter_subjects WHERE ExcuseLetterID = ?
    `, [excuseLetterId]);
    console.log("Raw excuse_letter_subjects data:", rawRows);
    
    const [rows] = await db.query(query, [excuseLetterId]);
    
    console.log("Subjects query result count:", (rows as any[]).length);
    console.log("Subjects query result:", rows);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Error fetching excuse letter subjects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch excuse letter subjects" },
      { status: 500 }
    );
  }
}
