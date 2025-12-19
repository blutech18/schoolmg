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
import { useEffect, useRef, useState } from 'react'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import AddStudentDialog from './modal/AddInstructor'
import DeleteStudentDialog from './modal/DeleteInstructor'
import EditStudentDialog from './modal/EditInstructor'
import EditInstructorDialog from './modal/EditInstructor'
import DeleteInstructorDialog from './modal/DeleteInstructor'

export default function InstructorsTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const [filter, setFilter] = useState("")
  const [students, setStudents] = useState<IStudent[]>([]);

  async function fetchData(){
    try{
      const res = await fetch('/api/users');
      if(!res.ok) throw new Error("Error!")
      
      const result = await res.json();

      setStudents(result.filter((user: IUser) => user.Role === "instructor"));
    }
    catch(err){
      console.error(err);
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
      title: 'INSTRUCTOR RECORDS',
      subtitle: 'Complete List of Faculty Members',
      department: 'Human Resources Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Total Instructors': filteredUsers.length.toString(),
        'Report Date': new Date().toLocaleDateString(),
        'Status': 'All Active Instructors'
      }
    });
  }

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `Instructors_Report_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Instructors'
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
          <TableCaption className="no-print">List of registered Instructors</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className="w-[150px]">ID no.</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>PWD?</TableHead>
              <TableHead className='text-center no-print'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user, UserIdx) => (
              <TableRow key={UserIdx} className='even:bg-gray-50'>
                <TableCell className="font-medium">{user.UserID}</TableCell>
                <TableCell>{user.FirstName}</TableCell>
                <TableCell>{user.LastName}</TableCell>
                <TableCell>{user.EmailAddress}</TableCell>
                <TableCell>
                  <span className={`${getRoleColor(user.Role)} px-2 py-1 text-sm text-white rounded-sm font-semibold`}>
                    {capitalizeString(user.Role)}
                  </span>
                </TableCell>
                <TableCell>{user.Status}</TableCell>
                <TableCell>{user.IsPWD ? "Yes" : "No"}</TableCell>
                <TableCell className='flex gap-2 no-print'>
                  <EditInstructorDialog onUpdated={fetchData} student={user} />
                  <DeleteInstructorDialog onDeleted={fetchData} instructorId={user.UserID} instructorName={`${user.FirstName} ${user.LastName}`} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
