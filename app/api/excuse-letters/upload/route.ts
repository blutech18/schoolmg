import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { put, del } from '@vercel/blob';

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const excuseLetterID = formData.get('excuseLetterID') as string;
    const files = formData.getAll('files') as File[];

    if (!excuseLetterID) {
      return NextResponse.json(
        { success: false, error: "Excuse letter ID is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: `File type ${file.type} is not allowed` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `excuse-letters/${excuseLetterID}_${timestamp}_${randomString}.${fileExtension}`;

      // Upload to Vercel Blob
      const blob = await put(fileName, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Save file info to database
      const insertQuery = `
        INSERT INTO excuse_letter_files 
        (ExcuseLetterID, FileName, OriginalName, FileSize, FileType, FilePath)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.execute(insertQuery, [
        excuseLetterID,
        fileName,
        file.name,
        file.size,
        file.type,
        blob.url  // Store the blob URL instead of local path
      ]);

      uploadedFiles.push({
        fileId: (result as any).insertId,
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: blob.url
      });
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      files: uploadedFiles
    });

  } catch (error) {
    console.error("Error uploading files:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to upload files", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Fetch files for an excuse letter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const excuseLetterID = searchParams.get("excuseLetterID");

    if (!excuseLetterID) {
      return NextResponse.json(
        { success: false, error: "Excuse letter ID is required" },
        { status: 400 }
      );
    }

    const query = `
      SELECT * FROM excuse_letter_files 
      WHERE ExcuseLetterID = ?
      ORDER BY UploadDate DESC
    `;

    const [rows] = await db.execute(query, [excuseLetterID]);

    return NextResponse.json({ success: true, data: rows });

  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get file info first
    const [fileRows] = await db.execute(
      "SELECT * FROM excuse_letter_files WHERE FileID = ?",
      [fileId]
    );

    if ((fileRows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    const fileInfo = (fileRows as any[])[0];

    // Delete from database
    await db.execute(
      "DELETE FROM excuse_letter_files WHERE FileID = ?",
      [fileId]
    );

    // Delete from Vercel Blob storage
    try {
      await del(fileInfo.FilePath, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobError) {
      console.warn("Could not delete file from blob storage:", blobError);
    }

    return NextResponse.json({
      success: true,
      message: "File deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
