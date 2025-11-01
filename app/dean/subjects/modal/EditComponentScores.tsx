'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Plus, Trash2, Save } from 'lucide-react'
import { toast } from 'sonner'

interface ComponentTotalScore {
  ComponentTotalScoreID?: number
  ComponentName: string
  TotalScore: number
  Weight: number
  Items: number
  ClassType: string
}

interface Subject {
  SubjectID: number
  SubjectCode: string
  SubjectName: string
  ClassType: string
}

interface EditComponentScoresDialogProps {
  subject: Subject
  onUpdated?: () => void
}

const DEFAULT_COMPONENTS = {
  'LECTURE': [
    { ComponentName: 'Quiz', TotalScore: 20, Weight: 60, Items: 15 },
    { ComponentName: 'Exam', TotalScore: 60, Weight: 40, Items: 1 }
  ],
  'LECTURE+LAB': [
    { ComponentName: 'Quiz', TotalScore: 20, Weight: 15, Items: 5 },
    { ComponentName: 'Laboratory', TotalScore: 20, Weight: 30, Items: 5 },
    { ComponentName: 'OLO', TotalScore: 20, Weight: 15, Items: 5 },
    { ComponentName: 'Exam', TotalScore: 60, Weight: 40, Items: 1 }
  ],
  'MAJOR': [
    { ComponentName: 'Quiz', TotalScore: 20, Weight: 15, Items: 5 },
    { ComponentName: 'Laboratory', TotalScore: 20, Weight: 40, Items: 5 },
    { ComponentName: 'OLO', TotalScore: 20, Weight: 15, Items: 5 },
    { ComponentName: 'Exam', TotalScore: 60, Weight: 30, Items: 1 }
  ]
}

export default function EditComponentScoresDialog({ subject, onUpdated }: EditComponentScoresDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [components, setComponents] = useState<ComponentTotalScore[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchComponentScores()
    }
  }, [isOpen, subject])

  const fetchComponentScores = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/component-total-scores?subjectId=${subject.SubjectID}&classType=${subject.ClassType}`)
      const data = await response.json()

      if (data.success && data.data.length > 0) {
        setComponents(data.data)
      } else {
        // Use default components if none exist
        const defaultComponents = DEFAULT_COMPONENTS[subject.ClassType as keyof typeof DEFAULT_COMPONENTS] || DEFAULT_COMPONENTS['LECTURE']
        setComponents(defaultComponents.map(comp => ({
          ...comp,
          ClassType: subject.ClassType
        })))
      }
    } catch (error) {
      console.error('Error fetching component scores:', error)
      toast.error('Failed to load component scores')
      // Fallback to default components
      const defaultComponents = DEFAULT_COMPONENTS[subject.ClassType as keyof typeof DEFAULT_COMPONENTS] || DEFAULT_COMPONENTS['LECTURE']
      setComponents(defaultComponents.map(comp => ({
        ...comp,
        ClassType: subject.ClassType
      })))
    } finally {
      setLoading(false)
    }
  }

  const addComponent = () => {
    setComponents([...components, {
      ComponentName: '',
      TotalScore: 20,
      Weight: 0,
      Items: 1,
      ClassType: subject.ClassType
    }])
  }

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, field: keyof ComponentTotalScore, value: any) => {
    const updatedComponents = [...components]
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value
    }
    setComponents(updatedComponents)
  }

  const saveComponentScores = async () => {
    setSaving(true)
    try {
      // Validate components
      const totalWeight = components.reduce((sum, comp) => sum + comp.Weight, 0)
      if (Math.abs(totalWeight - 100) > 0.01) {
        toast.error('Total weight must equal 100%')
        return
      }

      for (const comp of components) {
        if (!comp.ComponentName.trim()) {
          toast.error('All components must have a name')
          return
        }
        if (comp.TotalScore <= 0) {
          toast.error('Total score must be greater than 0')
          return
        }
        if (comp.Items <= 0) {
          toast.error('Number of items must be greater than 0')
          return
        }
      }

      const response = await fetch('/api/component-total-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subjectId: subject.SubjectID,
          classType: subject.ClassType,
          components: components.map(comp => ({
            ComponentName: comp.ComponentName.trim(),
            TotalScore: comp.TotalScore,
            Weight: comp.Weight,
            Items: comp.Items
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Component total scores updated successfully')
        setIsOpen(false)
        onUpdated?.()
      } else {
        toast.error(data.error || 'Failed to update component scores')
      }
    } catch (error) {
      console.error('Error saving component scores:', error)
      toast.error('Failed to save component scores')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    const defaultComponents = DEFAULT_COMPONENTS[subject.ClassType as keyof typeof DEFAULT_COMPONENTS] || DEFAULT_COMPONENTS['LECTURE']
    setComponents(defaultComponents.map(comp => ({
      ...comp,
      ClassType: subject.ClassType
    })))
  }

  const totalWeight = components.reduce((sum, comp) => sum + comp.Weight, 0)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Edit Scores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Component Total Scores
          </DialogTitle>
          <div className="text-sm text-gray-600">
            <p><strong>Subject:</strong> {subject.SubjectCode} - {subject.SubjectName}</p>
            <p><strong>Class Type:</strong> <Badge variant="outline">{subject.ClassType}</Badge></p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading component scores...</p>
            </div>
          ) : (
            <>
              {/* Weight Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Weight Summary</CardTitle>
                  <CardDescription>
                    Total weight: <span className={`font-semibold ${Math.abs(totalWeight - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalWeight.toFixed(1)}%
                    </span>
                    {Math.abs(totalWeight - 100) > 0.01 && (
                      <span className="text-red-600 ml-2">(Must equal 100%)</span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Components List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Grade Components</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetToDefaults}>
                      Reset to Defaults
                    </Button>
                    <Button variant="outline" size="sm" onClick={addComponent}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Component
                    </Button>
                  </div>
                </div>

                {components.map((component, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <Label htmlFor={`component-name-${index}`}>Component Name</Label>
                          <Input
                            id={`component-name-${index}`}
                            value={component.ComponentName}
                            onChange={(e) => updateComponent(index, 'ComponentName', e.target.value)}
                            placeholder="e.g., Quiz, Exam, Lab"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`total-score-${index}`}>Total Score</Label>
                          <Input
                            id={`total-score-${index}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={component.TotalScore}
                            onChange={(e) => updateComponent(index, 'TotalScore', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`weight-${index}`}>Weight (%)</Label>
                          <Input
                            id={`weight-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={component.Weight}
                            onChange={(e) => updateComponent(index, 'Weight', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`items-${index}`}>Number of Items</Label>
                          <Input
                            id={`items-${index}`}
                            type="number"
                            min="1"
                            value={component.Items}
                            onChange={(e) => updateComponent(index, 'Items', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeComponent(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {components.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">No components configured. Add components to define grading structure.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={saveComponentScores} disabled={saving || loading}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
