'use client'

import { Button } from '../../../components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import { SearchBar } from '../../../components/ui/searchbar'
import { useEffect, useRef, useState } from 'react'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { enhancedPrint, getCurrentAcademicYear, getCurrentSemester } from '@/app/lib/printUtils'
import AddSubjectDialog from './modal/AddSubject'
import EditSubjectDialog from './modal/EditSubject'
import DeleteSubjectDialog from './modal/DeleteSubject'

interface Subject {
  SubjectID: number;
  SubjectCode: string;
  SubjectName: string;
  Units: number;
  Prerequisites?: string;
  Description?: string;
  InstructorID?: number;
  InstructorName?: string;
  ClassType?: string;
  Major?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export default function SubjectsTable() {
  const tableRef = useRef<HTMLTableElement>(null)
  const [filter, setFilter] = useState("")
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData(){
    try{
      setLoading(true);
      console.log('Fetching subjects for SubjectsTable');
      const res = await fetch('/api/subjects');
      
      if(!res.ok) {
        console.error(`Subjects API failed: ${res.status} ${res.statusText}`);
        throw new Error("Failed to fetch subjects");
      }
      
      const result = await res.json();
      console.log('Subjects API response:', result);
      
      // Handle API response format
      if (result.success && Array.isArray(result.data)) {
        setSubjects(result.data);
      } else if (Array.isArray(result)) {
        setSubjects(result);
      } else {
        console.error('Invalid subjects response format:', result);
        setSubjects([]);
      }
    }
    catch(err){
      console.error('Error fetching subjects:', err);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  },[])

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const filteredSubjects = safeSubjects.filter(subject =>
    subject.SubjectCode?.toLowerCase().includes(filter.toLowerCase()) ||
    subject.SubjectName?.toLowerCase().includes(filter.toLowerCase()) ||
    subject.Prerequisites?.toLowerCase().includes(filter.toLowerCase()) ||
    subject.InstructorName?.toLowerCase().includes(filter.toLowerCase())
  );

  function handlePrint() {
    if (!tableRef.current) {
      alert('Table not ready for printing.');
      return;
    }

    enhancedPrint(tableRef, {
      title: 'SUBJECT CATALOG',
      subtitle: 'Complete List of Academic Subjects',
      department: 'Academic Affairs Office',
      academicYear: getCurrentAcademicYear(),
      semester: getCurrentSemester(),
      additionalInfo: {
        'Total Subjects': filteredSubjects.length.toString(),
        'Report Date': new Date().toLocaleDateString(),
        'Total Units': filteredSubjects.reduce((sum, s) => sum + (s.Units || 0), 0).toString()
      }
    });
  }

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: `Subject_Catalog_${new Date().toISOString().split('T')[0]}`,
    sheet: 'Subjects'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subjects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className='flex flex-wrap items-center gap-3'>
        <div className="flex-1 min-w-[300px]">
          <SearchBar
            placeholder="Search by subject code, name, prerequisites, or instructor..."
            value={filter}
            onChange={setFilter}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="whitespace-nowrap">
            Print Report
          </Button>
          <Button variant="outline" onClick={onDownload} className="whitespace-nowrap">
            Export to Excel
          </Button>
          <AddSubjectDialog onAdded={fetchData} />
        </div>
      </div>

      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        <Table ref={tableRef} className="min-w-full">
          <TableCaption className="no-print">List of subjects and curriculum</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className="w-[120px]">Subject Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead className="w-[80px]">Units</TableHead>
              <TableHead className="w-[120px]">Class Type</TableHead>
              <TableHead>Prerequisites</TableHead>
              <TableHead>Assigned Instructor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className='text-center w-[120px] no-print'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {filter ? 'No subjects found matching your search.' : 'No subjects available. Add some subjects to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject, idx) => (
                <TableRow key={idx} className='even:bg-gray-50'>
                  <TableCell className="font-medium">{subject.SubjectCode}</TableCell>
                  <TableCell>{subject.SubjectName}</TableCell>
                  <TableCell className="text-center">{subject.Units}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                       subject.ClassType === 'LECTURE+LAB' ? 'bg-blue-100 text-blue-800' :
                       subject.ClassType === 'MAJOR' ? 'bg-red-100 text-red-800' :
                       subject.ClassType === 'NSTP' ? 'bg-green-100 text-green-800' :
                       subject.ClassType === 'OJT' ? 'bg-purple-100 text-purple-800' :
                       'bg-gray-100 text-gray-800'
                     }`}>
                       {subject.ClassType === 'LECTURE+LAB' ? 'Lecture and Laboratory' :
                        subject.ClassType === 'MAJOR' ? 'Cisco' :
                        subject.ClassType === 'NSTP' ? 'NSTP' :
                        subject.ClassType === 'OJT' ? 'OJT' :
                        'Lecture'}
                     </span>
                  </TableCell>
                  <TableCell>{subject.Prerequisites || 'None'}</TableCell>
                  <TableCell>
                    {subject.InstructorName ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {subject.InstructorName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Not Assigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={subject.Description}>
                    {subject.Description || 'No description'}
                  </TableCell>
                  <TableCell className='flex gap-2 justify-center no-print'>
                    <EditSubjectDialog onUpdated={fetchData} subject={subject} />
                    <DeleteSubjectDialog onDeleted={fetchData} subjectId={subject.SubjectID} subjectName={subject.SubjectName} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
