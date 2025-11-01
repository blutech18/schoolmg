"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/searchbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

interface SubjectAnalytics {
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  totalSchedules: number;
  averageAttendance: number;
  averageGrade: number;
  instructorName: string;
}

export default function DeanSubjectsAnalyticsPage() {
  const [subjectsAnalytics, setSubjectsAnalytics] = useState<SubjectAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [instructorFilter, setInstructorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("subjectName");

  useEffect(() => {
    fetchSubjectsAnalytics();
  }, []);

  const fetchSubjectsAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dean/subjects-analytics");
      const data = await response.json();

      if (data.success) {
        setSubjectsAnalytics(data.data);
      } else {
        console.error("Failed to fetch subjects analytics:", data.error);
        toast.error("Failed to load subjects analytics");
      }
    } catch (error) {
      console.error("Error fetching subjects analytics:", error);
      toast.error("Failed to load subjects analytics");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSubjects = subjectsAnalytics
    .filter(subject => {
      const matchesSearch = subject.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInstructor = instructorFilter === 'all' || subject.instructorName === instructorFilter;
      return matchesSearch && matchesInstructor;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'subjectName':
          return a.subjectName.localeCompare(b.subjectName);
        case 'subjectCode':
          return a.subjectCode.localeCompare(b.subjectCode);
        case 'totalStudents':
          return b.totalStudents - a.totalStudents;
        case 'averageAttendance':
          return b.averageAttendance - a.averageAttendance;
        case 'averageGrade':
          return b.averageGrade - a.averageGrade;
        default:
          return 0;
      }
    });

  const uniqueInstructors = [...new Set(subjectsAnalytics.map(subject => subject.instructorName))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects Analytics</h1>
          <p className="text-gray-600 mt-1">Performance analytics by subject</p>
        </div>
        <Button onClick={fetchSubjectsAnalytics} disabled={loading}>
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Search and Filter Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <SearchBar
                placeholder="Search by subject name or code..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
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
                  <SelectItem value="totalStudents">Total Students</SelectItem>
                  <SelectItem value="averageAttendance">Average Attendance</SelectItem>
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
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading subjects analytics...</p>
            </CardContent>
          </Card>
        ) : filteredAndSortedSubjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No subjects found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedSubjects.map((subject, index) => (
            <Card key={`subject-${subject.subjectCode}-${index}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{subject.subjectName} ({subject.subjectCode})</span>
                  <Badge variant="outline">{subject.instructorName}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{subject.totalStudents}</div>
                    <div className="text-sm text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{subject.totalSchedules}</div>
                    <div className="text-sm text-gray-600">Total Schedules</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{subject.averageAttendance}%</div>
                    <div className="text-sm text-gray-600">Avg Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{subject.averageGrade}%</div>
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