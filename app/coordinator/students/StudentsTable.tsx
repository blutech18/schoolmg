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
import { Trash, Upload, Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import { brandedToast } from '@/components/ui/branded-toast'
import EditStudentDialog from './modal/EditStudent'
import DeleteStudentDialog from './modal/DeleteStudent'
import AddStudentDialog from './modal/AddStudent'

export default function StudentsTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filter, setFilter] = useState("")
  const [students, setStudents] = useState<IStudent[]>([])
  const [isImporting, setIsImporting] = useState(false)

  async function fetchData() {
    try {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error("Error!")

      const result = await res.json();

      // The students API should return student data with joined user information
      setStudents(result);
    }
    catch (err) {
      console.error(err);
      setStudents([]);
    }
  }

  useEffect(() => {
    fetchData();
  }, [])

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

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const downloadImportTemplate = () => {
    // Use the new Excel template generator with professional formatting
    const { downloadStudentImportTemplate } = require('@/app/lib/excelTemplateUtils');
    downloadStudentImportTemplate();
    brandedToast.success('Professional Excel template downloaded! Open in Excel, fill in student data, and import.');
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      brandedToast.error('Please upload a valid CSV or Excel file')
      event.target.value = ''
      return
    }

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok) {
        brandedToast.success(`Successfully imported ${result.imported || 0} students`)
        fetchData() // Refresh the table
      } else {
        brandedToast.error(result.error || 'Failed to import students')
      }
    } catch (error) {
      console.error('Import error:', error)
      brandedToast.error('An error occurred while importing students')
    } finally {
      setIsImporting(false)
      event.target.value = '' // Reset file input
    }
  }

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
          <Button
            onClick={downloadImportTemplate}
            variant="outline"
            title="Download CSV template for importing students"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            onClick={handleImportClick}
            variant="outline"
            disabled={isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import Students'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <AddStudentDialog onAdded={fetchData} />
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
