import React, { useState, useEffect } from 'react'
import { 
  Zap, 
  Clock, 
  PlusCircle, 
  AlertTriangle, 
  CheckSquare,
  Sparkles,
  Info
} from 'lucide-react'
import TaskMatrix from '../components/TaskMatrix.tsx'
import type { Task } from '../components/TaskMatrix.tsx'
import FocusTimer from '../components/FocusTimer.tsx'

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [briefing, setBriefing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingBrief, setGeneratingBrief] = useState(false)

  // Task creation state
  const [newTitle, setNewTitle] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newDuration, setNewDuration] = useState(2)
  const [newComplexity, setNewComplexity] = useState<'low' | 'medium' | 'high'>('medium')
  const [newImportance, setNewImportance] = useState(5)
  const [newCategory, setNewCategory] = useState('Work')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getUserId = () => {
    const raw = localStorage.getItem('deadlineai_user')
    if (raw) {
      try {
        const u = JSON.parse(raw)
        return u.id || 'mock-user-123'
      } catch (e) {}
    }
    return 'mock-user-123'
  }

  const fetchDashboardData = async () => {
    const activeUid = getUserId()
    try {
      // 1. Fetch Tasks for current active workspace user
      const tRes = await fetch(`http://localhost:5000/api/tasks?userId=${activeUid}`)
      const tData = await tRes.json()
      setTasks(tData)

      // 2. Fetch Notifications
      const nRes = await fetch(`http://localhost:5000/api/notifications?userId=${activeUid}`)
      const nData = await nRes.json()
      setNotifications(nData)

      const latestBrief = nData.find((n: any) => n.type === 'daily_brief')
      if (latestBrief) {
        setBriefing(latestBrief)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleGenerateBriefing = async () => {
    setGeneratingBrief(true)
    const activeUid = getUserId()
    try {
      const res = await fetch('http://localhost:5000/api/notifications/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUid })
      })
      const data = await res.json()
      setBriefing(data.notification)
      // Refresh dashboard notifications
      fetchDashboardData()
    } catch (err) {
      console.error(err)
    } finally {
      setGeneratingBrief(false)
    }
  }

  const handleToggleComplete = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      fetchDashboardData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newDeadline) return

    setIsSubmitting(true)
    const activeUid = getUserId()
    try {
      await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUid,
          title: newTitle,
          deadline: new Date(newDeadline).toISOString(),
          estimatedDuration: newDuration,
          complexity: newComplexity,
          importance: newImportance,
          category: newCategory
        })
      })
      setNewTitle('')
      setNewDeadline('')
      fetchDashboardData()
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFocusComplete = async (taskId: string, timeSpent: number) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSpent, status: 'completed' })
      })
      fetchDashboardData()
    } catch (err) {
      console.error(err)
    }
  }

  const activeTaskForTimer = tasks.find(t => t.status === 'pending' && t.priorityScore >= 75)
  const riskAlerts = notifications.filter(n => n.type === 'alert' || n.type === 'risk_alert')

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome header & Briefing trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Workspace Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage deadlines, schedule focus blocks, and review AI suggestions.</p>
        </div>
        <button 
          onClick={handleGenerateBriefing}
          disabled={generatingBrief}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{generatingBrief ? 'Generating briefing...' : 'Generate Daily AI Briefing'}</span>
        </button>
      </div>

      {/* AI Daily Briefing Panel */}
      {briefing && (
        <div className="glass-panel p-5 rounded-2xl relative border-purple-500/20 glow-primary">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-200">{briefing.title}</h3>
          </div>
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/30 p-4 rounded-xl border border-slate-800/40">
            {briefing.message}
          </div>
          {briefing.reflection && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-3 border-t border-slate-800/50 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Completed tasks today: {briefing.reflection.completedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Overdue/Missed: {briefing.reflection.missedCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Briefing Date: {new Date(briefing.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Focus Timer */}
      <FocusTimer activeTask={activeTaskForTimer} onSessionComplete={handleFocusComplete} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Task Matrix & Task Creation */}
        <div className="xl:col-span-2 space-y-6">
          {/* Task Matrix */}
          <div className="glass-panel p-6 rounded-2xl relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-400" />
                <span>Eisenhower Priority Matrix</span>
              </h3>
            </div>
            <TaskMatrix tasks={tasks} onToggleComplete={handleToggleComplete} />
          </div>

          {/* Quick Task Creation */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-400" />
              <span>Create New Task</span>
            </h3>
            <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">Task Title / Goal</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Finalize quarterly financial reports" 
                  className="w-full px-4 py-2.5 glass-input text-sm" 
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Deadline Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={newDeadline} 
                  onChange={e => setNewDeadline(e.target.value)} 
                  className="w-full px-4 py-2.5 glass-input text-sm" 
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Estimated Hours</label>
                <input 
                  type="number" 
                  value={newDuration} 
                  onChange={e => setNewDuration(parseFloat(e.target.value))} 
                  step="0.5" 
                  min="0.5" 
                  className="w-full px-4 py-2.5 glass-input text-sm" 
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Importance (1-10)</label>
                <input 
                  type="number" 
                  value={newImportance} 
                  onChange={e => setNewImportance(parseInt(e.target.value))} 
                  min="1" 
                  max="10"
                  className="w-full px-4 py-2.5 glass-input text-sm" 
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Category</label>
                <select 
                  value={newCategory} 
                  onChange={e => setNewCategory(e.target.value)} 
                  className="w-full px-4 py-2.5 glass-input text-sm"
                >
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Complexity</label>
                <select 
                  value={newComplexity} 
                  onChange={e => setNewComplexity(e.target.value as any)} 
                  className="w-full px-4 py-2.5 glass-input text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="col-span-2 pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Calculating priorities...' : 'Add Task & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: AI Suggestions & Looming Deadlines */}
        <div className="space-y-6">
          {/* AI Suggestions (Explainable AI Panel) */}
          <div className="glass-panel p-6 rounded-2xl relative border-purple-500/20 glow-primary">
            <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
              <span>Proactive AI Suggestions</span>
            </h3>
            <div className="space-y-4">
              {riskAlerts.length > 0 ? (
                riskAlerts.map(alert => (
                  <div key={alert.id} className="p-4 rounded-xl bg-purple-950/15 border border-purple-500/20 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <h4 className="text-xs font-bold text-slate-200">{alert.title}</h4>
                    </div>
                    <p className="text-[11px] text-purple-300 font-medium">{alert.recommendation || alert.message}</p>
                    
                    {/* Explainable AI block if risk parameters exist */}
                    {alert.riskLevel && (
                      <div className="border-t border-purple-500/10 pt-2 space-y-1.5 text-[10px]">
                        <div>
                          <span className="font-bold text-purple-400">Why?</span>
                          <p className="text-slate-400 leading-normal">{alert.message}</p>
                        </div>
                        {alert.recommendation && (
                          <div>
                            <span className="font-bold text-purple-400">Action Plan:</span>
                            <p className="text-slate-400 leading-normal">{alert.recommendation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-600 text-xs">
                  All systems green. No active risk warnings.
                </div>
              )}
            </div>
          </div>

          {/* Looming Deadlines list */}
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span>Looming Deadlines</span>
            </h3>
            <div className="space-y-3">
              {tasks.filter(t => t.status === 'pending').slice(0, 4).map(task => {
                const hoursLeft = Math.round((new Date(task.deadline).getTime() - Date.now()) / (1000 * 60 * 60))
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Category: {task.category}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      hoursLeft < 24 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {hoursLeft <= 0 ? 'Overdue' : `${hoursLeft}h left`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
