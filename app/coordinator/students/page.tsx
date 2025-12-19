import StudentsTable from './StudentsTable';
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Student Account Management" 
        description="Manage student accounts, enrollment status, and personal information"
      />
      
      <StudentsTable />
    </div>
  )
}
