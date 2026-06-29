import { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  BarChart3, 
  Bell, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  Link2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

import Dashboard from './pages/Dashboard.tsx'
import Calendar from './pages/Calendar.tsx'
import Copilot from './pages/Copilot.tsx'
import Analytics from './pages/Analytics.tsx'

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Dynamic User state
  const [user, setUser] = useState<any>({
    id: 'mock-user-123',
    displayName: 'Demo User',
    email: 'prepwise.demo@gmail.com',
    googleOAuthTokens: null
  })
  const [userModalOpen, setUserModalOpen] = useState(false)

  // Dynamic Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Copilot', path: '/copilot', icon: MessageSquare },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 }
  ]

  // Fetch session and notifications
  const fetchSessionAndNotifications = async () => {
    try {
      // 1. Fetch user session
      const uRes = await fetch(`http://localhost:5000/api/auth/session/mock-user-123`)
      if (uRes.ok) {
        const uData = await uRes.json()
        if (uData.user) setUser(uData.user)
      }

      // 2. Fetch notifications
      const nRes = await fetch(`http://localhost:5000/api/notifications?userId=mock-user-123`)
      if (nRes.ok) {
        const nData = await nRes.json()
        setNotifications(nData)
      }
    } catch (err) {
      console.error('Error fetching layout data:', err)
    }
  }

  useEffect(() => {
    fetchSessionAndNotifications()
    // Poll notifications every 10 seconds to make it feel real-time/active
    const interval = setInterval(fetchSessionAndNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, { method: 'PUT' })
      // Update local state instantly
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (err) {
      console.error(err)
    }
  }

  const handleLinkGoogle = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/google/url')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Google OAuth Client ID/Secret are not configured in your backend .env file.')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to authentication server.')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex h-screen bg-[#060814] text-slate-100 overflow-hidden">
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative z-20 h-full flex flex-col
        border-r border-slate-800/80 bg-[#090b1a]
        transition-all duration-300 ease-in-out shrink-0
        ${sidebarOpen ? 'w-56 xl:w-64' : 'w-0 lg:w-16 overflow-hidden'}
      `}>
        {/* Logo */}
        <div className={`p-4 border-b border-slate-800/80 flex items-center gap-3 ${!sidebarOpen && 'lg:justify-center'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shrink-0">
            D
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent truncate">
                DeadlineAI
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Multi-Agent OS</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!sidebarOpen ? item.name : undefined}
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${!sidebarOpen ? 'lg:justify-center' : ''}
                  ${isActive 
                    ? 'bg-purple-600/10 border border-purple-500/20 text-purple-400 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Card (Interactive profile click) */}
        {sidebarOpen && (
          <button 
            onClick={() => setUserModalOpen(true)}
            className="p-3 border-t border-slate-800/80 bg-[#070915] flex items-center gap-3 w-full hover:bg-slate-900/60 transition-colors text-left"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="profile" className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                DU
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {user.googleOAuthTokens?.accessToken ? 'Linked to Google' : 'Local Sandbox Mode'}
              </p>
            </div>
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Decorative glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/60 bg-[#060814]/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0 relative">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400 font-semibold tracking-wide hidden sm:block">Autonomous Engine Active</span>
            </div>
          </div>

          {/* Bell & User Control */}
          <div className="flex items-center gap-3" ref={notifRef}>
            {/* Bell Button */}
            <button 
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className={`p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/40 relative transition-all ${notifDropdownOpen ? 'bg-slate-800/60 text-slate-100' : ''}`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[8px] font-extrabold rounded-full bg-purple-600 text-white leading-none scale-90">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Icon Button for Profile Modal */}
            <button 
              onClick={() => setUserModalOpen(true)}
              className="w-8 h-8 rounded-full border border-slate-800/80 bg-slate-900/60 hover:border-slate-700/85 hover:bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all"
            >
              <UserIcon className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown Panel */}
            {notifDropdownOpen && (
              <div className="absolute right-4 top-13 w-80 glass-panel rounded-2xl p-4 shadow-xl border border-slate-800 bg-[#0b0e22]/95 z-55 max-h-[380px] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] text-purple-400 font-semibold">{unreadCount} unread alerts</span>
                  )}
                </div>

                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div 
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          notif.read 
                            ? 'bg-slate-950/20 border-slate-850/40 opacity-70' 
                            : 'bg-purple-950/10 border-purple-500/20 hover:border-purple-500/40 glow-primary'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-1">
                          {notif.type === 'alert' || notif.type === 'risk_alert' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          )}
                          <h4 className="text-[11px] font-bold text-slate-200 leading-tight">{notif.title}</h4>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal line-clamp-3">
                          {notif.message}
                        </p>
                        <span className="text-[8px] text-slate-500 block mt-1.5">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-600 text-xs">
                      No notifications yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>

      {/* User Profile / Sign In Modal */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-black/75 z-60 flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl relative border border-slate-850 bg-[#090b1a]/95 shadow-2xl">
            <button 
              onClick={() => setUserModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 text-2xl font-bold mx-auto mb-3 shadow-lg">
                {user.displayName.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{user.displayName}</h3>
              <p className="text-xs text-slate-400 mt-1">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/30 border border-slate-850/40 text-xs">
                <span className="font-bold text-slate-400 block mb-1">Calendar Link Status</span>
                {user.googleOAuthTokens?.accessToken ? (
                  <p className="text-emerald-400 font-semibold flex items-center gap-1.5 mt-1">
                    <CheckCircle className="w-4 h-4" />
                    Connected to Google Calendar API
                  </p>
                ) : (
                  <div>
                    <p className="text-amber-400 font-semibold flex items-center gap-1.5 mt-1 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      Google Calendar disconnected
                    </p>
                    <button 
                      onClick={() => {
                        setUserModalOpen(false)
                        handleLinkGoogle()
                      }}
                      className="w-full py-2.5 rounded-xl bg-purple-650 hover:bg-purple-700 text-white font-bold transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Link with Google Account
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => {
                  setUser({
                    id: 'mock-user-123',
                    displayName: 'Demo User',
                    email: 'prepwise.demo@gmail.com',
                    googleOAuthTokens: null
                  })
                  setUserModalOpen(false)
                }}
                className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-semibold transition-all text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Reset Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function App() {
  return (
    <Router>
      <SidebarLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/copilot" element={<Copilot />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </SidebarLayout>
    </Router>
  )
}

export default App
