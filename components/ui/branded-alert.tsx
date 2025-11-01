import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'

interface BrandedAlertProps {
  variant?: 'success' | 'info' | 'warning' | 'error'
  title?: string
  description?: string
  children?: React.ReactNode
  className?: string
  showLogo?: boolean
  dismissible?: boolean
  onDismiss?: () => void
}

const BrandedAlert = React.forwardRef<HTMLDivElement, BrandedAlertProps>(
  ({ 
    variant = 'info', 
    title, 
    description, 
    children, 
    className, 
    showLogo = true,
    dismissible = false,
    onDismiss,
    ...props 
  }, ref) => {
    const variants = {
      success: {
        container: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        title: 'text-green-800',
        description: 'text-green-700',
        logo: 'opacity-90'
      },
      info: {
        container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        title: 'text-blue-800',
        description: 'text-blue-700',
        logo: 'opacity-90'
      },
      warning: {
        container: 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200',
        icon: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        title: 'text-yellow-800',
        description: 'text-yellow-700',
        logo: 'opacity-90'
      },
      error: {
        container: 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
        title: 'text-red-800',
        description: 'text-red-700',
        logo: 'opacity-90'
      }
    }

    const icons = {
      success: CheckCircle,
      info: Info,
      warning: AlertTriangle,
      error: XCircle
    }

    const Icon = icons[variant]
    const styles = variants[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-start gap-4 p-4 rounded-lg border shadow-sm transition-all duration-200',
          styles.container,
          className
        )}
        {...props}
      >
        {/* Logo */}
        {showLogo && (
          <div className="flex-shrink-0 mt-0.5">
            <div className="relative">
              <img
                src="/img/cca-logo.png"
                alt="CCA Logo"
                className={cn('w-8 h-8 object-contain', styles.logo)}
              />
              <div className={cn(
                'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
                styles.iconBg
              )}>
                <Icon className={cn('w-3 h-3', styles.icon)} />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn('text-sm font-semibold mb-1', styles.title)}>
              {title}
            </h4>
          )}
          {description && (
            <p className={cn('text-sm', styles.description)}>
              {description}
            </p>
          )}
          {children && (
            <div className={cn('mt-2', styles.description)}>
              {children}
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-full transition-colors duration-200',
              'hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2',
              styles.icon,
              'focus:ring-current'
            )}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }
)

BrandedAlert.displayName = 'BrandedAlert'

export { BrandedAlert, type BrandedAlertProps }
