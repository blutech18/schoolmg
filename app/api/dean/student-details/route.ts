import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

interface StudentDetails {
  StudentID: number;
  StudentName: string;
  StudentNumber: string;
  EmailAddress: string;
  ContactNumber: string;
  Course: string;
  YearLevel: number;
  Section: string;
  DateOfEnrollment: string;
  GuardianName: string;
  GuardianContact: string;
  Address: string;
  IsPWD: boolean;
  Status: string;
  enrollments: Array<{
    ScheduleID: number;
    SubjectCode: string;
    SubjectName: string;
    InstructorName: string;
    EnrollmentDate: string;
  }>;
  grades: Array<{
    SubjectCode: string;
    SubjectName: string;
    InstructorName: string;
    MidtermGrade: number | null;
    FinalGrade: number | null;
    OverallGrade: number | null;
    Status: string;
  }>;
  attendanceDetails: Array<{
    SubjectCode: string;
    SubjectName: string;
    InstructorName: string;
    TotalSessions: number;
    PresentCount: number;
    AbsentCount: number;
    ExcusedCount: number;
    LateCount: number;
    AttendancePercentage: number;
  }>;
  excuseLetters: Array<{
    ExcuseLetterID: number;
    Subject: string;
    Reason: string;
    DateFrom: string;
    DateTo: string;
    Status: string;
    InstructorApproval: string;
    CoordinatorApproval: string;
    DeanApproval: string;
    SubmittedDate: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Validate studentId is a number
    const studentIdNum = parseInt(studentId);
    if (isNaN(studentIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID format" },
        { status: 400 }
      );
    }

    // Get basic student information
    const [studentRows] = await db.execute(`
      SELECT
        u.UserID,
        u.FirstName,
        u.LastName,
        u.MiddleName,
        u.EmailAddress,
        u.ContactNumber,
        u.Status,
        u.IsPWD,
        s.StudentID,
        s.StudentNumber,
        s.Course,
        s.YearLevel,
        s.Section,
        s.DateOfEnrollment,
        s.GuardianName,
        s.GuardianContact,
        s.Address
      FROM users u
      JOIN students s ON u.UserID = s.StudentID
      WHERE s.StudentID = ?
    `, [studentIdNum]);

    if ((studentRows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const student = (studentRows as any[])[0];

    // Fetch related datasets in parallel to reduce latency
    const [
      [enrollmentRows],
      [rawGradesRows],
      [attendanceRows],
      [excuseLettersRows],
    ] = await Promise.all([
      db.execute(
        `
        SELECT
          e.ScheduleID,
          e.EnrollmentDate,
          COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown Code') as SubjectCode,
          COALESCE(sch.SubjectName, sch.SubjectTitle, subj.SubjectName, 'Unknown Subject') as SubjectName,
          CONCAT(COALESCE(inst.FirstName, ''), ' ', COALESCE(inst.LastName, '')) as InstructorName
        FROM enrollments e
        JOIN schedules sch ON e.ScheduleID = sch.ScheduleID
        LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
        LEFT JOIN users inst ON sch.InstructorID = inst.UserID
        WHERE e.StudentID = ?
        ORDER BY e.EnrollmentDate DESC
        `,
        [studentIdNum],
      ),
      db.execute(
        `
        SELECT
          g.*,
          COALESCE(sub.SubjectCode, sch.SubjectCode) as SubjectCode,
          COALESCE(sub.SubjectName, sch.SubjectName) as SubjectName,
          sub.ClassType,
          CONCAT(COALESCE(inst.FirstName, ''), ' ', COALESCE(inst.LastName, '')) as InstructorName
        FROM grades g
        JOIN schedules sch ON g.ScheduleID = sch.ScheduleID
        LEFT JOIN subjects sub ON sch.SubjectID = sub.SubjectID
        LEFT JOIN users inst ON sch.InstructorID = inst.UserID
        WHERE g.StudentID = ?
        ORDER BY g.ScheduleID, g.Term ASC, g.Component ASC, g.ItemNumber ASC
        `,
        [studentIdNum],
      ),
      db.execute(
        `
        SELECT
          COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown Code') as SubjectCode,
          COALESCE(sch.SubjectName, sch.SubjectTitle, subj.SubjectName, 'Unknown Subject') as SubjectName,
          CONCAT(COALESCE(inst.FirstName, ''), ' ', COALESCE(inst.LastName, '')) as InstructorName,
          COUNT(*) as TotalSessions,
          SUM(CASE WHEN a.Status = 'P' THEN 1 ELSE 0 END) as PresentCount,
          SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END) as AbsentCount,
          SUM(CASE WHEN a.Status = 'E' THEN 1 ELSE 0 END) as ExcusedCount,
          SUM(CASE WHEN a.Status = 'L' THEN 1 ELSE 0 END) as LateCount
        FROM attendance a
        JOIN schedules sch ON a.ScheduleID = sch.ScheduleID
        LEFT JOIN subjects subj ON sch.SubjectID = subj.SubjectID
        LEFT JOIN users inst ON sch.InstructorID = inst.UserID
        WHERE a.StudentID = ?
        GROUP BY 
          a.ScheduleID,
          COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown Code'),
          COALESCE(sch.SubjectName, sch.SubjectTitle, subj.SubjectName, 'Unknown Subject'),
          CONCAT(COALESCE(inst.FirstName, ''), ' ', COALESCE(inst.LastName, ''))
        ORDER BY COALESCE(sch.SubjectCode, subj.SubjectCode, 'Unknown Code')
        `,
        [studentIdNum],
      ),
      db.execute(
        `
        SELECT
          ExcuseLetterID,
          Subject,
          Reason,
          DateFrom,
          DateTo,
          Status,
          InstructorStatus,
          CoordinatorStatus,
          DeanStatus,
          SubmissionDate
        FROM excuse_letters
        WHERE StudentID = ?
        ORDER BY SubmissionDate DESC
        `,
        [studentIdNum],
      ),
    ]);

    // Get grades using the same calculation logic that instructor/student interfaces use
    // This ensures consistent grade calculations across all interfaces
    let gradesData: any = {};
    try {
      gradesData = calculateStudentGradesForDean(rawGradesRows as any[]);
    } catch (error) {
      console.error('Error calculating grades using shared logic:', error);
      gradesData = {};
    }

    // Process the data
    const studentDetails: StudentDetails = {
      StudentID: student.StudentID,
      StudentName: `${student.FirstName} ${student.LastName}`,
      StudentNumber: student.StudentNumber || 'N/A',
      EmailAddress: student.EmailAddress || 'N/A',
      ContactNumber: student.ContactNumber || 'N/A',
      Course: student.Course || 'N/A',
      YearLevel: student.YearLevel || 0,
      Section: student.Section || 'N/A',
      DateOfEnrollment: student.DateOfEnrollment || 'N/A',
      GuardianName: student.GuardianName || 'N/A',
      GuardianContact: student.GuardianContact || 'N/A',
      Address: student.Address || 'N/A',
      IsPWD: Boolean(student.IsPWD),
      Status: student.Status || 'unknown',
      enrollments: (enrollmentRows as any[])
        .filter(row => row.SubjectCode && row.SubjectCode !== 'Unknown Code' && row.SubjectName && row.SubjectName !== 'Unknown Subject')
        .map(row => ({
          ScheduleID: row.ScheduleID,
          SubjectCode: row.SubjectCode,
          SubjectName: row.SubjectName,
          InstructorName: row.InstructorName?.trim() || 'TBA',
          EnrollmentDate: row.EnrollmentDate || new Date().toISOString().split('T')[0]
        })),
      grades: Object.keys(gradesData).map(scheduleId => {
        const gradeInfo = gradesData[scheduleId];
        return {
          SubjectCode: gradeInfo.SubjectCode || 'Unknown Code',
          SubjectName: gradeInfo.SubjectName || 'Unknown Subject',
          InstructorName: gradeInfo.InstructorName?.trim() || 'TBA',
          MidtermGrade: gradeInfo.midterm ? parseFloat(gradeInfo.midterm.toFixed(2)) : null,
          FinalGrade: gradeInfo.final ? parseFloat(gradeInfo.final.toFixed(2)) : null,
          OverallGrade: gradeInfo.summary ? parseFloat(gradeInfo.summary.toFixed(2)) : null,
          Status: gradeInfo.summary !== null
            ? (gradeInfo.summary <= 3.0 ? 'Passed' : 'Failed')
            : 'Incomplete'
        };
      }),
      attendanceDetails: (attendanceRows as any[])
        .filter(row => row.SubjectCode && row.SubjectCode !== 'Unknown Code' && row.SubjectName && row.SubjectName !== 'Unknown Subject' && row.TotalSessions > 0)
        .map(row => ({
          SubjectCode: row.SubjectCode,
          SubjectName: row.SubjectName,
          InstructorName: row.InstructorName?.trim() || 'TBA',
          TotalSessions: row.TotalSessions || 0,
          PresentCount: row.PresentCount || 0,
          AbsentCount: row.AbsentCount || 0,
          ExcusedCount: row.ExcusedCount || 0,
          LateCount: row.LateCount || 0,
          AttendancePercentage: row.TotalSessions > 0 ?
            Math.round((row.PresentCount / row.TotalSessions) * 100) : 0
        })),
      excuseLetters: (excuseLettersRows as any[])
        .filter(row => row.Subject && row.Reason)
        .map(row => ({
          ExcuseLetterID: row.ExcuseLetterID,
          Subject: row.Subject,
          Reason: row.Reason,
          DateFrom: row.DateFrom || new Date().toISOString().split('T')[0],
          DateTo: row.DateTo || new Date().toISOString().split('T')[0],
          Status: row.Status || 'pending',
          InstructorApproval: row.InstructorStatus || 'pending',
          CoordinatorApproval: row.CoordinatorStatus || 'pending',
          DeanApproval: row.DeanStatus || 'pending',
          SubmittedDate: row.SubmissionDate || new Date().toISOString().split('T')[0]
        }))
    };

    return NextResponse.json({
      success: true,
      data: studentDetails,
      message: "Student details retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching student details:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch student details", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Convert percentage to Filipino grading system (1.0-5.0)
// 1.0 is highest, 3.0 is passing, 5.0 is failed
function convertToFilipinoGradeForDean(percentage: number): number {
  if (percentage >= 98) return 1.0;   // 98-100%
  if (percentage >= 95) return 1.25;  // 95-97%
  if (percentage >= 92) return 1.5;   // 92-94%
  if (percentage >= 89) return 1.75;  // 89-91%
  if (percentage >= 86) return 2.0;   // 86-88%
  if (percentage >= 83) return 2.25;  // 83-85%
  if (percentage >= 80) return 2.5;   // 80-82%
  if (percentage >= 77) return 2.75;  // 77-79%
  if (percentage >= 75) return 3.0;   // 75-76% - Passing grade
  return 5.0;  // Below 75% - Failed
}

// Helper function to calculate student grades based on class type (for dean interface)
function calculateStudentGradesForDean(grades: any[]) {
  const summaryGrades: any = {};

  // Group grades by schedule
  const gradesBySchedule = grades.reduce((acc: any, grade: any) => {
    if (!acc[grade.ScheduleID]) {
      acc[grade.ScheduleID] = {
        SubjectCode: grade.SubjectCode,
        SubjectName: grade.SubjectName,
        InstructorName: grade.InstructorName,
        ClassType: grade.ClassType,
        midterm: [],
        final: []
      };
    }
    // Normalize term name to lowercase to ensure consistency (e.g., "Midterm" → "midterm")
    const termKey = (grade.Term || "").toString().toLowerCase();
    if (!acc[grade.ScheduleID][termKey]) {
      acc[grade.ScheduleID][termKey] = [];
    }
    acc[grade.ScheduleID][termKey].push(grade);
    return acc;
  }, {});

  // Calculate grades for each schedule
  Object.keys(gradesBySchedule).forEach(scheduleId => {
    const scheduleGrades = gradesBySchedule[scheduleId];
    const classType = scheduleGrades.ClassType;

    console.log(`Dean API - Calculating grades for Schedule ${scheduleId}, ClassType: ${classType}`);
    console.log('Midterm grades:', scheduleGrades.midterm);
    console.log('Final grades:', scheduleGrades.final);

    const midtermGrade = calculateTermGradeForDean(scheduleGrades.midterm || [], classType);
    const finalGrade = calculateTermGradeForDean(scheduleGrades.final || [], classType);

    // Calculate summary grade - only if both midterm and final exist, average them
    // If only one exists or neither exists, summary should be null (incomplete)
    let summaryGrade = null;
    if (midtermGrade !== null && finalGrade !== null) {
      summaryGrade = (midtermGrade + finalGrade) / 2;
    }
    // Note: If only midterm OR only final exists, summaryGrade remains null
    // This ensures students are not marked as passed/failed with incomplete grades

    console.log(`Dean API - Calculated - Midterm: ${midtermGrade}, Final: ${finalGrade}, Summary: ${summaryGrade}`);

    summaryGrades[scheduleId] = {
      SubjectCode: scheduleGrades.SubjectCode,
      SubjectName: scheduleGrades.SubjectName,
      InstructorName: scheduleGrades.InstructorName,
      ClassType: classType,
      midterm: midtermGrade,
      final: finalGrade,
      summary: summaryGrade
    };
  });

  return summaryGrades;
}

// Helper function to calculate term grade based on class type (for dean interface)
function calculateTermGradeForDean(termGrades: any[], classType: string) {
  if (!termGrades || !termGrades.length) {
    console.log('Dean API - No grades found for term calculation');
    return null;
  }

  // Normalize component names to handle case variations
  const normalizeComponentName = (name: string): string => {
    if (!name) return '';
    const lower = name.toLowerCase().trim();

    // Map common variations to standard names
    const componentMap: { [key: string]: string } = {
      'quiz': 'quiz',
      'quizzes': 'quiz',
      'laboratory': 'laboratory',
      'lab': 'laboratory',
      'laboratory activity': 'laboratory',
      'olo': 'olo',
      'online learning opportunity': 'olo',
      'exam': 'exam',
      'examination': 'exam',
      'midterm': 'exam',
      'final': 'exam',
      'midterm exam': 'exam',
      'final exam': 'exam'
    };

    // Check if we have a direct mapping
    if (componentMap[lower]) {
      return componentMap[lower];
    }

    // Check for partial matches
    for (const [key, value] of Object.entries(componentMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }

    // Fallback – return the cleaned lower-cased name so we still group identical unknown components together
    return lower;
  };

  const gradesByComponent = termGrades.reduce((acc: any, grade: any) => {
    const component = normalizeComponentName(grade.Component || '');
    if (!acc[component]) {
      acc[component] = [];
    }
    acc[component].push(grade);
    return acc;
  }, {});

  console.log('Dean API - Grades by component:', gradesByComponent);

  let classStanding = 0;
  let examGrade = 0;
  let hasValidGrades = false;

  switch (classType) {
    case 'LECTURE':
      // LECTURE: Class Standing 60% (Quizzes 60%), Exam 40%
      let lectureQuizGrade = 0;

      // Quiz component (60% of total grade)
      if ((gradesByComponent.Quiz || gradesByComponent.quiz) && (gradesByComponent.Quiz || gradesByComponent.quiz).length > 0) {
        const quizComponents = gradesByComponent.Quiz || gradesByComponent.quiz;
        const validQuizzes = quizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            lectureQuizGrade = quizPercentage * 0.6; // 60% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Quiz (60%) = 60% total
      classStanding = lectureQuizGrade;

      // Exam is 40% of total grade
      if ((gradesByComponent.Exam || gradesByComponent.exam) && (gradesByComponent.Exam || gradesByComponent.exam).length > 0) {
        const examComponents = gradesByComponent.Exam || gradesByComponent.exam;
        const validExam = examComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
        }
      }
      break;

    case 'LECTURE+LAB':
      // LECTURE+LAB: Quiz 15% + Lab 30% + OLO 15% + Exam 40% = 100%
      let lecLabQuizGrade = 0, lecLabLabGrade = 0, lecLabOloGrade = 0;

      // Quiz component (15% of total grade)
      if (gradesByComponent.quiz && gradesByComponent.quiz.length > 0) {
        const quizComponents = gradesByComponent.quiz;
        const validQuizzes = quizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            lecLabQuizGrade = quizPercentage * 0.15; // 15% weight
            hasValidGrades = true;
          }
        }
      }

      // Lab component (30% of total grade)
      if (gradesByComponent.laboratory && gradesByComponent.laboratory.length > 0) {
        const labComponents = gradesByComponent.laboratory;
        const validLabs = labComponents.filter((l: any) => l.Score !== null && l.Score !== undefined);
        if (validLabs.length > 0) {
          const totalLabScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.Score) || 0), 0);
          const totalLabMaxScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.MaxScore) || 0), 0);
          if (totalLabMaxScore > 0) {
            const labPercentage = (totalLabScore / totalLabMaxScore) * 100;
            lecLabLabGrade = labPercentage * 0.3; // 30% weight
            hasValidGrades = true;
          }
        }
      }

      // OLO component (15% of total grade)
      if (gradesByComponent.olo && gradesByComponent.olo.length > 0) {
        const oloComponents = gradesByComponent.olo;
        const validOlos = oloComponents.filter((o: any) => o.Score !== null && o.Score !== undefined);
        if (validOlos.length > 0) {
          const totalOloScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.Score) || 0), 0);
          const totalOloMaxScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.MaxScore) || 0), 0);
          if (totalOloMaxScore > 0) {
            const oloPercentage = (totalOloScore / totalOloMaxScore) * 100;
            lecLabOloGrade = oloPercentage * 0.15; // 15% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Quiz (15%) + Lab (30%) + OLO (15%) = 60% total
      classStanding = lecLabQuizGrade + lecLabLabGrade + lecLabOloGrade;

      // Exam is 40% of total grade
      if (gradesByComponent.exam && gradesByComponent.exam.length > 0) {
        const examComponents = gradesByComponent.exam;
        const validExam = examComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
        }
      }
      break;

    case 'MAJOR':
      // MAJOR: Class Standing 70% (Quiz 15% + Lab 40% + OLO 15%), Exam 30%
      let majorQuizGrade = 0, majorLabGrade = 0, majorOloGrade = 0;

      // Quiz component (15% of total grade)
      if (gradesByComponent.quiz && gradesByComponent.quiz.length > 0) {
        const quizComponents = gradesByComponent.quiz;
        const validQuizzes = quizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            majorQuizGrade = quizPercentage * 0.15; // 15% weight
            hasValidGrades = true;
          }
        }
      }

      // Lab component (40% of total grade)
      if (gradesByComponent.laboratory && gradesByComponent.laboratory.length > 0) {
        const labComponents = gradesByComponent.laboratory;
        const validLabs = labComponents.filter((l: any) => l.Score !== null && l.Score !== undefined);
        if (validLabs.length > 0) {
          const totalLabScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.Score) || 0), 0);
          const totalLabMaxScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.MaxScore) || 0), 0);
          if (totalLabMaxScore > 0) {
            const labPercentage = (totalLabScore / totalLabMaxScore) * 100;
            majorLabGrade = labPercentage * 0.4; // 40% weight
            hasValidGrades = true;
          }
        }
      }

      // OLO component (15% of total grade)
      if (gradesByComponent.olo && gradesByComponent.olo.length > 0) {
        const oloComponents = gradesByComponent.olo;
        const validOlos = oloComponents.filter((o: any) => o.Score !== null && o.Score !== undefined);
        if (validOlos.length > 0) {
          const totalOloScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.Score) || 0), 0);
          const totalOloMaxScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.MaxScore) || 0), 0);
          if (totalOloMaxScore > 0) {
            const oloPercentage = (totalOloScore / totalOloMaxScore) * 100;
            majorOloGrade = oloPercentage * 0.15; // 15% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Quiz (15%) + Lab (40%) + OLO (15%) = 70% total
      classStanding = majorQuizGrade + majorLabGrade + majorOloGrade;

      // Exam is 30% of total grade
      if (gradesByComponent.exam && gradesByComponent.exam.length > 0) {
        const examComponents = gradesByComponent.exam;
        const validExam = examComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.3; // 30% weight
          hasValidGrades = true;
        }
      }
      break;

    default:
      // Default to LECTURE calculation: Class Standing 60% (Quizzes 60%), Exam 40%
      let defaultQuizGrade = 0;

      // Quiz component (60% of total grade)
      if ((gradesByComponent.Quiz || gradesByComponent.quiz) && (gradesByComponent.Quiz || gradesByComponent.quiz).length > 0) {
        const quizComponents = gradesByComponent.Quiz || gradesByComponent.quiz;
        const validQuizzes = quizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            defaultQuizGrade = quizPercentage * 0.6; // 60% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Quiz (60%) = 60% total
      classStanding = defaultQuizGrade;

      // Exam is 40% of total grade
      if ((gradesByComponent.Exam || gradesByComponent.exam) && (gradesByComponent.Exam || gradesByComponent.exam).length > 0) {
        const examComponents = gradesByComponent.Exam || gradesByComponent.exam;
        const validExam = examComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
        }
      }
      break;
  }

  const finalGrade = classStanding + examGrade;
  console.log(`Dean API - Term calculation result - ClassStanding: ${classStanding}, ExamGrade: ${examGrade}, Final: ${finalGrade}`);

  // Convert percentage to Filipino grading system (1.0-5.0)
  const filipinoGrade = hasValidGrades ? convertToFilipinoGradeForDean(finalGrade) : null;
  console.log(`Dean API - Converted to Filipino grade: ${filipinoGrade}`);

  return filipinoGrade;
}
