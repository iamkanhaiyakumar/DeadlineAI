import { useState } from 'react'
import { Brain, Layers, ShieldAlert, Calendar, UserCheck, RefreshCw, Cpu, ChevronLeft, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "DeadlineAI",
      subtitle: "Autonomous Multi-Agent Productivity OS",
      tag: "THE ELEVATOR PITCH",
      content: (
        <div className="space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-2xl mx-auto animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            A production-grade, proactive productivity operating system that coordinates a team of specialized AI agents to plan, prioritize, check risks, and schedule focus blocks before deadlines are missed.
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold text-slate-400">
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">7 Specialized Agents</span>
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">Google Gemini & Calendar</span>
            <span className="bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">Firebase Firestore</span>
          </div>
        </div>
      )
    },
    {
      title: "The Problem We Solve",
      subtitle: "Passive Reminders Are Easy to Ignore",
      tag: "THE CHALLENGE",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="glass-panel p-6 rounded-2xl border-red-500/10 bg-red-950/5">
            <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Traditional Tools (Passive)</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Send alarms or notifications that are easily dismissed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Require manual task entry and timing splits.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Do not check calendar occupancy or conflict overlaps.</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-emerald-500/10 bg-emerald-950/5">
            <h4 className="text-emerald-400 font-bold text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>DeadlineAI (Proactive)</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Automatically decomposes goals into actionable subtasks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Predicts failure risks if scheduled time is insufficient.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span>Saves focus blocks directly to your live Google Calendar.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Multi-Agent Architecture",
      subtitle: "7 Agents Coordinating Under One Orchestrator",
      tag: "AGENTIC AI DEPTH",
      content: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { name: 'Memory Agent', icon: UserCheck, desc: 'Tracks working preferences & historical category delays.' },
            { name: 'Planner Agent', icon: Layers, desc: 'Uses Gemini to decompose goals into concrete subtasks.' },
            { name: 'Priority Agent', icon: Cpu, desc: 'Scores tasks (0-100) using Eisenhower urgency indicators.' },
            { name: 'Risk Agent', icon: ShieldAlert, desc: 'Alerts user when required duration exceeds calendar free slots.' },
            { name: 'Scheduler Agent', icon: Calendar, desc: 'Pushes optimized focus sessions directly to Google Calendar.' },
            { name: 'Reflection Agent', icon: RefreshCw, desc: 'Runs nightly retrospectives on workloads and completions.' }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-800 text-center space-y-2 bg-[#070918]/40 hover:border-purple-500/25 transition-all">
              <item.icon className="w-6 h-6 text-purple-400 mx-auto" />
              <h5 className="text-[11px] font-bold text-slate-200">{item.name}</h5>
              <p className="text-[9px] text-slate-500 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Google & Database Stack",
      subtitle: "Enterprise-Ready Technical Integration",
      tag: "THE TECH STACK",
      content: (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200">1. Google Gemini AI</h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Powers all agent reasoning loops, Eisenhower score explanations, and daily briefings.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200">2. Google Calendar API</h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Connects via OAuth 2.0. Fetches live conflicts and schedules Violet deep-work focus sessions.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 space-y-1.5">
              <h5 className="text-xs font-bold text-slate-200">3. Firebase Firestore</h5>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Provides real-time cloud data persistence for task logs, user memory, and notifications.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-purple-950/15 border border-purple-500/25 flex items-center justify-between text-xs max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-purple-400 font-semibold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Full try-catch fallback limits failover. Server will not crash.</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Thank You!",
      subtitle: "Empowering Users to Beat Every Deadline",
      tag: "FINALE",
      content: (
        <div className="space-y-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-purple-650/15 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '4s' }} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Ready to Deploy & Scale</h3>
          <p className="text-xs text-slate-400 leading-relaxed text-slate-300">
            Thank you for reviewing **DeadlineAI**. We are committed to building proactive, agentic productivity tools that make life easier and deadlines stress-free.
          </p>
          <div className="pt-2 flex justify-center gap-6 text-[10px] text-slate-500 font-semibold">
            <span>GitHub: @iamkanhaiyakumar</span>
            <span>Stack: Gemini • Firebase • OAuth</span>
          </div>
        </div>
      )
    }
  ]

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  const slide = slides[currentSlide]

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between max-w-5xl mx-auto relative px-4">
      {/* Glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Slide Header Info */}
      <div className="text-center pt-8 space-y-2 shrink-0">
        <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold uppercase px-3 py-1 rounded-full tracking-widest">
          {slide.tag}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mt-3">
          {slide.title}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm font-medium">{slide.subtitle}</p>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex items-center justify-center py-8">
        {slide.content}
      </div>

      {/* Slide Footer Navigation */}
      <div className="pb-8 flex items-center justify-between border-t border-slate-800/60 pt-4 shrink-0">
        <span className="text-[10px] text-slate-500 font-bold tracking-wider">
          Slide {currentSlide + 1} of {slides.length}
        </span>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrev}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-750 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-500/10"
          >
            <span>Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
