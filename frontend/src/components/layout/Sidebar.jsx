import { Fragment, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Dialog, Transition } from '@headlessui/react'
import { useAuth } from '../../contexts/AuthContext'
import { getAvatarUrl } from '../../utils/imageUtils'
import { 
  XMarkIcon,
  HomeIcon,
  UserIcon,
  HeartIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
const getNavigation = (userRole) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Pets', href: '/pets', icon: HeartIcon },
    { 
      name: userRole === 'veterinarian' || userRole === 'vet' ? 'Vet Network' : 'Appointments', 
      href: '/appointments', 
      icon: CalendarIcon 
    },
    { name: 'Adoption', href: '/adoption', icon: UserIcon },
    { name: 'Shop', href: '/shop', icon: ShoppingBagIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'AI Assistant', href: '/ai-assistant', icon: SparklesIcon },
  ]
  return baseNavigation
}
const adminNavigation = [
  { name: 'Admin Panel', href: '/admin', icon: ShieldCheckIcon },
  { name: 'User Management', href: '/admin/users', icon: UserIcon },
  { name: 'Payment Providers', href: '/admin/payments', icon: Cog6ToothIcon },
  { name: 'Audit Logs', href: '/admin/audit', icon: ShieldCheckIcon },
]
export const Sidebar = ({ open, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [avatarKey, setAvatarKey] = useState(0)
  const isAdmin = user?.role === 'admin'
  useEffect(() => {
    setAvatarKey(prev => prev + 1)
  }, [user?.avatar])
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">🐾</span>
          </div>
          <span className="ml-2 text-xl font-bold text-gray-900">PetCare</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {getNavigation(user?.role).map((item) => {
          const isActive = location.pathname === item.href || 
                          (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
        {isAdmin && (
          <>
            <div className="pt-6 mt-6 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
            </div>
            {adminNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                              location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-red-100 text-red-900 border-r-2 border-red-600'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-red-600' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </>
        )}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          {user?.avatar ? (
            <img
              key={`sidebar-avatar-${avatarKey}-${user.avatar}`}
              className="h-10 w-10 rounded-full object-cover"
              src={`${getAvatarUrl(user.avatar)}?t=${Date.now()}`}
              alt={user?.name || 'User'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center"
            style={{ display: user?.avatar ? 'none' : 'flex' }}
          >
            <UserIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
  return (
    <>
      {}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>
    </>
  )
}