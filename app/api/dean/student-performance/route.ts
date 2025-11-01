import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "schoolmgtdb",
};

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
    const connection = await mysql.createConnection(dbConfig);

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

    const [students] = await connection.execute(studentsQuery);
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
        const [attendanceRows] = await connection.execute(`
          SELECT Status, COUNT(*) as count 
          FROM attendance 
          WHERE StudentID = ? 
          GROUP BY Status
        `, [student.StudentID]);

        // Calculate attendance rate
        let totalAttendance = 0;
        let presentCount = 0;
        let excusedCount = 0;
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
            }
          }
        });

        if (totalAttendance > 0) {
          // Present + Excused count as "attended"
          const attendedCount = presentCount + excusedCount;
          performance.AttendanceRate = Math.round((attendedCount / totalAttendance) * 100);
        }

        // Fetch excuse letters count
        const [excuseLettersRows] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM excuse_letters 
          WHERE StudentID = ?
        `, [student.StudentID]);

        performance.ExcuseLettersCount = (excuseLettersRows as any[])[0]?.count || 0;

        // Fetch total subjects enrolled
        const [subjectsRows] = await connection.execute(`
          SELECT COUNT(DISTINCT ScheduleID) as count 
          FROM grades 
          WHERE StudentID = ?
        `, [student.StudentID]);

        performance.TotalSubjects = (subjectsRows as any[])[0]?.count || 0;

        // If no subjects from grades, try to get from schedules/enrollment
        if (performance.TotalSubjects === 0) {
          const [enrollmentRows] = await connection.execute(`
            SELECT COUNT(DISTINCT s.ScheduleID) as count
            FROM schedules s
            JOIN students st ON st.Course = s.Course AND st.YearLevel = s.YearLevel
            WHERE st.StudentID = ?
          `, [student.StudentID]);

          performance.TotalSubjects = (enrollmentRows as any[])[0]?.count || 0;
        }



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

    await connection.end();

    return NextResponse.json({ 
      success: true, 
      data: studentPerformance,
      message: `Retrieved performance data for ${studentPerformance.length} students`
    });

  } catch (error) {
    console.error("Error fetching student performance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch student performance data" },
      { status: 500 }
    );
  }
}
