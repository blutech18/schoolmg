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

    // Calculate summary grades for instructor view as well
    if (userRole === "instructor") {
      const grades = rows as any[];
      // For instructors, we don't want to calculate a single summary for the whole schedule
      // because that would aggregate all students' grades into one.
      // return just the raw data and let the frontend calculate per-student grades.
      // We return an empty summary object to trigger the local calculation fallback in the frontend
      // (which happens when data.summary exists but data.summary[scheduleId] does not).
      return NextResponse.json({ success: true, data: grades, summary: {} });
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

// Round to nearest valid Filipino grade (matches instructor grading sheet)
function roundToValidGrade(grade: number): number {
  const validGrades = [1.00, 1.25, 1.50, 1.75, 2.00, 2.25, 2.50, 2.75, 3.00, 5.00];
  if (validGrades.includes(grade)) return grade;
  if (grade > 3.0) return 5.00;
  let nearest = validGrades[0];
  let minDiff = Math.abs(grade - nearest);
  for (const validGrade of validGrades) {
    const diff = Math.abs(grade - validGrade);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = validGrade;
    }
  }
  return nearest;
}

// Convert percentage to Filipino grading system (1.0-5.0)
// 1.0 is highest, 3.0 is passing, 5.0 is failed
// Thresholds match the instructor grading sheet
function convertToFilipinoGrade(percentage: number): number {
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
        final: [],
        // Keep track of all items for this schedule to determine which are "active"
        allItems: []
      };
    }
    // Normalize term name
    const termKey = (grade.Term || "").toString().toLowerCase();
    if (!acc[grade.ScheduleID][termKey]) {
      acc[grade.ScheduleID][termKey] = [];
    }
    acc[grade.ScheduleID][termKey].push(grade);
    acc[grade.ScheduleID].allItems.push(grade);
    return acc;
  }, {});

  // Calculate grades for each schedule
  Object.keys(gradesBySchedule).forEach(scheduleId => {
    const scheduleGrades = gradesBySchedule[scheduleId];
    const classType = scheduleGrades.ClassType;
    const subjectCode = scheduleGrades.SubjectCode || '';

    // Skip NSTP subjects
    if (subjectCode.toUpperCase().includes('NSTP')) {
      return;
    }

    // Determine "Active Items": Items where AT LEAST ONE student has a score > 0
    // This ignores initialized "0"s that serve as placeholders
    const activeItems = new Set<string>();
    scheduleGrades.allItems.forEach((g: any) => {
      if (g.Score !== null && parseFloat(g.Score) > 0) {
        // Create a unique key for Component + ItemNumber + Term
        const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase();
        activeItems.add(key);
      }
    });

    // Helper to filter grades to only active items
    const filterActive = (grades: any[]) => {
      return grades.filter((g: any) => {
        const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase();
        // If it's in activeItems, keep it. 
        // Also keep if explicitly non-zero (though that covers the definition).
        // If it's 0 but NO ONE has >0 for this item, we filter it out.
        return activeItems.has(key);
      });
    };

    const midtermResult = calculateTermGrade(filterActive(scheduleGrades.midterm || []), classType);
    const finalResult = calculateTermGrade(filterActive(scheduleGrades.final || []), classType);

    // Extract grades and percentages
    const midtermGrade = midtermResult?.grade || null;
    const finalGrade = finalResult?.grade || null;
    const midtermPercentage = midtermResult?.percentage || null;
    const finalPercentage = finalResult?.percentage || null;

    // Calculate summary grade (average of valid terms)
    // Round to nearest valid Filipino grade to match instructor grading sheet
    let summaryGrade = null;
    let summaryPercentage = null;

    if (midtermGrade !== null && finalGrade !== null) {
      const rawAverage = (midtermGrade + finalGrade) / 2;
      summaryGrade = roundToValidGrade(rawAverage);
      if (midtermPercentage !== null && finalPercentage !== null) {
        summaryPercentage = (midtermPercentage + finalPercentage) / 2;
      }
    }

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
    // console.log('No grades found for term calculation');
    return null;
  }

  // Normalize classType to handle variations (spaces, casing)
  const normalizedClassType = (classType || 'LECTURE').replace(/\s+/g, '').toUpperCase();

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
      'recitation': 'recitation',
      'seatwork': 'seatwork',
      'assignment': 'assignment',
      'homework': 'assignment',
      'project': 'project',
      'major exam': 'major exam',
      'major': 'major exam',
      'exam': 'major exam',
      'examination': 'major exam',
      'periodical exam': 'major exam',
      'periodical': 'major exam',
      'midterm': 'major exam',
      'final': 'major exam',
      'midterm exam': 'major exam',
      'final exam': 'major exam',
      'olo': 'olo',
      'online learning opportunity': 'olo',
      'online learning activity': 'olo',
      'online course': 'online course',
      'attendance': 'attendance',
      'class participation': 'attendance',
      'participation': 'attendance',
      'thesis': 'thesis',
      'defense': 'thesis defense'
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

    return lower;
  };

  // Group grades by normalized component
  const gradesByComponent = termGrades.reduce((acc: any, grade: any) => {
    const component = normalizeComponentName(grade.Component || '');
    if (!acc[component]) {
      acc[component] = [];
    }
    acc[component].push(grade);
    return acc;
  }, {});

  // Define weights for different class types
  // These MUST match the instructor grading page weights (calculateTermGradeLocal)
  const WEIGHTS: { [key: string]: { [key: string]: number } } = {
    'LECTURE': {
      'quiz': 30,
      'assignment': 10,
      'recitation': 10,
      'seatwork': 10,
      'major exam': 40
    },
    'LECTURE+LAB': {
      'quiz': 15,
      'laboratory': 40,
      'assignment': 10,
      'recitation': 10,
      'major exam': 25
    },
    'MAJOR': {
      'quiz': 15,
      'laboratory': 40,
      'olo': 15,
      'major exam': 30
    },
    'CISCO': {
      'quiz': 15,
      'laboratory': 40,
      'olo': 15,
      'major exam': 30
    },
    'NSTP': {
      'quiz': 60,
      'major exam': 40
    },
    'OJT': {
      'online course': 50,
      'recitation': 20,
      'seatwork': 30
    },
    'THESIS': {
      'thesis': 100,
      'thesis defense': 100,
      'project': 100
    }
  };

  // Select weight configuration with fallbacks
  let activeWeights = WEIGHTS[normalizedClassType];
  if (!activeWeights) {
    if (normalizedClassType.includes('LAB')) activeWeights = WEIGHTS['LECTURE+LAB'];
    else if (normalizedClassType.includes('CISCO')) activeWeights = WEIGHTS['CISCO'];
    else if (normalizedClassType.includes('THESIS')) activeWeights = WEIGHTS['THESIS'];
    else activeWeights = WEIGHTS['LECTURE'];
  }

  let totalWeightedScore = 0;
  let totalWeightUsed = 0;
  let hasActiveComponents = false;

  // Calculate grade based on ACTIVE components only
  Object.keys(gradesByComponent).forEach(component => {
    const componentGrades = gradesByComponent[component];
    const weight = activeWeights[component] || 0;

    // If this component isn't in our weight map, we ignore it (or should we count it?)
    // For safety, only count configured weighted components.
    if (weight > 0 && componentGrades.length > 0) {
      // Calculate active score for this component
      let currentTotalScore = 0;
      let currentTotalMaxScore = 0;

      componentGrades.forEach((g: any) => {
        const score = parseFloat(g.Score) || 0;
        const max = parseFloat(g.MaxScore) || 0;
        if (max > 0) {
          currentTotalScore += score;
          currentTotalMaxScore += max;
        }
      });

      if (currentTotalMaxScore > 0) {
        const componentPercentage = (currentTotalScore / currentTotalMaxScore) * 100;
        totalWeightedScore += componentPercentage * (weight / 100);
        totalWeightUsed += weight;
        hasActiveComponents = true;
      }
    }
  });

  // Calculate final percentage
  // If totalWeightUsed is < 100 (because some components like Exam are missing/inactive),
  // we re-normalize the score to be out of the used weight.
  // e.g., if only Quiz (60%) is active and score is perfect, weighted score is 60. 
  // Final % = 60 / 60 * 100 = 100%.

  if (!hasActiveComponents || totalWeightUsed === 0) {
    return {
      grade: null,
      percentage: null,
      classStanding: 0,
      examGrade: 0
    };
  }

  const finalPercentage = (totalWeightedScore / (totalWeightUsed / 100));

  // Note: classStanding and examGrade are partial sums. 
  // To correspond to the "Dynamic" logic, we should probably return the unified finalPercentage.
  // The UI might expect separated fields, but for "Running Grade" calculation, the single percentage is truth.

  // Convert percentage to Filipino grading system (1.0-5.0)
  const filipinoGrade = convertToFilipinoGrade(finalPercentage);

  return {
    grade: filipinoGrade,
    percentage: finalPercentage,
    // We can approximate these splits for UI if needed, or just set them proportional
    classStanding: 0, // Legacy field
    examGrade: 0      // Legacy field
  };
}


// PUT - Bulk update grades (OPTIMIZED with batch upsert)
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

    if (grades.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No grades to update",
        summary: { inserted: 0, updated: 0, total: 0 }
      });
    }

    // Prepare values for batch insert with ON DUPLICATE KEY UPDATE
    // This requires a unique key on (StudentID, ScheduleID, Term, Component, ItemNumber)
    const values: any[] = [];
    const placeholders: string[] = [];

    for (const grade of grades) {
      const {
        studentId, scheduleId, term, component, itemNumber,
        maxScore, score
      } = grade;

      const percentage = maxScore && (score !== null && score !== undefined)
        ? (score / maxScore) * 100
        : null;

      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?)');
      values.push(
        studentId,
        scheduleId,
        term,
        component,
        itemNumber || 1,
        maxScore,
        score,
        percentage,
        recordedBy
      );
    }

    // Use INSERT ... ON DUPLICATE KEY UPDATE for efficient batch upsert
    // This assumes there's a unique index on (StudentID, ScheduleID, Term, Component, ItemNumber)
    const batchQuery = `
      INSERT INTO grades 
        (StudentID, ScheduleID, Term, Component, ItemNumber, MaxScore, Score, Percentage, RecordedBy)
      VALUES ${placeholders.join(', ')}
      ON DUPLICATE KEY UPDATE 
        MaxScore = VALUES(MaxScore),
        Score = VALUES(Score),
        Percentage = VALUES(Percentage),
        RecordedBy = VALUES(RecordedBy),
        LastModified = NOW()
    `;

    const [result] = await db.execute(batchQuery, values) as any;

    // affectedRows includes both inserts and updates
    // For ON DUPLICATE KEY UPDATE: insert = 1 row, update = 2 rows affected
    const affectedRows = result.affectedRows || 0;
    const insertedCount = Math.max(0, affectedRows - (result.changedRows || 0));
    const updatedCount = result.changedRows || 0;

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