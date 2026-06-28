import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  BarChart3, 
  Bell,
  Menu,
  X
} from 'lucide-react'

import Dashboard from './pages/Dashboard.tsx'
import Calendar from './pages/Calendar.tsx'
import Copilot from './pages/Copilot.tsx'
import Analytics from './pages/Analytics.tsx'

function SidebarLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'AI Copilot', path: '/copilot', icon: MessageSquare },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 }
  ]

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

        {/* User Card */}
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-800/80 bg-[#070915] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
              DU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Demo User</p>
              <p className="text-[10px] text-slate-500 truncate">Mock Mode Active</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Decorative glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none -z-10" />

        {/* Top Header */}
        <header className="h-14 border-b border-slate-800/60 bg-[#060814]/80 backdrop-blur-md flex items-center justify-between px-4 z-10 shrink-0">
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

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/40 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Main Pages */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>
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
