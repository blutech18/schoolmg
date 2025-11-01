import { Suspense } from 'react'
import AttendanceTable from './AttendanceTable'
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Management"
        description="View and manage student attendance records for all schedules"
      />

      <Suspense fallback={<div>Loading attendance...</div>}>
        <AttendanceTable />
      </Suspense>
    </div>
  )
}
