import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";

// GET - Fetch grades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("scheduleId");
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term"); // midterm or final
    const userRole = searchParams.get("role");
    const userId = searchParams.get("userId");

    let query = `
      SELECT
        g.*,
        CONCAT(u.FirstName, ' ', u.LastName) as StudentName,
        s.Course,
        s.Section,
        s.YearLevel,
        COALESCE(sub.SubjectCode, sch.SubjectCode) as SubjectCode,
        COALESCE(sub.SubjectName, sch.SubjectName) as SubjectName,
        sub.ClassType,
        CONCAT(recorder.FirstName, ' ', recorder.LastName) as RecorderName
      FROM grades g
      JOIN students s ON g.StudentID = s.StudentID
      JOIN users u ON s.StudentID = u.UserID
      JOIN schedules sch ON g.ScheduleID = sch.ScheduleID
      LEFT JOIN subjects sub ON sch.SubjectID = sub.SubjectID
      LEFT JOIN users recorder ON g.RecordedBy = recorder.UserID
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter based on user role
    if (userRole === "student" && userId) {
      query += " AND g.StudentID = ?";
      params.push(userId);
    } else if (userRole === "instructor" && userId) {
      query += " AND sch.InstructorID = ?";
      params.push(userId);
    }

    // Additional filters
    if (scheduleId) {
      query += " AND g.ScheduleID = ?";
      params.push(scheduleId);
    }

    if (studentId) {
      query += " AND g.StudentID = ?";
      params.push(studentId);
    }

    if (term) {
      query += " AND g.Term = ?";
      params.push(term);
    }

    query += " ORDER BY g.Term ASC, g.Component ASC, g.ItemNumber ASC";

    const [rows] = await db.execute(query, params);

    // Calculate summary grades for student view
    if (userRole === "student") {
      const grades = rows as any[];
      const summaryGrades = calculateStudentGrades(grades);
      return NextResponse.json({ success: true, data: grades, summary: summaryGrades });
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error("Error fetching grades:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch grades",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create or update grade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentId,
      scheduleId,
      term,
      component,
      itemNumber,
      maxScore,
      score,
      recordedBy,
    } = body;

    // Validation
    if (!studentId || !scheduleId || !term || !component || !recordedBy) {
      return NextResponse.json(
        { success: false, error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const validTerms = ['midterm', 'final'];
    if (!validTerms.includes(term)) {
      return NextResponse.json(
        { success: false, error: "Invalid term" },
        { status: 400 }
      );
    }

    // Check if record already exists
    const checkQuery = `
      SELECT GradeID FROM grades 
      WHERE StudentID = ? AND ScheduleID = ? AND Term = ? AND Component = ? AND ItemNumber = ?
    `;

    const [existingRows] = await db.execute(checkQuery, [
      studentId, scheduleId, term, component, itemNumber || 1
    ]);

    const percentage = maxScore && (score !== null && score !== undefined) ? (score / maxScore) * 100 : null;

    let result;
    if ((existingRows as any[]).length > 0) {
      // Update existing record
      const updateQuery = `
        UPDATE grades 
        SET MaxScore = ?, Score = ?, Percentage = ?, RecordedBy = ?, LastModified = NOW()
        WHERE StudentID = ? AND ScheduleID = ? AND Term = ? AND Component = ? AND ItemNumber = ?
      `;

      result = await db.execute(updateQuery, [
        maxScore, score, percentage, recordedBy, 
        studentId, scheduleId, term, component, itemNumber || 1
      ]);
    } else {
      // Insert new record
      const insertQuery = `
        INSERT INTO grades 
        (StudentID, ScheduleID, Term, Component, ItemNumber, MaxScore, Score, Percentage, RecordedBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      result = await db.execute(insertQuery, [
        studentId, scheduleId, term, component, itemNumber || 1, 
        maxScore, score, percentage, recordedBy
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Grade saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving grade:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to save grade",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// Convert percentage to Filipino grading system (1.0-5.0)
// 1.0 is highest, 3.0 is passing, 5.0 is failed
function convertToFilipinoGrade(percentage: number): number {
  if (percentage >= 97) return 1.0;   // 97-100%
  if (percentage >= 94) return 1.25;  // 94-96%
  if (percentage >= 91) return 1.5;   // 91-93%
  if (percentage >= 88) return 1.75;  // 88-90%
  if (percentage >= 85) return 2.0;   // 85-87%
  if (percentage >= 82) return 2.25;  // 82-84%
  if (percentage >= 79) return 2.5;   // 79-81%
  if (percentage >= 76) return 2.75;  // 76-78%
  if (percentage >= 75) return 3.0;   // 75% - Passing grade
  return 5.0;  // Below 75% - Failed
}

// Helper function to calculate student grades based on class type
function calculateStudentGrades(grades: any[]) {
  const summaryGrades: any = {};

  // Group grades by schedule
  const gradesBySchedule = grades.reduce((acc: any, grade: any) => {
    if (!acc[grade.ScheduleID]) {
      acc[grade.ScheduleID] = {
        SubjectCode: grade.SubjectCode,
        SubjectName: grade.SubjectName,
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
    const subjectCode = scheduleGrades.SubjectCode || '';

    // Skip NSTP subjects - they don't count towards GPA/grade computation
    if (subjectCode.toUpperCase().includes('NSTP')) {
      console.log(`Skipping NSTP subject: ${subjectCode}`);
      return;
    }

    console.log(`Calculating grades for Schedule ${scheduleId}, ClassType: ${classType}`);
    console.log('Midterm grades:', scheduleGrades.midterm);
    console.log('Final grades:', scheduleGrades.final);

    const midtermResult = calculateTermGrade(scheduleGrades.midterm || [], classType);
    const finalResult = calculateTermGrade(scheduleGrades.final || [], classType);

    // Extract grades and percentages
    const midtermGrade = midtermResult?.grade || null;
    const finalGrade = finalResult?.grade || null;
    const midtermPercentage = midtermResult?.percentage || null;
    const finalPercentage = finalResult?.percentage || null;

    // Calculate summary grade - only if both midterm and final exist, average them
    // If only one exists or neither exists, summary should be null (incomplete)
    let summaryGrade = null;
    let summaryPercentage = null;
    if (midtermGrade !== null && finalGrade !== null) {
      summaryGrade = (midtermGrade + finalGrade) / 2;
      if (midtermPercentage !== null && finalPercentage !== null) {
        summaryPercentage = (midtermPercentage + finalPercentage) / 2;
      }
    }
    // Note: If only midterm OR only final exists, summaryGrade remains null
    // This ensures students are not marked as passed/failed with incomplete grades

    console.log(`Calculated - Midterm: ${midtermGrade} (${midtermPercentage}%), Final: ${finalGrade} (${finalPercentage}%), Summary: ${summaryGrade} (${summaryPercentage}%)`);

    summaryGrades[scheduleId] = {
      SubjectCode: scheduleGrades.SubjectCode,
      SubjectName: scheduleGrades.SubjectName,
      ClassType: classType,
      midterm: midtermGrade,
      final: finalGrade,
      summary: summaryGrade,
      midtermPercentage,
      finalPercentage,
      summaryPercentage
    };
  });

  return summaryGrades;
}

// Helper function to calculate term grade based on class type
function calculateTermGrade(termGrades: any[], classType: string) {
  if (!termGrades || !termGrades.length) {
    console.log('No grades found for term calculation');
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
      'final exam': 'exam',
      // OJT-specific components
      'online course': 'online course',
      'recitation': 'recitation',
      'seatwork': 'seatwork'
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

  // Also store original component names for debugging
  const originalGradesByComponent = termGrades.reduce((acc: any, grade: any) => {
    const component = grade.Component || '';
    if (!acc[component]) {
      acc[component] = [];
    }
    acc[component].push(grade);
    return acc;
  }, {});

  console.log('Original grades by component:', originalGradesByComponent);
  console.log('Normalized grades by component:', gradesByComponent);
  console.log('Class Type:', classType);
  console.log('Available normalized components:', Object.keys(gradesByComponent));
  console.log('Looking for: quiz, laboratory, olo, exam');
  console.log('Term grades count:', termGrades.length);
  console.log('Sample grade data:', termGrades.slice(0, 3));

  let classStanding = 0;
  let examGrade = 0;
  let hasValidGrades = false;

  switch (classType) {
    case 'LECTURE':
      // LECTURE: Class Standing 60% (Quizzes 60%), Exam 40%
      let lectureQuizGrade = 0;

      // Quiz component (60% of total grade)
      const lectureQuizComponents = gradesByComponent.quiz || [];
      if (lectureQuizComponents.length > 0) {
        const validQuizzes = lectureQuizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
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

      // Major Exam is 40% of total grade
      const lectureExamComponents = gradesByComponent['major exam'] || gradesByComponent.exam || [];
      if (lectureExamComponents.length > 0) {
        const validExam = lectureExamComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
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
      console.log('Checking for quiz component:', gradesByComponent.quiz);
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
            console.log(`LECTURE+LAB Quiz Debug - TotalScore: ${totalQuizScore}, TotalMax: ${totalQuizMaxScore}, Percentage: ${quizPercentage}, Weighted: ${lecLabQuizGrade}`);
          }
        }
      } else {
        console.log('LECTURE+LAB Quiz component not found or empty');
      }

      // Lab component (30% of total grade)
      console.log('Checking for laboratory component:', gradesByComponent.laboratory);
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
            console.log(`LECTURE+LAB Lab Debug - TotalScore: ${totalLabScore}, TotalMax: ${totalLabMaxScore}, Percentage: ${labPercentage}, Weighted: ${lecLabLabGrade}`);
          }
        }
      } else {
        console.log('LECTURE+LAB Laboratory component not found or empty');
      }

      // OLO component (15% of total grade)
      console.log('Checking for olo component:', gradesByComponent.olo);
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
            console.log(`LECTURE+LAB OLO Debug - TotalScore: ${totalOloScore}, TotalMax: ${totalOloMaxScore}, Percentage: ${oloPercentage}, Weighted: ${lecLabOloGrade}`);
          }
        }
      } else {
        console.log('LECTURE+LAB OLO component not found or empty');
      }

      // Class Standing = Quiz (15%) + Lab (30%) + OLO (15%) = 60% total
      classStanding = lecLabQuizGrade + lecLabLabGrade + lecLabOloGrade;
      console.log(`LECTURE+LAB Debug - Quiz: ${lecLabQuizGrade}, Lab: ${lecLabLabGrade}, OLO: ${lecLabOloGrade}, ClassStanding: ${classStanding}`);

      // Major Exam is 40% of total grade
      const lecLabExamComponents = gradesByComponent['major exam'] || gradesByComponent.exam || [];
      console.log('Checking for major exam component:', lecLabExamComponents);
      if (lecLabExamComponents.length > 0) {
        const validExam = lecLabExamComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
          console.log(`LECTURE+LAB Debug - Exam Score: ${validExam.Score}, Max: ${validExam.MaxScore}, Percentage: ${examPercentage}, ExamGrade: ${examGrade}`);
        }
      } else {
        console.log('LECTURE+LAB Exam component not found or empty');
      }
      break;

    case 'MAJOR':
      // MAJOR: Class Standing 70% (Quiz 15% + Lab 40% + OLO 15%), Exam 30%
      let majorQuizGrade = 0, majorLabGrade = 0, majorOloGrade = 0;

      // Quiz component (15% of total grade)
      const majorQuizComponents = gradesByComponent.quiz || [];
      if (majorQuizComponents.length > 0) {
        const validQuizzes = majorQuizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            majorQuizGrade = quizPercentage * 0.15; // 15% weight
            hasValidGrades = true;
            console.log(`MAJOR Quiz calculation: ${totalQuizScore}/${totalQuizMaxScore} = ${quizPercentage}% × 0.15 = ${majorQuizGrade}`);
          }
        }
      }

      // Lab component (40% of total grade)
      const majorLabComponents = gradesByComponent.laboratory || [];
      if (majorLabComponents.length > 0) {
        const validLabs = majorLabComponents.filter((l: any) => l.Score !== null && l.Score !== undefined);
        if (validLabs.length > 0) {
          const totalLabScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.Score) || 0), 0);
          const totalLabMaxScore = validLabs.reduce((sum: number, l: any) => sum + (parseFloat(l.MaxScore) || 0), 0);
          if (totalLabMaxScore > 0) {
            const labPercentage = (totalLabScore / totalLabMaxScore) * 100;
            majorLabGrade = labPercentage * 0.4; // 40% weight
            hasValidGrades = true;
            console.log(`MAJOR Lab calculation: ${totalLabScore}/${totalLabMaxScore} = ${labPercentage}% × 0.4 = ${majorLabGrade}`);
          }
        }
      }

      // OLO component (15% of total grade)
      const majorOloComponents = gradesByComponent.olo || [];
      if (majorOloComponents.length > 0) {
        const validOlos = majorOloComponents.filter((o: any) => o.Score !== null && o.Score !== undefined);
        if (validOlos.length > 0) {
          const totalOloScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.Score) || 0), 0);
          const totalOloMaxScore = validOlos.reduce((sum: number, o: any) => sum + (parseFloat(o.MaxScore) || 0), 0);
          if (totalOloMaxScore > 0) {
            const oloPercentage = (totalOloScore / totalOloMaxScore) * 100;
            majorOloGrade = oloPercentage * 0.15; // 15% weight
            hasValidGrades = true;
            console.log(`MAJOR OLO calculation: ${totalOloScore}/${totalOloMaxScore} = ${oloPercentage}% × 0.15 = ${majorOloGrade}`);
          }
        }
      }

      // Class Standing = Quiz (15%) + Lab (40%) + OLO (15%) = 70% total
      classStanding = majorQuizGrade + majorLabGrade + majorOloGrade;
      console.log(`MAJOR Class Standing total: ${majorQuizGrade} + ${majorLabGrade} + ${majorOloGrade} = ${classStanding}`);

      // Exam is 30% of total grade
      const majorExamComponents = gradesByComponent.exam || [];
      if (majorExamComponents.length > 0) {
        const validExam = majorExamComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.3; // 30% weight
          hasValidGrades = true;
          console.log(`MAJOR Exam calculation: ${validExam.Score}/${validExam.MaxScore} = ${examPercentage}% × 0.3 = ${examGrade}`);
        }
      }
      break;

    case 'NSTP':
      // NSTP: Same grading system percentage with lecture
      // Class Standing 60% (Quizzes 60%), Exam 40%
      let nstpQuizGrade = 0;

      // Quiz component (60% of total grade)
      const nstpQuizComponents = gradesByComponent.quiz || [];
      if (nstpQuizComponents.length > 0) {
        const validQuizzes = nstpQuizComponents.filter((q: any) => q.Score !== null && q.Score !== undefined);
        if (validQuizzes.length > 0) {
          const totalQuizScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.Score) || 0), 0);
          const totalQuizMaxScore = validQuizzes.reduce((sum: number, q: any) => sum + (parseFloat(q.MaxScore) || 0), 0);
          if (totalQuizMaxScore > 0) {
            const quizPercentage = (totalQuizScore / totalQuizMaxScore) * 100;
            nstpQuizGrade = quizPercentage * 0.6; // 60% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Quiz (60%) = 60% total
      classStanding = nstpQuizGrade;

      // Exam is 40% of total grade
      const nstpExamComponents = gradesByComponent.exam || [];
      if (nstpExamComponents.length > 0) {
        const validExam = nstpExamComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
        }
      }
      break;

    case 'OJT':
      // OJT: Online Course 50%, Recitation 20%, Seatwork 30%
      let ojtOnlineCourseGrade = 0, ojtRecitationGrade = 0, ojtSeatworkGrade = 0;

      // Online Course component (50% of total grade)
      const ojtOnlineCourseComponents = gradesByComponent['online course'] || [];
      if (ojtOnlineCourseComponents.length > 0) {
        const validOnlineCourses = ojtOnlineCourseComponents.filter((oc: any) => oc.Score !== null && oc.Score !== undefined);
        if (validOnlineCourses.length > 0) {
          const totalOnlineCourseScore = validOnlineCourses.reduce((sum: number, oc: any) => sum + (parseFloat(oc.Score) || 0), 0);
          const totalOnlineCourseMaxScore = validOnlineCourses.reduce((sum: number, oc: any) => sum + (parseFloat(oc.MaxScore) || 0), 0);
          if (totalOnlineCourseMaxScore > 0) {
            const onlineCoursePercentage = (totalOnlineCourseScore / totalOnlineCourseMaxScore) * 100;
            ojtOnlineCourseGrade = onlineCoursePercentage * 0.5; // 50% weight
            hasValidGrades = true;
          }
        }
      }

      // Recitation component (20% of total grade)
      const ojtRecitationComponents = gradesByComponent.recitation || [];
      if (ojtRecitationComponents.length > 0) {
        const validRecitations = ojtRecitationComponents.filter((r: any) => r.Score !== null && r.Score !== undefined);
        if (validRecitations.length > 0) {
          const totalRecitationScore = validRecitations.reduce((sum: number, r: any) => sum + (parseFloat(r.Score) || 0), 0);
          const totalRecitationMaxScore = validRecitations.reduce((sum: number, r: any) => sum + (parseFloat(r.MaxScore) || 0), 0);
          if (totalRecitationMaxScore > 0) {
            const recitationPercentage = (totalRecitationScore / totalRecitationMaxScore) * 100;
            ojtRecitationGrade = recitationPercentage * 0.2; // 20% weight
            hasValidGrades = true;
          }
        }
      }

      // Seatwork component (30% of total grade)
      const ojtSeatworkComponents = gradesByComponent.seatwork || [];
      if (ojtSeatworkComponents.length > 0) {
        const validSeatworks = ojtSeatworkComponents.filter((s: any) => s.Score !== null && s.Score !== undefined);
        if (validSeatworks.length > 0) {
          const totalSeatworkScore = validSeatworks.reduce((sum: number, s: any) => sum + (parseFloat(s.Score) || 0), 0);
          const totalSeatworkMaxScore = validSeatworks.reduce((sum: number, s: any) => sum + (parseFloat(s.MaxScore) || 0), 0);
          if (totalSeatworkMaxScore > 0) {
            const seatworkPercentage = (totalSeatworkScore / totalSeatworkMaxScore) * 100;
            ojtSeatworkGrade = seatworkPercentage * 0.3; // 30% weight
            hasValidGrades = true;
          }
        }
      }

      // Class Standing = Online Course (50%) + Recitation (20%) + Seatwork (30%) = 100% total
      classStanding = ojtOnlineCourseGrade + ojtRecitationGrade + ojtSeatworkGrade;
      examGrade = 0; // OJT doesn't have exams
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

      // Major Exam is 40% of total grade
      const defaultExamComponents = gradesByComponent['Major Exam'] || gradesByComponent['major exam'] || gradesByComponent.Exam || gradesByComponent.exam || [];
      if (defaultExamComponents.length > 0) {
        const validExam = defaultExamComponents.find((e: any) => e.Score !== null && e.Score !== undefined);
        if (validExam) {
          const examPercentage = (parseFloat(validExam.Score) || 0) / (parseFloat(validExam.MaxScore) || 60) * 100;
          examGrade = examPercentage * 0.4; // 40% weight
          hasValidGrades = true;
        }
      }
      break;
  }

  const finalGrade = classStanding + examGrade;
  console.log(`Term calculation result - ClassStanding: ${classStanding}, ExamGrade: ${examGrade}, Final: ${finalGrade}`);

  // Convert percentage to Filipino grading system (1.0-5.0)
  const filipinoGrade = hasValidGrades ? convertToFilipinoGrade(finalGrade) : null;
  console.log(`Converted to Filipino grade: ${filipinoGrade}`);

  return {
    grade: filipinoGrade,
    percentage: hasValidGrades ? finalGrade : null,
    classStanding,
    examGrade
  };
}


// PUT - Bulk update grades
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { grades, recordedBy } = body;

    if (!grades || !Array.isArray(grades) || !recordedBy) {
      return NextResponse.json(
        { success: false, error: "Grades array and recordedBy are required" },
        { status: 400 }
      );
    }

    let updatedCount = 0;
    let insertedCount = 0;

    for (const grade of grades) {
      const {
        studentId, scheduleId, term, component, itemNumber,
        maxScore, score
      } = grade;

      const percentage = maxScore && (score !== null && score !== undefined) ? (score / maxScore) * 100 : null;

      // Check if record exists
      const checkQuery = `
        SELECT GradeID FROM grades 
        WHERE StudentID = ? AND ScheduleID = ? AND Term = ? AND Component = ? AND ItemNumber = ?
      `;

      const [existingRows] = await db.execute(checkQuery, [
        studentId, scheduleId, term, component, itemNumber || 1
      ]);

      if ((existingRows as any[]).length > 0) {
        // Update existing record
        const updateQuery = `
          UPDATE grades 
          SET MaxScore = ?, Score = ?, Percentage = ?, RecordedBy = ?, LastModified = NOW()
          WHERE StudentID = ? AND ScheduleID = ? AND Term = ? AND Component = ? AND ItemNumber = ?
        `;

        await db.execute(updateQuery, [
          maxScore, score, percentage, recordedBy,
          studentId, scheduleId, term, component, itemNumber || 1
        ]);
        updatedCount++;
      } else {
        // Insert new record
        const insertQuery = `
          INSERT INTO grades 
          (StudentID, ScheduleID, Term, Component, ItemNumber, MaxScore, Score, Percentage, RecordedBy)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(insertQuery, [
          studentId, scheduleId, term, component, itemNumber || 1,
          maxScore, score, percentage, recordedBy
        ]);
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Bulk grades update completed",
      summary: {
        inserted: insertedCount,
        updated: updatedCount,
        total: grades.length
      }
    });
  } catch (error: any) {
    console.error("Error bulk updating grades:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to bulk update grades",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove grade record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get("gradeId");

    if (!gradeId) {
      return NextResponse.json(
        { success: false, error: "Grade ID is required" },
        { status: 400 }
      );
    }

    const deleteQuery = "DELETE FROM grades WHERE GradeID = ?";
    await db.execute(deleteQuery, [gradeId]);

    return NextResponse.json({
      success: true,
      message: "Grade record deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting grade:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete grade record",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}