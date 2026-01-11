import { db } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let connection: any = null;
  try {
    const student = await req.json();

    // Start transaction for atomic operations
    await db.query('START TRANSACTION');

    // Generate IDs via DB functions backed by sequences
    let nextStudentId: number;
    try {
      const [idRows]: any = await db.query('SELECT GetNextUserID(?) AS uid', ['student']);
      nextStudentId = idRows[0].uid;
    } catch {
      const [uidRows]: any = await db.query('SELECT GREATEST(100000, NextVal(?)) AS uid', ['user_student']);
      nextStudentId = uidRows[0].uid;
    }

    let nextPrefixedId: string;
    try {
      const [pidRows]: any = await db.query('SELECT GetNextPrefixedID(?) AS pid', ['student']);
      nextPrefixedId = pidRows[0].pid;
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Failed to generate PrefixedID:', error);
      return NextResponse.json({
        error: 'Failed to generate student ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Insert into users table with prefixed ID for students
    const userQuery = `
      INSERT INTO users (UserID, PrefixedID, FirstName, LastName, MiddleName, EmailAddress, Password, Sex, Role, Status, IsPWD, ContactNumber)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const { hashPassword, isHashed } = await import('@/app/lib/passwords')
    const passwordToStore = isHashed(student.Password) ? student.Password : await hashPassword(student.Password)

    try {
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
    } catch (error: any) {
      await db.query('ROLLBACK');
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('uq_users_prefixed')) {
          return NextResponse.json({
            error: 'Duplicate PrefixedID detected. Please try again.',
            details: 'A student with this ID already exists'
          }, { status: 409 });
        }
        if (error.message.includes('EmailAddress')) {
          return NextResponse.json({
            error: 'Email already exists',
            details: 'This email address is already in use'
          }, { status: 409 });
        }
      }
      console.error('Failed to insert user:', error);
      return NextResponse.json({
        error: 'Failed to create student',
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }

    const userId = nextStudentId;

    // Generate student number using sequence per year to avoid races
    // Ensure uniqueness by checking if the number already exists and retrying if needed
    const currentYear = new Date().getFullYear();
    let studentNumber: string;
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops

    try {
      do {
        const [numRows]: any = await db.query('SELECT GetNextStudentNumber(?) AS snum', [currentYear]);
        studentNumber = numRows[0].snum;

        // Check if this student number already exists
        const [existingCheck]: any = await db.query(
          'SELECT COUNT(*) as count FROM students WHERE StudentNumber = ?',
          [studentNumber]
        );

        if (existingCheck[0].count === 0) {
          // Student number is unique, break out of loop
          break;
        }

        // If duplicate found, increment attempts and try again
        attempts++;
        if (attempts >= maxAttempts) {
          await db.query('ROLLBACK');
          console.error('Failed to generate unique StudentNumber after multiple attempts');
          return NextResponse.json({
            error: 'Failed to generate unique student number',
            details: 'Unable to generate a unique student number after multiple attempts. Please try again.'
          }, { status: 500 });
        }

        // Log the retry attempt
        console.warn(`Student number ${studentNumber} already exists, retrying... (attempt ${attempts})`);
      } while (attempts < maxAttempts);
    } catch (error) {
      await db.query('ROLLBACK');
      console.error('Failed to generate StudentNumber:', error);
      return NextResponse.json({
        error: 'Failed to generate student number',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Insert into students table with additional fields including prefixed ID
    const studentQuery = `
      INSERT INTO students (
        StudentID, PrefixedStudentID, StudentNumber, Course, YearLevel, Section, DateOfEnrollment,
        ContactNumber, GuardianName, GuardianContact, Address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
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
    } catch (error: any) {
      await db.query('ROLLBACK');
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('uq_students_prefixed')) {
          return NextResponse.json({
            error: 'Duplicate PrefixedStudentID detected. Please try again.',
            details: 'A student with this ID already exists'
          }, { status: 409 });
        }
        if (error.message.includes('uq_students_studentnumber')) {
          return NextResponse.json({
            error: 'Duplicate StudentNumber detected. Please try again.',
            details: 'A student with this number already exists'
          }, { status: 409 });
        }
      }
      console.error('Failed to insert student:', error);
      return NextResponse.json({
        error: 'Failed to create student',
        details: error.message || 'Unknown error'
      }, { status: 500 });
    }

    // Commit transaction
    await db.query('COMMIT');

    return NextResponse.json({
      message: "Student created successfully",
      UserID: userId,
      PrefixedID: nextPrefixedId,
      StudentNumber: studentNumber
    });
  } catch (err: any) {
    await db.query('ROLLBACK').catch(() => { });
    console.error('POST student error:', err);
    return NextResponse.json({
      error: 'Failed to create student',
      details: err.message || 'Unknown error'
    }, { status: 500 });
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

    // Format DateOfEnrollment to YYYY-MM-DD for MySQL DATE column
    let formattedDate = student.DateOfEnrollment;
    if (formattedDate) {
      // If it's an ISO string or Date object, extract just the date part
      const dateObj = new Date(formattedDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD
      }
    }

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
      formattedDate,
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
