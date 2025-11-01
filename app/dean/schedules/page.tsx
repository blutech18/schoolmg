import ScheduleCardView from './ScheduleCardView'
import SchedulesTable from './SchedulesTable'
import PageHeader from '../components/PageHeader';

export default async function page() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Schedule Management" 
        description="Create, manage, and organize courses and class sessions"
      />
      
      <div className="space-y-8">
        <ScheduleCardView />
        <SchedulesTable />
      </div>
    </div>
  )
}
