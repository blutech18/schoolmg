'use client'

import { IStudent, IUser } from '@/app/models/IUser'
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
import { SearchBar } from '@/components/ui/searchbar'
import { capitalizeString, getRoleColor } from '@/helpers/helper'
import { Trash } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import EditStudentDialog from './modal/EditStudent'
import DeleteStudentDialog from './modal/DeleteStudent'
import AddStudentDialog from './modal/AddStudent'

export default function StudentsTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const [filter, setFilter] = useState("")
  const [students, setStudents] = useState<IStudent[]>([]);

  async function fetchData(){
    try{
      const res = await fetch('/api/students');
      if(!res.ok) throw new Error("Error!")
      
      const result = await res.json();
      
      // The students API should return student data with joined user information
      setStudents(result);
    }
    catch(err){
      console.error(err);
      setStudents([]);
    }
  }

  useEffect(() => {
    fetchData();
  },[])

  const filteredUsers = students.filter(student =>
    student.FirstName.toLowerCase().includes(filter.toLowerCase()) ||
    student.LastName.toLowerCase().includes(filter.toLowerCase())
  )

  function handlePrint() {
    if (!tableRef.current) {
      alert('Table not ready for printing.');
      return;
    }

    enhancedPrint(tableRef, {
      title: 'STUDENT RECORDS',
      subtitle: 'Complete List of Registered Students',
      department: 'Academic Affairs Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Total Students': filteredUsers.length.toString(),
        'Report Date': new Date().toLocaleDateString(),
        'Status': 'All Active Students'
      }
    });
  }

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `Students_Report_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Students'
  })

  return (
    <>
      <div className='flex flex-col sm:flex-row gap-3 mb-4'>
        <SearchBar
          placeholder="Search by name..."
          value={filter}
          onChange={setFilter}
          className="w-full"
        />
        <div className='flex gap-2 flex-shrink-0'>
          <Button onClick={handlePrint} variant="outline">Print Report</Button>
          <Button onClick={onDownload} variant="outline">Export to Excel</Button>
          <AddStudentDialog onAdded={fetchData}/>
        </div>
      </div>

      <div className='overflow-hidden rounded-xl'>
        <Table className='border-lg' ref={tableRef}>
          <TableCaption className="no-print">List of registered students</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className="w-[150px]">Student No.</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Year Level</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Enrolled Date</TableHead>
              <TableHead>PWD?</TableHead>
              <TableHead className='text-center no-print'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, UserIdx) => (
              <TableRow key={UserIdx} className='even:bg-gray-50'>
                <TableCell className="font-medium">{user.StudentNumber || user.StudentID}</TableCell>
                <TableCell>{user.LastName}</TableCell>
                <TableCell>{user.FirstName}</TableCell>
                <TableCell>{user.EmailAddress}</TableCell>
                <TableCell>{user.ContactNumber || 'N/A'}</TableCell>
                <TableCell>
                  <span className={`${user.Status === 'active' ? 'bg-green-500' : 'bg-red-500'} px-2 py-1 text-sm text-white rounded-sm font-semibold`}>
                    {capitalizeString(user.Status)}
                  </span>
                </TableCell>
                <TableCell>{user.Course}</TableCell>
                <TableCell>{user.YearLevel}</TableCell>
                <TableCell>{user.Section}</TableCell>
                <TableCell>{new Date(user.DateOfEnrollment).toLocaleDateString()}</TableCell>
                <TableCell>{user.IsPWD ? "Yes" : "No"}</TableCell>
                <TableCell className='flex gap-2 no-print'>
                  <EditStudentDialog onUpdated={fetchData} student={user} />
                  <DeleteStudentDialog onDeleted={fetchData} studentId={user.UserID} studentName={`${user.FirstName} ${user.LastName}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
