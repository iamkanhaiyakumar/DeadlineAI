import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, ShieldCheck, Flame } from 'lucide-react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'

export default function Analytics() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const fetchReport = async () => {
      const activeUid = getUserId()
      try {
        const res = await fetch(`http://localhost:5000/api/analytics/report?userId=${activeUid}`)
        const data = await res.json()
        setReport(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981']

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Productivity Analytics
        </h2>
        <p className="text-slate-400 text-sm mt-1">Review completion rates, task categories, and burnout stress index.</p>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completion Rate</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{report.completionRate}%</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Focus Duration</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{report.focusHours} hrs</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Avg Task Duration</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{report.averageTaskDuration} hrs</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>

        <div className={`glass-panel p-5 rounded-2xl flex items-center justify-between border ${
          report.burnoutScore >= 60 ? 'border-red-500/20' : 'border-slate-800/80'
        }`}>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Burnout Stress Index</span>
            <h3 className={`text-2xl font-black mt-1 ${report.burnoutScore >= 60 ? 'text-red-400' : 'text-slate-100'}`}>
              {report.burnoutScore}%
            </h3>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            report.burnoutScore >= 60 
              ? 'bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse' 
              : 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400'
          }`}>
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly Productivity Trend */}
        <div className="xl:col-span-2 glass-panel p-5 rounded-2xl flex flex-col">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Productivity Focus Trend</h4>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={report.productivityTrend}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#090b1a', border: '1px solid #1e293b', borderRadius: '8px', color: '#cbd5e1', fontSize: 11 }} 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (Donut chart) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Workload Allocation</h4>
          <div className="flex-1 min-h-[220px] flex items-center justify-center">
            {report.categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={report.categoryDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {report.categoryDistribution.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#090b1a', border: '1px solid #1e293b', borderRadius: '8px', color: '#cbd5e1', fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-600 text-xs text-center">No categorizations computed.</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] mt-4">
            {report.categoryDistribution.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Insights */}
      <div className="glass-panel p-6 rounded-2xl">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Flame className="w-5 h-5 text-purple-400" />
          <span>Analytics Agent Focus Suggestions</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {report.insights.map((insight: string, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs leading-relaxed text-slate-300">
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
