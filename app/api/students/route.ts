import { db } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const student = await req.json();

    // Get next student UserID (students now start from 100000)
    const [maxStudentResult]: any = await db.query(
      'SELECT MAX(UserID) as maxId FROM users WHERE Role = "student"'
    );
    const nextStudentId = Math.max((maxStudentResult[0].maxId || 99999) + 1, 100000);

    // Generate prefixed ID manually since the function might not exist
    const [existingPrefixedResult]: any = await db.query(
      'SELECT MAX(CAST(SUBSTRING(PrefixedID, 3) AS UNSIGNED)) as maxNum FROM users WHERE PrefixedID LIKE "st%"'
    );
    const nextPrefixedNum = (existingPrefixedResult[0].maxNum || 0) + 1;
    const nextPrefixedId = `st${nextPrefixedNum}`;

    // Insert into users table with prefixed ID for students
    const userQuery = `
      INSERT INTO users (UserID, PrefixedID, FirstName, LastName, MiddleName, EmailAddress, Password, Sex, Role, Status, IsPWD, ContactNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const { hashPassword, isHashed } = await import('@/app/lib/passwords')
    const passwordToStore = isHashed(student.Password) ? student.Password : await hashPassword(student.Password)

    await db.query(userQuery, [
      nextStudentId,
      nextPrefixedId,
      student.FirstName,
      student.LastName,
      student.MiddleName,
      student.EmailAddress,
      passwordToStore,
      student.Sex,
      "student",
      student.Status,
      student.IsPWD ? 'Yes' : 'No',
      student.ContactNumber || null
    ]);

    const userId = nextStudentId;

    // Generate student number automatically
    const currentYear = new Date().getFullYear();

    // Get the count of students for this year to generate sequential number
    const countQuery = `
      SELECT COUNT(*) as count
      FROM students
      WHERE StudentNumber LIKE ?
    `;
    const [countResult]: any = await db.query(countQuery, [`${currentYear}-%`]);
    const studentCount = countResult[0].count + 1;
    const studentNumber = `${currentYear}-${studentCount.toString().padStart(4, '0')}`;

    // Insert into students table with additional fields including prefixed ID
    const studentQuery = `
      INSERT INTO students (
        StudentID, PrefixedStudentID, StudentNumber, Course, YearLevel, Section, DateOfEnrollment,
        ContactNumber, GuardianName, GuardianContact, Address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await db.query(studentQuery, [
      userId,
      nextPrefixedId,
      studentNumber,
      student.Course,
      student.YearLevel,
      student.Section,
      student.DateOfEnrollment,
      student.ContactNumber || null,
      student.GuardianName || null,
      student.GuardianContact || null,
      student.Address || null
    ]);

    return NextResponse.json({
      message: "Student created successfully",
      UserID: userId,
      PrefixedID: nextPrefixedId,
      StudentNumber: studentNumber
    });
  } catch (err) {
    console.error('POST student error:', err);
    return NextResponse.json({ error: 'Failed to create student' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = `
      SELECT
        u.UserID,
        u.PrefixedID,
        u.FirstName,
        u.LastName,
        u.MiddleName,
        u.EmailAddress,
        u.Sex,
        u.Role,
        u.Status,
        u.IsPWD,
        u.ContactNumber,
        s.StudentID,
        s.PrefixedStudentID,
        s.StudentNumber,
        s.Course,
        s.YearLevel,
        s.Section,
        s.DateOfEnrollment,
        s.ContactNumber as StudentContactNumber,
        s.GuardianName,
        s.GuardianContact,
        s.Address
      FROM users u
      JOIN students s ON u.UserID = s.StudentID
      WHERE u.Role = 'student'
    `;
    
    let queryParams: any[] = [];
    
    // If userId is provided, filter by specific user
    if (userId) {
      query += ` AND u.UserID = ?`;
      queryParams.push(parseInt(userId));
    }

    const [students]: any = await db.query(query, queryParams);

    // Transform the data to match the expected interface
    const transformedStudents = students.map((student: any) => ({
      ...student,
      ContactNumber: student.StudentContactNumber || student.ContactNumber,
      IsPWD: student.IsPWD === 'Yes'
    }));

    // Return data directly (not wrapped in success/data object for admin table compatibility)
    return NextResponse.json(transformedStudents);
  } catch (err) {
    console.error('GET students error:', err);
    return NextResponse.json({ 
      error: 'Failed to fetch students' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const student = await req.json();

    // Update users table with basic user information
    const updateUserQuery = `
      UPDATE users
      SET FirstName = ?, LastName = ?, MiddleName = ?, EmailAddress = ?,
          Sex = ?, Status = ?, IsPWD = ?, ContactNumber = ?
      WHERE UserID = ?
    `;

    await db.query(updateUserQuery, [
      student.FirstName,
      student.LastName,
      student.MiddleName,
      student.EmailAddress,
      student.Sex,
      student.Status,
      student.IsPWD ? 'Yes' : 'No',
      student.ContactNumber || null,
      student.UserID
    ]);

    // Update students table with student-specific information
    // Note: StudentNumber is intentionally excluded to prevent modification
    const updateStudentQuery = `
      UPDATE students
      SET Course = ?, YearLevel = ?, Section = ?, DateOfEnrollment = ?,
          ContactNumber = ?, GuardianName = ?, GuardianContact = ?, Address = ?
      WHERE StudentID = ?
    `;

    await db.query(updateStudentQuery, [
      student.Course,
      student.YearLevel,
      student.Section,
      student.DateOfEnrollment,
      student.ContactNumber || null,
      student.GuardianName || null,
      student.GuardianContact || null,
      student.Address || null,
      student.UserID
    ]);

    return NextResponse.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error('PUT student error:', err);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdParam = searchParams.get('id')

    if (!userIdParam) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const UserID = parseInt(userIdParam)
    console.log(`Attempting to delete student with ID: ${UserID}`)

    // Start a transaction to ensure data consistency
    await db.query('START TRANSACTION')

    try {
      // First, delete related records that might reference this student
      // Delete from attendance table
      await db.query('DELETE FROM attendance WHERE StudentID = ?', [UserID])
      console.log('Deleted attendance records')

      // Delete from enrollments table
      await db.query('DELETE FROM enrollments WHERE StudentID = ?', [UserID])
      console.log('Deleted enrollment records')

      // Delete from grades table
      await db.query('DELETE FROM grades WHERE StudentID = ?', [UserID])
      console.log('Deleted grade records')

      // Delete from excuse_letters table
      await db.query('DELETE FROM excuse_letters WHERE StudentID = ?', [UserID])
      console.log('Deleted excuse letter records')

      // Delete from students table
      await db.query('DELETE FROM students WHERE StudentID = ?', [UserID])
      console.log('Student deleted from students table')

      // Finally, delete from users table
      await db.query('DELETE FROM users WHERE UserID = ?', [UserID])
      console.log('User deleted from users table')

      // Commit the transaction
      await db.query('COMMIT')
      console.log('Transaction committed successfully')

      return NextResponse.json({ message: 'Student deleted successfully' })
    } catch (deleteError) {
      // Rollback the transaction if any error occurs
      await db.query('ROLLBACK')
      console.error('Delete operation failed, transaction rolled back:', deleteError)
      throw deleteError
    }
  } catch (err) {
    console.error('DELETE student error:', err)
    return NextResponse.json({ 
      error: 'Failed to delete student', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 })
  }
}
