'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, RefreshCw, Download } from "lucide-react"

interface FilterOptions {
  sections: string[]
  courses: string[]
  yearLevels: number[]
  schoolYears?: string[]
}

interface AnalyticsFiltersProps {
  schoolYear: string
  semester: string
  section: string
  course: string
  yearLevel: string
  analyticsType: string
  onSchoolYearChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onSectionChange: (value: string) => void
  onCourseChange: (value: string) => void
  onYearLevelChange: (value: string) => void
  onAnalyticsTypeChange: (value: string) => void
  onRefresh: () => void
  onExport: () => void
  loading?: boolean
  filterOptions?: FilterOptions
}

export default function AnalyticsFilters({
  schoolYear,
  semester,
  section,
  course,
  yearLevel,
  analyticsType,
  onSchoolYearChange,
  onSemesterChange,
  onSectionChange,
  onCourseChange,
  onYearLevelChange,
  onAnalyticsTypeChange,
  onRefresh,
  onExport,
  loading = false,
  filterOptions
}: AnalyticsFiltersProps) {
  // Dynamically generate school years based on current year
  const schoolYears = [
    { value: 'all', label: 'All School Years' },
    ...(filterOptions?.schoolYears?.map(year => ({ value: year, label: year })) || 
      (() => {
        const currentYear = new Date().getFullYear();
        const years: { value: string; label: string }[] = [];
        // Generate years from 2 years ahead to 3 years back
        for (let y = currentYear + 1; y >= currentYear - 3; y--) {
          const yearStr = `${y}-${y + 1}`;
          years.push({ value: yearStr, label: yearStr });
        }
        return years;
      })()
    )
  ];

  const semesters = [
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' }
  ]

  const sections = [
    { value: 'all', label: 'All Sections' },
    ...(filterOptions?.sections || []).map(sec => ({ value: sec, label: `Section ${sec}` }))
  ]

  const courses = [
    { value: 'all', label: 'All Courses' },
    ...(filterOptions?.courses || []).map(c => ({ value: c, label: c }))
  ]

  const yearLevels = [
    { value: 'all', label: 'All Year Levels' },
    ...(filterOptions?.yearLevels || []).map(y => ({ value: String(y), label: `Year ${y}` }))
  ]

  const analyticsTypes = [
    { value: 'overall', label: 'Overall Analytics' },
    { value: 'by-course', label: 'By Course' },
    { value: 'by-section', label: 'By Section' },
    { value: 'by-subject', label: 'By Subject' },
    { value: 'by-instructor', label: 'By Instructor' }
  ]

  // Get default school year dynamically
  const currentYear = new Date().getFullYear();
  const defaultSchoolYear = `${currentYear}-${currentYear + 1}`;

  const getActiveFiltersCount = () => {
    let count = 0
    if (schoolYear !== defaultSchoolYear && schoolYear !== 'all') count++
    if (semester !== '1st') count++
    if (section !== 'all') count++
    if (course !== 'all') count++
    if (yearLevel !== 'all') count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* School Year Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">School Year</label>
            <Select value={schoolYear} onValueChange={onSchoolYearChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select School Year" />
              </SelectTrigger>
              <SelectContent>
                {schoolYears.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Semester</label>
            <Select value={semester} onValueChange={onSemesterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((sem) => (
                  <SelectItem key={sem.value} value={sem.value}>
                    {sem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Course Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Course</label>
            <Select value={course} onValueChange={onCourseChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Level Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Year Level</label>
            <Select value={yearLevel} onValueChange={onYearLevelChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Year Level" />
              </SelectTrigger>
              <SelectContent>
                {yearLevels.map((y) => (
                  <SelectItem key={y.value} value={y.value}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Section</label>
            <Select value={section} onValueChange={onSectionChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((sec) => (
                  <SelectItem key={sec.value} value={sec.value}>
                    {sec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium text-gray-700">Quick Actions</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSchoolYearChange(defaultSchoolYear)
                  onSemesterChange('1st')
                  onCourseChange('all')
                  onYearLevelChange('all')
                  onSectionChange('all')
                  onAnalyticsTypeChange('overall')
                }}
                className="flex-1"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {schoolYear !== defaultSchoolYear && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  School Year: {schoolYear}
                </Badge>
              )}
              {semester !== '1st' && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Semester: {semester}
                </Badge>
              )}
              {course !== 'all' && (
                <Badge variant="outline" className="bg-cyan-50 text-cyan-700">
                  Course: {course}
                </Badge>
              )}
              {yearLevel !== 'all' && (
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                  Year Level: {yearLevel}
                </Badge>
              )}
              {section !== 'all' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Section: {section}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
