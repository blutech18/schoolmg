"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, TrendingDown, AlertTriangle, Award, BarChart3, RefreshCw } from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface SectionPerformance {
  course: string;
  section: string;
  yearLevel: number;
  totalStudents: number;
  totalSubjects: number;
  averageAttendance: number;
  averageGrade: number;
  atRiskStudents: number;
}

export default function SectionPerformancePage() {
  const [sections, setSections] = useState<SectionPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'course' | 'attendance' | 'grade' | 'risk'>('course');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchSectionPerformance();
  }, []);

  const fetchSectionPerformance = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dean/sections-analytics');
      const data = await response.json();
      
      if (data.success) {
        setSections(data.data);
      } else {
        brandedToast.error('Failed to load section performance data');
      }
    } catch (error) {
      console.error('Error fetching section performance:', error);
      brandedToast.error('Failed to load section performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'course' | 'attendance' | 'grade' | 'risk') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedSections = [...sections].sort((a, b) => {
    let compareA, compareB;
    
    switch (sortBy) {
      case 'course':
        compareA = `${a.course}-${a.section}-${a.yearLevel}`;
        compareB = `${b.course}-${b.section}-${b.yearLevel}`;
        break;
      case 'attendance':
        compareA = a.averageAttendance;
        compareB = b.averageAttendance;
        break;
      case 'grade':
        compareA = a.averageGrade;
        compareB = b.averageGrade;
        break;
      case 'risk':
        compareA = a.atRiskStudents;
        compareB = b.atRiskStudents;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  const getPerformanceStatus = (grade: number) => {
    if (grade >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (grade >= 85) return { label: 'Very Good', color: 'bg-blue-100 text-blue-700' };
    if (grade >= 80) return { label: 'Good', color: 'bg-cyan-100 text-cyan-700' };
    if (grade >= 75) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Needs Improvement', color: 'bg-red-100 text-red-700' };
  };

  const getAttendanceStatus = (attendance: number) => {
    if (attendance >= 95) return { label: 'Excellent', color: 'bg-green-100 text-green-700' };
    if (attendance >= 90) return { label: 'Very Good', color: 'bg-blue-100 text-blue-700' };
    if (attendance >= 85) return { label: 'Good', color: 'bg-cyan-100 text-cyan-700' };
    if (attendance >= 75) return { label: 'Satisfactory', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Poor', color: 'bg-red-100 text-red-700' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Section Performance</h1>
            <p className="text-gray-600 mt-1">Loading section performance data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalStudents = sections.reduce((sum, s) => sum + s.totalStudents, 0);
  const totalAtRisk = sections.reduce((sum, s) => sum + s.atRiskStudents, 0);
  const avgAttendance = sections.length > 0 
    ? sections.reduce((sum, s) => sum + s.averageAttendance, 0) / sections.length 
    : 0;
  const avgGrade = sections.length > 0 
    ? sections.reduce((sum, s) => sum + s.averageGrade, 0) / sections.length 
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Section Performance</h1>
          <p className="text-gray-600 mt-1">Monitor academic performance across all sections</p>
        </div>
        <Button onClick={fetchSectionPerformance} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sections.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{totalStudents} total students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgAttendance.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all sections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalAtRisk}</div>
            <p className="text-xs text-muted-foreground mt-1">Need intervention</p>
          </CardContent>
        </Card>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <Button 
          variant={sortBy === 'course' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleSort('course')}
        >
          Section
        </Button>
        <Button 
          variant={sortBy === 'attendance' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleSort('attendance')}
        >
          Attendance
        </Button>
        <Button 
          variant={sortBy === 'grade' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleSort('grade')}
        >
          Grade
        </Button>
        <Button 
          variant={sortBy === 'risk' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleSort('risk')}
        >
          At-Risk
        </Button>
      </div>

      {/* Section Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSections.map((section, index) => {
          const gradeStatus = getPerformanceStatus(section.averageGrade);
          const attendanceStatus = getAttendanceStatus(section.averageAttendance);
          
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {section.course} - {section.section}
                    </CardTitle>
                    <p className="text-sm text-gray-600">Year {section.yearLevel}</p>
                  </div>
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Students */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Students</span>
                  <span className="font-semibold">{section.totalStudents}</span>
                </div>

                {/* Subjects */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subjects</span>
                  <span className="font-semibold">{section.totalSubjects}</span>
                </div>

                {/* Attendance */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="font-semibold">{section.averageAttendance.toFixed(1)}%</span>
                  </div>
                  <Badge className={attendanceStatus.color}>{attendanceStatus.label}</Badge>
                </div>

                {/* Grade */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Grade</span>
                    <span className="font-semibold">{section.averageGrade.toFixed(1)}%</span>
                  </div>
                  <Badge className={gradeStatus.color}>{gradeStatus.label}</Badge>
                </div>

                {/* At-Risk Students */}
                {section.atRiskStudents > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      {section.atRiskStudents} student{section.atRiskStudents > 1 ? 's' : ''} at risk
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {sections.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No section performance data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

