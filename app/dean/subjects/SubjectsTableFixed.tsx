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

interface Subject {
  SubjectID: number;
  SubjectCode: string;
  SubjectName: string;
  Units: number;
  Prerequisites?: string;
  Description?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export default function SubjectsTableFixed() {
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
    subject.Prerequisites?.toLowerCase().includes(filter.toLowerCase())
  );

  function handleScreenshot() {
    window.print()
  }

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: 'subjects_table',
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
    <>
      <div className='flex gap-3 mb-4'>
        <SearchBar
          placeholder="Search by subject code, name, or prerequisites..."
          value={filter}
          onChange={setFilter}
          className="w-full max-w-sm"
        />
        <Button onClick={handleScreenshot}>Print PDF</Button>
        <Button onClick={onDownload}>Export to Excel</Button>
        <Button className="bg-blue-900 text-white">Add Subject</Button>
      </div>

      <div className='overflow-hidden rounded-xl'>
        <Table className='border-lg' ref={tableRef}>
          <TableCaption>List of subjects and curriculum</TableCaption>
          <TableHeader>
            <TableRow className='bg-gray-100'>
              <TableHead className="w-[120px]">Subject Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead className="w-[80px]">Units</TableHead>
              <TableHead>Prerequisites</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className='text-center w-[120px]'>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {filter ? 'No subjects found matching your search.' : 'No subjects available. Add some subjects to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject, idx) => (
                <TableRow key={idx} className='even:bg-gray-50'>
                  <TableCell className="font-medium">{subject.SubjectCode}</TableCell>
                  <TableCell>{subject.SubjectName}</TableCell>
                  <TableCell className="text-center">{subject.Units}</TableCell>
                  <TableCell>{subject.Prerequisites || 'None'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={subject.Description}>
                    {subject.Description || 'No description'}
                  </TableCell>
                  <TableCell className='flex gap-2 justify-center'>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
