
import React from 'react';
import { Notification } from '../types';
import { XIcon, WarningIcon } from './Icons';

interface NotificationsProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) {
    return null;
  }

  const notificationStyles = {
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    error: 'bg-red-100 border-red-500 text-red-800',
  };

  return (
    <div className="px-8 pt-4 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 border-l-4 rounded-r-lg shadow-sm flex items-center justify-between ${notificationStyles[notification.type]}`}
          role="alert"
        >
          <div className="flex items-center">
            <WarningIcon className={`w-6 h-6 mr-3 flex-shrink-0 ${notification.type === 'error' ? 'text-red-500' : 'text-yellow-500'}`} />
            <p className="font-semibold">{notification.message}</p>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="ml-4 text-gray-500 hover:text-gray-800"
            aria-label="Cerrar notificación"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};
