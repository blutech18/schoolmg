import InstructorsTable from './InstructorsTable';
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Instructors Account Management" 
        description="Manage instructor accounts, assignments, and contact information"
      />
      
      <InstructorsTable />
    </div>
  )
}
