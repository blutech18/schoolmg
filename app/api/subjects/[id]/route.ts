import { db } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/subjects/[id]
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    

    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    // Check if required columns exist
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
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    let result = rows[0];
    
    // Add default fields if columns don't exist
    if (!hasInstructorColumn) {
      result.InstructorID = null;
      result.InstructorName = null;
    }
    if (!hasClassTypeColumn) {
      result.ClassType = 'lecture-only';
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET subject error:', error);
    return NextResponse.json({ error: 'Failed to fetch subject' }, { status: 500 });
  }
}

// PUT /api/subjects/[id]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const subject = body;

    // Validate required fields
    if (!subject.SubjectCode || !subject.SubjectName) {
      return NextResponse.json({ error: 'Subject code and name are required' }, { status: 400 });
    }

    // Check if required columns exist
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

    const [result] = await db.query(updateQuery, queryParams);

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

// DELETE /api/subjects/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const id = resolvedParams.id;

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