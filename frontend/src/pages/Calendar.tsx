import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, RefreshCw, AlertCircle, Clock, Zap, Link2, CheckCircle2 } from 'lucide-react'

export default function Calendar() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [authError, setAuthError] = useState('')

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

  const fetchCalendarEvents = async () => {
    const activeUid = getUserId()
    try {
      const res = await fetch(`http://localhost:5000/api/calendar?userId=${activeUid}`)
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
    
    // Check if redirecting back from a successful sync
    const params = new URLSearchParams(window.location.search)
    if (params.get('sync') === 'success') {
      setSyncSuccess(true)
      // Clear URL params cleanly
      window.history.replaceState({}, document.title, window.location.pathname)
      // Hide banner after 5 seconds
      setTimeout(() => setSyncSuccess(false), 5000)
    }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setAuthError('')
    const activeUid = getUserId()
    try {
      await fetch('http://localhost:5000/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUid })
      })
      await fetchCalendarEvents()
    } catch (err) {
      console.error(err)
    } finally {
      setSyncing(false)
    }
  }

  const handleLinkGoogle = async () => {
    setAuthError('')
    try {
      const res = await fetch('http://localhost:5000/api/auth/google/url')
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setAuthError(data.error || 'Google Client ID / Client Secret are not configured in your backend .env file.')
      }
    } catch (err) {
      console.error(err)
      setAuthError('Failed to contact auth server. Make sure the backend is running.')
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Calendar Timeline
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review focus blocks and synchronizations with Google Calendar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleLinkGoogle}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-750 text-xs flex items-center gap-2 transition-all font-semibold"
          >
            <Link2 className="w-4 h-4" />
            <span>Link Google Calendar</span>
          </button>
          
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2.5 rounded-xl border border-purple-500/20 bg-purple-600/10 text-purple-400 font-semibold hover:bg-purple-600/20 text-xs flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Re-optimizing schedule...' : 'Sync Calendar'}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {syncSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs font-semibold animate-pulse">
          <CheckCircle2 className="w-5 h-5" />
          <span>Google Calendar connected successfully! Live events synced.</span>
        </div>
      )}

      {/* Error Alert */}
      {authError && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Configuration Needed</p>
            <p className="text-red-300/80 leading-relaxed">{authError}</p>
          </div>
        </div>
      )}

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
                      
                      {/* Vertical line indicator */}
                      <div className={`w-[2px] self-stretch rounded ${isFocus ? 'bg-purple-500' : 'bg-slate-700'}`} />

                      <div>
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          {isFocus && <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
                          {evt.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Focus Block</span>
                        </p>
                      </div>
                    </div>

                    {isFocus && (
                      <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold uppercase px-2 py-0.5 rounded">
                        Active Focus
                      </span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-slate-600 text-xs">
                No events found. Link your Google Calendar to sync real events.
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar details */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl relative border-purple-500/20 glow-primary">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span>Conflict Analyzer</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your Scheduler Agent runs conflict-resolution algorithms to protect deep focus blocks.
            </p>
            <div className="p-3.5 rounded-xl bg-purple-950/10 border border-purple-500/10 space-y-2 text-xs">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Total Focus Booked</span>
                <span className="font-bold text-purple-400">
                  {events.filter(e => e.isFocusSession).length * 2} hours
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Conflicts Detected</span>
                <span className="font-bold text-emerald-400">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
