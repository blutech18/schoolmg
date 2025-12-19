import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '../../../lib/db';

interface GradingComponent {
  name: string;
  weight: number;
  items: number;
  maxScore: number;
  maxItemsPerQuiz?: number;
  maxItemsPerExam?: number;
  maxItemsPerLab?: number;
  maxItemsPerOLO?: number;
  maxItemsPerAssignment?: number;
  maxItemsPerProject?: number;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('userSession');
    
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
    }

    // Get schedule details and subject's class type
    const [scheduleRows]: any = await db.query(
      `SELECT s.*, sub.SubjectCode, sub.SubjectName, sub.ClassType as SubjectClassType, sub.SubjectID
       FROM schedules s 
       JOIN subjects sub ON s.SubjectID = sub.SubjectID 
       WHERE s.ScheduleID = ?`,
      [scheduleId]
    );

    if (scheduleRows.length === 0) {
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    const schedule = scheduleRows[0];
    const classType = schedule.SubjectClassType || 'LECTURE';
    const subjectId = schedule.SubjectID;

    console.log('Schedule data:', { 
      scheduleId, 
      subjectId,
      classType, 
      subjectClassType: schedule.SubjectClassType
    });

    // Try to get editable component configurations first
    const [componentRows]: any = await db.query(
      `SELECT ComponentName, TotalScore, Weight, Items 
       FROM component_total_scores 
       WHERE SubjectID = ? AND ClassType = ?
       ORDER BY CASE ComponentName
         WHEN 'Quiz' THEN 1
         WHEN 'Laboratory' THEN 2
         WHEN 'OLO' THEN 3
         WHEN 'Exam' THEN 4
         WHEN 'Assignment' THEN 5
         WHEN 'Project' THEN 6
         ELSE 7
       END`,
      [subjectId, classType]
    );

    let gradingConfig;

    if (componentRows.length > 0) {
      // Use editable configurations from database
      const components: GradingComponent[] = componentRows.map((row: any) => ({
        name: row.ComponentName,
        weight: parseFloat(row.Weight),
        items: parseInt(row.Items),
        maxScore: parseFloat(row.TotalScore),
        // Legacy support
        maxItemsPerQuiz: row.ComponentName.toLowerCase() === 'quiz' ? parseFloat(row.TotalScore) : undefined,
        maxItemsPerExam: row.ComponentName.toLowerCase() === 'exam' ? parseFloat(row.TotalScore) : undefined,
        maxItemsPerLab: row.ComponentName.toLowerCase() === 'laboratory' ? parseFloat(row.TotalScore) : undefined,
        maxItemsPerOLO: row.ComponentName.toLowerCase() === 'olo' ? parseFloat(row.TotalScore) : undefined,
        maxItemsPerAssignment: row.ComponentName.toLowerCase() === 'assignment' ? parseFloat(row.TotalScore) : undefined,
        maxItemsPerProject: row.ComponentName.toLowerCase() === 'project' ? parseFloat(row.TotalScore) : undefined,
      }));

      // Ensure all required components are present for LECTURE
      if (classType === 'LECTURE') {
        const componentNames = components.map((c: GradingComponent) => c.name.toLowerCase());
        
        // Create ordered components array: Quiz → Exam
        const orderedComponents: GradingComponent[] = [];
        
        // Add Quiz component (first)
        if (componentNames.includes('quiz')) {
          const quizComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'quiz');
          orderedComponents.push(quizComponent!);
        } else {
          orderedComponents.push({
            name: 'Quiz',
            weight: 60,
            items: 15,
            maxScore: 20,
            maxItemsPerQuiz: 20
          });
        }
        
        // Add Major Exam component (second)
        if (componentNames.includes('exam') || componentNames.includes('major exam')) {
          const examComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'exam' || c.name.toLowerCase() === 'major exam');
          if (examComponent) {
            orderedComponents.push({
              ...examComponent,
              name: 'Major Exam'
            });
          }
        } else {
          orderedComponents.push({
            name: 'Major Exam',
            weight: 40,
            items: 1,
            maxScore: 60,
            maxItemsPerExam: 60
          });
        }
        
        // Replace components with ordered array
        components.length = 0;
        components.push(...orderedComponents);
      }
      
      // Ensure all required components are present for LECTURE+LAB
      if (classType === 'LECTURE+LAB') {
        const componentNames = components.map((c: GradingComponent) => c.name.toLowerCase());
        
        // Create ordered components array: Quiz → Laboratory → OLO → Exam
        const orderedComponents: GradingComponent[] = [];
        
        // Add Quiz component (first)
        if (componentNames.includes('quiz')) {
          const quizComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'quiz');
          orderedComponents.push(quizComponent!);
        } else {
          orderedComponents.push({
            name: 'Quiz',
            weight: 15,
            items: 5,
            maxScore: 20,
            maxItemsPerQuiz: 20
          });
        }
        
        // Add Laboratory component (second)
        if (componentNames.includes('laboratory')) {
          const labComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'laboratory');
          orderedComponents.push(labComponent!);
        } else {
          orderedComponents.push({
            name: 'Laboratory',
            weight: 30,
            items: 5,
            maxScore: 20,
            maxItemsPerLab: 20
          });
        }
        
        // Add OLO component (third)
        if (componentNames.includes('olo')) {
          const oloComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'olo');
          orderedComponents.push(oloComponent!);
        } else {
          orderedComponents.push({
            name: 'OLO',
            weight: 15,
            items: 5,
            maxScore: 20,
            maxItemsPerOLO: 20
          });
        }
        
        // Add Major Exam component (last)
        if (componentNames.includes('exam') || componentNames.includes('major exam')) {
          const examComponent = components.find((c: GradingComponent) => c.name.toLowerCase() === 'exam' || c.name.toLowerCase() === 'major exam');
          if (examComponent) {
            orderedComponents.push({
              ...examComponent,
              name: 'Major Exam'
            });
          }
        } else {
          orderedComponents.push({
            name: 'Major Exam',
            weight: 40,
            items: 1,
            maxScore: 60,
            maxItemsPerExam: 60
          });
        }
        
        // Replace components with ordered array
        components.length = 0;
        components.push(...orderedComponents);
      }

      gradingConfig = { components };
      console.log('Using editable component configurations from database with missing components added');
    } else {
      // Fallback to hardcoded configurations based on class type
      console.log('No editable configurations found, using hardcoded defaults');

    switch (classType) {
      case 'LECTURE':
        gradingConfig = {
          components: [
            {
              name: 'Quiz',
              weight: 60,
              items: 15,
              maxScore: 20, // Each quiz limited to 20 points
              maxItemsPerQuiz: 20 // Legacy support
            },
            {
              name: 'Exam',
              weight: 40,
              items: 1,
              maxScore: 60, // Each exam limited to 60 points
              maxItemsPerExam: 60 // Legacy support
            }
          ]
        };
        break;

      case 'LECTURE+LAB':
        // Force correct LECTURE+LAB configuration regardless of database values
        gradingConfig = {
          components: [
            {
              name: 'Quiz',
              weight: 15,
              items: 5,
              maxScore: 20, // Each quiz limited to 20 points
              maxItemsPerQuiz: 20 // Legacy support
            },
            {
              name: 'Laboratory',
              weight: 30,
              items: 5,
              maxScore: 20, // Each lab limited to 20 points
              maxItemsPerLab: 20 // Legacy support
            },
            {
              name: 'OLO',
              weight: 15,
              items: 5,
              maxScore: 20, // Each OLO limited to 20 points
              maxItemsPerOLO: 20 // Legacy support
            },
            {
              name: 'Exam',
              weight: 40,
              items: 1,
              maxScore: 60, // Each exam limited to 60 points
              maxItemsPerExam: 60 // Legacy support
            }
          ]
        };
        
        // Also update the database to match this configuration
        try {
          await db.query(`DELETE FROM component_total_scores WHERE SubjectID = ? AND ClassType = ?`, [subjectId, classType]);
          
          const correctConfig = [
            { ComponentName: 'Quiz', TotalScore: 20, Weight: 15, Items: 5 },
            { ComponentName: 'Laboratory', TotalScore: 20, Weight: 30, Items: 5 },
            { ComponentName: 'OLO', TotalScore: 20, Weight: 15, Items: 5 },
            { ComponentName: 'Exam', TotalScore: 60, Weight: 40, Items: 1 }
          ];

          for (const config of correctConfig) {
            await db.query(
              `INSERT INTO component_total_scores (SubjectID, ClassType, ComponentName, TotalScore, Weight, Items)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [subjectId, classType, config.ComponentName, config.TotalScore, config.Weight, config.Items]
            );
          }
          
          console.log('Updated LECTURE+LAB configuration in database for SubjectID:', subjectId);
        } catch (dbError) {
          console.error('Error updating database configuration:', dbError);
          // Continue with hardcoded config even if DB update fails
        }
        
        break;

      case 'MAJOR':
        gradingConfig = {
          components: [
            {
              name: 'Quiz',
              weight: 15,
              items: 5,
              maxScore: 20, // Each quiz limited to 20 points
              maxItemsPerQuiz: 20 // Legacy support
            },
            {
              name: 'Laboratory',
              weight: 40,
              items: 5,
              maxScore: 20, // Each lab limited to 20 points
              maxItemsPerLab: 20 // Legacy support
            },
            {
              name: 'OLO',
              weight: 15,
              items: 5,
              maxScore: 20, // Each OLO limited to 20 points
              maxItemsPerOLO: 20 // Legacy support
            },
            {
              name: 'Exam',
              weight: 30,
              items: 1,
              maxScore: 60, // Each exam limited to 60 points
              maxItemsPerExam: 60 // Legacy support
            }
          ]
        };
        break;

      case 'NSTP':
        // NSTP: Same grading system percentage with lecture
        gradingConfig = {
          components: [
            {
              name: 'Quiz',
              weight: 60,
              items: 15,
              maxScore: 20, // Each quiz limited to 20 points
              maxItemsPerQuiz: 20 // Legacy support
            },
            {
              name: 'Exam',
              weight: 40,
              items: 1,
              maxScore: 60, // Each exam limited to 60 points
              maxItemsPerExam: 60 // Legacy support
            }
          ]
        };
        break;

      case 'OJT':
        // OJT: Online Course 50%, Recitation 20%, Seatwork 30%
        gradingConfig = {
          components: [
            {
              name: 'Online Course',
              weight: 50,
              items: 5,
              maxScore: 20, // Each online course limited to 20 points
              maxItemsPerOnlineCourse: 20 // Legacy support
            },
            {
              name: 'Recitation',
              weight: 20,
              items: 5,
              maxScore: 20, // Each recitation limited to 20 points
              maxItemsPerRecitation: 20 // Legacy support
            },
            {
              name: 'Seatwork',
              weight: 30,
              items: 5,
              maxScore: 20, // Each seatwork limited to 20 points
              maxItemsPerSeatwork: 20 // Legacy support
            }
          ]
        };
        break;

      default:
        // Default to LECTURE configuration
        gradingConfig = {
          components: [
            {
              name: 'Quiz',
              weight: 60,
              items: 15,
              maxScore: 20, // Each quiz limited to 20 points
              maxItemsPerQuiz: 20 // Legacy support
            },
            {
              name: 'Exam',
              weight: 40,
              items: 1,
              maxScore: 60, // Each exam limited to 60 points
              maxItemsPerExam: 60 // Legacy support
            }
          ]
        };
      }
    }

    console.log('Final grading config being returned:');
    console.log('- Config object:', gradingConfig);
    console.log('- Components array:', gradingConfig?.components);
    console.log('- Components length:', gradingConfig?.components?.length);

    return NextResponse.json({
      success: true,
      config: gradingConfig,
      schedule: {
        ScheduleID: schedule.ScheduleID,
        SubjectCode: schedule.SubjectCode,
        SubjectName: schedule.SubjectName,
        ClassType: schedule.SubjectClassType
      }
    });

  } catch (error) {
    console.error('Error fetching grading config:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
