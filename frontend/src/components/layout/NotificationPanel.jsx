import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useSocket } from '../../contexts/SocketContext'
import { 
  XMarkIcon,
  BellIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '../../utils/cn'
const priorityIcons = {
  high: ExclamationTriangleIcon,
  medium: InformationCircleIcon,
  low: BellIcon
}
const priorityColors = {
  high: 'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-blue-600 bg-blue-100'
}
export const NotificationPanel = ({ open, onClose }) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useSocket()
  const handleMarkAsRead = (notificationId) => {
    markNotificationRead(notificationId)
  }
  const handleClearAll = () => {
    clearAllNotifications()
  }
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Notifications
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            onClick={onClose}
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      {notifications.length > 0 && (
                        <div className="mt-4">
                          <button
                            onClick={handleClearAll}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 px-4 sm:px-6">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                          <BellIcon className="h-12 w-12 mb-4" />
                          <p className="text-lg font-medium">No notifications</p>
                          <p className="text-sm">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notifications.map((notification) => {
                            const PriorityIcon = priorityIcons[notification.priority] || BellIcon
                            return (
                              <div
                                key={notification._id}
                                className={cn(
                                  'p-4 rounded-lg border transition-colors',
                                  notification.isRead
                                    ? 'bg-gray-50 border-gray-200'
                                    : 'bg-white border-primary-200 shadow-sm'
                                )}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={cn(
                                    'flex-shrink-0 p-2 rounded-full',
                                    priorityColors[notification.priority]
                                  )}>
                                    <PriorityIcon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn(
                                      'text-sm font-medium',
                                      notification.isRead ? 'text-gray-600' : 'text-gray-900'
                                    )}>
                                      {notification.title}
                                    </p>
                                    <p className={cn(
                                      'text-sm mt-1',
                                      notification.isRead ? 'text-gray-500' : 'text-gray-700'
                                    )}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <button
                                      onClick={() => handleMarkAsRead(notification._id)}
                                      className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                                      title="Mark as read"
                                    >
                                      <CheckIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}