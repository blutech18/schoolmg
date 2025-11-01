import SubjectsTable from './SubjectsTable'
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Subjects Management" 
        description="Manage academic subjects, prerequisites, and course offerings"
      />
      <SubjectsTable />
    </div>
  )
}
