'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Placeholder data for notifications
const initialNotifications = [
  {
    id: 1,
    title: 'New Task Assigned',
    message: 'You have been assigned a new task: "Complete project proposal".',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: 2,
    title: 'Sale Recorded',
    message: 'A new sale of $250 has been recorded by John Doe.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: 3,
    title: 'Clock-In Reminder',
    message: 'Don\'t forget to clock in for your shift today.',
    timestamp: '3 days ago',
    read: true,
  },
  {
    id: 4,
    title: 'System Update',
    message: 'The system will be down for maintenance tonight at 11 PM.',
    timestamp: '5 days ago',
    read: false,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleDelete = (id: number) => {
    setNotifications(notifications.filter((notification) => notification.id !== id));
  };

  return (
    <div className="w-full">
      <h1 className="text-2xl">Notifications</h1>

      <div className="mt-6 space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={clsx(
              'rounded-lg p-4',
              {
                'bg-white': notification.read,
                'bg-sky-100': !notification.read,
              }
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{notification.title}</p>
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-400">{notification.timestamp}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="rounded-md p-2 hover:bg-gray-200"
                    title="Mark as read"
                  >
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="rounded-md p-2 hover:bg-gray-200"
                  title="Delete"
                >
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
