import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
import { getAvatarUrl } from '../../utils/imageUtils'
import { 
  Bars3Icon, 
  BellIcon,
  UserCircleIcon, 
  ChevronDownIcon,
  HeartIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
export const Header = ({ onMenuClick, onNotificationClick }) => {
  const { user, logout } = useAuth()
  const { unreadCount } = useSocket()
  const [avatarKey, setAvatarKey] = useState(0)
  useEffect(() => {
    setAvatarKey(prev => prev + 1)
  }, [user?.avatar])
  const handleLogout = async () => {
    await logout()
  }
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <Link to="/dashboard" className="flex items-center ml-4 lg:ml-0">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🐾</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">PetCare</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={onNotificationClick}
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                {user?.avatar ? (
                  <img
                    key={`avatar-${avatarKey}-${user.avatar}`}
                    className="h-8 w-8 rounded-full object-cover"
                    src={`${getAvatarUrl(user.avatar)}?t=${Date.now()}`}
                    alt={user?.name || 'User'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center"
                  style={{ display: user?.avatar ? 'none' : 'flex' }}
                >
                  <UserCircleIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/profile"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          <UserCircleIcon className="h-4 w-4 mr-3" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/favorites"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700`}
                        >
                          <HeartIcon className="h-4 w-4 mr-3" />
                          My Favorites
                        </Link>
                      )}
                    </Menu.Item>
                    <hr className="my-1" />
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}