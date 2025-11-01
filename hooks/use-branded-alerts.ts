import { useState, useCallback } from 'react'
import { brandedToast } from '@/components/ui/branded-toast'

export interface AlertState {
  show: boolean
  variant: 'success' | 'info' | 'warning' | 'error'
  title: string
  description?: string
  duration?: number
}

export const useBrandedAlerts = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    variant: 'info',
    title: '',
    description: ''
  })

  const showAlert = useCallback((alert: Omit<AlertState, 'show'>) => {
    setAlertState({ ...alert, show: true })
  }, [])

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, show: false }))
  }, [])

  const showSuccess = useCallback((title: string, description?: string, duration?: number) => {
    brandedToast.success(description || title, { title, duration })
  }, [])

  const showInfo = useCallback((title: string, description?: string, duration?: number) => {
    brandedToast.info(description || title, { title, duration })
  }, [])

  const showWarning = useCallback((title: string, description?: string, duration?: number) => {
    brandedToast.warning(description || title, { title, duration })
  }, [])

  const showError = useCallback((title: string, description?: string, duration?: number) => {
    brandedToast.error(description || title, { title, duration })
  }, [])

  return {
    alertState,
    showAlert,
    hideAlert,
    showSuccess,
    showInfo,
    showWarning,
    showError
  }
}
