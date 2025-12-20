import EnrollmentsTable from './EnrollmentsTable'
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Enrollments Management" 
        description="Manage student enrollments, course assignments, and enrollment status"
      />
      
      <EnrollmentsTable />
    </div>
  )
}
