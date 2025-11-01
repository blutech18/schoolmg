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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useRef, useState } from 'react'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, GraduationCap, FileText, ChevronDown, ChevronUp } from 'lucide-react'

interface Grade {
  GradeID: number;
  StudentID: string;
  ScheduleID: number;
  Period: string;
  ComponentType: string;
  ComponentNumber: number;
  Score?: number;
  MaxScore: number;
  StudentName?: string;
  StudentNumber?: string;
  SubjectCode?: string;
  SubjectName?: string;
  Course?: string;
  Section?: string;
}

interface StudentGradeSummary {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
  SubjectCode: string;
  SubjectName: string;
  MidtermGrade: number | null;
  FinalGrade: number | null;
  OverallGrade: number | null;
  Status: 'Passed' | 'Failed' | 'Incomplete';
}

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectName: string;
  Course: string;
  Section: string;
  YearLevel: number | null;
  Semester: string;
  AcademicYear: string;
}

export default function GradesTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const exportTableRef = useRef<HTMLTableElement>(null)
  const searchParams = useSearchParams()
  const scheduleId = searchParams.get('scheduleId')
  
  const [filter, setFilter] = useState("")
  const [selectedSchedule, setSelectedSchedule] = useState(scheduleId || '')
  const [studentGrades, setStudentGrades] = useState<StudentGradeSummary[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchSchedules(){
    try{
      const res = await fetch('/api/schedules');
      
      if(!res.ok) {
        console.error(`Schedules API failed: ${res.status} ${res.statusText}`);
        return;
      }
      
      const result = await res.json();
      
      if (result.success && Array.isArray(result.data)) {
        setSchedules(result.data);
      } else if (Array.isArray(result)) {
        setSchedules(result);
      }
    }
    catch(err){
      console.error('Error fetching schedules:', err);
    }
  }

  async function fetchStudentGrades(){
    try{
      setLoading(true);
      console.log('Fetching student grade summaries for GradesTable');
      
      if (!selectedSchedule) {
        setStudentGrades([]);
        setLoading(false);
        return;
      }
      
      // Fetch enrolled students for the schedule
      const enrollmentsRes = await fetch(`/api/enrollments?scheduleId=${selectedSchedule}`);
      if (!enrollmentsRes.ok) {
        throw new Error('Failed to fetch enrollments');
      }
      
      const enrollmentsResult = await enrollmentsRes.json();
      const enrollments = enrollmentsResult.success ? enrollmentsResult.data : enrollmentsResult;
      
      if (!Array.isArray(enrollments) || enrollments.length === 0) {
        setStudentGrades([]);
        setLoading(false);
        return;
      }
      
      // Fetch calculated grades for each student
      const studentGradeSummaries: StudentGradeSummary[] = [];
      
      for (const enrollment of enrollments) {
        try {
          console.log(`Fetching grades for student ${enrollment.StudentID}`);
          const gradesRes = await fetch(`/api/grades?role=student&userId=${enrollment.StudentID}`);
          
          if (gradesRes.ok) {
            const gradesResult = await gradesRes.json();
            console.log(`Grades API response for student ${enrollment.StudentID}:`, gradesResult);
            
            if (gradesResult.success && gradesResult.summary) {
              // Find the grade summary for this specific schedule
              const scheduleSummary = gradesResult.summary[selectedSchedule];
              
              if (scheduleSummary) {
                studentGradeSummaries.push({
                  StudentID: enrollment.StudentID,
                  StudentName: enrollment.StudentName || 'Unknown',
                  StudentNumber: enrollment.StudentNumber || 'N/A',
                  SubjectCode: scheduleSummary.SubjectCode || enrollment.SubjectCode || 'N/A',
                  SubjectName: scheduleSummary.SubjectName || enrollment.SubjectName || 'Unknown',
                  MidtermGrade: scheduleSummary.midterm,
                  FinalGrade: scheduleSummary.final,
                  OverallGrade: scheduleSummary.summary,
                  Status: scheduleSummary.summary !== null && scheduleSummary.summary <= 3.00 ? 'Passed' : 
                         scheduleSummary.summary !== null && scheduleSummary.summary > 3.00 ? 'Failed' : 'Incomplete'
                });
              } else {
                // Add student with no grades for this schedule
                studentGradeSummaries.push({
                  StudentID: enrollment.StudentID,
                  StudentName: enrollment.StudentName || 'Unknown',
                  StudentNumber: enrollment.StudentNumber || 'N/A',
                  SubjectCode: enrollment.SubjectCode || 'N/A',
                  SubjectName: enrollment.SubjectName || 'Unknown',
                  MidtermGrade: null,
                  FinalGrade: null,
                  OverallGrade: null,
                  Status: 'Incomplete'
                });
              }
            } else {
              // Add student with no grades
              studentGradeSummaries.push({
                StudentID: enrollment.StudentID,
                StudentName: enrollment.StudentName || 'Unknown',
                StudentNumber: enrollment.StudentNumber || 'N/A',
                SubjectCode: enrollment.SubjectCode || 'N/A',
                SubjectName: enrollment.SubjectName || 'Unknown',
                MidtermGrade: null,
                FinalGrade: null,
                OverallGrade: null,
                Status: 'Incomplete'
              });
            }
          } else {
            console.error(`Failed to fetch grades for student ${enrollment.StudentID}: ${gradesRes.status}`);
            // Add student with no grades if API call fails
            studentGradeSummaries.push({
              StudentID: enrollment.StudentID,
              StudentName: enrollment.StudentName || 'Unknown',
              StudentNumber: enrollment.StudentNumber || 'N/A',
              SubjectCode: enrollment.SubjectCode || 'N/A',
              SubjectName: enrollment.SubjectName || 'Unknown',
              MidtermGrade: null,
              FinalGrade: null,
              OverallGrade: null,
              Status: 'Incomplete'
            });
          }
        } catch (error) {
          console.error(`Error fetching grades for student ${enrollment.StudentID}:`, error);
          // Add student with no grades on error
          studentGradeSummaries.push({
            StudentID: enrollment.StudentID,
            StudentName: enrollment.StudentName || 'Unknown',
            StudentNumber: enrollment.StudentNumber || 'N/A',
            SubjectCode: enrollment.SubjectCode || 'N/A',
            SubjectName: enrollment.SubjectName || 'Unknown',
            MidtermGrade: null,
            FinalGrade: null,
            OverallGrade: null,
            Status: 'Incomplete'
          });
        }
      }
      
      console.log('Fetched student grade summaries:', studentGradeSummaries);
      setStudentGrades(studentGradeSummaries);
    }
    catch(err){
      console.error('Error fetching student grades:', err);
      setStudentGrades([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchedules();
  }, [])

  useEffect(() => {
    if (selectedSchedule) {
      fetchStudentGrades();
    } else {
      setStudentGrades([]);
      setLoading(false);
    }
  }, [selectedSchedule])

  const safeStudentGrades = Array.isArray(studentGrades) ? studentGrades : [];
  const filteredStudentGrades = safeStudentGrades.filter(student =>
    student.StudentName?.toLowerCase().includes(filter.toLowerCase()) ||
    student.StudentNumber?.toLowerCase().includes(filter.toLowerCase()) ||
    student.SubjectCode?.toLowerCase().includes(filter.toLowerCase()) ||
    student.Status?.toLowerCase().includes(filter.toLowerCase())
  );

  function handlePrint() {
    if (!selectedSchedule) {
      alert('Please select a schedule first.');
      return;
    }

    if (!tableRef.current) {
      alert('Table not ready for printing.');
      return;
    }

    const selectedScheduleInfo = schedules.find(s => s.ScheduleID.toString() === selectedSchedule);
    enhancedPrint(tableRef, {
      title: 'GRADE REPORT',
      subtitle: 'Student Grade Summary',
      department: 'Academic Affairs Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Subject': selectedScheduleInfo ? `${selectedScheduleInfo.SubjectCode} - ${selectedScheduleInfo.SubjectName}` : 'All Subjects',
        'Course/Section': selectedScheduleInfo ? `${selectedScheduleInfo.Course} - ${selectedScheduleInfo.Section}` : 'All Sections',
        'Total Students': filteredStudentGrades.length.toString(),
        'Report Date': new Date().toLocaleDateString()
      }
    });
  }

  // Create the export data structure
  const createExportTable = () => {
    if (!exportTableRef.current) return;

    const table = exportTableRef.current;
    table.innerHTML = ''; // Clear existing content

    // Create header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const headers = ['Student Name', 'Student Number', 'Subject Code', 'Subject Name', 'Midterm Grade', 'Final Grade', 'Overall Grade', 'Status'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body with all student grades
    const tbody = document.createElement('tbody');
    filteredStudentGrades.forEach(student => {
      const row = document.createElement('tr');

      const cells = [
        student.StudentName || 'N/A',
        student.StudentNumber || 'N/A',
        student.SubjectCode || 'N/A',
        student.SubjectName || 'N/A',
        student.MidtermGrade !== null ? student.MidtermGrade.toFixed(2) : 'Not Available',
        student.FinalGrade !== null ? student.FinalGrade.toFixed(2) : 'Not Available',
        student.OverallGrade !== null ? student.OverallGrade.toFixed(2) : 'Not Available',
        student.Status || 'N/A'
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
    filename: `Grade_Report_${selectedSchedule || 'All'}_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Grades'
  })

  function handleExport() {
    if (!selectedSchedule) {
      alert('Please select a schedule first.');
      return;
    }
    createExportTable();
    setTimeout(() => onDownload(), 100); // Small delay to ensure table is populated
  }

  function getGradeDisplay(grade?: number | null) {
    if (grade === undefined || grade === null) {
      return (
        <Badge variant="outline">Not Available</Badge>
      );
    }
    
    // Filipino grading system: 1.00-3.00 is passing, above 3.00 is failing
    const isPassing = grade <= 3.00;
    
    return (
      <Badge className={isPassing ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
        {grade.toFixed(2)}
      </Badge>
    );
  }

  const handleScheduleClick = async (schedule: Schedule) => {
    setSelectedSchedule(schedule.ScheduleID.toString());
    // The fetchStudentGrades will be triggered by the useEffect when selectedSchedule changes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading grades...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden table for Excel export */}
      <table ref={exportTableRef} style={{ display: 'none' }}></table>

      <div className='flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center justify-between'>
        <div className='flex flex-col sm:flex-row gap-3 w-full'>
          <div className="w-full">
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a schedule">
                  {selectedSchedule && (() => {
                    const selected = schedules.find(s => s.ScheduleID.toString() === selectedSchedule);
                    return selected ? (
                      <span className="truncate">
                        {selected.SubjectCode} - {selected.SubjectName || 'Subject Name Not Available'} | {selected.Course || 'N/A'} {selected.Section || 'N/A'}{selected.YearLevel ? ` - Year ${selected.YearLevel}` : ''}
                      </span>
                    ) : null;
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.ScheduleID} value={schedule.ScheduleID.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {schedule.SubjectCode} - {schedule.SubjectName || 'Subject Name Not Available'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {schedule.Course || 'N/A'} {schedule.Section || 'N/A'}
                        {schedule.YearLevel ? ` - Year ${schedule.YearLevel}` : ''}
                        {schedule.Semester && schedule.AcademicYear ? ` | ${schedule.Semester} ${schedule.AcademicYear}` : ''}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <SearchBar
            placeholder="Search by student, subject, component, or period..."
            value={filter}
            onChange={setFilter}
            className="w-full"
          />
        </div>
        
        <div className='flex gap-2 flex-shrink-0'>
          <Button onClick={handlePrint} variant="outline">Print Report</Button>
          <Button onClick={handleExport} variant="outline">Export to Excel</Button>
        </div>
      </div>

      {!selectedSchedule ? (
        // Display all schedules when no schedule is selected
        <div className="space-y-6">
          <div className="text-center py-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Schedules</h3>
            <p className="text-gray-600">Select a schedule from the dropdown above or click on a schedule card below to view grades</p>
          </div>
          
          <div className="grid gap-4">
            {schedules.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No schedules found.</p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div 
                  key={schedule.ScheduleID} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
                  onClick={() => handleScheduleClick(schedule)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {schedule.SubjectCode} - {schedule.SubjectName || 'Subject Name Not Available'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {schedule.Course || 'N/A'} {schedule.Section || 'N/A'}
                          {schedule.YearLevel ? ` - Year ${schedule.YearLevel}` : ''}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {schedule.Semester && schedule.AcademicYear ? `${schedule.Semester} ${schedule.AcademicYear}` : 'Schedule Info'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Schedule ID: {schedule.ScheduleID}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        View Grades
                      </Badge>
                      <div className="text-gray-400">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // Display grades for selected schedule
        <div className='overflow-hidden rounded-xl'>
          <Table className='border-lg' ref={tableRef}>
            <TableCaption className="no-print">Student Grade Summaries for selected schedule</TableCaption>
            <TableHeader>
              <TableRow className='bg-gray-100'>
                <TableHead>Student</TableHead>
                <TableHead>Student Number</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Midterm Grade</TableHead>
                <TableHead>Final Grade</TableHead>
                <TableHead>Overall Grade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudentGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {filter ? 'No students found matching your search.' : 'No students enrolled in this schedule.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudentGrades.map((student, idx) => (
                  <TableRow key={idx} className='even:bg-gray-50'>
                    <TableCell className="font-medium">{student.StudentName}</TableCell>
                    <TableCell>{student.StudentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.SubjectCode}</div>
                        <div className="text-sm text-gray-600">{student.SubjectName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getGradeDisplay(student.MidtermGrade)}
                    </TableCell>
                    <TableCell>
                      {getGradeDisplay(student.FinalGrade)}
                    </TableCell>
                    <TableCell>
                      {getGradeDisplay(student.OverallGrade)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          student.Status === 'Passed' ? "bg-green-100 text-green-800" :
                          student.Status === 'Failed' ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {student.Status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  )
}
