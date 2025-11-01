"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";

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

export default function DeanSectionsAnalyticsPage() {
  const [sectionsAnalytics, setSectionsAnalytics] = useState<SectionAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [sortBy, setSortBy] = useState("course");

  useEffect(() => {
    fetchSectionsAnalytics();
  }, []);

  const fetchSectionsAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dean/sections-analytics");
      const data = await response.json();

      if (data.success) {
        setSectionsAnalytics(data.data);
      } else {
        console.error("Failed to fetch sections analytics:", data.error);
        toast.error("Failed to load sections analytics");
      }
    } catch (error) {
      console.error("Error fetching sections analytics:", error);
      toast.error("Failed to load sections analytics");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSections = sectionsAnalytics
    .filter(section => {
      const matchesSearch = section.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           section.section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter === 'all' || section.course === courseFilter;
      const matchesYear = yearFilter === 'all' || section.yearLevel.toString() === yearFilter;
      return matchesSearch && matchesCourse && matchesYear;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'course':
          return a.course.localeCompare(b.course);
        case 'section':
          return a.section.localeCompare(b.section);
        case 'yearLevel':
          return a.yearLevel - b.yearLevel;
        case 'totalStudents':
          return b.totalStudents - a.totalStudents;
        case 'averageAttendance':
          return b.averageAttendance - a.averageAttendance;
        case 'averageGrade':
          return b.averageGrade - a.averageGrade;
        case 'atRiskStudents':
          return b.atRiskStudents - a.atRiskStudents;
        default:
          return 0;
      }
    });

  const uniqueCourses = [...new Set(sectionsAnalytics.map(section => section.course))];
  const uniqueYears = [...new Set(sectionsAnalytics.map(section => section.yearLevel))].sort();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections Analytics</h1>
          <p className="text-gray-600 mt-1">Performance analytics by section</p>
        </div>
        <Button onClick={fetchSectionsAnalytics} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search and Filter Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by course or section..."
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

              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by year level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {uniqueYears.map(year => (
                    <SelectItem key={`year-${year}`} value={year.toString()}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                  <SelectItem value="yearLevel">Year Level</SelectItem>
                  <SelectItem value="totalStudents">Total Students</SelectItem>
                  <SelectItem value="averageAttendance">Average Attendance</SelectItem>
                  <SelectItem value="averageGrade">Average Grade</SelectItem>
                  <SelectItem value="atRiskStudents">At Risk Students</SelectItem>
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
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading sections analytics...</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedSections.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sections found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedSections.map((section, index) => (
            <Card key={`section-${section.course}-${section.section}-${section.yearLevel}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{section.course} - Section {section.section}</span>
                  <Badge variant="outline">Year {section.yearLevel}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{section.totalStudents}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{section.totalSubjects}</div>
                    <div className="text-sm text-gray-600">Total Subjects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{section.averageAttendance}%</div>
                    <div className="text-sm text-gray-600">Avg Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{section.averageGrade}%</div>
                    <div className="text-sm text-gray-600">Avg Grade</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${section.atRiskStudents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {section.atRiskStudents}
                    </div>
                    <div className="text-sm text-gray-600">At Risk Students</div>
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