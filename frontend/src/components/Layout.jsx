import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getAvatarUrl } from '../utils/imageUtils'
import {
  HomeIcon,
  HeartIcon,
  CalendarIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { NotificationPanel } from './layout/NotificationPanel'
export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        onNotificationClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
      />
      <div className="flex">
        <Sidebar 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        <main className="flex-1 p-6 lg:ml-64">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <NotificationPanel 
        open={notificationPanelOpen}
        onClose={() => setNotificationPanelOpen(false)}
      />
    </div>
  )
}