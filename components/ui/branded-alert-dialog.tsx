import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BrandedAlert } from '@/components/ui/branded-alert'
import { CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrandedAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: 'success' | 'info' | 'warning' | 'error'
  title: string
  description?: string
  children?: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  showLogo?: boolean
  className?: string
}

const BrandedAlertDialog = ({
  open,
  onOpenChange,
  variant = 'info',
  title,
  description,
  children,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  showLogo = true,
  className
}: BrandedAlertDialogProps) => {
  const variants = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      confirmButton: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      border: 'border-green-200'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      border: 'border-blue-200'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      border: 'border-yellow-200'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-600',
      confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      border: 'border-red-200'
    }
  }

  const Icon = variants[variant].icon
  const iconColor = variants[variant].iconColor
  const confirmButtonClass = variants[variant].confirmButton
  const borderClass = variants[variant].border

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onOpenChange(false)
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('sm:max-w-md', className)}>
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              {showLogo && (
                <img
                  src="/img/cca-logo.png"
                  alt="CCA Logo"
                  className="w-12 h-12 object-contain mx-auto opacity-90"
                />
              )}
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Icon className={cn('w-4 h-4', iconColor)} />
              </div>
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-600 mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {children && (
          <div className="py-4">
            {children}
          </div>
        )}

        <DialogFooter className="flex gap-2 justify-center">
          {cancelText && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="min-w-[80px]"
            >
              {cancelText}
            </Button>
          )}
          {confirmText && (
            <Button
              onClick={handleConfirm}
              className={cn('min-w-[80px]', confirmButtonClass)}
            >
              {confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { BrandedAlertDialog, type BrandedAlertDialogProps }
