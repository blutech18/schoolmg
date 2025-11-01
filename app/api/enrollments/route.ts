import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../lib/db';
import { cookies } from 'next/headers';

interface IEnrollment {
  EnrollmentID: number;
  StudentID: string;
  ScheduleID: number;
  EnrollmentDate: string;
  Status: string;
  StudentName?: string;
  StudentNumber?: string;
  Course?: string;
  YearLevel?: number;
  Section?: string;
  SubjectCode?: string;
  SubjectName?: string;
  InstructorName?: string;
  Semester?: string;
  AcademicYear?: string;
}

// Helper function to get user session
async function getUserSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('userSession');
  
  if (!sessionCookie) {
    return null;
  }
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || session.role;
    const studentId = searchParams.get('studentId');
    const scheduleId = searchParams.get('scheduleId');
    const limit = searchParams.get('limit');

    let enrollmentsQuery = `
      SELECT
        e.EnrollmentID,
        e.StudentID,
        e.ScheduleID,
        e.EnrollmentDate,
        e.Status,
        CONCAT(u.FirstName,
               CASE WHEN u.MiddleName IS NOT NULL AND u.MiddleName != ''
                    THEN CONCAT(' ', u.MiddleName, ' ')
                    ELSE ' '
               END,
               u.LastName) as StudentName,
        u.FirstName,
        u.MiddleName,
        u.LastName,
        COALESCE(s.StudentNumber, CONCAT('ST-', e.StudentID)) as StudentNumber,
        COALESCE(s.Course, 'N/A') as Course,
        COALESCE(s.YearLevel, 1) as YearLevel,
        COALESCE(s.Section, 'A') as Section,
        COALESCE(sub.SubjectCode, sch.SubjectCode, CONCAT('SUB-', e.ScheduleID)) as SubjectCode,
        COALESCE(sub.SubjectName, sch.SubjectName, CONCAT('Subject ', e.ScheduleID)) as SubjectName,
        COALESCE(CONCAT(inst.FirstName, ' ', inst.LastName), 'Instructor Not Found') as InstructorName,
        COALESCE(sch.Semester, '1st') as Semester,
        COALESCE(sch.AcademicYear, '2025-2026') as AcademicYear
      FROM enrollments e
      LEFT JOIN users u ON e.StudentID = u.UserID
      LEFT JOIN students s ON u.UserID = s.StudentID
      LEFT JOIN schedules sch ON e.ScheduleID = sch.ScheduleID
      LEFT JOIN subjects sub ON sch.SubjectID = sub.SubjectID
      LEFT JOIN users inst ON sch.InstructorID = inst.UserID
    `;

    const queryParams: any[] = [];

    // Add role-based filtering
    if (role === 'student') {
      enrollmentsQuery += ' WHERE e.StudentID = ?';
      queryParams.push(session.userId || studentId);
    } else if (role === 'instructor') {
      enrollmentsQuery += ' WHERE sch.InstructorID = ?';
      queryParams.push(session.userId);
    }

    // Add additional filters
    if (studentId && role !== 'student') {
      enrollmentsQuery += queryParams.length > 0 ? ' AND e.StudentID = ?' : ' WHERE e.StudentID = ?';
      queryParams.push(studentId);
    }

    if (scheduleId) {
      enrollmentsQuery += queryParams.length > 0 ? ' AND e.ScheduleID = ?' : ' WHERE e.ScheduleID = ?';
      queryParams.push(scheduleId);
    }

    enrollmentsQuery += ' ORDER BY e.EnrollmentDate DESC';

    // Add limit if specified
    if (limit) {
      enrollmentsQuery += ' LIMIT ?';
      queryParams.push(parseInt(limit));
    }

    console.log('Enrollments Query:', enrollmentsQuery);
    console.log('Query Params:', queryParams);

    const [enrollments]: any = await db.query(enrollmentsQuery, queryParams);

    return NextResponse.json({
      success: true,
      data: enrollments
    });

  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !['admin', 'dean', 'programcoor'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Enrollment POST body:', body);

    // Handle both single enrollment and bulk enrollment
    const enrollments = Array.isArray(body) ? body : [body];
    console.log('Processing enrollments:', enrollments.length, 'items');

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const enrollment of enrollments) {
      const { StudentID, ScheduleID, Status = 'enrolled' } = enrollment;

      console.log('Processing enrollment:', { StudentID, ScheduleID, Status });

      if (!StudentID || ScheduleID === null || ScheduleID === undefined || ScheduleID === '') {
        console.log('Validation failed - missing required fields');
        failureCount++;
        errors.push(`Missing required fields for enrollment`);
        continue;
      }

      try {
        console.log('Validation passed - processing enrollment');
        // Get student name for better error messages
        const [studentResult]: any = await db.query(
          'SELECT CONCAT(u.FirstName, " ", u.LastName) as StudentName, s.StudentNumber FROM users u LEFT JOIN students s ON u.UserID = s.StudentID WHERE u.UserID = ?',
          [StudentID]
        );

        const studentName = studentResult.length > 0 ? studentResult[0].StudentName : `Student ${StudentID}`;
        const studentNumber = studentResult.length > 0 ? studentResult[0].StudentNumber : '';

        // Get schedule details for better error messages
        const [scheduleResult]: any = await db.query(
          'SELECT SubjectCode, SubjectName FROM schedules WHERE ScheduleID = ?',
          [ScheduleID]
        );

        const scheduleInfo = scheduleResult.length > 0 
          ? `${scheduleResult[0].SubjectCode} - ${scheduleResult[0].SubjectName}`
          : `Schedule ${ScheduleID}`;

        // Check if enrollment already exists
        const [existingEnrollment]: any = await db.query(
          'SELECT EnrollmentID FROM enrollments WHERE StudentID = ? AND ScheduleID = ?',
          [StudentID, ScheduleID]
        );

        if (existingEnrollment.length > 0) {
          failureCount++;
          const errorMessage = studentNumber 
            ? `${studentName} (${studentNumber}) is already enrolled in ${scheduleInfo}`
            : `${studentName} is already enrolled in ${scheduleInfo}`;
          errors.push(errorMessage);
          continue;
        }

        // Create new enrollment
        console.log(`Creating enrollment for StudentID: ${StudentID}, ScheduleID: ${ScheduleID}, Status: ${Status}`);
        const [insertResult]: any = await db.query(
          'INSERT INTO enrollments (StudentID, ScheduleID, EnrollmentDate, Status) VALUES (?, ?, NOW(), ?)',
          [StudentID, ScheduleID, Status]
        );
        console.log('Enrollment created with ID:', insertResult.insertId);

        successCount++;
      } catch (error) {
        console.error('Error creating enrollment:', error);
        failureCount++;
        
        // Get student name for error message
        const [studentResult]: any = await db.query(
          'SELECT CONCAT(u.FirstName, " ", u.LastName) as StudentName FROM users u WHERE u.UserID = ?',
          [StudentID]
        );
        const studentName = studentResult.length > 0 ? studentResult[0].StudentName : `Student ${StudentID}`;
        
        errors.push(`Failed to enroll ${studentName}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Enrollment completed: ${successCount} successful, ${failureCount} failed`,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error creating enrollments:', error);
    return NextResponse.json(
      { error: 'Failed to create enrollments' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !['admin', 'dean', 'programcoor'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { EnrollmentID, Status } = await request.json();

    if (!EnrollmentID || !Status) {
      return NextResponse.json(
        { error: 'EnrollmentID and Status are required' },
        { status: 400 }
      );
    }

    await db.query(
      'UPDATE enrollments SET Status = ? WHERE EnrollmentID = ?',
      [Status, EnrollmentID]
    );

    return NextResponse.json({
      success: true,
      message: 'Enrollment updated successfully'
    });

  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session || !['admin', 'dean'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('id');

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID is required' },
        { status: 400 }
      );
    }

    await db.query('DELETE FROM enrollments WHERE EnrollmentID = ?', [enrollmentId]);

    return NextResponse.json({
      success: true,
      message: 'Enrollment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to delete enrollment' },
      { status: 500 }
    );
  }
}
