import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - View a specific file (redirects to Vercel Blob URL)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT 
        FilePath,
        FileType,
        OriginalName
      FROM excuse_letter_files
      WHERE FileID = ?
    `;

    const [rows] = await db.execute(query, [fileId]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    const file = rows[0] as any;

    // Return the Vercel Blob URL so the frontend can open it directly
    // This avoids CORS issues with redirects and credentials
    return NextResponse.json({
      success: true,
      url: file.FilePath,
      fileName: file.OriginalName,
      fileType: file.FileType
    });

  } catch (error: any) {
    console.error("Error viewing file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to view file",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
