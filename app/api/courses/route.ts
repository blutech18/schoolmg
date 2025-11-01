import { db } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');

    if (courseId) {
      // Get specific course
      const query = `
        SELECT 
          CourseID,
          CourseCode,
          CourseName,
          Description,
          TotalUnits,
          DurationYears,
          Status,
          CreatedAt,
          UpdatedAt
        FROM courses 
        WHERE CourseID = ?
      `;
      const [courses]: any = await db.query(query, [parseInt(courseId)]);
      return NextResponse.json(courses[0] || null);
    } else {
      // Get all courses
      const query = `
        SELECT 
          CourseID,
          CourseCode,
          CourseName,
          Description,
          TotalUnits,
          DurationYears,
          Status,
          CreatedAt,
          UpdatedAt
        FROM courses 
        ORDER BY CourseCode ASC
      `;
      const [courses]: any = await db.query(query);
      return NextResponse.json(courses);
    }
  } catch (err) {
    console.error('GET courses error:', err);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const course = await req.json();
    
    const query = `
      INSERT INTO courses (
        CourseCode, CourseName, Description, TotalUnits, 
        DurationYears, Status
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result]: any = await db.query(query, [
      course.CourseCode,
      course.CourseName,
      course.Description,
      course.TotalUnits,
      course.DurationYears,
      course.Status || 'active'
    ]);

    return NextResponse.json({ 
      message: "Course created successfully", 
      CourseID: result.insertId 
    });
  } catch (err) {
    console.error('POST course error:', err);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const course = await req.json();
    
    const query = `
      UPDATE courses 
      SET CourseCode = ?, CourseName = ?, Description = ?, 
          TotalUnits = ?, DurationYears = ?, 
          Status = ?, UpdatedAt = NOW()
      WHERE CourseID = ?
    `;
    
    await db.query(query, [
      course.CourseCode,
      course.CourseName,
      course.Description,
      course.TotalUnits,
      course.DurationYears,
      course.Status,
      course.CourseID
    ]);

    return NextResponse.json({ message: 'Course updated successfully' });
  } catch (err) {
    console.error('PUT course error:', err);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    // Check if course has enrolled students
    const checkQuery = `
      SELECT COUNT(*) as studentCount 
      FROM students 
      WHERE Course = (SELECT CourseCode FROM courses WHERE CourseID = ?)
    `;
    const [checkResult]: any = await db.query(checkQuery, [parseInt(courseId)]);
    
    if (checkResult[0].studentCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete course with enrolled students' 
      }, { status: 400 });
    }

    const deleteQuery = `DELETE FROM courses WHERE CourseID = ?`;
    await db.query(deleteQuery, [parseInt(courseId)]);

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('DELETE course error:', err);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
