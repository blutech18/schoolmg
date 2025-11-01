'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function TestPage() {
  const [loading, setLoading] = useState(false)

  const testEnrollment = async (scheduleId: number) => {
    setLoading(true)
    try {
      console.log(`Testing enrollment for schedule ${scheduleId}`)
      
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          StudentID: '100000',
          ScheduleID: scheduleId,
          Status: 'enrolled'
        }),
      })

      const result = await res.json()
      console.log('Enrollment result:', result)

      if (!res.ok) {
        toast.error(`Failed to enroll: ${result.error}`)
      } else {
        toast.success(`Successfully enrolled in schedule ${scheduleId}`)
      }
    } catch (error) {
      console.error('Enrollment test failed:', error)
      toast.error('Enrollment test failed')
    } finally {
      setLoading(false)
    }
  }

  const checkSchedule = async (scheduleId: number) => {
    try {
      const res = await fetch(`/api/schedules?id=${scheduleId}`, {
        credentials: 'include'
      })
      const result = await res.json()
      console.log(`Schedule ${scheduleId}:`, result)
      toast.info(`Schedule ${scheduleId} details logged to console`)
    } catch (error) {
      console.error('Failed to check schedule:', error)
      toast.error('Failed to check schedule')
    }
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Enrollment Test Page</h1>
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Test Schedule 30 (IT101)</h2>
        <div className="flex gap-2">
          <Button onClick={() => checkSchedule(30)} variant="outline">
            Check Schedule 30
          </Button>
          <Button 
            onClick={() => testEnrollment(30)} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : 'Test Enrollment Schedule 30'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Test Schedule 32 (CS102)</h2>
        <div className="flex gap-2">
          <Button onClick={() => checkSchedule(32)} variant="outline">
            Check Schedule 32
          </Button>
          <Button 
            onClick={() => testEnrollment(32)} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Testing...' : 'Test Enrollment Schedule 32'}
          </Button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Instructions:</h3>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Click "Check Schedule" to see the schedule details in the console</li>
          <li>Click "Test Enrollment" to attempt enrollment</li>
          <li>Check the browser console for detailed logs</li>
          <li>Look for toast notifications for results</li>
        </ul>
      </div>
    </div>
  )
}
