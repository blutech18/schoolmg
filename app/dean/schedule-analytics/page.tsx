"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { toast } from "sonner";
import { formatScheduleEntry, type ScheduleDisplayData } from "@/lib/utils";

interface ScheduleAnalytics {
  scheduleId: number;
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

export default function DeanScheduleAnalyticsPage() {
  const [scheduleAnalytics, setScheduleAnalytics] = useState<ScheduleAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState("all");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("subjectName");

  useEffect(() => {
    fetchScheduleAnalytics();
  }, []);

  const fetchScheduleAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dean/schedule-analytics");
      const data = await response.json();

      if (data.success) {
        setScheduleAnalytics(data.data);
      } else {
        console.error("Failed to fetch schedule analytics:", data.error);
        toast.error("Failed to load schedule analytics");
      }
    } catch (error) {
      console.error("Error fetching schedule analytics:", error);
      toast.error("Failed to load schedule analytics");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSchedules = scheduleAnalytics
    .filter(schedule => {
      const matchesSearch = schedule.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           schedule.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           schedule.instructorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter === 'all' || schedule.course === courseFilter;
      const matchesDay = dayFilter === 'all' || schedule.day === dayFilter;
      const matchesInstructor = instructorFilter === 'all' || schedule.instructorName === instructorFilter;
      return matchesSearch && matchesCourse && matchesDay && matchesInstructor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'subjectName':
          return a.subjectName.localeCompare(b.subjectName);
        case 'subjectCode':
          return a.subjectCode.localeCompare(b.subjectCode);
        case 'course':
          return a.course.localeCompare(b.course);
        case 'day':
          return a.day.localeCompare(b.day);
        case 'totalStudents':
          return b.totalStudents - a.totalStudents;
        case 'attendanceRate':
          return b.attendanceRate - a.attendanceRate;
        case 'averageGrade':
          return b.averageGrade - a.averageGrade;
        default:
          return 0;
      }
    });

  const uniqueCourses = [...new Set(scheduleAnalytics.map(schedule => schedule.course))];
  const uniqueDays = [...new Set(scheduleAnalytics.map(schedule => schedule.day))];
  const uniqueInstructors = [...new Set(scheduleAnalytics.map(schedule => schedule.instructorName))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule Analytics</h1>
          <p className="text-gray-600 mt-1">Performance analytics by schedule</p>
        </div>
        <Button onClick={fetchScheduleAnalytics} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search and Filter Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by subject name, code, or instructor..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map(course => (
                    <SelectItem key={`course-${course}`} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {uniqueDays.map(day => (
                    <SelectItem key={`day-${day}`} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={instructorFilter} onValueChange={setInstructorFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {uniqueInstructors.map(instructor => (
                    <SelectItem key={`instructor-${instructor}`} value={instructor}>{instructor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subjectName">Subject Name</SelectItem>
                  <SelectItem value="subjectCode">Subject Code</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="totalStudents">Total Students</SelectItem>
                  <SelectItem value="attendanceRate">Attendance Rate</SelectItem>
                  <SelectItem value="averageGrade">Average Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading schedule analytics...</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedSchedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No schedules found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedSchedules.map((schedule, index) => (
            <Card key={`schedule-${schedule.scheduleId}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{schedule.subjectName} ({schedule.subjectCode})</span>
                  <Badge variant="outline">{schedule.course} - {schedule.section}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Instructor</div>
                    <div className="font-semibold">{schedule.instructorName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Schedule</div>
                    <div className="font-semibold">{schedule.room}</div>
                    <div className="text-sm text-gray-600">
                      {formatScheduleEntry({
                        Room: schedule.room ?? undefined,
                        Day: schedule.day ?? undefined,
                        Time: schedule.time ?? undefined,
                        Lecture: 0, // Not available in analytics data
                        Laboratory: 0, // Not available in analytics data
                        ClassType: 'LECTURE' // Default assumption
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Year Level</div>
                    <div className="font-semibold">{schedule.yearLevel}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{schedule.totalStudents}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{schedule.attendanceRate}%</div>
                    <div className="text-sm text-gray-600">Attendance Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{schedule.averageGrade}%</div>
                    <div className="text-sm text-gray-600">Avg Grade</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}