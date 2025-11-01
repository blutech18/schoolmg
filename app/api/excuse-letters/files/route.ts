import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

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

    const connection = await mysql.createConnection(dbConfig);

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

    const [rows] = await connection.execute(query, [excuseLetterID]);
    await connection.end();

    return NextResponse.json({ 
      success: true, 
      files: rows 
    });
  } catch (error) {
    console.error("Error fetching excuse letter files:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
