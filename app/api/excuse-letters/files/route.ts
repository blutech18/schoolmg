import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch files for a specific excuse letter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excuseLetterID = searchParams.get("excuseLetterID");

    if (!excuseLetterID) {
      return NextResponse.json(
        { success: false, error: "Excuse Letter ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        FileID,
        FileName,
        FilePath,
        FileSize,
        FileType,
        UploadDate
      FROM excuse_letter_files
      WHERE ExcuseLetterID = ?
      ORDER BY UploadDate ASC
    `;

    const [rows] = await db.execute(query, [excuseLetterID]);

    return NextResponse.json({ 
      success: true, 
      files: rows 
    });
  } catch (error: any) {
    console.error("Error fetching excuse letter files:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch files",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
