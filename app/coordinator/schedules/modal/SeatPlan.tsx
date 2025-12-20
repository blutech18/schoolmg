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

interface SeatPlanProps {
  numberOfSeats: number
  cols: number
  studentSeatMap?: string | (string | number)[]
  scheduleId: number
}

interface EnrolledStudent {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
}

export default function SeatPlan({ numberOfSeats, cols, studentSeatMap = "", scheduleId }: SeatPlanProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [seatAssignments, setSeatAssignments] = useState<(string | number)[]>([]);
  const [loading, setLoading] = useState(false);
  
  const totalSeats = numberOfSeats
  const seats = Array.from({ length: totalSeats }, (_, i) => i + 1)

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

  // Initialize seat assignments from studentSeatMap
  useEffect(() => {
    let parsedMap: (string | number)[] = [];
    
    if (typeof studentSeatMap === "string") {
      try {
        // Handle empty or invalid strings
        if (studentSeatMap.trim() === '') {
          parsedMap = Array(totalSeats).fill(0);
        } else {
          const parsed = JSON.parse(studentSeatMap);
          if (Array.isArray(parsed)) {
            parsedMap = parsed;
          } else {
            console.warn("SeatMap is not an array:", studentSeatMap);
            parsedMap = Array(totalSeats).fill(0);
          }
        }
      } catch (error) {
        console.error("Invalid seat map string:", studentSeatMap, error);
        parsedMap = Array(totalSeats).fill(0);
      }
    } else if (Array.isArray(studentSeatMap)) {
      parsedMap = studentSeatMap;
    } else {
      parsedMap = Array(totalSeats).fill(0);
    }
    
    // Ensure the array has the correct length
    if (parsedMap.length !== totalSeats) {
      parsedMap = Array(totalSeats).fill(0);
    }
    
    setSeatAssignments(parsedMap);
  }, [studentSeatMap, totalSeats]);

  const handleSeatClick = (seatIndex: number) => {
    const currentAssignment = seatAssignments[seatIndex];
    
    if (currentAssignment && currentAssignment !== 0) {
      // Seat is occupied, unassign student
      const newAssignments = [...seatAssignments];
      newAssignments[seatIndex] = 0;
      setSeatAssignments(newAssignments);
    } else {
      // Seat is empty, show available students to assign
      const assignedStudentIds = seatAssignments.filter(id => id !== 0);
      const availableStudents = enrolledStudents.filter(student => 
        !assignedStudentIds.includes(student.StudentID)
      );
      
      if (availableStudents.length > 0) {
        // For simplicity, assign the first available student
        // In a real implementation, you might want to show a dropdown
        const newAssignments = [...seatAssignments];
        newAssignments[seatIndex] = availableStudents[0].StudentID;
        setSeatAssignments(newAssignments);
      }
    }
  };

  const getStudentName = (studentId: string | number) => {
    const student = enrolledStudents.find(s => s.StudentID === studentId.toString());
    return student ? student.StudentName : `Student ${studentId}`;
  };

  const saveSeatArrangement = async () => {
    try {
      setLoading(true);
      
      // Use the dedicated seat-map endpoint to avoid corrupting other schedule data
      const res = await fetch(`/api/schedules/seat-map?id=${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SeatMap: JSON.stringify(seatAssignments)
        })
      });
      
      if (res.ok) {
        alert('Seat arrangement saved successfully!');
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
              Total Seats: {numberOfSeats} | Columns: {cols} | Enrolled Students: {enrolledStudents.length}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-6 mt-4">
                {totalSeats > 0 && cols > 0 ? (
                  Array.from({ length: cols === 2 ? Math.ceil(totalSeats / 8) : Math.ceil(totalSeats / (cols * 2)) }, (_, rowIndex) => (
                    <div key={rowIndex} className="flex justify-center gap-12">
                      {cols === 2 ? (
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
                                  onClick={() => handleSeatClick(actualSeatIndex)}
                                  className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                                    seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0 ? `${getStudentName(seatAssignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                                >
                                  {seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0 ? (
                                    <div className="text-center">
                                      <div className="font-bold">{seatNumber}</div>
                                      <div className="text-xs truncate w-10">{getStudentName(seatAssignments[actualSeatIndex]).split(' ')[0]}</div>
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
                                  onClick={() => handleSeatClick(actualSeatIndex)}
                                  className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                                    seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0 ? `${getStudentName(seatAssignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                                >
                                  {seatAssignments[actualSeatIndex] && seatAssignments[actualSeatIndex] !== 0 ? (
                                    <div className="text-center">
                                      <div className="font-bold">{seatNumber}</div>
                                      <div className="text-xs truncate w-10">{getStudentName(seatAssignments[actualSeatIndex]).split(' ')[0]}</div>
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
                        Array.from({ length: cols }, (_, colIndex) => {
                          const seat1Index = rowIndex * (cols * 2) + colIndex * 2
                          const seat2Index = seat1Index + 1
                          const seat1Number = seat1Index + 1
                          const seat2Number = seat2Index + 1
                          
                          return (
                            <div key={colIndex} className="flex gap-2">
                              {/* First seat in column */}
                              {seat1Index < totalSeats && (
                                <div
                                  onClick={() => handleSeatClick(seat1Index)}
                                  className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                                    seatAssignments[seat1Index] && seatAssignments[seat1Index] !== 0
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={seatAssignments[seat1Index] && seatAssignments[seat1Index] !== 0 ? `${getStudentName(seatAssignments[seat1Index])} - Click to unassign` : `Seat ${seat1Number} - Click to assign student`}
                                >
                                  {seatAssignments[seat1Index] && seatAssignments[seat1Index] !== 0 ? (
                                    <div className="text-center">
                                      <div className="font-bold">{seat1Number}</div>
                                      <div className="text-xs truncate w-10">{getStudentName(seatAssignments[seat1Index]).split(' ')[0]}</div>
                                    </div>
                                  ) : (
                                    seat1Number
                                  )}
                                </div>
                              )}
                              
                              {/* Second seat in column */}
                              {seat2Index < totalSeats && (
                                <div
                                  onClick={() => handleSeatClick(seat2Index)}
                                  className={`w-12 h-12 flex items-center justify-center rounded border text-xs cursor-pointer transition-colors ${
                                    seatAssignments[seat2Index] && seatAssignments[seat2Index] !== 0
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                  title={seatAssignments[seat2Index] && seatAssignments[seat2Index] !== 0 ? `${getStudentName(seatAssignments[seat2Index])} - Click to unassign` : `Seat ${seat2Number} - Click to assign student`}
                                >
                                  {seatAssignments[seat2Index] && seatAssignments[seat2Index] !== 0 ? (
                                    <div className="text-center">
                                      <div className="font-bold">{seat2Number}</div>
                                      <div className="text-xs truncate w-10">{getStudentName(seatAssignments[seat2Index]).split(' ')[0]}</div>
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
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Instructions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click on an empty seat to assign the next available student</li>
                  <li>• Click on an occupied seat to unassign the student</li>
                  <li>• Green seats are assigned, gray seats are empty</li>
                </ul>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Assigned: {seatAssignments.filter(id => id !== 0).length} / {enrolledStudents.length} students
                  </div>
                  <Button 
                    onClick={saveSeatArrangement} 
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Saving...' : 'Save Arrangement'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
