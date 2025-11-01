import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/lib/db'

export async function GET() {
  try {
    // Check current schedules
    const [schedules] = await db.query('SELECT ScheduleID, SubjectCode, SubjectName FROM schedules ORDER BY ScheduleID')
    
    return NextResponse.json({
      success: true,
      message: 'Current schedules',
      data: schedules
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({
      success: false,
      message: 'Error fetching schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST() {
  try {
    // Fix existing data
    await db.query("UPDATE schedules SET ScheduleID = 1 WHERE ScheduleID = 0 AND SubjectCode = 'AC101' LIMIT 1")
    await db.query("UPDATE schedules SET ScheduleID = 2 WHERE ScheduleID = 0 AND SubjectCode = 'AC102' LIMIT 1")
    
    // Add primary key if it doesn't exist
    try {
      await db.query('ALTER TABLE schedules ADD PRIMARY KEY (ScheduleID)')
    } catch (error) {
      console.log('Primary key might already exist:', error)
    }
    
    // Add auto-increment
    await db.query('ALTER TABLE schedules MODIFY ScheduleID int(11) NOT NULL AUTO_INCREMENT')
    
    // Set auto-increment to start from 3
    await db.query('ALTER TABLE schedules AUTO_INCREMENT = 3')
    
    // Get updated schedules
    const [schedules] = await db.query('SELECT ScheduleID, SubjectCode, SubjectName FROM schedules ORDER BY ScheduleID')
    
    return NextResponse.json({
      success: true,
      message: 'Schedules table fixed successfully',
      data: schedules
    })
  } catch (error) {
    console.error('Error fixing schedules:', error)
    return NextResponse.json({
      success: false,
      message: 'Error fixing schedules',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
