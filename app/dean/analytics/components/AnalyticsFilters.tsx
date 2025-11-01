'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Filter, RefreshCw, Download } from "lucide-react"

interface AnalyticsFiltersProps {
  schoolYear: string
  semester: string
  section: string
  analyticsType: string
  onSchoolYearChange: (value: string) => void
  onSemesterChange: (value: string) => void
  onSectionChange: (value: string) => void
  onAnalyticsTypeChange: (value: string) => void
  onRefresh: () => void
  onExport: () => void
  loading?: boolean
}

export default function AnalyticsFilters({
  schoolYear,
  semester,
  section,
  analyticsType,
  onSchoolYearChange,
  onSemesterChange,
  onSectionChange,
  onAnalyticsTypeChange,
  onRefresh,
  onExport,
  loading = false
}: AnalyticsFiltersProps) {
  // Mock data - in real implementation, these would come from API
  const schoolYears = [
    { value: '2024-2025', label: '2024-2025' },
    { value: '2023-2024', label: '2023-2024' },
    { value: '2022-2023', label: '2022-2023' },
    { value: '2021-2022', label: '2021-2022' }
  ]

  const semesters = [
    { value: '1st', label: '1st Semester' },
    { value: '2nd', label: '2nd Semester' },
    { value: 'summer', label: 'Summer' }
  ]

  const sections = [
    { value: 'all', label: 'All Sections' },
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
    { value: 'D', label: 'Section D' }
  ]

  const analyticsTypes = [
    { value: 'overall', label: 'Overall Analytics' },
    { value: 'by-course', label: 'By Course' },
    { value: 'by-section', label: 'By Section' },
    { value: 'by-subject', label: 'By Subject' },
    { value: 'by-instructor', label: 'By Instructor' }
  ]

  const getActiveFiltersCount = () => {
    let count = 0
    if (schoolYear !== '2024-2025') count++
    if (semester !== '1st') count++
    if (section !== 'all') count++
    if (analyticsType !== 'overall') count++
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          {/* Analytics Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Analytics Type</label>
            <Select value={analyticsType} onValueChange={onAnalyticsTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Analytics Type" />
              </SelectTrigger>
              <SelectContent>
                {analyticsTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Quick Actions</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSchoolYearChange('2024-2025')
                  onSemesterChange('1st')
                  onSectionChange('all')
                  onAnalyticsTypeChange('overall')
                }}
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              {schoolYear !== '2024-2025' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  School Year: {schoolYear}
                </Badge>
              )}
              {semester !== '1st' && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Semester: {semester}
                </Badge>
              )}
              {section !== 'all' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Section: {section}
                </Badge>
              )}
              {analyticsType !== 'overall' && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  Type: {analyticsType}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
