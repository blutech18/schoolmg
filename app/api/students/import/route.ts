import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import * as XLSX from 'xlsx';

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

    // Determine file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        { success: false, error: 'Please upload a CSV or Excel file (.csv, .xlsx, .xls)' },
        { status: 400 }
      );
    }

    let rows: any[] = [];
    let headers: string[] = [];

    if (isExcel) {
      // Handle Excel files
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

      console.log('Excel sheets found:', workbook.SheetNames);

      // Find the data sheet (prefer "Student Data" sheet, otherwise use first non-Instructions sheet)
      let sheetName = workbook.SheetNames.find(name =>
        name.toLowerCase().includes('student') || name.toLowerCase().includes('data')
      );

      if (!sheetName) {
        sheetName = workbook.SheetNames.find(name => !name.toLowerCase().includes('instruction'));
      }

      if (!sheetName) {
        sheetName = workbook.SheetNames[0];
      }

      console.log('Using sheet:', sheetName);
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      console.log('Parsed rows count:', jsonData.length);
      console.log('First row (headers):', jsonData[0]);

      if (jsonData.length < 2) {
        return NextResponse.json(
          { success: false, error: 'File is empty or missing data. Make sure to add data rows after the header row.' },
          { status: 400 }
        );
      }

      // First row is headers
      headers = (jsonData[0] as string[]).map(h => String(h || '').trim());

      // Convert remaining rows to objects
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        if (!rowData || rowData.length === 0) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = rowData[index] !== undefined ? String(rowData[index]).trim() : '';
        });

        // Skip empty rows
        if (Object.values(row).every(v => !v)) continue;

        rows.push(row);
      }
    } else {
      // Handle CSV files
      const fileContent = await file.text();
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return NextResponse.json(
          { success: false, error: 'File is empty or missing data' },
          { status: 400 }
        );
      }

      // Parse CSV header
      headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        rows.push(row);
      }
    }

    // Expected headers (only truly required fields)
    const requiredHeaders = [
      'StudentNumber',
      'FirstName',
      'LastName',
      'EmailAddress',
      'Course',
      'YearLevel',
      'Section'
    ];

    console.log('Found headers:', headers);
    console.log('Required headers:', requiredHeaders);
    console.log('Total rows to process:', rows.length);

    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      console.log('Missing headers:', missingHeaders);
      return NextResponse.json(
        {
          success: false,
          error: `Missing required columns: ${missingHeaders.join(', ')}`,
          foundHeaders: headers
        },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, and array is 0-indexed

      try {
        // Validate required fields
        if (!row.StudentNumber || !row.FirstName || !row.LastName || !row.EmailAddress) {
          errors.push(`Row ${rowNum}: Missing required fields`);
          skipped++;
          continue;
        }

        // Check if user already exists
        const [existingUser] = await db.execute(
          'SELECT UserID FROM users WHERE EmailAddress = ?',
          [row.EmailAddress]
        );

        if ((existingUser as any[]).length > 0) {
          errors.push(`Row ${rowNum}: Email ${row.EmailAddress} already exists`);
          skipped++;
          continue;
        }

        // Check if student number already exists
        const [existingStudent] = await db.execute(
          'SELECT StudentID FROM students WHERE StudentNumber = ?',
          [row.StudentNumber]
        );

        if ((existingStudent as any[]).length > 0) {
          errors.push(`Row ${rowNum}: Student number ${row.StudentNumber} already exists`);
          skipped++;
          continue;
        }

        // Generate UserID for the new student
        let nextUserId: number;
        try {
          const [idRows]: any = await db.query('SELECT GetNextUserID(?) AS uid', ['student']);
          nextUserId = idRows[0].uid;
        } catch {
          // Fallback if function doesn't exist
          const [uidRows]: any = await db.query('SELECT GREATEST(100000, COALESCE(MAX(UserID), 100000) + 1) AS uid FROM users WHERE Role = ?', ['student']);
          nextUserId = uidRows[0].uid;
        }

        // Generate PrefixedID for the new student
        let prefixedId: string;
        try {
          const [pidRows]: any = await db.query('SELECT GetNextPrefixedID(?) AS pid', ['student']);
          prefixedId = pidRows[0].pid;
        } catch {
          // Fallback if function doesn't exist
          prefixedId = `STU-${nextUserId}`;
        }

        // Hash password (use a default if not provided)
        const { hashPassword } = await import('@/app/lib/passwords');
        const password = row.Password || '12345';
        const hashedPassword = await hashPassword(password);

        // Insert user with generated UserID
        await db.execute(
          `INSERT INTO users (UserID, PrefixedID, FirstName, LastName, MiddleName, EmailAddress, Password, Role, Status, Sex)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'student', 'active', ?)`,
          [
            nextUserId,
            prefixedId,
            row.FirstName,
            row.LastName,
            row.MiddleName || '',
            row.EmailAddress,
            hashedPassword,
            row.Sex || 'Male'
          ]
        );

        // Insert student record with PrefixedStudentID
        await db.execute(
          `INSERT INTO students (StudentID, PrefixedStudentID, StudentNumber, Course, YearLevel, Section, DateOfEnrollment)
           VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
          [
            nextUserId,
            prefixedId,
            row.StudentNumber,
            row.Course || 'General',
            parseInt(row.YearLevel) || 1,
            row.Section || 'A'
          ]
        );

        imported++;
      } catch (rowError: any) {
        console.error(`Error processing row ${rowNum}:`, rowError);
        errors.push(`Row ${rowNum}: ${rowError.message}`);
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

