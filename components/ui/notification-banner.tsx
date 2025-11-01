'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export interface NotificationBannerData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number; // in milliseconds
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationBannerProps {
  notification: NotificationBannerData;
  onDismiss: (id: string) => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (notification.autoHide && notification.autoHideDelay) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.autoHideDelay);
      
      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.autoHideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300); // Allow fade out animation
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-blue-800';
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-sm transition-all duration-300 ${getBackgroundColor()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-semibold ${getTextColor()}`}>
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {notification.timestamp.toLocaleTimeString()}
              </span>
              {notification.dismissible !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          <p className={`text-sm mt-1 ${getTextColor()}`}>
            {notification.message}
          </p>
          {notification.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={notification.action.onClick}
                className={`text-xs ${getTextColor()} border-current hover:bg-current hover:text-white`}
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface NotificationBannerContainerProps {
  notifications: NotificationBannerData[];
  onDismiss: (id: string) => void;
  maxNotifications?: number;
}

export const NotificationBannerContainer: React.FC<NotificationBannerContainerProps> = ({
  notifications,
  onDismiss,
  maxNotifications = 5
}) => {
  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full space-y-3">
      {visibleNotifications.map((notification) => (
        <NotificationBanner
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotificationBanner = () => {
  const [notifications, setNotifications] = useState<NotificationBannerData[]>([]);

  const addNotification = (notification: Omit<NotificationBannerData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationBannerData = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      dismissible: notification.dismissible !== false,
      autoHide: notification.autoHide !== false,
      autoHideDelay: notification.autoHideDelay || 5000, // Default 5 seconds
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
  };
};

export default NotificationBanner;
