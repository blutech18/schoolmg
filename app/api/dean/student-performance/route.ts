import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

interface StudentPerformance {
  StudentID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  TotalSubjects: number;
  AttendanceRate: number;
  ExcuseLettersCount: number;
  Status: string;
}

export async function GET(request: NextRequest) {
  try {
    // Get all active students with their basic information
    const studentsQuery = `
      SELECT 
        u.UserID,
        u.FirstName,
        u.LastName,
        u.EmailAddress,
        s.StudentID,
        s.Course,
        s.YearLevel,
        s.Section
      FROM users u
      JOIN students s ON u.UserID = s.StudentID
      WHERE u.Role = 'student' AND u.Status = 'active'
      ORDER BY u.LastName, u.FirstName
    `;

    const [students] = await db.execute(studentsQuery);
    console.log(`Found ${(students as any[]).length} active students`);

    // Process each student's performance data
    const studentPerformance = await Promise.all((students as any[]).map(async (student) => {
      try {
        // Initialize performance data with default values
        const performance: StudentPerformance = {
          StudentID: student.StudentID,
          StudentName: `${student.FirstName} ${student.LastName}`,
          Course: student.Course,
          YearLevel: student.YearLevel,
          Section: student.Section,
          TotalSubjects: 0,
          AttendanceRate: 0,
          ExcuseLettersCount: 0,
          Status: 'Good'
        };

        // Fetch attendance data
        const [attendanceRows] = await db.execute(`
          SELECT Status, COUNT(*) as count 
          FROM attendance 
          WHERE StudentID = ? 
          GROUP BY Status
        `, [student.StudentID]);

        // Calculate attendance rate
        let totalAttendance = 0;
        let presentCount = 0;
        let excusedCount = 0;
        let lateCount = 0;
        let dismissedCount = 0;
        let cancelledCount = 0;

        (attendanceRows as any[]).forEach(row => {
          if (row.Status === 'CC') {
            cancelledCount += row.count;
          } else {
            totalAttendance += row.count;
            if (row.Status === 'P') {
              presentCount += row.count;
            } else if (row.Status === 'E') {
              excusedCount += row.count;
            } else if (row.Status === 'L') {
              lateCount += row.count;
            } else if (row.Status === 'D') {
              dismissedCount += row.count;
            }
          }
        });

        if (totalAttendance > 0) {
          // Present + Excused + Late + Dismissed count as "attended" (matching dean dashboard calculation)
          const attendedCount = presentCount + excusedCount + lateCount + dismissedCount;
          performance.AttendanceRate = Math.round((attendedCount / totalAttendance) * 100);
        }

        // Fetch excuse letters count (subject-specific)
        // Count unique excuse letters that have specific subjects attached
        const [excuseLettersRows] = await db.execute(`
          SELECT COUNT(DISTINCT 
            CASE 
              WHEN el.IsMultiSubject = 1 
              THEN CONCAT(el.ExcuseLetterID, '-', els.ScheduleID)
              ELSE el.ExcuseLetterID
            END
          ) as count 
          FROM excuse_letters el
          LEFT JOIN excuse_letter_subjects els ON el.ExcuseLetterID = els.ExcuseLetterID
          WHERE el.StudentID = ?
        `, [student.StudentID]);

        performance.ExcuseLettersCount = (excuseLettersRows as any[])[0]?.count || 0;

        // Fetch total subjects enrolled (count unique subjects, not schedules)
        // A subject with both Lecture and Lab creates 2 schedules but should count as 1 subject
        // Priority 1: Check enrollments table (most accurate - links students to schedules via enrollments)
        const [enrollmentSubjectsRows] = await db.execute(`
          SELECT COUNT(DISTINCT s.SubjectID) as count
          FROM enrollments e
          JOIN schedules s ON e.ScheduleID = s.ScheduleID
          WHERE e.StudentID = ? AND s.SubjectID IS NOT NULL AND e.Status = 'enrolled'
        `, [student.StudentID]);

        let subjectCount = (enrollmentSubjectsRows as any[])[0]?.count || 0;

        // Priority 2: If no enrollments, try grades table (join with schedules to get SubjectID)
        if (subjectCount === 0) {
          const [gradesSubjectsRows] = await db.execute(`
            SELECT COUNT(DISTINCT sch.SubjectID) as count 
            FROM grades g
            JOIN schedules sch ON g.ScheduleID = sch.ScheduleID
            WHERE g.StudentID = ? AND sch.SubjectID IS NOT NULL
          `, [student.StudentID]);
          subjectCount = (gradesSubjectsRows as any[])[0]?.count || 0;
        }

        // Priority 3: If still no subjects, try matching schedules by Course, YearLevel, and Section
        if (subjectCount === 0) {
          const [scheduleMatchRows] = await db.execute(`
            SELECT COUNT(DISTINCT s.SubjectID) as count
            FROM schedules s
            JOIN students st ON st.Course = s.Course AND st.YearLevel = s.YearLevel AND st.Section = s.Section
            WHERE st.StudentID = ? AND s.SubjectID IS NOT NULL
          `, [student.StudentID]);
          subjectCount = (scheduleMatchRows as any[])[0]?.count || 0;
        }

        // Priority 4: Final fallback - match schedules by Course and YearLevel only (without Section)
        if (subjectCount === 0) {
          const [scheduleLooseRows] = await db.execute(`
            SELECT COUNT(DISTINCT s.SubjectID) as count
            FROM schedules s
            JOIN students st ON st.Course = s.Course AND st.YearLevel = s.YearLevel
            WHERE st.StudentID = ? AND s.SubjectID IS NOT NULL
          `, [student.StudentID]);
          subjectCount = (scheduleLooseRows as any[])[0]?.count || 0;
        }

        performance.TotalSubjects = subjectCount;



        // Determine status based on attendance rate and excuse letters
        if (performance.AttendanceRate < 75 || performance.ExcuseLettersCount > 3) {
          performance.Status = 'at-risk';
        } else if (performance.AttendanceRate < 85 || performance.ExcuseLettersCount > 1) {
          performance.Status = 'needs-attention';
        } else {
          performance.Status = 'good';
        }

        return performance;

      } catch (error) {
        console.error(`Error processing student ${student.StudentID}:`, error);
        // Return basic student info with default values if there's an error
        return {
          StudentID: student.StudentID,
          StudentName: `${student.FirstName} ${student.LastName}`,
          Course: student.Course,
          YearLevel: student.YearLevel,
          Section: student.Section,
          TotalSubjects: 0,
          AttendanceRate: 0,
          ExcuseLettersCount: 0,
          Status: 'unknown'
        };
      }
    }));

    return NextResponse.json({
      success: true,
      data: studentPerformance,
      message: `Retrieved performance data for ${studentPerformance.length} students`
    });

  } catch (error: any) {
    console.error("Error fetching student performance:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch student performance data",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
