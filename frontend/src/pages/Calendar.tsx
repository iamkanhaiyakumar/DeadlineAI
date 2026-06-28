import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, RefreshCw, AlertCircle, Clock, Zap } from 'lucide-react'

export default function Calendar() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchCalendarEvents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/calendar')
      const data = await res.json()
      // Sort chronologically
      const sorted = data.sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      setEvents(sorted)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendarEvents()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('http://localhost:5000/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'mock-user-123' })
      })
      await fetchCalendarEvents()
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Calendar Timeline
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review focus blocks and synchronizations with Google Calendar.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2.5 rounded-xl border border-purple-500/20 bg-purple-600/10 text-purple-400 font-semibold hover:bg-purple-600/20 text-xs flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Re-optimizing schedule...' : 'Sync Calendar'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Timeline Events list (2 columns) */}
        <div className="xl:col-span-2 glass-panel p-5 rounded-2xl space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
            <CalendarIcon className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-slate-200">Daily Timeline</span>
          </div>

          <div className="space-y-4">
            {events.length > 0 ? (
              events.map(evt => {
                const sTime = new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const eTime = new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isFocus = evt.isFocusSession

                return (
                  <div 
                    key={evt.id} 
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      isFocus 
                        ? 'bg-purple-950/10 border-purple-500/25 shadow-sm glow-primary' 
                        : 'bg-slate-900/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Left time blocks */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-slate-200">{sTime}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{eTime}</p>
                      </div>
                      
                      {/* Vertical separator */}
                      <div className={`w-0.5 h-8 rounded-full ${isFocus ? 'bg-purple-500' : 'bg-slate-700'}`} />

                      {/* Event details */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{evt.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isFocus ? 'Focus Block (Auto-scheduled)' : 'Regular Appointment'}</span>
                        </p>
                      </div>
                    </div>

                    {isFocus && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-extrabold uppercase flex items-center gap-1">
                        <Zap className="w-3 h-3 text-purple-400 fill-current" />
                        <span>AI Co-Pilot</span>
                      </span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                No events scheduled. Trigger sync to load calendar items.
              </div>
            )}
          </div>
        </div>

        {/* Right Info Sidebar (1 column) */}
        <div className="glass-panel p-6 rounded-2xl h-fit space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800/80">
            <AlertCircle className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-slate-200">Scheduling Insight</span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-3">
            <p>
              The **Scheduler Agent** continuously monitors calendar events. 
              When a new meeting request is detected, it runs a conflict scanner.
            </p>
            <p>
              If a meeting clashes with an existing focus session, the Scheduler automatically:
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-300">
              <li>Identifies another available work block.</li>
              <li>Re-allocates the focus slot for that task.</li>
              <li>Updates your Google Calendar and Google Tasks in real time.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
