"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Users, BookOpen, ChevronDown, ChevronRight, RefreshCw,
    GraduationCap, Calendar, ClipboardCheck, TrendingUp, AlertTriangle
} from "lucide-react";
import { brandedToast } from "@/components/ui/branded-toast";

interface Student {
    StudentID: number;
    StudentName: string;
    StudentNumber: string;
    Course: string;
    YearLevel: number;
    Section: string;
}

interface Schedule {
    ScheduleID: number;
    SubjectCode: string;
    SubjectTitle: string;
    InstructorName: string;
    Course: string;
    YearLevel: number;
    Section: string;
}

interface SectionData {
    course: string;
    yearLevel: number;
    section: string;
    students: Student[];
    schedules: Schedule[];
}

export default function SectionOverviewPage() {
    const [sections, setSections] = useState<SectionData[]>([]);
    const [courses, setCourses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState<string>("all");
    const [selectedYear, setSelectedYear] = useState<string>("all");
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, schedulesRes] = await Promise.all([
                fetch('/api/students'),
                fetch('/api/schedules')
            ]);

            const studentsData = await studentsRes.json();
            const schedulesData = await schedulesRes.json();

            const students = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);
            const schedules = schedulesData.success ? schedulesData.data : (Array.isArray(schedulesData) ? schedulesData : []);

            // Group students and schedules by section
            const sectionMap = new Map<string, SectionData>();

            students.forEach((student: Student) => {
                const key = `${student.Course}-${student.YearLevel}-${student.Section}`;
                if (!sectionMap.has(key)) {
                    sectionMap.set(key, {
                        course: student.Course,
                        yearLevel: student.YearLevel,
                        section: student.Section,
                        students: [],
                        schedules: []
                    });
                }
                sectionMap.get(key)!.students.push(student);
            });

            // Add schedules to sections
            schedules.forEach((schedule: Schedule) => {
                const key = `${schedule.Course}-${schedule.YearLevel}-${schedule.Section}`;
                if (sectionMap.has(key)) {
                    sectionMap.get(key)!.schedules.push(schedule);
                }
            });

            const sectionArray = Array.from(sectionMap.values());
            setSections(sectionArray);

            // Extract unique courses
            const uniqueCourses = [...new Set(sectionArray.map(s => s.course))].filter(Boolean);
            setCourses(uniqueCourses);

        } catch (error) {
            console.error('Error fetching data:', error);
            brandedToast.error('Failed to load section data');
        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (key: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
        }
        setExpandedSections(newExpanded);
    };

    const filteredSections = sections.filter(section => {
        if (selectedCourse !== "all" && section.course !== selectedCourse) return false;
        if (selectedYear !== "all" && section.yearLevel !== parseInt(selectedYear)) return false;
        return true;
    });

    const totalStudents = filteredSections.reduce((sum, s) => sum + s.students.length, 0);
    const totalSubjects = new Set(filteredSections.flatMap(s => s.schedules.map(sch => sch.SubjectCode))).size;

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading section overview...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Section Overview</h1>
                    <p className="text-gray-600 mt-1">Consolidated view of sections, subjects, and student status</p>
                </div>
                <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <label className="text-sm text-gray-600 block mb-1">Course</label>
                            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Courses</SelectItem>
                                    {courses.map(course => (
                                        <SelectItem key={course} value={course}>{course}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-48">
                            <label className="text-sm text-gray-600 block mb-1">Year Level</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Years" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    <SelectItem value="1">1st Year</SelectItem>
                                    <SelectItem value="2">2nd Year</SelectItem>
                                    <SelectItem value="3">3rd Year</SelectItem>
                                    <SelectItem value="4">4th Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sections</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{filteredSections.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Subjects</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSubjects}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                        <GraduationCap className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Set(filteredSections.map(s => s.course)).size}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
                {filteredSections.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No sections found matching the selected filters</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredSections.map(section => {
                        const key = `${section.course}-${section.yearLevel}-${section.section}`;
                        const isExpanded = expandedSections.has(key);

                        return (
                            <Card key={key} className="overflow-hidden">
                                {/* Section Header - Clickable */}
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleSection(key)}
                                >
                                    <div className="flex items-center gap-4">
                                        {isExpanded ? (
                                            <ChevronDown className="h-5 w-5 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="h-5 w-5 text-gray-500" />
                                        )}
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {section.course} - {section.section}
                                            </h3>
                                            <p className="text-sm text-gray-600">Year {section.yearLevel}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className="text-lg font-semibold">{section.students.length}</div>
                                            <div className="text-xs text-gray-500">Students</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-semibold">{section.schedules.length}</div>
                                            <div className="text-xs text-gray-500">Subjects</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="border-t">
                                        <Tabs defaultValue="subjects" className="w-full">
                                            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0">
                                                <TabsTrigger
                                                    value="subjects"
                                                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                                                >
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    Subjects ({section.schedules.length})
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="students"
                                                    className="rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    Students ({section.students.length})
                                                </TabsTrigger>
                                            </TabsList>

                                            {/* Subjects Tab */}
                                            <TabsContent value="subjects" className="p-4 m-0">
                                                {section.schedules.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-4">No subjects assigned to this section</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {section.schedules.map(schedule => (
                                                            <div
                                                                key={schedule.ScheduleID}
                                                                className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                                            >
                                                                <div className="font-medium text-sm">{schedule.SubjectCode}</div>
                                                                <div className="text-xs text-gray-600 truncate">{schedule.SubjectTitle}</div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Instructor: {schedule.InstructorName || 'Not assigned'}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </TabsContent>

                                            {/* Students Tab */}
                                            <TabsContent value="students" className="p-4 m-0">
                                                {section.students.length === 0 ? (
                                                    <p className="text-gray-500 text-center py-4">No students in this section</p>
                                                ) : (
                                                    <div className="max-h-[300px] overflow-y-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-gray-50 sticky top-0">
                                                                <tr>
                                                                    <th className="text-left p-2 font-medium">Student Number</th>
                                                                    <th className="text-left p-2 font-medium">Name</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y">
                                                                {section.students.map(student => (
                                                                    <tr key={student.StudentID} className="hover:bg-gray-50">
                                                                        <td className="p-2">{student.StudentNumber}</td>
                                                                        <td className="p-2">{student.StudentName}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
