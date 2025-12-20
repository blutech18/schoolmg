'use client'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { SearchBar } from '@/components/ui/searchbar'

import React, { useEffect, useRef, useState } from 'react'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import AddEnrollmentDialog from './modal/AddEnrollment'
import EditEnrollmentDialog from './modal/EditEnrollment'
import DeleteEnrollmentDialog from './modal/DeleteEnrollment'

interface Enrollment {
  EnrollmentID: number;
  StudentID: string;
  ScheduleID: number;
  EnrollmentDate: string;
  Status: string;
  StudentName?: string;
  StudentNumber?: string;
  SubjectCode?: string;
  SubjectName?: string;
  Course?: string;
  Section?: string;
  Semester?: string;
  AcademicYear?: string;
}

interface GroupedStudent {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
  Course: string;
  Section: string;
  enrollments: Enrollment[];
}

export default function EnrollmentsTable() {
  const tableRef = useRef(null)
  const [filter, setFilter] = useState("")
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  async function fetchData(){
    try{
      setLoading(true);
      console.log('Fetching enrollments for EnrollmentsTable');
      const res = await fetch('/api/enrollments', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if(!res.ok) {
        console.error(`Enrollments API failed: ${res.status} ${res.statusText}`);
        throw new Error("Failed to fetch enrollments");
      }
      
      const result = await res.json();
      console.log('Enrollments API response:', result);

      // Handle API response format
      if (result.success && Array.isArray(result.data)) {
        setEnrollments(result.data);
      } else if (Array.isArray(result)) {
        setEnrollments(result);
      } else {
        console.error('Invalid enrollments response format:', result);
        setEnrollments([]);
      }
    }
    catch(err){
      console.error('Error fetching enrollments:', err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  },[])

  // Group enrollments by student
  const groupEnrollmentsByStudent = (enrollments: Enrollment[]): GroupedStudent[] => {
    const studentMap = new Map<string, GroupedStudent>();

    enrollments.forEach(enrollment => {
      const studentId = enrollment.StudentID;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          StudentID: studentId,
          StudentName: enrollment.StudentName || 'Unknown',
          StudentNumber: enrollment.StudentNumber || 'N/A',
          Course: enrollment.Course || 'N/A',
          Section: enrollment.Section || 'N/A',
          enrollments: []
        });
      }
      studentMap.get(studentId)!.enrollments.push(enrollment);
    });

    return Array.from(studentMap.values());
  };

  const safeEnrollments = Array.isArray(enrollments) ? enrollments : [];
  const filteredEnrollments = safeEnrollments.filter(enrollment =>
    enrollment.StudentName?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.StudentNumber?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.SubjectCode?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.SubjectName?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.Course?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.Section?.toLowerCase().includes(filter.toLowerCase()) ||
    enrollment.Status?.toLowerCase().includes(filter.toLowerCase())
  );

  const groupedStudents = groupEnrollmentsByStudent(filteredEnrollments);

  const toggleStudentExpansion = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  function handlePrint() {
    // Create a temporary table with all enrollment details for printing
    const printTable = document.createElement('table');
    printTable.className = 'min-w-max w-full';
    printTable.style.borderCollapse = 'collapse';
    printTable.style.width = '100%';

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#f3f4f6';

    const headers = ['Student Name', 'Student Number', 'Subject Code', 'Subject Name', 'Course/Section', 'Academic Period', 'Enrollment Date', 'Status'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      th.style.border = '1px solid #d1d5db';
      th.style.padding = '8px';
      th.style.textAlign = 'center';
      th.style.fontWeight = 'bold';
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    printTable.appendChild(thead);

    // Create body with all enrollments
    const tbody = document.createElement('tbody');
    filteredEnrollments.forEach((enrollment, index) => {
      const row = document.createElement('tr');
      if (index % 2 === 1) row.style.backgroundColor = '#f9fafb';

      const cells = [
        enrollment.StudentName || 'N/A',
        enrollment.StudentNumber || 'N/A',
        enrollment.SubjectCode || 'N/A',
        enrollment.SubjectName || 'N/A',
        `${enrollment.Course || 'N/A'} - ${enrollment.Section || 'N/A'}`,
        `${enrollment.Semester || 'N/A'} ${enrollment.AcademicYear || 'N/A'}`,
        new Date(enrollment.EnrollmentDate).toLocaleDateString(),
        enrollment.Status || 'N/A'
      ];

      cells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        td.style.border = '1px solid #d1d5db';
        td.style.padding = '6px';
        td.style.textAlign = 'center';
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    printTable.appendChild(tbody);

    // Use enhanced print with the temporary table
    enhancedPrint({ current: printTable }, {
      title: 'ENROLLMENT RECORDS',
      subtitle: 'Complete Student Enrollment Report',
      department: 'Registrar\'s Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Total Students': groupedStudents.length.toString(),
        'Total Enrollments': filteredEnrollments.length.toString(),
        'Report Date': new Date().toLocaleDateString(),
        'Active Enrollments': filteredEnrollments.filter(e => e.Status?.toLowerCase() === 'enrolled').length.toString()
      }
    });
  }

  // Create export table ref for all enrollment details
  const exportTableRef = useRef<HTMLTableElement>(null);

  // Create the export data structure
  const createExportTable = () => {
    if (!exportTableRef.current) return;

    const table = exportTableRef.current;
    table.innerHTML = ''; // Clear existing content

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['Student Name', 'Student Number', 'Subject Code', 'Subject Name', 'Course/Section', 'Academic Period', 'Enrollment Date', 'Status'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body with all enrollments
    const tbody = document.createElement('tbody');
    filteredEnrollments.forEach(enrollment => {
      const row = document.createElement('tr');

      const cells = [
        enrollment.StudentName || 'N/A',
        enrollment.StudentNumber || 'N/A',
        enrollment.SubjectCode || 'N/A',
        enrollment.SubjectName || 'N/A',
        `${enrollment.Course || 'N/A'} - ${enrollment.Section || 'N/A'}`,
        `${enrollment.Semester || 'N/A'} ${enrollment.AcademicYear || 'N/A'}`,
        new Date(enrollment.EnrollmentDate).toLocaleDateString(),
        enrollment.Status || 'N/A'
      ];

      cells.forEach(cellText => {
        const td = document.createElement('td');
        td.textContent = cellText;
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });
    table.appendChild(tbody);
  };

  const { onDownload } = useDownloadExcel({
    currentTableRef: exportTableRef.current,
    filename: `Enrollment_Records_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Enrollments'
  });

  const handleExcelExport = () => {
    createExportTable();
    setTimeout(() => onDownload(), 100); // Small delay to ensure table is populated
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'enrolled':
        return <Badge className="bg-green-100 text-green-800">Enrolled</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'dropped':
        return <Badge className="bg-red-100 text-red-800">Dropped</Badge>
      case 'withdrawn':
        return <Badge className="bg-yellow-100 text-yellow-800">Withdrawn</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading enrollments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden table for Excel export */}
      <table ref={exportTableRef} style={{ display: 'none' }}></table>

      <div className='flex flex-col sm:flex-row gap-3 mb-4'>
        <SearchBar
          placeholder="Search by student, subject, course, section, or status..."
          value={filter}
          onChange={setFilter}
          className="w-full"
        />
        <div className='flex gap-2 flex-shrink-0'>
          <Button onClick={handlePrint} variant="outline">Print Report</Button>
          <Button onClick={handleExcelExport} variant="outline">Export to Excel</Button>
          <AddEnrollmentDialog onAdded={fetchData}/>
        </div>
      </div>

      <div className='rounded-xl border border-gray-200 overflow-hidden'>
        <div className='w-full overflow-x-auto'>
          <Table className='min-w-max w-full' ref={tableRef}>
          <TableCaption className="no-print">List of student enrollments grouped by student</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className='whitespace-nowrap w-[50px] text-center'></TableHead>
              <TableHead className='whitespace-nowrap text-center'>Student</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Student Number</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Course/Section</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Total Enrollments</TableHead>
              <TableHead className='whitespace-nowrap text-center'>Active Enrollments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {filter ? 'No students found matching your search.' : 'No students available.'}
                </TableCell>
              </TableRow>
            ) : (
              groupedStudents.map((student) => {
                const isExpanded = expandedStudents.has(student.StudentID);
                const activeEnrollments = student.enrollments.filter(e => e.Status?.toLowerCase() === 'enrolled');

                return (
                  <React.Fragment key={student.StudentID}>
                    {/* Main student row */}
                    <TableRow className='even:bg-gray-50 hover:bg-gray-100 cursor-pointer' onClick={() => toggleStudentExpansion(student.StudentID)}>
                      <TableCell className="p-2 text-center">
                        <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium text-center">{student.StudentName}</TableCell>
                      <TableCell className="text-center">{student.StudentNumber}</TableCell>
                      <TableCell className="text-center">{student.Course} - {student.Section}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{student.enrollments.length}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-green-100 text-green-800">{activeEnrollments.length}</Badge>
                      </TableCell>
                    </TableRow>

                    {/* Collapsible enrollment details */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0 bg-gray-50">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3 text-gray-700">Enrollment Details for {student.StudentName}</h4>
                            <div className="space-y-2">
                              {student.enrollments.map((enrollment, idx) => (
                                <div key={`${student.StudentID}-${enrollment.EnrollmentID}-${idx}`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                      <div className="font-medium text-sm">{enrollment.SubjectCode}</div>
                                      <div className="text-xs text-gray-600">{enrollment.SubjectName}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm">{enrollment.Semester} {enrollment.AcademicYear}</div>
                                      <div className="text-xs text-gray-600">Academic Period</div>
                                    </div>
                                    <div>
                                      <div className="text-sm">{new Date(enrollment.EnrollmentDate).toLocaleDateString()}</div>
                                      <div className="text-xs text-gray-600">Enrollment Date</div>
                                    </div>
                                    <div>
                                      {getStatusBadge(enrollment.Status)}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 ml-4 no-print">
                                    <EditEnrollmentDialog onUpdated={fetchData} enrollment={enrollment} />
                                    <DeleteEnrollmentDialog
                                      onDeleted={fetchData}
                                      enrollmentId={enrollment.EnrollmentID}
                                      studentName={enrollment.StudentName || 'Unknown'}
                                      subjectCode={enrollment.SubjectCode || 'Unknown'}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
