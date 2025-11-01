'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestSchedules() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const checkSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-schedules')
      const result = await response.json()
      
      if (result.success) {
        setSchedules(result.data)
        setMessage('Schedules loaded successfully')
      } else {
        setMessage(`Error: ${result.message}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const fixSchedules = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-schedules', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setSchedules(result.data)
        setMessage('Schedules table fixed successfully!')
      } else {
        setMessage(`Error: ${result.message}`)
      }
    } catch (error) {
      setMessage(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Schedules Table</h1>
      
      <div className="space-y-4 mb-6">
        <Button onClick={checkSchedules} disabled={loading}>
          Check Current Schedules
        </Button>
        
        <Button onClick={fixSchedules} disabled={loading} variant="destructive">
          Fix Schedules Table
        </Button>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}

      {schedules.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Schedules:</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">ScheduleID</th>
                  <th className="border border-gray-300 px-4 py-2">SubjectCode</th>
                  <th className="border border-gray-300 px-4 py-2">SubjectName</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{schedule.ScheduleID}</td>
                    <td className="border border-gray-300 px-4 py-2">{schedule.SubjectCode}</td>
                    <td className="border border-gray-300 px-4 py-2">{schedule.SubjectName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
