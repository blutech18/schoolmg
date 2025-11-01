import { Suspense } from 'react'
import GradesTable from './GradesTable'
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades Management"
        description="View and manage student grades, assessments, and academic performance"
      />

      <Suspense fallback={<div>Loading grades...</div>}>
        <GradesTable />
      </Suspense>
    </div>
  )
}
