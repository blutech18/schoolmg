"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { ArrowLeft, Save, Calculator, FileText, Users, Printer } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";
import { printDocument, generateGradingPrintContent } from "../../lib/printUtils";

interface GradingConfig {
  components: Array<{
    name: string;
    weight: number;
    items: number;
    maxScore?: number;
    maxItemsPerQuiz?: number;
    maxItemsPerExam?: number;
    maxItemsPerLab?: number;
    maxItemsPerOLO?: number;
    maxItemsPerAssignment?: number;
    maxItemsPerProject?: number;
    maxItemsPerOnlineCourse?: number;
    maxItemsPerRecitation?: number;
    maxItemsPerSeatwork?: number;
  }>;
}

interface Student {
  StudentID: number;
  StudentName: string;
  Course: string;
  YearLevel: number;
  Section: string;
  StudentNumber?: string;
}

interface Grade {
  GradeID?: number;
  StudentID: number;
  ScheduleID: number;
  Component: string;
  Term: string;
  ItemNumber: number;
  Score: number;
  MaxScore: number;
}

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectTitle: string;
  SubjectID?: number;
  Course: string;
  YearLevel: number;
  Section: string;
  ClassType: string;
}

function InstructorGradesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scheduleId = searchParams.get('scheduleId');

  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradingConfig, setGradingConfig] = useState<GradingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<'midterm' | 'final'>('midterm');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [maxScoreUpdateTrigger, setMaxScoreUpdateTrigger] = useState(0);

  // Helper function to get max score for component from grading config - focus on numbers only
  const getMaxScore = (componentName: string, itemNumber?: number): number => {
    // Use the trigger to ensure this function re-runs when max scores are updated
    const _ = maxScoreUpdateTrigger;
    const __ = selectedTerm; // Also depend on selectedTerm to re-run when term changes

    if (!gradingConfig?.components) {
      // Default numerical fallback - allow 0 as minimum
      return 20;
    }

    // Find the component in the grading config by exact name match
    const configComponent = gradingConfig.components.find(
      comp => comp.name.toLowerCase() === componentName.toLowerCase()
    );

    if (configComponent) {
      // If itemNumber is provided, check for individual item max scores in localStorage first
      if (itemNumber && schedule?.SubjectID && schedule?.ClassType) {
        const itemMaxScoresKey = `itemMaxScores_${schedule.SubjectID}_${schedule.ClassType}_${componentName}_${selectedTerm}`;
        const storedScores = JSON.parse(localStorage.getItem(itemMaxScoresKey) || '{}');
        if (storedScores[itemNumber] !== undefined) {
          return storedScores[itemNumber];
        }
      }

      // Use maxScore directly from the component configuration
      if (configComponent.maxScore) {
        return configComponent.maxScore;
      }

      // Legacy support for named max score properties
      const componentType = componentName.toLowerCase();
      if (componentType === 'quiz' && configComponent.maxItemsPerQuiz) {
        return configComponent.maxItemsPerQuiz;
      }
      if ((componentType === 'exam' || componentType === 'major exam') && configComponent.maxItemsPerExam) {
        return configComponent.maxItemsPerExam;
      }
      if (componentType === 'laboratory' && configComponent.maxItemsPerLab) {
        return configComponent.maxItemsPerLab;
      }
      if (componentType === 'olo' && configComponent.maxItemsPerOLO) {
        return configComponent.maxItemsPerOLO;
      }
      if (componentType === 'assignment' && configComponent.maxItemsPerAssignment) {
        return configComponent.maxItemsPerAssignment;
      }
      if (componentType === 'project' && configComponent.maxItemsPerProject) {
        return configComponent.maxItemsPerProject;
      }
      // OJT-specific components
      if (componentType === 'online course' && configComponent.maxItemsPerOnlineCourse) {
        return configComponent.maxItemsPerOnlineCourse;
      }
      if (componentType === 'recitation' && configComponent.maxItemsPerRecitation) {
        return configComponent.maxItemsPerRecitation;
      }
      if (componentType === 'seatwork' && configComponent.maxItemsPerSeatwork) {
        return configComponent.maxItemsPerSeatwork;
      }
    }

    // Final numerical fallback - allow 0 as minimum
    return 20;
  };

  useEffect(() => {
    if (scheduleId) {
      fetchScheduleData();
      fetchStudents();
      fetchGrades();
      fetchGradingConfig();
    }
  }, [scheduleId]);

  // Fetch calculated grades when students are loaded
  useEffect(() => {
    if (students.length > 0) {
      fetchCalculatedGrades();
    }
  }, [students]);

  const printGradingSheet = () => {
    if (!schedule || !gradingConfig) {
      brandedToast.error('Schedule and grading configuration not loaded');
      return;
    }

    const studentsData = students.map(student => {
      const nameParts = (student.StudentName || '').split(' ');
      return {
        StudentID: student.StudentID,
        FirstName: nameParts[0] || '',
        LastName: nameParts.slice(1).join(' ') || '',
        StudentNumber: student.StudentNumber || student.StudentID?.toString() || ''
      };
    });

    const printContent = generateGradingPrintContent(
      schedule,
      studentsData,
      grades,
      gradingConfig,
      selectedTerm,
      calculatedGrades
    );

    printDocument(printContent, `${schedule.SubjectCode} - ${selectedTerm} Grading Sheet`);
  };

  // Debug grading config changes
  useEffect(() => {
    console.log('GradingConfig state changed:', gradingConfig);
    console.log('Components in config:', gradingConfig?.components);
    console.log('Number of components:', gradingConfig?.components?.length);
    if (gradingConfig?.components) {
      gradingConfig.components.forEach((comp, index) => {
        console.log(`Component ${index}:`, comp.name, 'items:', comp.items, 'weight:', comp.weight);
      });
    }
  }, [gradingConfig]);

  const fetchScheduleData = async () => {
    try {
      // First try to get the specific schedule by ID
      const response = await fetch(`/api/schedules?id=${scheduleId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success && data.data) {
        // If we got a single schedule object
        const scheduleData = !Array.isArray(data.data) ? data.data : data.data[0];
        setSchedule(scheduleData);
        console.log('Schedule data loaded:', scheduleData);
      } else {
        console.error('No schedule data found:', data);
        brandedToast.error('Schedule not found');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      brandedToast.error('Failed to load schedule data');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/enrollments?scheduleId=${scheduleId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Filter out students with LOA, Drop, or UW status
        const filteredStudents = data.data.filter((student: any) => {
          const status = student.Status?.toLowerCase();
          return status !== 'loa' && status !== 'drop' && status !== 'uw';
        });
        setStudents(filteredStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      brandedToast.error('Failed to load students');
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/grades?scheduleId=${scheduleId}&role=instructor`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // Process grades to ensure whole numbers are stored as integers
        const processedGrades = data.data.map((grade: any) => ({
          ...grade,
          Score: grade.Score !== null && grade.Score % 1 === 0 ? Math.round(grade.Score) : grade.Score
        }));
        setGrades(processedGrades);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
      brandedToast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  // Normalized templates to mirror /api/grades/config and prevent "all quiz" fallbacks
  const TEMPLATE_CONFIG: Record<string, { components: { name: string; weight: number; items: number; maxScore: number }[] }> = {
    LECTURE: {
      components: [
        { name: 'Quiz', weight: 60, items: 15, maxScore: 20 },
        { name: 'Major Exam', weight: 40, items: 1, maxScore: 60 },
      ],
    },
    'LECTURE+LAB': {
      components: [
        { name: 'Quiz', weight: 15, items: 5, maxScore: 20 },
        { name: 'Laboratory', weight: 30, items: 5, maxScore: 20 },
        { name: 'OLO', weight: 15, items: 5, maxScore: 20 },
        { name: 'Major Exam', weight: 40, items: 1, maxScore: 60 },
      ],
    },
    MAJOR: {
      components: [
        { name: 'Quiz', weight: 15, items: 5, maxScore: 20 },
        { name: 'Laboratory', weight: 40, items: 5, maxScore: 20 },
        { name: 'OLO', weight: 15, items: 5, maxScore: 20 },
        { name: 'Major Exam', weight: 30, items: 1, maxScore: 60 },
      ],
    },
    NSTP: {
      components: [
        { name: 'Quiz', weight: 60, items: 15, maxScore: 20 },
        { name: 'Major Exam', weight: 40, items: 1, maxScore: 60 },
      ],
    },
    OJT: {
      components: [
        { name: 'Online Course', weight: 50, items: 5, maxScore: 20 },
        { name: 'Recitation', weight: 20, items: 5, maxScore: 20 },
        { name: 'Seatwork', weight: 30, items: 5, maxScore: 20 },
      ],
    },
  };

  const normalizeClassType = (classType?: string) => {
    if (!classType) return 'LECTURE';
    return classType.replace(/\s+/g, '').toUpperCase();
  };

  const getDefaultConfig = (classType?: string) => {
    const normalized = normalizeClassType(classType || schedule?.ClassType || 'LECTURE');
    return TEMPLATE_CONFIG[normalized] || TEMPLATE_CONFIG.LECTURE;
  };

  // Validate and normalize grading components from API before using
  const sanitizeConfig = (config: any, classType?: string) => {
    const normalized = normalizeClassType(classType);
    const template = getDefaultConfig(normalized);

    // If API has no components, fall back to template immediately
    if (!config?.components || !Array.isArray(config.components)) return template;

    // Map API components by lowercase name for easy lookup
    const apiComponentsByName = new Map<string, any>();
    config.components.forEach((comp: any) => {
      const key = (comp?.name || '').toLowerCase();
      if (!key) return;
      apiComponentsByName.set(key, comp);
    });

    // Build ordered components strictly from the template to avoid "all quiz"
    const mergedComponents = template.components.map((tplComp) => {
      const apiComp = apiComponentsByName.get(tplComp.name.toLowerCase());
      const toNumber = (val: any, fallback: number) => {
        const num = typeof val === 'number' ? val : Number(val);
        return Number.isFinite(num) && num > 0 ? num : fallback;
      };

      return {
        name: tplComp.name,
        weight: toNumber(apiComp?.weight, tplComp.weight),
        items: toNumber(apiComp?.items, tplComp.items),
        maxScore: toNumber(apiComp?.maxScore, tplComp.maxScore),
      };
    });

    return { components: mergedComponents };
  };

  const fetchGradingConfig = async () => {
    try {
      const response = await fetch(`/api/grades/config?scheduleId=${scheduleId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      const classType = data?.schedule?.ClassType || schedule?.ClassType || 'LECTURE';

      if (data.success) {
        const safeConfig = sanitizeConfig(data.config, classType);
        setGradingConfig(safeConfig);
      } else {
        brandedToast.error('Failed to load grading configuration');
        setGradingConfig(getDefaultConfig(classType));
      }
    } catch (error) {
      console.error('Error fetching grading config:', error);
      brandedToast.error('Error loading grading configuration');
      const classType = schedule?.ClassType || 'LECTURE';
      setGradingConfig(getDefaultConfig(classType));
    } finally {
      setLoading(false);
    }
  };

  const updateGrade = (studentId: number, component: string, itemNumber: number, score: string) => {
    // Handle empty string as null/undefined (no grade entered)
    if (score === '' || score === null || score === undefined) {
      setGrades(prevGrades => {
        const existingGradeIndex = prevGrades.findIndex(g =>
          g.StudentID === studentId &&
          g.Component === component &&
          g.ItemNumber === itemNumber &&
          g.Term === selectedTerm
        );

        if (existingGradeIndex >= 0) {
          const updatedGrades = [...prevGrades];
          updatedGrades.splice(existingGradeIndex, 1);
          setUnsavedChanges(true);
          return updatedGrades;
        }
        return prevGrades;
      });
      return;
    }

    let numericScore = parseFloat(score);

    // Check if the parsed value is NaN (invalid input)
    if (isNaN(numericScore)) {
      brandedToast.error('Please enter a valid number');
      return;
    }

    // Get max score based on component type and item number
    const maxScore = getMaxScore(component, itemNumber);

    // Validate score doesn't exceed maximum allowed
    if (numericScore > maxScore) {
      brandedToast.error(`Score cannot exceed ${maxScore} for ${component} ${itemNumber}`);
      numericScore = maxScore; // Cap the score at maximum
    }

    // Ensure score is not negative
    if (numericScore < 0) {
      numericScore = 0;
    }

    // Allow 0 as a valid score (no minimum enforced)

    // Convert to integer (whole number) to avoid decimal display
    numericScore = Math.round(numericScore);

    setGrades(prevGrades => {
      const existingGradeIndex = prevGrades.findIndex(g =>
        g.StudentID === studentId &&
        g.Component === component &&
        g.ItemNumber === itemNumber &&
        g.Term === selectedTerm
      );

      if (existingGradeIndex >= 0) {
        const updatedGrades = [...prevGrades];
        updatedGrades[existingGradeIndex] = {
          ...updatedGrades[existingGradeIndex],
          Score: numericScore,
          MaxScore: maxScore
        };
        return updatedGrades;
      } else {
        const newGrade: Grade = {
          StudentID: studentId,
          ScheduleID: parseInt(scheduleId!),
          Component: component,
          Term: selectedTerm,
          ItemNumber: itemNumber,
          Score: numericScore,
          MaxScore: maxScore
        };
        return [...prevGrades, newGrade];
      }
    });

    setUnsavedChanges(true);
  };

  // Updates the max score for a component item and proportionally adjusts existing scores
  // Examples: 
  // - If max score changes from 60 to 50, and a student had 60 points, they get 50 points
  // - If max score changes from 60 to 50, and a student had 30 points, they get 25 points (30/60 * 50)
  // - If max score changes from 30 to 40, and a student had 30 points, they get 40 points
  const updateItemMaxScore = async (componentName: string, itemNumber: number, newMaxScore: number) => {
    try {
      // Validate new max score
      if (newMaxScore < 0) {
        brandedToast.error('Max score cannot be negative');
        return;
      }

      if (newMaxScore > 1000) {
        brandedToast.error('Max score cannot exceed 1000 points');
        return;
      }

      // Get the current max score before updating
      const currentMaxScore = getMaxScore(componentName, itemNumber);

      // Store individual item max scores in localStorage with term-specific keys
      const itemMaxScoresKey = `itemMaxScores_${schedule?.SubjectID}_${schedule?.ClassType}_${componentName}_${selectedTerm}`;
      const existingScores = JSON.parse(localStorage.getItem(itemMaxScoresKey) || '{}');
      existingScores[itemNumber] = newMaxScore;
      localStorage.setItem(itemMaxScoresKey, JSON.stringify(existingScores));

      // Proportionally adjust existing scores for all students
      if (currentMaxScore > 0 && newMaxScore !== currentMaxScore) {
        const adjustmentRatio = newMaxScore / currentMaxScore;
        let adjustedCount = 0;

        setGrades(prevGrades => {
          return prevGrades.map(grade => {
            // Check if this grade is for the same component, item, and term
            if (grade.Component === componentName &&
              grade.ItemNumber === itemNumber &&
              grade.Term === selectedTerm &&
              grade.Score !== null) {

              // Handle zero scores - keep them as zero
              if (grade.Score === 0) {
                return {
                  ...grade,
                  MaxScore: newMaxScore
                };
              }

              // Calculate new score proportionally
              let newScore = grade.Score * adjustmentRatio;

              // Round to 1 decimal place for better precision
              newScore = Math.round(newScore * 10) / 10;

              // Ensure the new score doesn't exceed the new max score
              if (newScore > newMaxScore) {
                newScore = newMaxScore;
              }

              // If the score was a perfect score (equal to old max), make it perfect for new max
              if (Math.abs(grade.Score - currentMaxScore) < 0.01) {
                newScore = newMaxScore;
              }

              adjustedCount++;

              return {
                ...grade,
                Score: newScore,
                MaxScore: newMaxScore
              };
            }
            return grade;
          });
        });

        if (adjustedCount > 0) {
          brandedToast.success(`${componentName} ${itemNumber} max score updated to ${newMaxScore} points. ${adjustedCount} existing scores adjusted proportionally.`);
        } else {
          brandedToast.success(`${componentName} ${itemNumber} max score updated to ${newMaxScore} points.`);
        }
      } else {
        brandedToast.success(`${componentName} ${itemNumber} max score updated to ${newMaxScore} points`);
      }

      // Trigger a re-render to update the UI
      setMaxScoreUpdateTrigger(prev => prev + 1);
      setUnsavedChanges(true);

    } catch (error) {
      console.error('Error updating item max score:', error);
      brandedToast.error('Failed to update max score');
    }
  };

  const saveGrades = async () => {
    try {
      // Get session data from cookies
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };

      const sessionCookie = getCookie('userSession');
      if (!sessionCookie) {
        brandedToast.error('Session expired. Please log in again.');
        return;
      }

      let sessionData;
      try {
        sessionData = JSON.parse(decodeURIComponent(sessionCookie));
      } catch (error) {
        brandedToast.error('Invalid session data. Please log in again.');
        return;
      }

      if (!sessionData.userId) {
        brandedToast.error('User ID not found in session. Please log in again.');
        return;
      }

      // Filter grades for the selected term and format for API
      const gradesToSave = grades
        .filter(g => g.Term === selectedTerm)
        .map(grade => ({
          studentId: grade.StudentID,
          scheduleId: grade.ScheduleID,
          term: grade.Term,
          component: grade.Component,
          itemNumber: grade.ItemNumber,
          maxScore: grade.MaxScore,
          score: grade.Score
        }));

      console.log('Saving grades:', gradesToSave);
      console.log('Recorded by:', sessionData.userId);

      const response = await fetch('/api/grades', {
        method: 'PUT', // Use PUT for bulk update
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          grades: gradesToSave,
          recordedBy: sessionData.userId
        }),
      });

      const data = await response.json();

      if (data.success) {
        brandedToast.success(`Grades saved successfully! ${data.summary?.updated || 0} updated, ${data.summary?.inserted || 0} inserted.`);
        setUnsavedChanges(false);
        fetchGrades();
        fetchCalculatedGrades(); // Refresh calculated grades for Term Average
      } else {
        brandedToast.error(data.error || 'Failed to save grades');
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      brandedToast.error('Failed to save grades');
    }
  };



  // State to store calculated grades from API
  const [calculatedGrades, setCalculatedGrades] = useState<{ [key: string]: any }>({});

  // Fetch calculated grades from API for consistency
  const fetchCalculatedGrades = async () => {
    if (!scheduleId || students.length === 0) return;

    // First, get all grades for this schedule as instructor
    try {
      const response = await fetch(`/api/grades?scheduleId=${scheduleId}&role=instructor`, {
        credentials: 'include'
      });

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status} for schedule ${scheduleId}`);
        return;
      }

      const data = await response.json();
      console.log(`Grade data for schedule ${scheduleId}:`, data);

      if (data.success && data.summary) {
        console.log(`Found calculated grades for schedule ${scheduleId}:`, data.summary);
        console.log(`Summary keys:`, Object.keys(data.summary));
        console.log(`Schedule ${scheduleId} in summary:`, data.summary[scheduleId]);

        // Check if we have summary data for this schedule
        const scheduleSummary = data.summary[scheduleId];
        if (scheduleSummary) {
          console.log(`Using API summary data for schedule ${scheduleId}:`, scheduleSummary);

          // The API returns one summary per schedule, but we need to apply it to all students
          // Since this is the same subject/class for all students, we'll use the same grades
          const gradesMap: { [key: string]: any } = {};

          students.forEach((student: any) => {
            const studentId = student.StudentID;
            gradesMap[studentId] = {
              midterm: scheduleSummary.midterm,
              final: scheduleSummary.final,
              summary: scheduleSummary.summary,
              midtermPercentage: scheduleSummary.midtermPercentage,
              finalPercentage: scheduleSummary.finalPercentage,
              summaryPercentage: scheduleSummary.summaryPercentage
            };
          });

          console.log('Final calculated grades map from API:', gradesMap);
          setCalculatedGrades(gradesMap);
        } else {
          console.log(`No summary data found for schedule ${scheduleId}, calculating locally...`);

          // Fallback to local calculation if API summary is not available
          const gradesMap: { [key: string]: any } = {};

          // The API returns summary grouped by scheduleId, but we need it by studentId
          // We need to extract individual student grades from the raw data
          const studentGradesMap: { [key: string]: { midterm: any[], final: any[] } } = {};

          // Group grades by student first
          data.data.forEach((grade: any) => {
            const studentId = grade.StudentID;
            if (!studentGradesMap[studentId]) {
              studentGradesMap[studentId] = { midterm: [], final: [] };
            }

            const termKey = (grade.Term || '').toLowerCase();
            if (termKey === 'midterm') {
              studentGradesMap[studentId].midterm.push(grade);
            } else if (termKey === 'final') {
              studentGradesMap[studentId].final.push(grade);
            }
          });

          // Now calculate grades for each student
          // Determine "Active Items": Items where AT LEAST ONE student has a score > 0
          const activeItems = new Set<string>();
          data.data.forEach((g: any) => {
            if (g.Score !== null && parseFloat(g.Score) > 0) {
              const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase();
              activeItems.add(key);
            }
          });

          const filterActive = (grades: any[]) => {
            return grades.filter((g: any) => {
              const key = `${g.Term}-${g.Component}-${g.ItemNumber}`.toLowerCase();
              return activeItems.has(key);
            });
          };

          students.forEach((student: any) => {
            const studentId = student.StudentID;
            const studentGrades = studentGradesMap[studentId];

            if (studentGrades) {
              const midtermResult = calculateTermGradeLocal(filterActive(studentGrades.midterm), schedule?.ClassType);
              const finalResult = calculateTermGradeLocal(filterActive(studentGrades.final), schedule?.ClassType);

              gradesMap[studentId] = {
                midterm: midtermResult?.grade || null,
                final: finalResult?.grade || null,
                summary: (midtermResult?.grade !== null && midtermResult?.grade !== undefined && finalResult?.grade !== null && finalResult?.grade !== undefined)
                  ? (midtermResult.grade + finalResult.grade) / 2
                  : null
              };
            } else {
              gradesMap[studentId] = { midterm: null, final: null, summary: null };
            }
          });

          console.log('Final calculated grades map (local calculation):', gradesMap);
          setCalculatedGrades(gradesMap);
        }
      } else {
        console.log(`No calculated grades found for schedule ${scheduleId}`);
        // Fallback: fetch individual student grades
        fetchIndividualStudentGrades();
      }
    } catch (error) {
      console.error(`Error fetching grades for schedule ${scheduleId}:`, error);
      // Fallback: fetch individual student grades
      fetchIndividualStudentGrades();
    }
  };

  const fetchIndividualStudentGrades = async () => {
    const gradePromises = students.map(async (student) => {
      try {
        const response = await fetch(`/api/grades?role=student&userId=${student.StudentID}`, {
          credentials: 'include'
        });

        if (!response.ok) {
          console.error(`HTTP error! status: ${response.status} for student ${student.StudentID}`);
          return {
            studentId: student.StudentID,
            grades: { midterm: null, final: null, summary: null }
          };
        }

        const data = await response.json();

        if (data.success && data.summary && scheduleId && data.summary[scheduleId]) {
          return {
            studentId: student.StudentID,
            grades: data.summary[scheduleId]
          };
        }

        return {
          studentId: student.StudentID,
          grades: { midterm: null, final: null, summary: null }
        };
      } catch (error) {
        console.error(`Error fetching grades for student ${student.StudentID}:`, error);
        return {
          studentId: student.StudentID,
          grades: { midterm: null, final: null, summary: null }
        };
      }
    });

    const results = await Promise.all(gradePromises);
    const gradesMap = results.reduce((acc, result) => {
      acc[result.studentId] = result.grades;
      return acc;
    }, {} as { [key: string]: any });

    setCalculatedGrades(gradesMap);
  };

  // Fetch calculated grades when students are loaded
  useEffect(() => {
    if (students.length > 0 && scheduleId) {
      fetchCalculatedGrades();
    }
  }, [students, scheduleId]);

  // Use API-calculated grades instead of local calculation
  // Helper function to calculate term grade based on class type (local version)
  const calculateTermGradeLocal = (termGrades: any[], classType?: string) => {
    if (!termGrades || !termGrades.length) {
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
        'recitation': 'recitation',
        'seatwork': 'seatwork',
        'assignment': 'assignment',
        'homework': 'assignment',
        'project': 'project',
        'major exam': 'major exam',
        'major': 'major exam',
        'exam': 'major exam',
        'periodical exam': 'major exam',
        'periodical': 'major exam',
        'olo': 'olo',
        'online learning activity': 'olo',
        'online course': 'online course',
        'attendance': 'attendance',
        'class participation': 'attendance',
        'participation': 'attendance'
      };

      return componentMap[lower] || lower;
    };

    // Determine "Active Items": Items where AT LEAST ONE student has a score > 0
    // This requires access to the full `grades` state, not just `termGrades` (which is for one student)
    // We will pass the full `grades` to this function or derive valid items differently.
    // Since we can't easily change the signature without breaking things, we'll try to use a heuristic:
    // We really should filter at the *source* before calling this, but `calculateStudentGrade` calls this per student.

    // BETTER APPROACH: Calculate active items ONCE at component level and pass it down, 
    // or just implement a simplified version here if we can't see other students' grades.

    // However, `termGrades` is just ONE student's grades. We cannot know if "Active Item" logic applies based on one student.
    // BUT! `calculateTermGradeLocal` is called inside `fetchCalculatedGrades` loop.
    // We should refactor `fetchCalculatedGrades` to do the filtering!

    // Let's assume for this local helper, we process what we get.
    // The filtering should happen BEFORE calling this function.

    // Get component weights based on class type
    const getComponentWeights = (classType: string) => {
      const weights: { [key: string]: { [key: string]: number } } = {
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
        'NSTP': {
          'quiz': 60,
          'major exam': 40
        },
        'OJT': {
          'online course': 50,
          'recitation': 20,
          'seatwork': 30
        },
        'CISCO': {
          'quiz': 15,
          'laboratory': 40,
          'olo': 15,
          'major exam': 30
        },
        'THESIS': {
          'thesis': 100,
          'thesis defense': 100,
          'project': 100
        }
      };

      if (weights[classType]) return weights[classType];
      if (classType.includes('CISCO')) return weights['CISCO'];
      if (classType.includes('THESIS')) return weights['THESIS'];
      if (classType.includes('LAB')) return weights['LECTURE+LAB'];

      return weights['LECTURE'];
    };

    const componentWeights = getComponentWeights(normalizedClassType);
    let totalWeightedScore = 0;
    let totalWeight = 0;

    // Group grades by component
    const componentGroups: { [key: string]: any[] } = {};
    termGrades.forEach(grade => {
      const normalizedComponent = normalizeComponentName(grade.Component);
      if (!componentGroups[normalizedComponent]) {
        componentGroups[normalizedComponent] = [];
      }
      componentGroups[normalizedComponent].push(grade);
    });

    // Calculate weighted average for each component
    Object.keys(componentGroups).forEach(component => {
      const grades = componentGroups[component];
      const weight = componentWeights[component] || 0;

      if (weight === 0 || grades.length === 0) return;

      // Calculate total score and total max score for this component
      let currentTotalScore = 0;
      let currentTotalMaxScore = 0;

      grades.forEach((grade: any) => {
        const score = parseFloat(grade.Score) || 0;
        const max = parseFloat(grade.MaxScore) || 0;

        // Only count if MaxScore > 0 to avoid division by zero errors generally
        if (max > 0) {
          currentTotalScore += score;
          currentTotalMaxScore += max;
        }
      });

      // Calculate percentage for this component
      let componentPercentage = 0;
      if (currentTotalMaxScore > 0) {
        componentPercentage = (currentTotalScore / currentTotalMaxScore) * 100;
      }

      totalWeightedScore += componentPercentage * (weight / 100);
      totalWeight += weight;
    });

    if (totalWeight === 0) {
      return null;
    }

    // Normalize the final percentage based on the total weight of recorded components
    // This ensures that if only some components are graded, the grade reflects performance on those components
    const finalPercentage = (totalWeightedScore / totalWeight) * 100;

    // Convert percentage to Filipino grade (1.0-5.0 scale)
    const filipinoGrade = convertToFilipinoGrade(finalPercentage);

    return {
      grade: filipinoGrade,
      percentage: finalPercentage,
      details: {
        componentWeights,
        componentGroups,
        totalWeightedScore,
        totalWeight,
        finalPercentage
      }
    };
  };

  // Helper function to convert percentage to Filipino grade (1.0-5.0 scale)
  const convertToFilipinoGrade = (percentage: number): number => {
    if (percentage >= 98) return 1.0;
    if (percentage >= 95) return 1.25;
    if (percentage >= 92) return 1.5;
    if (percentage >= 89) return 1.75;
    if (percentage >= 86) return 2.0;
    if (percentage >= 83) return 2.25;
    if (percentage >= 80) return 2.5;
    if (percentage >= 77) return 2.75;
    if (percentage >= 75) return 3.0;
    // Below 75% is automatically 5.0 (no 4.0 grade)
    return 5.0;
  };

  const calculateStudentGrade = (studentId: number, term: string): number | null => {
    const studentGrades = calculatedGrades[studentId];
    if (!studentGrades) return null;

    if (term === 'midterm') {
      return studentGrades.midterm !== undefined && studentGrades.midterm !== null ? studentGrades.midterm : null;
    } else if (term === 'final') {
      return studentGrades.final !== undefined && studentGrades.final !== null ? studentGrades.final : null;
    }
    return null;
  };

  const getGradeValue = (studentId: number, component: string, itemNumber: number): string => {
    const grade = grades.find(g =>
      g.StudentID === studentId &&
      g.Component === component &&
      g.ItemNumber === itemNumber &&
      g.Term === selectedTerm
    );

    if (grade && grade.Score !== null) {
      // Always display as whole number (integer)
      return Math.round(grade.Score).toString();
    }
    return '';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading grades...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Schedule not found</p>
          <Button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/instructor');
              }
            }}
            className="mt-4"
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/instructor');
              }
            }}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {schedule.SubjectCode} - {schedule.SubjectTitle}
            </h1>
            <p className="text-gray-600">
              {schedule.Course} {schedule.YearLevel}-{schedule.Section} • {schedule.ClassType}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="h-4 w-4 mr-1" />
            {students.length} Students
          </Badge>
          {unsavedChanges && (
            <Badge variant="destructive" className="px-3 py-1">
              Unsaved Changes
            </Badge>
          )}
        </div>
      </div>

      {/* Term Selection and Save Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Term:</label>
          <Select value={selectedTerm} onValueChange={(value: 'midterm' | 'final') => setSelectedTerm(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="midterm">Midterm</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={printGradingSheet}
            variant="outline"
            className="print-hide"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            onClick={saveGrades}
            disabled={!unsavedChanges}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Grades
          </Button>
        </div>
      </div>

      {/* Grades Spreadsheet Table */}
      {gradingConfig ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grading Sheet - {selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} Term
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  {/* Student Name Header Row */}
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-3 text-left font-semibold sticky left-0 bg-gray-50 z-10 min-w-[200px] border-r-2 border-r-gray-400">
                      Student Name
                    </th>
                    {gradingConfig?.components?.map((component) => (
                      Array.from({ length: component.items }, (_, index) => (
                        <th
                          key={`${component.name}-${index + 1}`}
                          className="border border-gray-300 p-2 text-center font-medium min-w-[80px]"
                        >
                          <div className="text-sm font-bold">
                            {component.name === 'Laboratory' ? 'Lab' :
                              component.name === 'Online Course' ? 'Online' :
                                component.name} {index + 1}
                          </div>
                        </th>
                      ))
                    )) || []}
                    <th className="border border-gray-300 p-3 text-center font-semibold bg-blue-50 min-w-[100px]">
                      <div className="text-sm font-bold">
                        {selectedTerm.charAt(0).toUpperCase() + selectedTerm.slice(1)} Grade
                      </div>
                    </th>
                  </tr>

                  {/* Total Items Row */}
                  <tr className="bg-blue-50 text-xs">
                    <td className="border border-gray-300 p-2 font-medium sticky left-0 bg-blue-50 z-10 border-r-2 border-r-gray-400">
                      TOTAL ITEMS
                    </td>
                    {gradingConfig?.components?.map((component) => (
                      Array.from({ length: component.items }, (_, index) => (
                        <td
                          key={`max-${component.name}-${index + 1}`}
                          className="border border-gray-300 p-1 text-center"
                        >
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={getMaxScore(component.name, index + 1)}
                            onChange={(e) => updateItemMaxScore(component.name, index + 1, Math.round(parseFloat(e.target.value) || 0))}
                            className="w-full h-6 text-center border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 text-xs font-bold"
                            title={`Edit total items for ${component.name === 'Laboratory' ? 'Lab' :
                              component.name === 'Online Course' ? 'Online Course' :
                                component.name} ${index + 1}`}
                          />
                        </td>
                      ))
                    )) || []}
                    <td className="border border-gray-300 p-2 text-center font-medium bg-blue-100">
                      -
                    </td>
                  </tr>

                </thead>
                <tbody>
                  {students.map((student, studentIndex) => {
                    const termAverage = calculateStudentGrade(student.StudentID, selectedTerm);
                    const isEvenRow = studentIndex % 2 === 0;

                    return (
                      <tr
                        key={student.StudentID}
                        className={`hover:bg-blue-50 ${isEvenRow ? 'bg-white' : 'bg-gray-25'}`}
                      >
                        <td className="border border-gray-300 p-3 font-medium sticky left-0 bg-white z-10 border-r-2 border-r-gray-400">
                          <div className="text-sm font-bold">{student.StudentName}</div>
                          <div className="text-xs text-gray-500">
                            {student.Course} {student.YearLevel}-{student.Section}
                          </div>
                        </td>
                        {gradingConfig?.components?.map((component) => (
                          Array.from({ length: component.items }, (_, index) => (
                            <td
                              key={`${student.StudentID}-${component.name}-${index + 1}`}
                              className="border border-gray-300 p-1"
                            >
                              <Input
                                type="number"
                                min="0"
                                max={getMaxScore(component.name, index + 1).toString()}
                                step="1"
                                value={getGradeValue(student.StudentID, component.name, index + 1)}
                                onChange={(e) => updateGrade(student.StudentID, component.name, index + 1, e.target.value)}
                                className="w-full h-8 text-center border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300 hover:bg-gray-50"
                                placeholder="-"
                                title={`${component.name === 'Laboratory' ? 'Lab' : component.name} ${index + 1} - Max score: ${getMaxScore(component.name, index + 1)} points`}
                              />
                            </td>
                          ))
                        )) || []}
                        <td className="border border-gray-300 p-3 text-center font-semibold bg-blue-50">
                          <div className={`text-lg font-bold ${termAverage !== null && termAverage > 3.0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {termAverage !== null ? termAverage.toFixed(2) : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


            {/* Summary Table for Midterm and Finals */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Grade Summary - Midterm & Finals
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left font-semibold sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                        Student Name
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-semibold min-w-[120px]">
                        Midterm Grade
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-semibold min-w-[120px]">
                        Final Grade
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-semibold min-w-[120px] bg-blue-50">
                        Overall Average
                      </th>
                      <th className="border border-gray-300 p-3 text-center font-semibold min-w-[100px] bg-green-50">
                        Final Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, studentIndex) => {
                      const studentGrades = calculatedGrades[student.StudentID];
                      const hasMidterm = studentGrades && studentGrades.midterm !== null && studentGrades.midterm !== undefined;
                      const hasFinal = studentGrades && studentGrades.final !== null && studentGrades.final !== undefined;

                      const midtermGrade = calculateStudentGrade(student.StudentID, 'midterm');
                      const finalGrade = calculateStudentGrade(student.StudentID, 'final');

                      // Helper function to round to nearest valid Filipino grade
                      const roundToValidGrade = (grade: number): number => {
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
                      };

                      // Calculate overall average - round to nearest valid grade
                      let overallAverage = null;
                      if (hasMidterm && hasFinal && midtermGrade !== null && finalGrade !== null) {
                        const average = (midtermGrade + finalGrade) / 2;
                        overallAverage = roundToValidGrade(average);
                      }
                      
                      const finalStatus = overallAverage !== null
                        ? (overallAverage <= 3.0 ? 'Passed' : 'Failed')
                        : 'Incomplete';
                      const isEvenRow = studentIndex % 2 === 0;

                      return (
                        <tr
                          key={`summary-${student.StudentID}`}
                          className={`hover:bg-blue-50 ${isEvenRow ? 'bg-white' : 'bg-gray-25'}`}
                        >
                          <td className="border border-gray-300 p-3 font-medium sticky left-0 bg-white z-10">
                            <div className="text-sm">{student.StudentName}</div>
                            <div className="text-xs text-gray-500">
                              {student.Course} {student.YearLevel}-{student.Section}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            <div className={`text-lg font-semibold ${midtermGrade !== null && midtermGrade > 3.0 ? 'text-red-600' : ''}`}>
                              {midtermGrade !== null ? midtermGrade.toFixed(2) : 'N/A'}
                            </div>
                            {studentGrades?.midtermPercentage != null && (
                              <div className="text-xs text-gray-600 mt-1">
                                ({studentGrades.midtermPercentage.toFixed(1)}%)
                              </div>
                            )}
                            {midtermGrade !== null && (
                              <Badge
                                variant={midtermGrade <= 3.0 ? 'default' : 'destructive'}
                                className={`text-xs mt-1 ${midtermGrade <= 3.0 ? 'bg-green-600' : ''}`}
                              >
                                {midtermGrade <= 3.0 ? 'Pass' : 'Fail'}
                              </Badge>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3 text-center">
                            <div className={`text-lg font-semibold ${finalGrade !== null && finalGrade > 3.0 ? 'text-red-600' : ''}`}>
                              {finalGrade !== null ? finalGrade.toFixed(2) : 'N/A'}
                            </div>
                            {studentGrades?.finalPercentage != null && (
                              <div className="text-xs text-gray-600 mt-1">
                                ({studentGrades.finalPercentage.toFixed(1)}%)
                              </div>
                            )}
                            {finalGrade !== null && (
                              <Badge
                                variant={finalGrade <= 3.0 ? 'default' : 'destructive'}
                                className={`text-xs mt-1 ${finalGrade <= 3.0 ? 'bg-green-600' : ''}`}
                              >
                                {finalGrade <= 3.0 ? 'Pass' : 'Fail'}
                              </Badge>
                            )}
                          </td>
                          <td className="border border-gray-300 p-3 text-center bg-blue-50">
                            <div className={`text-xl font-bold ${overallAverage !== null && overallAverage > 3.0 ? 'text-red-600' : 'text-slate-900'}`}>
                              {overallAverage !== null ? overallAverage.toFixed(2) : 'N/A'}
                            </div>
                          </td>
                          <td className="border border-gray-300 p-3 text-center bg-green-50">
                            <Badge
                              variant={
                                finalStatus === 'Passed' ? 'default' :
                                  finalStatus === 'Failed' ? 'destructive' :
                                    'secondary'
                              }
                              className={`text-sm px-3 py-1 ${finalStatus === 'Passed' ? 'bg-green-600' :
                                finalStatus === 'Failed' ? 'bg-red-600' :
                                  'bg-gray-500'
                                }`}
                            >
                              {finalStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Statistics */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-700">Class Average</div>
                  <div className="text-2xl font-bold text-blue-800">
                    {(() => {
                      const roundToValidGrade = (grade: number): number => {
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
                      };

                      const studentsWithCompleteGrades = students.filter(student => {
                        const studentGrades = calculatedGrades[student.StudentID];
                        return studentGrades &&
                          studentGrades.midterm !== null && studentGrades.midterm !== undefined &&
                          studentGrades.final !== null && studentGrades.final !== undefined;
                      });

                      if (studentsWithCompleteGrades.length === 0) return 'N/A';

                      const average = studentsWithCompleteGrades.reduce((sum, student) => {
                        const midterm = calculateStudentGrade(student.StudentID, 'midterm');
                        const final = calculateStudentGrade(student.StudentID, 'final');
                        if (midterm !== null && final !== null) {
                          const avg = (midterm + final) / 2;
                          const finalAvg = roundToValidGrade(avg);
                          return sum + finalAvg;
                        }
                        return sum;
                      }, 0) / studentsWithCompleteGrades.length;

                      return average.toFixed(2);
                    })()}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-700">Students Passed</div>
                  <div className="text-2xl font-bold text-green-800">
                    {students.filter(student => {
                      const studentGrades = calculatedGrades[student.StudentID];
                      if (!studentGrades ||
                        studentGrades.midterm === null || studentGrades.midterm === undefined ||
                        studentGrades.final === null || studentGrades.final === undefined) {
                        return false; // Don't count incomplete grades
                      }
                      const midterm = calculateStudentGrade(student.StudentID, 'midterm');
                      const final = calculateStudentGrade(student.StudentID, 'final');
                      return midterm !== null && final !== null ? ((midterm + final) / 2) <= 3.0 : false;
                    }).length} / {students.length}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-red-700">Students Failed</div>
                  <div className="text-2xl font-bold text-red-800">
                    {students.filter(student => {
                      const studentGrades = calculatedGrades[student.StudentID];
                      if (!studentGrades ||
                        studentGrades.midterm === null || studentGrades.midterm === undefined ||
                        studentGrades.final === null || studentGrades.final === undefined) {
                        return false; // Don't count incomplete grades
                      }
                      const midterm = calculateStudentGrade(student.StudentID, 'midterm');
                      const final = calculateStudentGrade(student.StudentID, 'final');
                      return midterm !== null && final !== null ? ((midterm + final) / 2) > 3.0 : false;
                    }).length} / {students.length}
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-yellow-700">Pass Rate</div>
                  <div className="text-2xl font-bold text-yellow-800">
                    {(() => {
                      const studentsWithCompleteGrades = students.filter(student => {
                        const studentGrades = calculatedGrades[student.StudentID];
                        return studentGrades &&
                          studentGrades.midterm !== null && studentGrades.midterm !== undefined &&
                          studentGrades.final !== null && studentGrades.final !== undefined;
                      });

                      if (studentsWithCompleteGrades.length === 0) return 'N/A';

                      const passedStudents = studentsWithCompleteGrades.filter(student => {
                        const midterm = calculateStudentGrade(student.StudentID, 'midterm');
                        const final = calculateStudentGrade(student.StudentID, 'final');
                        return midterm !== null && final !== null ? ((midterm + final) / 2) <= 3.0 : false;
                      });

                      return Math.round((passedStudents.length / studentsWithCompleteGrades.length) * 100) + '%';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading grading configuration...</p>
        </div>
      )}
    </div>
  );
}

export default function InstructorGrades() {
  return (
    <Suspense fallback={<div>Loading grades...</div>}>
      <InstructorGradesContent />
    </Suspense>
  );
}
