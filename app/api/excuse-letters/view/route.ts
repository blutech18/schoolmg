import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

// GET - View a specific file (for images and PDFs - opens in new tab)
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

    const connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT 
        FileName,
        FilePath,
        FileType
      FROM excuse_letter_files
      WHERE FileID = ?
    `;

    const [rows] = await connection.execute(query, [fileId]);
    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    const file = rows[0] as any;
    const filePath = path.join(process.cwd(), 'public', file.FilePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "File not found on server" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath);

    // Return the file with appropriate headers for viewing (not downloading)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.FileType || 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        // Note: No Content-Disposition header, so browser will try to display the file
      },
    });
  } catch (error) {
    console.error("Error viewing file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to view file" },
      { status: 500 }
    );
  }
}
