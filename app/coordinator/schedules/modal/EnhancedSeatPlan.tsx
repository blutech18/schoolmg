'use client'
import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FlaskConical } from "lucide-react"

interface EnhancedSeatPlanProps {
  numberOfSeats: number
  cols: number
  studentSeatMap?: string | (string | number)[]
  scheduleId: number
  classType?: string
  lectureSeatMap?: string
  laboratorySeatMap?: string
  lectureSeatCols?: number
  laboratorySeatCols?: number
  lecture?: number
  laboratory?: number
}

interface EnrolledStudent {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
}

export default function EnhancedSeatPlan({ 
  numberOfSeats, 
  cols, 
  studentSeatMap = "", 
  scheduleId,
  classType = 'LECTURE',
  lectureSeatMap,
  laboratorySeatMap,
  lectureSeatCols,
  laboratorySeatCols,
  lecture = 0,
  laboratory = 0
}: EnhancedSeatPlanProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [lectureSeatAssignments, setLectureSeatAssignments] = useState<(string | number)[]>([]);
  const [laboratorySeatAssignments, setLaboratorySeatAssignments] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);
  
  const totalSeats = numberOfSeats
  // For NSTP and OJT, they should only have lecture seat plans (no lab)
  const isSpecialClassType = classType === 'NSTP' || classType === 'OJT'
  const hasLecture = lecture > 0
  // NSTP and OJT should not show lab seat plan even if laboratory > 0
  const hasLaboratory = !isSpecialClassType && laboratory > 0
  const hasBothComponents = hasLecture && hasLaboratory

  // Fetch enrolled students when component mounts
  useEffect(() => {
    async function fetchEnrolledStudents() {
      try {
        setLoading(true);
        const res = await fetch(`/api/enrollments?scheduleId=${scheduleId}`);
        if (res.ok) {
          const result = await res.json();
          const students = result.success ? result.data : result;
          setEnrolledStudents(Array.isArray(students) ? students : []);
        }
      } catch (error) {
        console.error('Error fetching enrolled students:', error);
      } finally {
        setLoading(false);
      }
    }

    if (scheduleId) {
      fetchEnrolledStudents();
    }
  }, [scheduleId]);

  // Initialize seat assignments from seat maps
  useEffect(() => {
    // Initialize Lecture seat assignments
    let lectureMap: (string | number)[] = [];
    try {
      if (lectureSeatMap && lectureSeatMap.trim() !== '') {
        const parsed = JSON.parse(lectureSeatMap);
        if (Array.isArray(parsed)) {
          lectureMap = parsed;
        } else {
          lectureMap = Array(totalSeats).fill(0);
        }
      } else {
        lectureMap = Array(totalSeats).fill(0);
      }
    } catch (error) {
      console.error("Invalid lecture seat map:", lectureSeatMap, error);
      lectureMap = Array(totalSeats).fill(0);
    }
    
    if (lectureMap.length !== totalSeats) {
      lectureMap = Array(totalSeats).fill(0);
    }
    setLectureSeatAssignments(lectureMap);

    // Initialize Laboratory seat assignments
    let laboratoryMap: (string | number)[] = [];
    try {
      if (laboratorySeatMap && laboratorySeatMap.trim() !== '') {
        const parsed = JSON.parse(laboratorySeatMap);
        if (Array.isArray(parsed)) {
          laboratoryMap = parsed;
        } else {
          laboratoryMap = Array(totalSeats).fill(0);
        }
      } else {
        laboratoryMap = Array(totalSeats).fill(0);
      }
    } catch (error) {
      console.error("Invalid laboratory seat map:", laboratorySeatMap, error);
      laboratoryMap = Array(totalSeats).fill(0);
    }
    
    if (laboratoryMap.length !== totalSeats) {
      laboratoryMap = Array(totalSeats).fill(0);
    }
    setLaboratorySeatAssignments(laboratoryMap);
  }, [lectureSeatMap, laboratorySeatMap, totalSeats]);

  const handleSeatClick = (seatIndex: number, seatType: 'lecture' | 'laboratory') => {
    const currentAssignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
    const setAssignments = seatType === 'lecture' ? setLectureSeatAssignments : setLaboratorySeatAssignments
    const currentAssignment = currentAssignments[seatIndex];
    
    if (currentAssignment && currentAssignment !== 0) {
      // Seat is occupied, unassign student
      const newAssignments = [...currentAssignments];
      newAssignments[seatIndex] = 0;
      setAssignments(newAssignments);
    } else {
      // Seat is empty, show available students to assign
      const assignedStudentIds = currentAssignments.filter(id => id !== 0);
      const availableStudents = enrolledStudents.filter(student => 
        !assignedStudentIds.includes(student.StudentID)
      );
      
      if (availableStudents.length > 0) {
        // For simplicity, assign the first available student
        const newAssignments = [...currentAssignments];
        newAssignments[seatIndex] = availableStudents[0].StudentID;
        setAssignments(newAssignments);
      }
    }
  };

  const getStudentName = (studentId: string | number) => {
    const student = enrolledStudents.find(s => s.StudentID === studentId.toString());
    return student ? student.StudentName : `Student ${studentId}`;
  };

  const saveSeatArrangement = async (seatType: 'lecture' | 'laboratory') => {
    try {
      setLoading(true);
      
      const assignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
      const seatCols = seatType === 'lecture' ? (lectureSeatCols || 1) : (laboratorySeatCols || cols)
      
      const res = await fetch(`/api/schedules/seat-map?id=${scheduleId}&type=${seatType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SeatMap: JSON.stringify(assignments),
          SeatCols: seatCols
        })
      });
      
      if (res.ok) {
        alert(`${seatType.charAt(0).toUpperCase() + seatType.slice(1)} seat arrangement saved successfully!`);
      } else {
        throw new Error('Failed to save seat arrangement');
      }
    } catch (error) {
      console.error('Error saving seat arrangement:', error);
      alert('Failed to save seat arrangement');
    } finally {
      setLoading(false);
    }
  };

  const renderSeatGrid = (seatType: 'lecture' | 'laboratory') => {
    const assignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
    const seatCols = seatType === 'lecture' ? (lectureSeatCols || 1) : (laboratorySeatCols || cols)
    const assignedCount = assignments.filter(id => id !== 0).length

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Assigned: {assignedCount} / {enrolledStudents.length} students
        </div>
        
        {totalSeats > 0 && seatCols > 0 ? (
          Array.from({ length: seatCols === 1 ? Math.ceil(totalSeats / 1) : seatCols === 2 ? Math.ceil(totalSeats / 8) : Math.ceil(totalSeats / (seatCols * 2)) }, (_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-12">
              {seatCols === 1 ? (
                // Single column layout for Lecture (as requested)
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 1 }, (_, seatIndex) => {
                    const actualSeatIndex = rowIndex * 1 + seatIndex
                    const seatNumber = actualSeatIndex + 1
                    
                    if (actualSeatIndex >= totalSeats) return null
                    
                    return (
                      <div
                        key={seatIndex}
                        onClick={() => handleSeatClick(actualSeatIndex, seatType)}
                        className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                          assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        }`}
                        title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentName(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                      >
                        {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                          <div className="text-center">
                            <div className="font-bold">{seatNumber}</div>
                            <div className="text-xs truncate w-10">{getStudentName(assignments[actualSeatIndex]).split(' ')[0]}</div>
                          </div>
                        ) : (
                          seatNumber
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : seatCols === 2 ? (
                // Special case for 2 columns: 8 seats per row (4 on each side) with wide aisle
                <>
                  {/* Left side: 4 seats */}
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }, (_, seatIndex) => {
                      const actualSeatIndex = rowIndex * 8 + seatIndex
                      const seatNumber = actualSeatIndex + 1
                      
                      if (actualSeatIndex >= totalSeats) return null
                      
                      return (
                        <div
                          key={seatIndex}
                          onClick={() => handleSeatClick(actualSeatIndex, seatType)}
                          className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                            assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentName(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                        >
                          {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                            <div className="text-center">
                              <div className="font-bold">{seatNumber}</div>
                              <div className="text-xs truncate w-10">{getStudentName(assignments[actualSeatIndex]).split(' ')[0]}</div>
                            </div>
                          ) : (
                            seatNumber
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Wide aisle space */}
                  <div className="w-12"></div>
                  
                  {/* Right side: 4 seats */}
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }, (_, seatIndex) => {
                      const actualSeatIndex = rowIndex * 8 + seatIndex + 4
                      const seatNumber = actualSeatIndex + 1
                      
                      if (actualSeatIndex >= totalSeats) return null
                      
                      return (
                        <div
                          key={seatIndex}
                          onClick={() => handleSeatClick(actualSeatIndex, seatType)}
                          className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                            assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentName(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                        >
                          {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                            <div className="text-center">
                              <div className="font-bold">{seatNumber}</div>
                              <div className="text-xs truncate w-10">{getStudentName(assignments[actualSeatIndex]).split(' ')[0]}</div>
                            </div>
                          ) : (
                            seatNumber
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                // Normal case for multiple columns: 2 seats per column
                Array.from({ length: seatCols }, (_, colIndex) => {
                  const seat1Index = rowIndex * (seatCols * 2) + colIndex * 2
                  const seat2Index = seat1Index + 1
                  const seat1Number = seat1Index + 1
                  const seat2Number = seat2Index + 1
                  
                  return (
                    <div key={colIndex} className="flex gap-2">
                      {/* First seat in column */}
                      {seat1Index < totalSeats && (
                        <div
                          onClick={() => handleSeatClick(seat1Index, seatType)}
                          className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                            assignments[seat1Index] && assignments[seat1Index] !== 0
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={assignments[seat1Index] && assignments[seat1Index] !== 0 ? `${getStudentName(assignments[seat1Index])} - Click to unassign` : `Seat ${seat1Number} - Click to assign student`}
                        >
                          {assignments[seat1Index] && assignments[seat1Index] !== 0 ? (
                            <div className="text-center">
                              <div className="font-bold">{seat1Number}</div>
                              <div className="text-xs truncate w-10">{getStudentName(assignments[seat1Index]).split(' ')[0]}</div>
                            </div>
                          ) : (
                            seat1Number
                          )}
                        </div>
                      )}
                      
                      {/* Second seat in column */}
                      {seat2Index < totalSeats && (
                        <div
                          onClick={() => handleSeatClick(seat2Index, seatType)}
                          className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                            assignments[seat2Index] && assignments[seat2Index] !== 0
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          title={assignments[seat2Index] && assignments[seat2Index] !== 0 ? `${getStudentName(assignments[seat2Index])} - Click to unassign` : `Seat ${seat2Number} - Click to assign student`}
                        >
                          {assignments[seat2Index] && assignments[seat2Index] !== 0 ? (
                            <div className="text-center">
                              <div className="font-bold">{seat2Number}</div>
                              <div className="text-xs truncate w-10">{getStudentName(assignments[seat2Index]).split(' ')[0]}</div>
                            </div>
                          ) : (
                            seat2Number
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No seats configured for this schedule.</p>
            <p className="text-sm">Please set the number of seats and columns in the schedule settings.</p>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click on an empty seat to assign the next available student</li>
            <li>• Click on an occupied seat to unassign the student</li>
            <li>• Green seats are assigned, gray seats are empty</li>
          </ul>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {seatType === 'lecture' ? 'Lecture' : 'Laboratory'} Layout
            </div>
            <Button 
              onClick={() => saveSeatArrangement(seatType)} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : `Save ${seatType === 'lecture' ? 'Lecture' : 'Laboratory'} Arrangement`}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger className='w-full bg-green-900 h-full rounded-md text-white cursor-pointer hover:bg-black'>
          Seat Plan
        </DialogTrigger>
        <DialogContent className='overflow-auto !max-w-[90vw] !w-[90vw] sm:!max-w-[90vw]'>
          <DialogHeader>
            <DialogTitle>Seat Plan Management</DialogTitle>
            <DialogDescription>
              Total Seats: {numberOfSeats} | Enrolled Students: {enrolledStudents.length}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <Tabs defaultValue={hasLecture ? "lecture" : "laboratory"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                {hasLecture && (
                  <TabsTrigger value="lecture" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Lecture
                  </TabsTrigger>
                )}
                {hasLaboratory && (
                  <TabsTrigger value="laboratory" className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" />
                    Laboratory
                  </TabsTrigger>
                )}
              </TabsList>
              
              {hasLecture && (
                <TabsContent value="lecture" className="mt-6">
                  {renderSeatGrid('lecture')}
                </TabsContent>
              )}
              
              {hasLaboratory && (
                <TabsContent value="laboratory" className="mt-6">
                  {renderSeatGrid('laboratory')}
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
