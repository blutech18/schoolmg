import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Download a specific file (redirects to Vercel Blob URL with download header)
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
        OriginalName,
        FileType
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

    // FilePath contains the Vercel Blob URL
    // For download, we fetch the blob and return it with download headers
    const blobResponse = await fetch(file.FilePath);

    if (!blobResponse.ok) {
      return NextResponse.json(
        { success: false, error: "File not accessible" },
        { status: 404 }
      );
    }

    const blob = await blobResponse.blob();

    return new NextResponse(blob, {
      headers: {
        'Content-Type': file.FileType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${file.OriginalName}"`,
      },
    });

  } catch (error: any) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to download file",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
