import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'File is empty or missing data' },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    // Expected headers
    const requiredHeaders = [
      'StudentNumber',
      'FirstName',
      'LastName',
      'EmailAddress',
      'Password',
      'Course',
      'YearLevel',
      'Section'
    ];

    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required columns: ${missingHeaders.join(', ')}`
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.StudentNumber || !row.FirstName || !row.LastName || !row.EmailAddress) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          skipped++;
          continue;
        }

        // Check if user already exists
        const [existingUser] = await db.execute(
          'SELECT UserID FROM users WHERE EmailAddress = ?',
          [row.EmailAddress]
        );

        if ((existingUser as any[]).length > 0) {
          errors.push(`Row ${i + 1}: Email ${row.EmailAddress} already exists`);
          skipped++;
          continue;
        }

        // Hash password (use a default if not provided)
        const { hashPassword } = await import('@/app/lib/passwords');
        const password = row.Password || 'changeme123';
        const hashedPassword = await hashPassword(password);

        // Insert user
        const [userResult] = await db.execute(
          `INSERT INTO users (FirstName, LastName, MiddleName, EmailAddress, Password, Role, Status)
           VALUES (?, ?, ?, ?, ?, 'student', 'active')`,
          [
            row.FirstName,
            row.LastName,
            row.MiddleName || '',
            row.EmailAddress,
            hashedPassword
          ]
        );

        const userId = (userResult as any).insertId;

        // Insert student record
        await db.execute(
          `INSERT INTO students (StudentID, StudentNumber, Course, YearLevel, Section)
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId,
            row.StudentNumber,
            row.Course || 'General',
            parseInt(row.YearLevel) || 1,
            row.Section || 'A'
          ]
        );

        imported++;
      } catch (rowError: any) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        errors.push(`Row ${i + 1}: ${rowError.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 10 ? errors.slice(0, 10) : errors,
      message: `Successfully imported ${imported} students. ${skipped} rows skipped.`
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import students',
        details: error.message
      },
      { status: 500 }
    );
  }
}

