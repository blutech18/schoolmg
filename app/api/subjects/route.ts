import { db } from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let result;

    // Check if InstructorID and ClassType columns exist in subjects table
    let hasInstructorColumn = false;
    let hasClassTypeColumn = false;

    try {
      const [instructorColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'InstructorID'");
      hasInstructorColumn = instructorColumns.length > 0;

      const [classTypeColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'ClassType'");
      hasClassTypeColumn = classTypeColumns.length > 0;
    } catch (err) {
      console.log('Could not check for columns:', err);
    }

    if (id) {
      // Get specific subject by ID
      let query;
      if (hasInstructorColumn) {
        query = `
          SELECT s.*, CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
          FROM subjects s
          LEFT JOIN users u ON s.InstructorID = u.UserID AND u.Role = 'instructor'
          WHERE s.SubjectID = ?
        `;
      } else {
        query = `SELECT * FROM subjects WHERE SubjectID = ?`;
      }
      const [rows]: any = await db.query(query, [parseInt(id)]);
      result = rows.length ? rows[0] : null;

      // Add default fields if columns don't exist
      if (result && !hasInstructorColumn) {
        result.InstructorID = null;
        result.InstructorName = null;
      }
      if (result && !hasClassTypeColumn) {
        result.ClassType = 'LECTURE';
      }
    } else {
      // Get all subjects
      let query;
      if (hasInstructorColumn) {
        query = `
          SELECT s.*, CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
          FROM subjects s
          LEFT JOIN users u ON s.InstructorID = u.UserID AND u.Role = 'instructor'
          ORDER BY s.SubjectCode
        `;
      } else {
        query = `SELECT * FROM subjects ORDER BY SubjectCode`;
      }
      const [rows]: any = await db.query(query);
      result = rows;

      // Add default fields if columns don't exist
      if (!hasInstructorColumn && Array.isArray(result)) {
        result = result.map(subject => ({
          ...subject,
          InstructorID: null,
          InstructorName: null
        }));
      }
      if (!hasClassTypeColumn && Array.isArray(result)) {
        result = result.map(subject => ({
          ...subject,
          ClassType: 'LECTURE'
        }));
      }

      // Check if Major column exists and add default if missing
      const [majorColumns]: any = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'Major'
      `);
      const hasMajorColumn = majorColumns.length > 0;

      if (!hasMajorColumn && Array.isArray(result)) {
        result = result.map(subject => ({
          ...subject,
          Major: 'Not Set'
        }));
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET subjects error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const subject = await req.json();
    console.log('Received subject data:', subject);

    // Validate required fields
    if (!subject.SubjectCode || !subject.SubjectName) {
      return NextResponse.json({ success: false, error: 'Subject code and name are required' }, { status: 400 });
    }

    // Check if InstructorID and ClassType columns exist in subjects table
    let hasInstructorColumn = false;
    let hasClassTypeColumn = false;

    try {
      const [instructorColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'InstructorID'");
      hasInstructorColumn = instructorColumns.length > 0;

      const [classTypeColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'ClassType'");
      hasClassTypeColumn = classTypeColumns.length > 0;
    } catch (err) {
      console.log('Could not check for columns:', err);
    }

    let insertQuery;
    let queryParams;

    if (hasInstructorColumn && hasClassTypeColumn) {
      insertQuery = `
        INSERT INTO subjects (SubjectCode, SubjectName, Units, Prerequisites, Description, InstructorID, ClassType)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null,
        subject.InstructorID || null,
        subject.ClassType || 'LECTURE'
      ];
    } else if (hasInstructorColumn) {
      insertQuery = `
        INSERT INTO subjects (SubjectCode, SubjectName, Units, Prerequisites, Description, InstructorID)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null,
        subject.InstructorID || null
      ];
    } else {
      insertQuery = `
        INSERT INTO subjects (SubjectCode, SubjectName, Units, Prerequisites, Description)
        VALUES (?, ?, ?, ?, ?)
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null
      ];
    }

    console.log('Executing query:', insertQuery);
    console.log('Query params:', queryParams);

    const [result]: any = await db.query(insertQuery, queryParams);

    console.log('Insert result:', result);

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: {
        SubjectID: result.insertId,
        ...subject
      }
    });
  } catch (error: any) {
    console.error('POST subject error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });

    // Handle duplicate subject code error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({
        success: false,
        error: 'Subject code already exists. Please use a unique subject code.'
      }, { status: 400 });
    }

    // Handle unknown column errors (database schema mismatch)
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return NextResponse.json({
        success: false,
        error: `Database schema issue: ${error.sqlMessage}. Please contact administrator.`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create subject. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const subject = await req.json();


    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!subject.SubjectCode || !subject.SubjectName) {
      return NextResponse.json({ error: 'Subject code and name are required' }, { status: 400 });
    }

    // Check if InstructorID and ClassType columns exist in subjects table
    let hasInstructorColumn = false;
    let hasClassTypeColumn = false;

    try {
      const [instructorColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'InstructorID'");
      hasInstructorColumn = instructorColumns.length > 0;

      const [classTypeColumns]: any = await db.query("SHOW COLUMNS FROM subjects LIKE 'ClassType'");
      hasClassTypeColumn = classTypeColumns.length > 0;
    } catch (err) {
      console.log('Could not check for columns:', err);
    }

    let updateQuery;
    let queryParams;

    if (hasInstructorColumn && hasClassTypeColumn) {
      updateQuery = `
        UPDATE subjects 
        SET SubjectCode = ?, SubjectName = ?, Units = ?, Prerequisites = ?, Description = ?, InstructorID = ?, ClassType = ?
        WHERE SubjectID = ?
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null,
        subject.InstructorID || null,
        subject.ClassType || 'LECTURE',
        parseInt(id)
      ];
    } else if (hasInstructorColumn) {
      updateQuery = `
        UPDATE subjects 
        SET SubjectCode = ?, SubjectName = ?, Units = ?, Prerequisites = ?, Description = ?, InstructorID = ?
        WHERE SubjectID = ?
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null,
        subject.InstructorID || null,
        parseInt(id)
      ];
    } else {
      updateQuery = `
        UPDATE subjects 
        SET SubjectCode = ?, SubjectName = ?, Units = ?, Prerequisites = ?, Description = ?
        WHERE SubjectID = ?
      `;
      queryParams = [
        subject.SubjectCode,
        subject.SubjectName,
        subject.Units || 3,
        subject.Prerequisites || null,
        subject.Description || null,
        parseInt(id)
      ];
    }

    await db.query(updateQuery, queryParams);

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully'
    });
  } catch (error: any) {
    console.error('PUT subject error:', error);

    // Handle duplicate subject code error
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const deleteQuery = 'DELETE FROM subjects WHERE SubjectID = ?';
    await db.query(deleteQuery, [parseInt(id)]);

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('DELETE subject error:', error);

    // Handle foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return NextResponse.json({
        error: 'Cannot delete subject as it is being used in schedules or other records'
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}