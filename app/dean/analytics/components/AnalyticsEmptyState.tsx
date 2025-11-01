'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  AlertCircle,
  RefreshCw,
  Filter
} from "lucide-react"

interface AnalyticsEmptyStateProps {
  type?: 'no-data' | 'filtered-empty' | 'error' | 'loading-timeout'
  title?: string
  description?: string
  onRetry?: () => void
  onResetFilters?: () => void
  onRefresh?: () => void
}

export default function AnalyticsEmptyState({
  type = 'no-data',
  title,
  description,
  onRetry,
  onResetFilters,
  onRefresh
}: AnalyticsEmptyStateProps) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-data':
        return {
          icon: <BarChart3 className="h-16 w-16 text-gray-400" />,
          title: title || "No Analytics Data Available",
          description: description || "There's no analytics data to display at the moment. Data will appear once students, courses, and attendance records are added to the system.",
          actions: [
            {
              label: "Refresh Data",
              onClick: onRefresh,
              variant: "default" as const,
              icon: <RefreshCw className="h-4 w-4" />
            }
          ]
        }
      
      case 'filtered-empty':
        return {
          icon: <Filter className="h-16 w-16 text-blue-400" />,
          title: title || "No Data Found for Current Filters",
          description: description || "No analytics data matches your current filter selection. Try adjusting your filters to see more results.",
          actions: [
            {
              label: "Reset Filters",
              onClick: onResetFilters,
              variant: "default" as const,
              icon: <Filter className="h-4 w-4" />
            },
            {
              label: "Refresh Data",
              onClick: onRefresh,
              variant: "outline" as const,
              icon: <RefreshCw className="h-4 w-4" />
            }
          ]
        }
      
      case 'error':
        return {
          icon: <AlertCircle className="h-16 w-16 text-red-400" />,
          title: title || "Error Loading Analytics Data",
          description: description || "There was an error loading the analytics data. Please try again or contact support if the problem persists.",
          actions: [
            {
              label: "Try Again",
              onClick: onRetry,
              variant: "default" as const,
              icon: <RefreshCw className="h-4 w-4" />
            }
          ]
        }
      
      case 'loading-timeout':
        return {
          icon: <TrendingUp className="h-16 w-16 text-yellow-400" />,
          title: title || "Loading Taking Longer Than Expected",
          description: description || "The analytics data is taking longer to load than usual. This might be due to a large dataset or network issues.",
          actions: [
            {
              label: "Retry",
              onClick: onRetry,
              variant: "default" as const,
              icon: <RefreshCw className="h-4 w-4" />
            }
          ]
        }
      
      default:
        return {
          icon: <BarChart3 className="h-16 w-16 text-gray-400" />,
          title: "No Data Available",
          description: "There's no data to display at the moment.",
          actions: []
        }
    }
  }

  const content = getEmptyStateContent()

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            {content.icon}
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {content.title}
          </h3>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            {content.description}
          </p>
          
          {content.actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {content.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Specific empty state components for different analytics sections
export function AttendanceEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <AnalyticsEmptyState
      type="no-data"
      title="No Attendance Data"
      description="No attendance records found. Attendance data will appear once instructors start marking attendance for their classes."
      onRefresh={onRefresh}
    />
  )
}

export function GradesEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <AnalyticsEmptyState
      type="no-data"
      title="No Grades Data"
      description="No grades data found. Grades will appear once instructors start entering student grades for their subjects."
      onRefresh={onRefresh}
    />
  )
}

export function StudentsEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <AnalyticsEmptyState
      type="no-data"
      title="No Students Data"
      description="No student data found. Students will appear once they are enrolled in the system."
      onRefresh={onRefresh}
    />
  )
}

export function CoursesEmptyState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <AnalyticsEmptyState
      type="no-data"
      title="No Courses Data"
      description="No courses data found. Courses will appear once they are created in the system."
      onRefresh={onRefresh}
    />
  )
}
