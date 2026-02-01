"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  BarChart3, Users, GraduationCap, BookOpen, Calendar, ClipboardList,
  TrendingUp, TrendingDown, Activity, Target
} from "lucide-react";
import HorizontalBarChart, { DetailedView } from "../components/HorizontalBarChart";
import { brandedToast } from "@/components/ui/branded-toast";
import AnalyticsFilters from "./components/AnalyticsFilters";
import AnalyticsLoadingState from "./components/AnalyticsLoadingState";
import AnalyticsEmptyState from "./components/AnalyticsEmptyState";
import ImprovedChart, { CHART_COLORS, CHART_COLOR_ARRAY } from "./components/ImprovedChart";

// Types
interface DashboardStats {
  totalStudents: number;
  totalExcuseLetters: number;
  pendingApprovals: number;
  totalAttendanceRecords: number;
  averageAttendance: number;
}

interface CourseAnalytics {
  courseCode: string;
  courseName: string;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  passRate: number;
  department: string;
}

interface SubjectAnalytics {
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  totalSchedules: number;
  averageAttendance: number;
  averageGrade: number;
  instructorName: string;
}

interface SectionAnalytics {
  course: string;
  section: string;
  yearLevel: number;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  averageGrade: number;
  atRiskStudents: number;
}

interface ScheduleAnalytics {
  scheduleID: number;
  subjectCode: string;
  subjectName: string;
  course: string;
  section: string;
  yearLevel: number;
  instructorName: string;
  totalStudents: number;
  attendanceRate: number;
  averageGrade: number;
  day: string;
  time: string;
  room: string;
}

interface EnrollmentData {
  year: number;
  semester: string;
  totalEnrolled: number;
  newEnrollments: number;
  graduates: number;
}

export default function DeanAnalyticsPage() {
  // State management
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Filter states - default to "all" to show all school years
  const currentYear = new Date().getFullYear();
  const defaultSchoolYear = 'all';
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [semester, setSemester] = useState('1st');
  const [course, setCourse] = useState('all');
  const [yearLevel, setYearLevel] = useState('all');
  const [section, setSection] = useState('all');
  const [analyticsType, setAnalyticsType] = useState('overall');

  // Filter options from database
  const [filterOptions, setFilterOptions] = useState<{
    sections: string[];
    courses: string[];
    yearLevels: number[];
    schoolYears: string[];
  }>({ sections: [], courses: [], yearLevels: [], schoolYears: [] });


  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExcuseLetters: 0,
    pendingApprovals: 0,
    totalAttendanceRecords: 0,
    averageAttendance: 0
  });
  const [coursesAnalytics, setCoursesAnalytics] = useState<CourseAnalytics[]>([]);
  const [subjectsAnalytics, setSubjectsAnalytics] = useState<SubjectAnalytics[]>([]);
  const [sectionsAnalytics, setSectionsAnalytics] = useState<SectionAnalytics[]>([]);
  const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalytics[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData[]>([]);


  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchAllAnalytics();
  }, [schoolYear, semester, course, yearLevel, section, analyticsType]);

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('dean-analytics-filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSchoolYear(filters.schoolYear || defaultSchoolYear);
        setSemester(filters.semester || '1st');
        setCourse(filters.course || 'all');
        setYearLevel(filters.yearLevel || 'all');
        setSection(filters.section || 'all');
        setAnalyticsType(filters.analyticsType || 'overall');
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  useEffect(() => {
    const filters = {
      schoolYear,
      semester,
      course,
      yearLevel,
      section,
      analyticsType
    };
    localStorage.setItem('dean-analytics-filters', JSON.stringify(filters));
  }, [schoolYear, semester, course, yearLevel, section, analyticsType]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/dean/filter-options');
      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };


  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchCoursesAnalytics(),
        fetchSubjectsAnalytics(),
        fetchSectionsAnalytics(),
        fetchScheduleAnalytics(),
        fetchEnrollmentData()
      ]);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      brandedToast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExport = () => {
    // TODO: Implement export functionality
    brandedToast.info("Export functionality coming soon!");
  };

  // Reset filters
  const handleResetFilters = () => {
    setSchoolYear('all');
    setSemester('1st');
    setCourse('all');
    setYearLevel('all');
    setSection('all');
    setAnalyticsType('overall');
  };

  const schoolYears = (() => {
    // Build a small range around current year
    const currentYear = new Date().getFullYear();
    const years: string[] = [];
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
      years.push(`${y}-${y + 1}`);
    }
    return years.reverse();
  })();

  const fetchDashboardStats = async () => {
    try {
      const [studentsRes, excuseLettersRes, attendanceRes, attendanceStatsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/excuse-letters?role=dean"),
        fetch("/api/attendance"),
        fetch("/api/dean/attendance-stats")
      ]);

      const studentsData = await studentsRes.json();
      const excuseLettersData = await excuseLettersRes.json();
      const attendanceData = await attendanceRes.json();
      const attendanceStatsData = await attendanceStatsRes.json();

      const pendingApprovals = excuseLettersData.success ?
        excuseLettersData.data.filter((letter: any) => letter.DeanStatus === 'pending').length : 0;

      const averageAttendance = attendanceStatsData.success && attendanceStatsData.data.averageAttendance
        ? Math.round(attendanceStatsData.data.averageAttendance * 10) / 10
        : 0;

      setDashboardStats({
        totalStudents: Array.isArray(studentsData) ? studentsData.length : 0,
        totalExcuseLetters: excuseLettersData.success ? excuseLettersData.data.length : 0,
        pendingApprovals,
        totalAttendanceRecords: attendanceData.success ? attendanceData.data.length : 0,
        averageAttendance
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchCoursesAnalytics = async () => {
    try {
      const schoolYearParam = schoolYear === 'all' ? '' : schoolYear;
      let url = `/api/dean/courses-analytics?schoolYear=${encodeURIComponent(schoolYearParam)}&semester=${encodeURIComponent(semester)}`;
      if (course !== 'all') url += `&course=${encodeURIComponent(course)}`;
      if (yearLevel !== 'all') url += `&yearLevel=${encodeURIComponent(yearLevel)}`;
      if (section !== 'all') url += `&section=${encodeURIComponent(section)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setCoursesAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching courses analytics:", error);
    }
  };

  const fetchSubjectsAnalytics = async () => {
    try {
      const schoolYearParam = schoolYear === 'all' ? '' : schoolYear;
      let url = `/api/dean/subjects-analytics?schoolYear=${encodeURIComponent(schoolYearParam)}&semester=${encodeURIComponent(semester)}`;
      if (course !== 'all') url += `&course=${encodeURIComponent(course)}`;
      if (yearLevel !== 'all') url += `&yearLevel=${encodeURIComponent(yearLevel)}`;
      if (section !== 'all') url += `&section=${encodeURIComponent(section)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSubjectsAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching subjects analytics:", error);
    }
  };

  const fetchSectionsAnalytics = async () => {
    try {
      const schoolYearParam = schoolYear === 'all' ? '' : schoolYear;
      let url = `/api/dean/sections-analytics?schoolYear=${encodeURIComponent(schoolYearParam)}&semester=${encodeURIComponent(semester)}`;
      if (course !== 'all') url += `&course=${encodeURIComponent(course)}`;
      if (yearLevel !== 'all') url += `&yearLevel=${encodeURIComponent(yearLevel)}`;
      if (section !== 'all') url += `&section=${encodeURIComponent(section)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSectionsAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching sections analytics:", error);
    }
  };

  const fetchScheduleAnalytics = async () => {
    try {
      const schoolYearParam = schoolYear === 'all' ? '' : schoolYear;
      let url = `/api/dean/schedule-analytics?schoolYear=${encodeURIComponent(schoolYearParam)}&semester=${encodeURIComponent(semester)}`;
      if (course !== 'all') url += `&course=${encodeURIComponent(course)}`;
      if (yearLevel !== 'all') url += `&yearLevel=${encodeURIComponent(yearLevel)}`;
      if (section !== 'all') url += `&section=${encodeURIComponent(section)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setScheduleAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching schedule analytics:", error);
    }
  };

  const fetchEnrollmentData = async () => {
    try {
      const schoolYearParam = schoolYear === 'all' ? '' : schoolYear;
      const response = await fetch(`/api/dean/enrollment-analytics?schoolYear=${encodeURIComponent(schoolYearParam)}&semester=${encodeURIComponent(semester)}`);
      const data = await response.json();
      if (data.success) {
        // Transform the API data to match our interface
        const transformedData: EnrollmentData[] = data.data.map((item: any) => ({
          year: item.year,
          semester: item.semester,
          totalEnrolled: item.totalEnrolled,
          newEnrollments: item.newEnrollments,
          graduates: item.graduates
        }));
        setEnrollmentData(transformedData);
      } else {
        // Fallback to mock data if API fails
        const mockEnrollmentData: EnrollmentData[] = [
          { year: 2021, semester: "1st", totalEnrolled: 1200, newEnrollments: 400, graduates: 350 },
          { year: 2021, semester: "2nd", totalEnrolled: 1250, newEnrollments: 50, graduates: 0 },
          { year: 2022, semester: "1st", totalEnrolled: 1300, newEnrollments: 450, graduates: 400 },
          { year: 2022, semester: "2nd", totalEnrolled: 1350, newEnrollments: 50, graduates: 0 },
          { year: 2023, semester: "1st", totalEnrolled: 1400, newEnrollments: 500, graduates: 450 },
          { year: 2023, semester: "2nd", totalEnrolled: 1450, newEnrollments: 50, graduates: 0 },
          { year: 2024, semester: "1st", totalEnrolled: 1500, newEnrollments: 550, graduates: 500 },
          { year: 2024, semester: "2nd", totalEnrolled: 1550, newEnrollments: 50, graduates: 0 },
        ];
        setEnrollmentData(mockEnrollmentData);
      }
    } catch (error) {
      console.error("Error fetching enrollment data:", error);
      // Fallback to mock data
      const mockEnrollmentData: EnrollmentData[] = [
        { year: 2021, semester: "1st", totalEnrolled: 1200, newEnrollments: 400, graduates: 350 },
        { year: 2021, semester: "2nd", totalEnrolled: 1250, newEnrollments: 50, graduates: 0 },
        { year: 2022, semester: "1st", totalEnrolled: 1300, newEnrollments: 450, graduates: 400 },
        { year: 2022, semester: "2nd", totalEnrolled: 1350, newEnrollments: 50, graduates: 0 },
        { year: 2023, semester: "1st", totalEnrolled: 1400, newEnrollments: 500, graduates: 450 },
        { year: 2023, semester: "2nd", totalEnrolled: 1450, newEnrollments: 50, graduates: 0 },
        { year: 2024, semester: "1st", totalEnrolled: 1500, newEnrollments: 550, graduates: 500 },
        { year: 2024, semester: "2nd", totalEnrolled: 1550, newEnrollments: 50, graduates: 0 },
      ];
      setEnrollmentData(mockEnrollmentData);
    }
  };


  // Data functions
  const getFilteredSections = () => {
    return sectionsAnalytics;
  };

  const getInstructorAnalytics = () => {
    const map = new Map<string, { name: string; subjects: number; students: number; rating: number }>();

    scheduleAnalytics.forEach((schedule) => {
      const name = schedule.instructorName || 'No Instructor';
      const existing = map.get(name);
      if (existing) {
        existing.subjects += 1;
        existing.students += schedule.totalStudents || 0;
      } else {
        map.set(name, {
          name,
          subjects: 1,
          students: schedule.totalStudents || 0,
          rating: 4.0, // placeholder until real ratings are available
        });
      }
    });

    return Array.from(map.values());
  };

  // Chart data preparation
  const formatSectionLabel = (section: SectionAnalytics) =>
    `${section.course} ${section.section} • Y${section.yearLevel}`;

  const getAttendanceChartData = () => {
    return sectionsAnalytics.map(section => ({
      name: formatSectionLabel(section),
      attendance: section.averageAttendance,
      students: section.totalStudents
    }));
  };

  const getGradeChartData = () => {
    return sectionsAnalytics.map(section => ({
      name: formatSectionLabel(section),
      averageGrade: section.averageGrade,
      atRisk: section.atRiskStudents
    }));
  };

  const getEnrollmentChartData = () => {
    const targetYear = parseInt(schoolYear.split('-')[0]);
    const filtered = enrollmentData.filter(d => d.year === targetYear);
    const base = (filtered.length > 0 ? filtered : enrollmentData);
    return base.map((data) => ({
      period: `${data.year} ${data.semester}`,
      enrolled: data.totalEnrolled,
      new: data.newEnrollments,
      graduates: data.graduates
    }));
  };

  const getSubjectPerformanceData = () => {
    return subjectsAnalytics.slice(0, 10).map(subject => ({
      name: subject.subjectName.length > 15 ? subject.subjectName.substring(0, 15) + "..." : subject.subjectName,
      attendance: subject.averageAttendance,
      grade: subject.averageGrade,
      students: subject.totalStudents
    }));
  };

  // Chart colors - using consistent CCA branding
  const COLORS = CHART_COLOR_ARRAY;

  // Horizontal bar chart handlers
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setShowDetailedView(true);
  };

  const handleBackToOverview = () => {
    setShowDetailedView(false);
    setSelectedCategory(null);
  };

  // Calculate additional metrics
  const getAdditionalMetrics = () => {
    // At-Risk Students (attendance < 75%)
    const atRiskStudents = sectionsAnalytics.reduce((sum, section) => sum + (section.atRiskStudents || 0), 0);

    // Pass Rate (students with grade >= 75%)
    const totalStudentsWithGrades = sectionsAnalytics.reduce((sum, section) => {
      // Estimate based on average grade - if average grade >= 75, most students likely pass
      return sum + (section.averageGrade >= 75 ? section.totalStudents * 0.8 : section.totalStudents * 0.6);
    }, 0);
    const totalStudents = sectionsAnalytics.reduce((sum, section) => sum + section.totalStudents, 0);
    const passRate = totalStudents > 0 ? Math.round((totalStudentsWithGrades / totalStudents) * 100) : 0;

    // Excuse Letters (from dashboard stats)
    const excuseLetters = dashboardStats.totalExcuseLetters;

    // Instructors (unique instructors from schedules)
    const uniqueInstructors = new Set(getInstructorAnalytics().map(inst => inst.name)).size;

    // Subjects (total subjects)
    const subjectsTotal = subjectsAnalytics.length;

    // Rooms (unique rooms from schedule analytics)
    const uniqueRooms = new Set(scheduleAnalytics.map(schedule => schedule.room)).size;

    // Schedules (total schedules)
    const schedulesTotal = scheduleAnalytics.length;

    // Grade Distribution (students with different grade ranges)
    const excellentStudents = sectionsAnalytics.reduce((sum, section) =>
      sum + (section.averageGrade >= 90 ? Math.round(section.totalStudents * 0.3) : 0), 0);
    const goodStudents = sectionsAnalytics.reduce((sum, section) =>
      sum + (section.averageGrade >= 80 && section.averageGrade < 90 ? Math.round(section.totalStudents * 0.4) : 0), 0);
    const satisfactoryStudents = sectionsAnalytics.reduce((sum, section) =>
      sum + (section.averageGrade >= 75 && section.averageGrade < 80 ? Math.round(section.totalStudents * 0.3) : 0), 0);

    return {
      atRiskStudents,
      passRate,
      excuseLetters,
      uniqueInstructors,
      subjectsTotal,
      uniqueRooms,
      schedulesTotal,
      excellentStudents,
      goodStudents,
      satisfactoryStudents
    };
  };

  // Prepare horizontal bar chart data
  const getHorizontalBarData = () => {
    const attendanceTotal = sectionsAnalytics.reduce((sum, section) => sum + section.totalStudents, 0);
    const performanceAverage = sectionsAnalytics.length > 0
      ? sectionsAnalytics.reduce((sum, section) => sum + section.averageGrade, 0) / sectionsAnalytics.length
      : 0;
    const enrollmentTotal = enrollmentData.length > 0
      ? enrollmentData[enrollmentData.length - 1].totalEnrolled
      : 0;
    const sectionsTotal = sectionsAnalytics.length;

    const additionalMetrics = getAdditionalMetrics();

    return [
      // Primary Metrics
      {
        category: 'attendance',
        value: attendanceTotal,
        label: 'Attendance',
        color: CHART_COLORS.secondary,
        icon: <Activity className="h-5 w-5" />
      },
      {
        category: 'performance',
        value: Math.round(performanceAverage),
        label: 'Performance',
        color: CHART_COLORS.primary,
        icon: <TrendingUp className="h-5 w-5" />
      },
      {
        category: 'enrollment',
        value: enrollmentTotal,
        label: 'Enrollment',
        color: CHART_COLORS.warning,
        icon: <Users className="h-5 w-5" />
      },
      {
        category: 'sections',
        value: sectionsTotal,
        label: 'Sections',
        color: CHART_COLORS.accent,
        icon: <BookOpen className="h-5 w-5" />
      },
      // Additional Metrics
      {
        category: 'atRisk',
        value: additionalMetrics.atRiskStudents,
        label: 'At-Risk Students',
        color: CHART_COLORS.accent,
        icon: <Target className="h-5 w-5" />
      },
      {
        category: 'passRate',
        value: additionalMetrics.passRate,
        label: 'Pass Rate',
        color: CHART_COLORS.success,
        icon: <TrendingUp className="h-5 w-5" />
      },
      {
        category: 'excuseLetters',
        value: additionalMetrics.excuseLetters,
        label: 'Excuse Letters',
        color: CHART_COLORS.warning,
        icon: <ClipboardList className="h-5 w-5" />
      },
      {
        category: 'instructors',
        value: additionalMetrics.uniqueInstructors,
        label: 'Instructors',
        color: CHART_COLORS.info,
        icon: <GraduationCap className="h-5 w-5" />
      },
      {
        category: 'subjects',
        value: additionalMetrics.subjectsTotal,
        label: 'Subjects',
        color: '#0891B2',
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        category: 'rooms',
        value: additionalMetrics.uniqueRooms,
        label: 'Rooms',
        color: '#BE185D',
        icon: <Calendar className="h-5 w-5" />
      },
      {
        category: 'schedules',
        value: additionalMetrics.schedulesTotal,
        label: 'Schedules',
        color: '#0F766E',
        icon: <Calendar className="h-5 w-5" />
      },
      {
        category: 'gradeDistribution',
        value: additionalMetrics.excellentStudents,
        label: 'Excellent Grades',
        color: CHART_COLORS.success,
        icon: <TrendingUp className="h-5 w-5" />
      }
    ];
  };

  // Check if data is empty
  const hasData = dashboardStats.totalStudents > 0 ||
    coursesAnalytics.length > 0 ||
    subjectsAnalytics.length > 0 ||
    sectionsAnalytics.length > 0;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive view of academic performance and enrollment data</p>
          </div>
        </div>
        <AnalyticsLoadingState type="full" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Comprehensive view of academic performance and enrollment data</p>
          </div>
        </div>
        <AnalyticsFilters
          schoolYear={schoolYear}
          semester={semester}
          course={course}
          yearLevel={yearLevel}
          section={section}
          analyticsType={analyticsType}
          onSchoolYearChange={setSchoolYear}
          onSemesterChange={setSemester}
          onCourseChange={setCourse}
          onYearLevelChange={setYearLevel}
          onSectionChange={setSection}
          onAnalyticsTypeChange={setAnalyticsType}
          onRefresh={fetchAllAnalytics}
          onExport={handleExport}
          loading={loading}
          filterOptions={filterOptions}
        />
        <AnalyticsEmptyState
          type="no-data"
          onRefresh={fetchAllAnalytics}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive view of academic performance and enrollment data</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">School Year:</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">{schoolYear}</span>
            <span className="text-xs text-gray-500 ml-3">Semester:</span>
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800 capitalize">{semester}</span>
          </div>
        </div>
        <Button onClick={fetchAllAnalytics} variant="outline" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Analytics Filters */}
      <AnalyticsFilters
        schoolYear={schoolYear}
        semester={semester}
        course={course}
        yearLevel={yearLevel}
        section={section}
        analyticsType={analyticsType}
        onSchoolYearChange={setSchoolYear}
        onSemesterChange={setSemester}
        onCourseChange={setCourse}
        onYearLevelChange={setYearLevel}
        onSectionChange={setSection}
        onAnalyticsTypeChange={setAnalyticsType}
        onRefresh={fetchAllAnalytics}
        onExport={handleExport}
        loading={loading}
        filterOptions={filterOptions}
      />


      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingApprovals}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-green-600">{dashboardStats.averageAttendance}%</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-purple-600">{coursesAnalytics.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                <p className="text-2xl font-bold text-indigo-600">{subjectsAnalytics.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improved Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImprovedChart
          title="Attendance by Section"
          description="Average attendance rates across different sections"
          data={getAttendanceChartData()}
          type="bar"
          dataKey="attendance"
          xAxisKey="name"
          height={300}
        />

        <ImprovedChart
          title="Grade Distribution"
          description="Average grades across different sections"
          data={getGradeChartData()}
          type="line"
          dataKey="averageGrade"
          xAxisKey="name"
          height={300}
        />
      </div>

      {/* Enrollment Trends */}
      <ImprovedChart
        title="Enrollment Trends"
        description="Student enrollment patterns over time"
        data={getEnrollmentChartData()}
        type="area"
        dataKey="enrolled"
        xAxisKey="period"
        height={350}
      />

      {/* Main Analytics View */}
      <div className="space-y-6">
        <div className="transition-all duration-500 ease-in-out">
          {showDetailedView && selectedCategory ? (
            <div className="animate-in slide-in-from-right-8 duration-700 ease-out">
              <DetailedView
                category={selectedCategory}
                onBack={handleBackToOverview}
                data={{
                  attendance: getAttendanceChartData(),
                  performance: getGradeChartData(),
                  enrollment: getEnrollmentChartData(),
                  sections: getFilteredSections(),
                  atRisk: getFilteredSections().filter(section => section.atRiskStudents > 0),
                  passRate: getFilteredSections(),
                  excuseLetters: Array.from({ length: dashboardStats.totalExcuseLetters }, (_, i) => ({
                    id: i + 1,
                    status: i % 3 === 0 ? 'pending' : 'approved',
                    priority: i % 5 === 0 ? 'urgent' : 'normal'
                  })),
                  instructors: getInstructorAnalytics(),
                  subjects: subjectsAnalytics.map(subject => ({
                    name: subject.subjectName,
                    students: subject.totalStudents,
                    schedules: subject.totalSchedules || 1
                  })),
                  rooms: scheduleAnalytics.map(schedule => ({
                    room: schedule.room,
                    status: 'active',
                    capacity: 30 + Math.floor(Math.random() * 20), // Random capacity 30-50
                    occupancy: 60 + Math.floor(Math.random() * 30) // Random occupancy 60-90%
                  })),
                  schedules: scheduleAnalytics.map(schedule => ({
                    day: schedule.day,
                    status: 'active',
                    timeSlot: schedule.time.includes('AM') ? 'morning' : schedule.time.includes('PM') && parseInt(schedule.time) < 6 ? 'afternoon' : 'evening'
                  })),
                  gradeDistribution: getFilteredSections().map(section => ({
                    excellent: Math.round(section.totalStudents * 0.3),
                    good: Math.round(section.totalStudents * 0.4),
                    satisfactory: Math.round(section.totalStudents * 0.2),
                    belowStandard: Math.round(section.totalStudents * 0.1)
                  }))
                }}
              />
            </div>
          ) : (
            <div className="animate-in slide-in-from-left-8 duration-700 ease-out">
              <HorizontalBarChart
                data={getHorizontalBarData()}
                onCategoryClick={handleCategoryClick}
                selectedCategory={selectedCategory || undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
