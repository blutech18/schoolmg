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

interface AttendanceRecord {
  AttendanceID: number;
  StudentID: string;
  ScheduleID: number;
  Week: number;
  DayOfWeek: number;
  Date: string;
  Status: string;
  StudentName?: string;
  StudentNumber?: string;
  SubjectCode?: string;
  SubjectName?: string;
}

interface StudentAttendanceSummary {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
  SubjectCode: string;
  SubjectName: string;
  Course: string;
  Section: string;
  TotalSessions: number;
  PresentCount: number;
  AbsentCount: number;
  ExcusedCount: number;
  LateCount: number;
  DroppedCount: number;
  FailureCount: number;
  AttendancePercentage: number;
  Status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dropped' | 'Failed';
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

export default function AttendanceTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const exportTableRef = useRef<HTMLTableElement>(null)
  const searchParams = useSearchParams()
  const scheduleId = searchParams.get('scheduleId')
  
  const [filter, setFilter] = useState("")
  const [selectedSchedule, setSelectedSchedule] = useState(scheduleId || '')
  const [showScheduleList, setShowScheduleList] = useState(!scheduleId)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentAttendanceSummary[]>([]);
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
      } else {
        console.error('AttendanceTable: Invalid schedules response format:', result);
        setSchedules([]);
      }
    }
    catch(err){
      console.error('AttendanceTable: Error fetching schedules:', err);
    }
  }

  async function fetchAttendance(){
    try{
      setLoading(true);
      console.log('Fetching attendance for AttendanceTable');

      if (!selectedSchedule) {
        setAttendance([]);
        setStudentSummaries([]);
        setLoading(false);
        return;
      }

      // Fetch attendance records
      const attendanceRes = await fetch(`/api/attendance?scheduleId=${selectedSchedule}`);
      if(!attendanceRes.ok) {
        console.error(`Attendance API failed: ${attendanceRes.status} ${attendanceRes.statusText}`);
        throw new Error("Failed to fetch attendance");
      }

      const attendanceResult = await attendanceRes.json();
      console.log('Attendance API response:', attendanceResult);

      let attendanceData: AttendanceRecord[] = [];
      if (attendanceResult.success && Array.isArray(attendanceResult.data)) {
        attendanceData = attendanceResult.data;
      } else if (Array.isArray(attendanceResult)) {
        attendanceData = attendanceResult;
      }

      setAttendance(attendanceData);

      // Fetch enrolled students for this schedule
      const enrollmentRes = await fetch(`/api/enrollments?scheduleId=${selectedSchedule}`);
      if(!enrollmentRes.ok) {
        console.error(`Enrollment API failed: ${enrollmentRes.status} ${enrollmentRes.statusText}`);
        throw new Error("Failed to fetch enrollments");
      }

      const enrollmentResult = await enrollmentRes.json();
      let enrolledStudents: any[] = [];
      if (enrollmentResult.success && Array.isArray(enrollmentResult.data)) {
        enrolledStudents = enrollmentResult.data;
      } else if (Array.isArray(enrollmentResult)) {
        enrolledStudents = enrollmentResult;
      }

      // Calculate attendance summaries for each student
      const summaries = calculateAttendanceSummaries(attendanceData, enrolledStudents);
      setStudentSummaries(summaries);

    }
    catch(err){
      console.error('Error fetching attendance:', err);
      setAttendance([]);
      setStudentSummaries([]);
    } finally {
      setLoading(false);
    }
  }

  // Function to calculate attendance summaries
  function calculateAttendanceSummaries(attendanceData: AttendanceRecord[], enrolledStudents: any[]): StudentAttendanceSummary[] {
    const summaries: StudentAttendanceSummary[] = [];

    enrolledStudents.forEach(student => {
      const studentAttendance = attendanceData.filter(record =>
        record.StudentID.toString() === student.StudentID.toString()
      );

      const presentCount = studentAttendance.filter(record => record.Status === 'P').length;
      const absentCount = studentAttendance.filter(record => record.Status === 'A').length;
      const excusedCount = studentAttendance.filter(record => record.Status === 'E').length;
      const lateCount = studentAttendance.filter(record => record.Status === 'L').length;
      const droppedCount = studentAttendance.filter(record => record.Status === 'D').length;
      const failureCount = studentAttendance.filter(record => record.Status === 'FA').length;
      const cancelledCount = studentAttendance.filter(record => record.Status === 'CC').length;
      const totalSessions = studentAttendance.length - cancelledCount; // Exclude CC from total

      // Calculate attendance percentage: Present + Excused count as "attended"
      const attendedCount = presentCount + excusedCount;
      const attendancePercentage = totalSessions > 0 ? (attendedCount / totalSessions) * 100 : 0;

      let status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dropped' | 'Failed';
      if (droppedCount > 0) status = 'Dropped';
      else if (failureCount > 0) status = 'Failed';
      else if (attendancePercentage >= 95) status = 'Excellent';
      else if (attendancePercentage >= 85) status = 'Good';
      else if (attendancePercentage >= 75) status = 'Fair';
      else status = 'Poor';

      summaries.push({
        StudentID: student.StudentID.toString(),
        StudentName: student.StudentName || `${student.FirstName} ${student.LastName}`,
        StudentNumber: student.StudentNumber || 'N/A',
        SubjectCode: student.SubjectCode || 'N/A',
        SubjectName: student.SubjectName || 'Unknown Subject',
        Course: student.Course || 'N/A',
        Section: student.Section || 'N/A',
        TotalSessions: totalSessions,
        PresentCount: presentCount,
        AbsentCount: absentCount,
        ExcusedCount: excusedCount,
        LateCount: lateCount,
        DroppedCount: droppedCount,
        FailureCount: failureCount,
        AttendancePercentage: attendancePercentage,
        Status: status
      });
    });

    return summaries.sort((a, b) => a.StudentName.localeCompare(b.StudentName));
  }

  useEffect(() => {
    fetchSchedules();
  }, [])

  useEffect(() => {
    if (selectedSchedule) {
      fetchAttendance();
    } else {
      setAttendance([]);
      setStudentSummaries([]);
      setShowScheduleList(true);
      setLoading(false);
    }
  }, [selectedSchedule])

  const filteredStudentSummaries = studentSummaries.filter(student =>
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

    // Build additional info object, only including Schedule Semester and Academic Year if they have values
    const additionalInfo: { [key: string]: string } = {
      'Total Students': filteredStudentSummaries.length.toString(),
      'Report Date': new Date().toLocaleDateString()
    };

    if (selectedScheduleInfo) {
      additionalInfo['Subject'] = `${selectedScheduleInfo.SubjectCode} - ${selectedScheduleInfo.SubjectName}`;
      additionalInfo['Course'] = selectedScheduleInfo.Course;
      additionalInfo['Section'] = selectedScheduleInfo.Section;

      // Only add Schedule Semester and Academic Year if they have actual values
      if (selectedScheduleInfo.Semester && selectedScheduleInfo.Semester.trim() && selectedScheduleInfo.Semester !== 'null') {
        additionalInfo['Schedule Semester'] = selectedScheduleInfo.Semester;
      }
      if (selectedScheduleInfo.AcademicYear && selectedScheduleInfo.AcademicYear.trim() && selectedScheduleInfo.AcademicYear !== 'null') {
        additionalInfo['Schedule Academic Year'] = selectedScheduleInfo.AcademicYear;
      }
    }

    enhancedPrint(tableRef as React.RefObject<HTMLTableElement>, {
      title: 'ATTENDANCE REPORT',
      subtitle: 'Student Attendance Summary',
      department: 'Academic Affairs Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo
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

    const headers = ['Student Name', 'Student Number', 'Subject Code', 'Subject Name', 'Course/Section', 'Total Sessions', 'Present', 'Absent', 'Excused', 'Late', 'Dropped', 'Failed', 'Attendance %', 'Status'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create body with all student summaries
    const tbody = document.createElement('tbody');
    filteredStudentSummaries.forEach(student => {
      const row = document.createElement('tr');

      const attendancePercentage = student.TotalSessions > 0 
        ? ((student.PresentCount + student.ExcusedCount + student.LateCount) / student.TotalSessions * 100).toFixed(1)
        : '0.0';

      const cells = [
        student.StudentName || 'N/A',
        student.StudentNumber || 'N/A',
        student.SubjectCode || 'N/A',
        student.SubjectName || 'N/A',
        `${student.Course || 'N/A'} - ${student.Section || 'N/A'}`,
        student.TotalSessions.toString(),
        student.PresentCount.toString(),
        student.AbsentCount.toString(),
        student.ExcusedCount.toString(),
        student.LateCount.toString(),
        student.DroppedCount.toString(),
        student.FailureCount.toString(),
        `${attendancePercentage}%`,
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
    filename: `Attendance_Summary_${selectedSchedule || 'All'}_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Attendance Summary'
  })

  function handleExport() {
    if (!selectedSchedule) {
      alert('Please select a schedule first.');
      return;
    }
    createExportTable();
    setTimeout(() => onDownload(), 100); // Small delay to ensure table is populated
  }

  const getAttendanceStatusBadge = (status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dropped' | 'Failed') => {
    switch (status) {
      case 'Excellent':
        return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      case 'Good':
        return <Badge className="bg-blue-100 text-blue-800">Good</Badge>
      case 'Fair':
        return <Badge className="bg-yellow-100 text-yellow-800">Fair</Badge>
      case 'Poor':
        return <Badge className="bg-red-100 text-red-800">Poor</Badge>
      case 'Dropped':
        return <Badge className="bg-orange-100 text-orange-800">Dropped</Badge>
      case 'Failed':
        return <Badge className="bg-red-200 text-red-900">Failed</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPercentageDisplay = (percentage: number) => {
    const color = percentage >= 95 ? 'text-green-600' :
                  percentage >= 85 ? 'text-blue-600' :
                  percentage >= 75 ? 'text-yellow-600' : 'text-red-600';
    return (
      <span className={`font-semibold ${color}`}>
        {percentage.toFixed(1)}%
      </span>
    );
  }

  const handleScheduleClick = async (schedule: Schedule) => {
    setSelectedSchedule(schedule.ScheduleID.toString());
    setShowScheduleList(false);
    // The fetchAttendance will be triggered by the useEffect when selectedSchedule changes
  };

  const handleBackToSchedules = () => {
    setSelectedSchedule('');
    setShowScheduleList(true);
    setAttendance([]);
    setStudentSummaries([]);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance...</p>
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
            placeholder="Search by student name, number, or subject..."
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
            <p className="text-gray-600">Select a schedule from the dropdown above or click on a schedule card below to view attendance records</p>
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
                        View Attendance
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
        // Display attendance for selected schedule
        <div className='overflow-hidden rounded-xl'>
          <Table className='border-lg' ref={tableRef}>
            <TableCaption className="no-print">Student Attendance Summary for selected schedule</TableCaption>
            <TableHeader>
              <TableRow className='bg-gray-100'>
                <TableHead>Student</TableHead>
                <TableHead>Student Number</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Total Sessions</TableHead>
                <TableHead>Present</TableHead>
                <TableHead>Absent</TableHead>
                <TableHead>Excused</TableHead>
                <TableHead>Late</TableHead>
                <TableHead>Dropped</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Attendance %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudentSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500">
                    {filter ? 'No students found matching your search.' : 'No students enrolled in this schedule.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudentSummaries.map((student, idx) => (
                  <TableRow key={idx} className='even:bg-gray-50'>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{student.StudentName}</div>
                      <div className="text-sm text-gray-600">{student.Course} - {student.Section}</div>
                    </TableCell>
                    <TableCell>{student.StudentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{student.SubjectCode}</div>
                        <div className="text-sm text-gray-600">{student.SubjectName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{student.TotalSessions}</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-100 text-green-800">{student.PresentCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-red-100 text-red-800">{student.AbsentCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-800">{student.ExcusedCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-100 text-yellow-800">{student.LateCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-orange-100 text-orange-800">{student.DroppedCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-red-200 text-red-900">{student.FailureCount}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {getPercentageDisplay(student.AttendancePercentage)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getAttendanceStatusBadge(student.Status)}
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
