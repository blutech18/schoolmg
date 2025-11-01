import React from 'react'
import { toast as sonnerToast } from 'sonner'
import { cn } from '@/lib/utils'
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react'

interface BrandedToastProps {
  variant?: 'success' | 'info' | 'warning' | 'error'
  title?: string
  description?: string
  duration?: number
  showLogo?: boolean
}

const BrandedToast = ({ 
  variant = 'info', 
  title, 
  description, 
  duration = 4000,
  showLogo = true 
}: BrandedToastProps) => {
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

  const toastContent = (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg border shadow-lg min-w-[300px] max-w-[400px]',
      styles.container
    )}>
      {/* Logo with Icon */}
      {showLogo && (
        <div className="flex-shrink-0">
          <div className="relative">
            <img
              src="/img/cca-logo.png"
              alt="CCA Logo"
              className={cn('w-6 h-6 object-contain', styles.logo)}
            />
            <div className={cn(
              'absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center',
              styles.iconBg
            )}>
              <Icon className={cn('w-2 h-2', styles.icon)} />
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
      </div>
    </div>
  )

  return toastContent
}

// Branded Toast Functions
export const brandedToast = {
  success: (message: string, options?: { title?: string; duration?: number; showLogo?: boolean }) => {
    sonnerToast.custom((t) => (
      <BrandedToast 
        variant="success" 
        title={options?.title || 'Success'}
        description={message}
        duration={options?.duration}
        showLogo={options?.showLogo}
      />
    ), {
      duration: options?.duration || 4000,
      position: 'top-right'
    })
  },

  info: (message: string, options?: { title?: string; duration?: number; showLogo?: boolean }) => {
    sonnerToast.custom((t) => (
      <BrandedToast 
        variant="info" 
        title={options?.title || 'Information'}
        description={message}
        duration={options?.duration}
        showLogo={options?.showLogo}
      />
    ), {
      duration: options?.duration || 4000,
      position: 'top-right'
    })
  },

  warning: (message: string, options?: { title?: string; duration?: number; showLogo?: boolean }) => {
    sonnerToast.custom((t) => (
      <BrandedToast 
        variant="warning" 
        title={options?.title || 'Warning'}
        description={message}
        duration={options?.duration}
        showLogo={options?.showLogo}
      />
    ), {
      duration: options?.duration || 5000,
      position: 'top-right'
    })
  },

  error: (message: string, options?: { title?: string; duration?: number; showLogo?: boolean }) => {
    sonnerToast.custom((t) => (
      <BrandedToast 
        variant="error" 
        title={options?.title || 'Error'}
        description={message}
        duration={options?.duration}
        showLogo={options?.showLogo}
      />
    ), {
      duration: options?.duration || 6000,
      position: 'top-right'
    })
  }
}

export { BrandedToast, type BrandedToastProps }
