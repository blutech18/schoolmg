'use client';

import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { SearchBar } from '../../../components/ui/searchbar';
import { useEffect, useRef, useState } from 'react';
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils';
import AddCourseDialog from './modal/AddCourse';
import EditCourseDialog from './modal/EditCourse';
import DeleteCourseDialog from './modal/DeleteCourse';

interface Course {
  CourseID: number;
  CourseCode: string;
  CourseName: string;
  Description?: string;
  TotalUnits: number;
  DurationYears: number;
  Status: 'active' | 'inactive';
  CreatedAt?: string;
  UpdatedAt?: string;
  StudentCount?: number;
}

export default function CoursesTable() {
  const tableRef = useRef<HTMLTableElement>(null);
  const [filter, setFilter] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      setLoading(true);
      console.log('Fetching courses for CoursesTable');

      // Fetch courses
      const coursesRes = await fetch('/api/courses', { credentials: 'include' });
      if (!coursesRes.ok) {
        console.error(`Courses API failed: ${coursesRes.status} ${coursesRes.statusText}`);
        throw new Error("Failed to fetch courses");
      }

      const coursesResult = await coursesRes.json();
      console.log('Courses API response:', coursesResult);

      let coursesData = Array.isArray(coursesResult) ? coursesResult : (coursesResult.data || []);

      // Fetch student counts for each course
      const coursesWithCounts = await Promise.all(
        coursesData.map(async (course: any) => {
          try {
            const countRes = await fetch(`/api/students?course=${course.CourseCode}`, { credentials: 'include' });
            const studentsData = countRes.ok ? await countRes.json() : [];
            const students = Array.isArray(studentsData) ? studentsData : (studentsData.data || []);

            return {
              ...course,
              StudentCount: students.length
            };
          } catch (err) {
            console.error(`Error fetching student count for ${course.CourseCode}:`, err);
            return {
              ...course,
              StudentCount: 0
            };
          }
        })
      );

      setCourses(coursesWithCounts);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const safeCourses = Array.isArray(courses) ? courses : [];
  const filteredCourses = safeCourses.filter(course =>
    course.CourseCode?.toLowerCase().includes(filter.toLowerCase()) ||
    course.CourseName?.toLowerCase().includes(filter.toLowerCase()) ||
    course.Description?.toLowerCase().includes(filter.toLowerCase())
  );

  function handlePrint() {
    enhancedPrint(tableRef, {
      title: 'COURSE CATALOG',
      subtitle: 'Complete List of Academic Programs',
      department: 'Academic Affairs Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Total Courses': filteredCourses.length.toString(),
        'Report Date': new Date().toLocaleDateString(),
        'Active Programs': filteredCourses.filter(c => c.Status === 'active').length.toString()
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className='flex flex-wrap items-center gap-3'>
        <div className="flex-1 min-w-[300px]">
          <SearchBar
            placeholder="Search by course code, name, or description..."
            value={filter}
            onChange={setFilter}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="whitespace-nowrap">
            Print Report
          </Button>
          <AddCourseDialog onAdded={fetchData} />
        </div>
      </div>

      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        <Table ref={tableRef} className="min-w-full">
          <TableCaption className="no-print">List of degree programs and courses</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className="w-[100px]">Course Code</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead className="w-[80px]">Units</TableHead>
              <TableHead className="w-[80px]">Duration</TableHead>
              <TableHead className="w-[100px]">Students</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[200px]">Description</TableHead>
              <TableHead className='text-center w-[120px] no-print'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  {filter ? 'No courses found matching your search.' : 'No courses available. Add some courses to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course, idx) => (
                <TableRow key={idx} className='even:bg-gray-50'>
                  <TableCell className="font-medium font-mono">{course.CourseCode}</TableCell>
                  <TableCell className="font-medium">{course.CourseName}</TableCell>
                  <TableCell className="text-center">{course.TotalUnits}</TableCell>
                  <TableCell className="text-center">{course.DurationYears} yrs</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {course.StudentCount || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${course.Status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {course.Status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={course.Description}>
                    {course.Description || 'No description available'}
                  </TableCell>
                  <TableCell className='flex gap-2 justify-center no-print'>
                    <EditCourseDialog onUpdated={fetchData} course={course} />
                    <DeleteCourseDialog onDeleted={fetchData} courseId={course.CourseID} courseName={course.CourseName} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
