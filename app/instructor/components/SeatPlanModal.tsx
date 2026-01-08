'use client'
import React, { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Save, RotateCcw, X, BookOpen, FlaskConical, Printer } from "lucide-react"
import { brandedToast } from "@/components/ui/branded-toast"
import { printDocument, generateSeatPlanPrintContent } from "../../lib/printUtils"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface EnrolledStudent {
  StudentID: string;
  StudentName: string;
  StudentNumber: string;
  FirstName?: string;
  LastName?: string;
}

interface Schedule {
  ScheduleID: number;
  SubjectCode: string;
  SubjectTitle: string;
  Course: string;
  YearLevel: number;
  Section: string;
  Room: string;
  Day: string;
  Time: string;
  TotalSeats: number;
  SeatCols: number;
  SeatMap: string;
  LectureSeatMap?: string;
  LaboratorySeatMap?: string;
  LectureSeatCols?: number;
  LaboratorySeatCols?: number;
  ClassType?: string;
  Lecture?: number;
  Laboratory?: number;
}

interface SeatPlanModalProps {
  schedule: Schedule;
  onClose: () => void;
  onDataSaved?: () => void;
}

export default function SeatPlanModal({ schedule, onClose, onDataSaved }: SeatPlanModalProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([])
  const [lectureSeatAssignments, setLectureSeatAssignments] = useState<(string | number)[]>([])
  const [laboratorySeatAssignments, setLaboratorySeatAssignments] = useState<(string | number)[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetType, setResetType] = useState<'lecture' | 'laboratory' | 'both'>('both')
  const hasInitializedRef = useRef(false)

  // Determine if this schedule has both Lecture and Laboratory components
  const hasLecture = (schedule.Lecture || 0) > 0
  const hasLaboratory = (schedule.Laboratory || 0) > 0
  const hasBothComponents = hasLecture && hasLaboratory
  const classType = schedule.ClassType || 'LECTURE'

  // Fetch enrolled students when component mounts
  useEffect(() => {
    async function fetchEnrolledStudents() {
      try {
        setLoading(true)
        const res = await fetch(`/api/enrollments?scheduleId=${schedule.ScheduleID}`)
        if (res.ok) {
          const result = await res.json()
          const students = result.success ? result.data : result
          setEnrolledStudents(Array.isArray(students) ? students : [])
        }
      } catch (error) {
        console.error('Error fetching enrolled students:', error)
        brandedToast.error('Failed to load enrolled students')
      } finally {
        setLoading(false)
      }
    }

    fetchEnrolledStudents()
  }, [schedule.ScheduleID])

  // Initialize seat assignments from schedule's seat maps
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const totalSeats = schedule.TotalSeats || 0

    // Initialize Lecture seat assignments
    let lectureMap: (string | number)[] = []
    try {
      if (schedule.LectureSeatMap && schedule.LectureSeatMap.trim() !== '') {
        const parsed = JSON.parse(schedule.LectureSeatMap)
        if (Array.isArray(parsed)) {
          lectureMap = parsed
        } else {
          lectureMap = Array(totalSeats).fill(0)
        }
      } else {
        lectureMap = Array(totalSeats).fill(0)
      }
    } catch (error) {
      console.error("Invalid lecture seat map:", schedule.LectureSeatMap, error)
      lectureMap = Array(totalSeats).fill(0)
    }

    if (lectureMap.length !== totalSeats) {
      lectureMap = Array(totalSeats).fill(0)
    }
    setLectureSeatAssignments(lectureMap)

    // Initialize Laboratory seat assignments
    let laboratoryMap: (string | number)[] = []
    try {
      if (schedule.LaboratorySeatMap && schedule.LaboratorySeatMap.trim() !== '') {
        const parsed = JSON.parse(schedule.LaboratorySeatMap)
        if (Array.isArray(parsed)) {
          laboratoryMap = parsed
        } else {
          laboratoryMap = Array(totalSeats).fill(0)
        }
      } else {
        laboratoryMap = Array(totalSeats).fill(0)
      }
    } catch (error) {
      console.error("Invalid laboratory seat map:", schedule.LaboratorySeatMap, error)
      laboratoryMap = Array(totalSeats).fill(0)
    }

    if (laboratoryMap.length !== totalSeats) {
      laboratoryMap = Array(totalSeats).fill(0)
    }
    setLaboratorySeatAssignments(laboratoryMap)
  }, [schedule.ScheduleID])

  const handleSeatClick = (seatIndex: number, seatType: 'lecture' | 'laboratory') => {
    const currentAssignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
    const setAssignments = seatType === 'lecture' ? setLectureSeatAssignments : setLaboratorySeatAssignments
    const currentAssignment = currentAssignments[seatIndex]

    if (currentAssignment && currentAssignment !== 0) {
      // Seat is occupied, unassign student
      const newAssignments = [...currentAssignments]
      newAssignments[seatIndex] = 0
      setAssignments(newAssignments)
      brandedToast.success('Student unassigned from seat')
    } else {
      // Seat is empty, show available students to assign
      const assignedStudentIds = currentAssignments
        .filter(id => id !== 0)
        .map(id => id!.toString())
      const availableStudents = enrolledStudents.filter(student =>
        !assignedStudentIds.includes(student.StudentID.toString())
      )

      if (availableStudents.length > 0) {
        // Assign the first available student
        const newAssignments = [...currentAssignments]
        newAssignments[seatIndex] = availableStudents[0].StudentID
        setAssignments(newAssignments)
        brandedToast.success(`Assigned ${availableStudents[0].StudentName} to seat ${seatIndex + 1}`)
      } else {
        brandedToast.info('No more students available to assign')
      }
    }
  }

  const getStudentLabel = (studentId: string | number) => {
    const idStr = studentId?.toString()
    const student = enrolledStudents.find(s => s.StudentID?.toString() === idStr)
    if (!student) return 'Unassigned'
    // Prefer LastName; fallback to last token of StudentName
    if (student.LastName && student.LastName.trim().length > 0) return student.LastName
    const parts = (student.StudentName || '').trim().split(/\s+/)
    return parts.length > 0 ? parts[parts.length - 1] : 'Unassigned'
  }

  const saveSeatArrangement = async (seatType: 'lecture' | 'laboratory') => {
    try {
      setSaving(true)

      const assignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
      const cols = seatType === 'lecture' ? (schedule.LectureSeatCols || schedule.SeatCols || 4) : (schedule.LaboratorySeatCols || schedule.SeatCols || 5)

      const res = await fetch(`/api/schedules/seat-map?id=${schedule.ScheduleID}&type=${seatType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SeatMap: JSON.stringify(assignments),
          SeatCols: cols
        })
      })

      if (res.ok) {
        const result = await res.json()
        if (result.success) {
          brandedToast.success(`${seatType.charAt(0).toUpperCase() + seatType.slice(1)} seat arrangement saved successfully!`)
          // Update the schedule's seat map in the parent component
          if (seatType === 'lecture') {
            schedule.LectureSeatMap = JSON.stringify(assignments)
          } else {
            schedule.LaboratorySeatMap = JSON.stringify(assignments)
          }
          // Notify parent component that data was saved
          onDataSaved?.()
        } else {
          throw new Error(result.error || 'Failed to save seat arrangement')
        }
      } else {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to save seat arrangement: ${res.status}`)
      }
    } catch (error) {
      console.error('Error saving seat arrangement:', error)
      brandedToast.error(`Failed to save seat arrangement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const resetSeatArrangement = async (seatType: 'lecture' | 'laboratory' | 'both') => {
    const totalSeats = schedule.TotalSeats || 0
    const newAssignments = Array(totalSeats).fill(0)

    if (seatType === 'lecture' || seatType === 'both') {
      setLectureSeatAssignments(newAssignments)
    }
    if (seatType === 'laboratory' || seatType === 'both') {
      setLaboratorySeatAssignments(newAssignments)
    }

    setShowResetModal(false)

    try {
      // Save the reset to database
      if (seatType === 'lecture' || seatType === 'both') {
        await saveSeatArrangement('lecture')
      }
      if (seatType === 'laboratory' || seatType === 'both') {
        await saveSeatArrangement('laboratory')
      }

      brandedToast.success('Seat arrangement reset and saved successfully!')
    } catch (error) {
      console.error('Error saving reset arrangement:', error)
      brandedToast.error('Failed to save reset arrangement')
    }
  }

  const autoAssignSeats = async (seatType: 'lecture' | 'laboratory') => {
    const totalSeats = schedule.TotalSeats || 0
    const newAssignments = Array(totalSeats).fill(0)
    const setAssignments = seatType === 'lecture' ? setLectureSeatAssignments : setLaboratorySeatAssignments

    // Sort students alphabetically by lastname
    const sortedStudents = [...enrolledStudents].sort((a, b) => {
      const lastNameA = a.LastName || a.StudentName.split(' ').pop() || ''
      const lastNameB = b.LastName || b.StudentName.split(' ').pop() || ''
      return lastNameA.localeCompare(lastNameB)
    })

    sortedStudents.forEach((student, index) => {
      if (index < totalSeats) {
        newAssignments[index] = student.StudentID
      }
    })

    setAssignments(newAssignments)

    try {
      // Immediately save the auto-assigned arrangement to database
      await saveSeatArrangement(seatType)
    } catch (error) {
      console.error('Error saving auto-assigned arrangement:', error)
      brandedToast.error(`Failed to save auto-assigned arrangement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const shuffleSeats = async (seatType: 'lecture' | 'laboratory') => {
    const totalSeats = schedule.TotalSeats || 0
    const newAssignments = Array(totalSeats).fill(0)
    const setAssignments = seatType === 'lecture' ? setLectureSeatAssignments : setLaboratorySeatAssignments

    // Create a shuffled copy of enrolled students
    const shuffledStudents = [...enrolledStudents].sort(() => Math.random() - 0.5)

    shuffledStudents.forEach((student, index) => {
      if (index < totalSeats) {
        newAssignments[index] = student.StudentID
      }
    })

    setAssignments(newAssignments)

    try {
      // Immediately save the shuffled arrangement to database
      await saveSeatArrangement(seatType)
    } catch (error) {
      console.error('Error saving shuffled arrangement:', error)
      brandedToast.error(`Failed to save shuffled arrangement: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Print seat plan
  const printSeatPlan = (seatType: 'lecture' | 'laboratory') => {
    try {
      const assignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments

      // Convert array format to object format expected by generateSeatPlanPrintContent
      const seatAssignments: { [key: number]: number } = {}
      assignments.forEach((studentId, index) => {
        if (studentId && studentId !== 0) {
          seatAssignments[index] = Number(studentId)
        }
      })

      // Map enrolled students to format expected by print function
      const studentsForPrint = enrolledStudents.map(s => ({
        StudentID: Number(s.StudentID),
        FirstName: s.FirstName || s.StudentName?.split(' ')[0] || '',
        LastName: s.LastName || s.StudentName?.split(' ').pop() || '',
        StudentName: s.StudentName,
        StudentNumber: s.StudentNumber
      }))

      const printContent = generateSeatPlanPrintContent(
        schedule,
        seatAssignments,
        studentsForPrint,
        seatType
      )

      printDocument(printContent, `SeatPlan_${schedule.SubjectCode}_${seatType}`)
      brandedToast.success(`${seatType.charAt(0).toUpperCase() + seatType.slice(1)} seat plan sent to printer`)
    } catch (error) {
      console.error('Error printing seat plan:', error)
      brandedToast.error('Failed to print seat plan')
    }
  }

  const renderSeatGrid = (seatType: 'lecture' | 'laboratory') => {
    const assignments = seatType === 'lecture' ? lectureSeatAssignments : laboratorySeatAssignments
    const cols = seatType === 'lecture' ? (schedule.LectureSeatCols || schedule.SeatCols || 4) : (schedule.LaboratorySeatCols || schedule.SeatCols || 5)
    const totalSeats = schedule.TotalSeats || 0
    const assignedCount = assignments.filter(id => id !== 0).length

    return (
      <div className="space-y-6">
        {/* Controls Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Legend and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Assigned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span className="text-sm font-medium text-gray-700">Available</span>
              </div>
              <div className="text-sm text-gray-600">
                Assigned: {assignedCount} / {enrolledStudents.length} students
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => autoAssignSeats(seatType)}
              disabled={enrolledStudents.length === 0 || loading}
              className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Alphabetical</span>
              <span className="sm:hidden">A-Z</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => shuffleSeats(seatType)}
              disabled={enrolledStudents.length === 0 || loading}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 flex-1 sm:flex-none"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Shuffle</span>
              <span className="sm:hidden">Random</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setResetType(seatType)
                setShowResetModal(true)
              }}
              disabled={loading}
              className="border-orange-300 text-orange-700 hover:bg-orange-50 flex-1 sm:flex-none"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={() => saveSeatArrangement(seatType)}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm flex-1 sm:flex-none"
            >
              <Save className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Arrangement'}</span>
              <span className="sm:hidden">{saving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => printSeatPlan(seatType)}
              disabled={loading}
              className="border-green-300 text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Print</span>
              <span className="sm:hidden">Print</span>
            </Button>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {seatType === 'lecture' ? 'Lecture' : 'Laboratory'} Seat Arrangement
          </h3>
          <div className="flex flex-col gap-6">
            {totalSeats > 0 && cols > 0 ? (
              Array.from({ length: cols === 1 ? Math.ceil(totalSeats / 1) : cols === 2 ? Math.ceil(totalSeats / 8) : Math.ceil(totalSeats / (cols * 2)) }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-12">
                  {cols === 1 ? (
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
                            className={`w-20 h-20 flex items-center justify-center rounded-lg border-2 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                              ? 'bg-green-600 text-white hover:bg-green-700 border-green-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                              }`}
                            title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentLabel(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                          >
                            {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                              <div className="text-center">
                                <div className="font-bold text-sm">{seatNumber}</div>
                                <div className="text-xs truncate w-16 font-medium">{getStudentLabel(assignments[actualSeatIndex])}</div>
                              </div>
                            ) : (
                              <span className="font-bold text-base">{seatNumber}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : cols === 2 ? (
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
                              className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                                ? 'bg-green-600 text-white hover:bg-green-700 border-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                }`}
                              title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentLabel(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                            >
                              {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                                <div className="text-center">
                                  <div className="font-bold text-sm">{seatNumber}</div>
                                  <div className="text-xs truncate w-12 font-medium">{getStudentLabel(assignments[actualSeatIndex])}</div>
                                </div>
                              ) : (
                                <span className="font-bold text-base">{seatNumber}</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Wide aisle space */}
                      <div className="w-16"></div>

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
                              className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0
                                ? 'bg-green-600 text-white hover:bg-green-700 border-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                }`}
                              title={assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? `${getStudentLabel(assignments[actualSeatIndex])} - Click to unassign` : `Seat ${seatNumber} - Click to assign student`}
                            >
                              {assignments[actualSeatIndex] && assignments[actualSeatIndex] !== 0 ? (
                                <div className="text-center">
                                  <div className="font-bold text-sm">{seatNumber}</div>
                                  <div className="text-xs truncate w-12 font-medium">{getStudentLabel(assignments[actualSeatIndex])}</div>
                                </div>
                              ) : (
                                <span className="font-bold text-base">{seatNumber}</span>
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
                              onClick={() => handleSeatClick(seat1Index, seatType)}
                              className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${assignments[seat1Index] && assignments[seat1Index] !== 0
                                ? 'bg-green-600 text-white hover:bg-green-700 border-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                }`}
                              title={assignments[seat1Index] && assignments[seat1Index] !== 0 ? `${getStudentLabel(assignments[seat1Index])} - Click to unassign` : `Seat ${seat1Number} - Click to assign student`}
                            >
                              {assignments[seat1Index] && assignments[seat1Index] !== 0 ? (
                                <div className="text-center">
                                  <div className="font-bold text-sm">{seat1Number}</div>
                                  <div className="text-xs truncate w-12 font-medium">{getStudentLabel(assignments[seat1Index])}</div>
                                </div>
                              ) : (
                                <span className="font-bold text-base">{seat1Number}</span>
                              )}
                            </div>
                          )}

                          {/* Second seat in column */}
                          {seat2Index < totalSeats && (
                            <div
                              onClick={() => handleSeatClick(seat2Index, seatType)}
                              className={`w-16 h-16 flex items-center justify-center rounded-lg border-2 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${assignments[seat2Index] && assignments[seat2Index] !== 0
                                ? 'bg-green-600 text-white hover:bg-green-700 border-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                                }`}
                              title={assignments[seat2Index] && assignments[seat2Index] !== 0 ? `${getStudentLabel(assignments[seat2Index])} - Click to unassign` : `Seat ${seat2Number} - Click to assign student`}
                            >
                              {assignments[seat2Index] && assignments[seat2Index] !== 0 ? (
                                <div className="text-center">
                                  <div className="font-bold text-sm">{seat2Number}</div>
                                  <div className="text-xs truncate w-12 font-medium">{getStudentLabel(assignments[seat2Index])}</div>
                                </div>
                              ) : (
                                <span className="font-bold text-base">{seat2Number}</span>
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
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <Users className="h-12 w-12 mx-auto text-gray-400" />
                </div>
                <p className="text-lg font-medium">No seats configured for this schedule</p>
                <p className="text-sm mt-2">Please set the number of seats and columns in the schedule settings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Instructions
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click on an empty seat to assign the next available student</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Click on an occupied seat to unassign the student</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Green seats are assigned, gray seats are empty</span>
              </li>
            </ul>
            <ul className="text-sm text-blue-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use "Alphabetical" to assign students by lastname (A-Z)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use "Shuffle" to randomly assign students to seats</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Use "Reset" to clear all seat assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                <span>Available seats: {totalSeats - assignedCount}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  const totalSeats = schedule.TotalSeats || 0
  const lectureCols = schedule.LectureSeatCols || schedule.SeatCols || 4
  const laboratoryCols = schedule.LaboratorySeatCols || schedule.SeatCols || 5

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-hidden sm:!max-w-[95vw]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Seat Plan Management</DialogTitle>
                <DialogDescription className="text-lg text-gray-600 mt-1">
                  {schedule.SubjectCode} - {schedule.SubjectTitle}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col h-full overflow-hidden">
            {/* Schedule Info Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Course & Section</p>
                  <p className="text-lg font-medium text-gray-900 mt-1">{schedule.Course} - Year {schedule.YearLevel} • Section {schedule.Section}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Schedule</p>
                  <p className="text-lg font-medium text-gray-900 mt-1">{schedule.Day} • {schedule.Time}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Room</p>
                  <p className="text-lg font-medium text-gray-900 mt-1">{schedule.Room}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Components</p>
                  <p className="text-lg font-medium text-gray-900 mt-1">
                    {hasLecture && <span className="inline-flex items-center gap-1 mr-2"><BookOpen className="h-4 w-4" />Lecture</span>}
                    {hasLaboratory && <span className="inline-flex items-center gap-1"><FlaskConical className="h-4 w-4" />Lab</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Seat Plan Tabs */}
            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading students...</p>
                  </div>
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Seat Arrangement</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the {resetType} seat arrangement? This will unassign all students from their seats.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => resetSeatArrangement(resetType)}>
              Reset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
