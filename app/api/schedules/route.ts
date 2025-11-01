import { db } from '@/app/lib/db';
import { ISchedule } from '@/app/models/ISchedule';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const studentId = searchParams.get('studentId');
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const instructorId = searchParams.get('instructorId');

    let result;

    if (id) {
      // Get specific schedule by ID with subject information
      const query = `
        SELECT
          s.*,
          s.LectureSeatMap,
          s.LaboratorySeatMap,
          s.LectureSeatCols,
          s.LaboratorySeatCols,
          COALESCE(sub.SubjectCode, s.SubjectCode) as SubjectCode,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectTitle,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectName,
          COALESCE(sub.Units, s.Units) as Units,
          COALESCE(s.Lecture, sub.LectureHours, 0) as Lecture,
          COALESCE(s.Laboratory, sub.LaboratoryHours, 0) as Laboratory,
          sub.ClassType,
          CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
        FROM schedules s
        LEFT JOIN subjects sub ON s.SubjectID = sub.SubjectID
        LEFT JOIN users u ON s.InstructorID = u.UserID
        WHERE s.ScheduleID = ?
      `;
      const [rows]: any = await db.query(query, [parseInt(id)]);
      result = rows.length ? rows[0] : null;
    } else if (role === 'student' && (studentId || userId)) {
      // Get schedules for enrolled student
      const studentIdToUse = studentId || userId;
      if (!studentIdToUse) {
        return NextResponse.json({ success: false, error: 'Student ID is required' }, { status: 400 });
      }
      const query = `
        SELECT
          s.*,
          COALESCE(sub.SubjectCode, s.SubjectCode) as SubjectCode,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectTitle,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectName,
          COALESCE(sub.Units, s.Units) as Units,
          COALESCE(s.Lecture, sub.LectureHours, 0) as Lecture,
          COALESCE(s.Laboratory, sub.LaboratoryHours, 0) as Laboratory,
          COALESCE(sub.ClassType, 'lecture-only') as ClassType,
          CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
        FROM schedules s
        JOIN enrollments e ON s.ScheduleID = e.ScheduleID
        LEFT JOIN subjects sub ON s.SubjectID = sub.SubjectID
        LEFT JOIN users u ON s.InstructorID = u.UserID
        WHERE e.StudentID = ? AND e.Status = 'enrolled'
        ORDER BY COALESCE(sub.SubjectCode, s.SubjectCode)
      `;
      const [rows]: any = await db.query(query, [parseInt(studentIdToUse)]);
      result = rows;
    } else if (role === 'instructor' && (instructorId || userId)) {
      // Get schedules for specific instructor
      const instructorIdToUse = instructorId || userId;
      if (!instructorIdToUse) {
        return NextResponse.json({ success: false, error: 'Instructor ID is required' }, { status: 400 });
      }
      const query = `
        SELECT
          s.*,
          s.LectureSeatMap,
          s.LaboratorySeatMap,
          s.LectureSeatCols,
          s.LaboratorySeatCols,
          COALESCE(sub.SubjectCode, s.SubjectCode) as SubjectCode,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectTitle,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectName,
          COALESCE(sub.Units, s.Units) as Units,
          COALESCE(s.Lecture, sub.LectureHours, 0) as Lecture,
          COALESCE(s.Laboratory, sub.LaboratoryHours, 0) as Laboratory,
          sub.ClassType,
          CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
        FROM schedules s
        LEFT JOIN subjects sub ON s.SubjectID = sub.SubjectID
        LEFT JOIN users u ON s.InstructorID = u.UserID
        WHERE s.InstructorID = ?
        ORDER BY COALESCE(sub.SubjectCode, s.SubjectCode)
      `;
      const [rows]: any = await db.query(query, [parseInt(instructorIdToUse)]);
      result = rows;
    } else {
      // Get all schedules (admin/dean/coordinator view)
      const query = `
        SELECT
          s.*,
          s.LectureSeatMap,
          s.LaboratorySeatMap,
          s.LectureSeatCols,
          s.LaboratorySeatCols,
          COALESCE(sub.SubjectCode, s.SubjectCode) as SubjectCode,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectTitle,
          COALESCE(sub.SubjectName, s.SubjectName) as SubjectName,
          COALESCE(sub.Units, s.Units) as Units,
          COALESCE(s.Lecture, sub.LectureHours, 0) as Lecture,
          COALESCE(s.Laboratory, sub.LaboratoryHours, 0) as Laboratory,
          COALESCE(sub.ClassType, 'lecture-only') as ClassType,
          CONCAT(u.FirstName, ' ', u.LastName) as InstructorName
        FROM schedules s
        LEFT JOIN subjects sub ON s.SubjectID = sub.SubjectID
        LEFT JOIN users u ON s.InstructorID = u.UserID
        ORDER BY COALESCE(sub.SubjectCode, s.SubjectCode)
      `;
      const [rows]: any = await db.query(query);
      result = rows as ISchedule[];
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET schedules error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch schedules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const schedule: ISchedule = await req.json();

    // If SubjectID is provided but SubjectCode/SubjectName are missing, get them from subjects table
    let subjectCode = schedule.SubjectCode;
    let subjectName = schedule.SubjectName;
    let units = schedule.Units;
    let classType = 'LECTURE'; // Default class type

    if (schedule.SubjectID && (!subjectCode || !subjectName)) {
      const [subjectRows]: any = await db.query(
        'SELECT SubjectCode, SubjectName, Units, ClassType FROM subjects WHERE SubjectID = ?',
        [schedule.SubjectID]
      );

      if (subjectRows.length > 0) {
        const subject = subjectRows[0];
        subjectCode = subjectCode || subject.SubjectCode;
        subjectName = subjectName || subject.SubjectName;
        units = units || subject.Units;
        classType = subject.ClassType || 'LECTURE';
      }
    }

    // Set standardized column configurations based on class type
    let lectureSeatCols = 4; // Default for lecture
    let laboratorySeatCols = 2; // Default for laboratory
    let seatCols = 4; // Default overall seat columns

    // Adjust based on class type if needed
    if (classType === 'LECTURE+LAB') {
      // For combined lecture+lab, use lecture columns as default
      seatCols = 4;
    } else if (classType === 'MAJOR' || classType === 'NSTP' || classType === 'OJT') {
      // For special class types, use lecture configuration
      seatCols = 4;
    }

    const query = `
      INSERT INTO schedules
      (Course, InstructorID, Section, YearLevel, Day, Time, Room, TotalSeats, SeatCols, SeatMap, Lecture, Laboratory, Units, SubjectID, SubjectCode, SubjectName, Semester, AcademicYear, LectureSeatCols, LaboratorySeatCols)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      schedule.Course,
      schedule.InstructorID,
      schedule.Section,
      schedule.YearLevel,
      schedule.Day,
      schedule.Time,
      schedule.Room,
      schedule.TotalSeats,
      seatCols, // Use standardized seatCols instead of schedule.SeatCols
      schedule.SeatMap,
      schedule.Lecture,
      schedule.Laboratory,
      units,
      schedule.SubjectID || null,
      subjectCode || null,
      subjectName || null,
      schedule.Semester || null,
      schedule.AcademicYear || null,
      lectureSeatCols, // Always 4 for lecture
      laboratorySeatCols, // Always 2 for laboratory
    ];

    const [result]: any = await db.query(query, params);
    const scheduleId = result.insertId;

    // Automatically enroll students who match the schedule criteria
    try {
      console.log('Attempting auto-enrollment for schedule:', {
        scheduleId,
        course: schedule.Course,
        yearLevel: schedule.YearLevel,
        section: schedule.Section
      });

      const enrollStudentsQuery = `
        INSERT INTO enrollments (StudentID, ScheduleID, EnrollmentDate, Status)
        SELECT 
          s.StudentID,
          ?,
          NOW(),
          'enrolled'
        FROM students s
        WHERE s.Course = ? AND s.YearLevel = ? AND s.Section = ?
        AND NOT EXISTS (
          SELECT 1 FROM enrollments e 
          WHERE e.StudentID = s.StudentID AND e.ScheduleID = ?
        )
      `;

      const [enrollmentResult]: any = await db.query(enrollStudentsQuery, [
        scheduleId,
        schedule.Course,
        schedule.YearLevel,
        schedule.Section,
        scheduleId
      ]);

      console.log(`Auto-enrolled ${enrollmentResult.affectedRows} students for schedule ${scheduleId}`);
      
      // Log which students were enrolled for debugging
      if (enrollmentResult.affectedRows > 0) {
        const [enrolledStudents]: any = await db.query(`
          SELECT s.StudentID, s.PrefixedStudentID, s.Course, s.YearLevel, s.Section
          FROM students s
          JOIN enrollments e ON s.StudentID = e.StudentID
          WHERE e.ScheduleID = ? AND e.Status = 'enrolled'
        `, [scheduleId]);
        
        console.log('Enrolled students:', enrolledStudents);
      }
    } catch (enrollmentError) {
      console.error('Error auto-enrolling students:', enrollmentError);
      // Don't fail the entire operation if auto-enrollment fails
    }

    return NextResponse.json({ 
      message: 'Schedule created', 
      ScheduleID: scheduleId,
      autoEnrolled: true
    });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing ScheduleID' }, { status: 400 });
    }

    const schedule: ISchedule = await req.json();

    // Get class type from subject to ensure correct column configurations
    let classType = 'LECTURE';
    if (schedule.SubjectID) {
      const [subjectRows]: any = await db.query(
        'SELECT ClassType FROM subjects WHERE SubjectID = ?',
        [schedule.SubjectID]
      );
      if (subjectRows.length > 0) {
        classType = subjectRows[0].ClassType || 'LECTURE';
      }
    }

    // Set standardized column configurations
    let lectureSeatCols = 4; // Always 4 for lecture
    let laboratorySeatCols = 2; // Always 2 for laboratory
    let seatCols = 4; // Default overall seat columns

    // Adjust based on class type if needed
    if (classType === 'LECTURE+LAB') {
      seatCols = 4;
    } else if (classType === 'MAJOR' || classType === 'NSTP' || classType === 'OJT') {
      seatCols = 4;
    }

    const query = `
      UPDATE schedules SET
        Course = ?, InstructorID = ?, Section = ?, YearLevel = ?, Day = ?, Time = ?, Room = ?,
        TotalSeats = ?, SeatCols = ?, SeatMap = ?, Lecture = ?, Laboratory = ?, Units = ?,
        SubjectID = ?, Semester = ?, AcademicYear = ?, LectureSeatCols = ?, LaboratorySeatCols = ?
      WHERE ScheduleID = ?
    `;

    const params = [
      schedule.Course,
      schedule.InstructorID,
      schedule.Section,
      schedule.YearLevel,
      schedule.Day,
      schedule.Time,
      schedule.Room,
      schedule.TotalSeats,
      seatCols, // Use standardized seatCols
      schedule.SeatMap,
      schedule.Lecture,
      schedule.Laboratory,
      schedule.Units,
      schedule.SubjectID || null,
      schedule.Semester || null,
      schedule.AcademicYear || null,
      lectureSeatCols, // Always 4 for lecture
      laboratorySeatCols, // Always 2 for laboratory
      parseInt(id),
    ];

    await db.query(query, params);
    return NextResponse.json({ message: 'Schedule updated' });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing ScheduleID' }, { status: 400 });
    }

    await db.query('DELETE FROM schedules WHERE ScheduleID = ?', [parseInt(id)]);
    return NextResponse.json({ message: 'Schedule deleted' });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
  }
}
