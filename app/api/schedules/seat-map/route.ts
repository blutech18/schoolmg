import { db } from '@/app/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    const seatType = req.nextUrl.searchParams.get('type'); // 'lecture' or 'laboratory'
    
    console.log('🔍 API: PUT seat-map request');
    console.log('🔍 API: Schedule ID:', id);
    console.log('🔍 API: Seat Type:', seatType);
    
    if (!id) {
      console.error('❌ API: Missing ScheduleID');
      return NextResponse.json({ error: 'Missing ScheduleID' }, { status: 400 });
    }

    const { SeatMap, SeatCols } = await req.json();
    console.log('🔍 API: Received SeatMap:', SeatMap);
    console.log('🔍 API: Received SeatCols:', SeatCols);

    if (SeatMap === undefined) {
      console.error('❌ API: SeatMap is undefined');
      return NextResponse.json({ error: 'SeatMap is required' }, { status: 400 });
    }

    let query: string;
    let params: any[];

    if (seatType === 'lecture') {
      // Update Lecture seat map
      query = `UPDATE schedules SET LectureSeatMap = ?, LectureSeatCols = ? WHERE ScheduleID = ?`;
      params = [SeatMap, SeatCols || null, parseInt(id)];
      console.log('🔍 API: Using lecture query:', query);
      console.log('🔍 API: Lecture params:', params);
    } else if (seatType === 'laboratory') {
      // Update Laboratory seat map
      query = `UPDATE schedules SET LaboratorySeatMap = ?, LaboratorySeatCols = ? WHERE ScheduleID = ?`;
      params = [SeatMap, SeatCols || null, parseInt(id)];
      console.log('🔍 API: Using laboratory query:', query);
      console.log('🔍 API: Laboratory params:', params);
    } else {
      // Update general SeatMap (for backward compatibility)
      query = `UPDATE schedules SET SeatMap = ?, SeatCols = ? WHERE ScheduleID = ?`;
      params = [SeatMap, SeatCols || null, parseInt(id)];
      console.log('🔍 API: Using general query:', query);
      console.log('🔍 API: General params:', params);
    }

    console.log('🔍 API: Executing query...');
    const result = await db.query(query, params);
    console.log('🔍 API: Query result:', result);
    
    return NextResponse.json({ 
      success: true, 
      message: `${seatType ? seatType.charAt(0).toUpperCase() + seatType.slice(1) : 'Seat'} map updated successfully` 
    });
  } catch (error) {
    console.error('❌ API: PUT seat-map error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update seat map' 
    }, { status: 500 });
  }
}
