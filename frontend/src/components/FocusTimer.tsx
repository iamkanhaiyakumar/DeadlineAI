import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Zap, Target } from 'lucide-react'

interface FocusTimerProps {
  activeTask: any;
  onSessionComplete: (taskId: string, timeSpentMin: number) => void;
}

export default function FocusTimer({ activeTask, onSessionComplete }: FocusTimerProps) {
  const [seconds, setSeconds] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [isBreak, setIsBreak] = useState(false)

  useEffect(() => {
    let interval: any = null
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds(s => s - 1)
      }, 1000)
    } else if (seconds === 0) {
      setIsActive(false)
      if (!isBreak) {
        // Pomodoro complete
        if (activeTask) {
          onSessionComplete(activeTask.id, 25)
        }
        setIsBreak(true)
        setSeconds(5 * 60) // 5 min break
      } else {
        setIsBreak(false)
        setSeconds(25 * 60) // 25 min work
      }
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isActive, seconds, isBreak, activeTask])

  const toggle = () => setIsActive(!isActive)
  const reset = () => {
    setIsActive(false)
    setIsBreak(false)
    setSeconds(25 * 60)
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remains = secs % 60
    return `${mins.toString().padStart(2, '0')}:${remains.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 sm:p-5 border border-purple-500/20 rounded-xl bg-purple-950/10 flex flex-wrap items-center justify-between gap-4 glow-primary">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100">
            {isBreak ? 'Take a Break!' : activeTask ? `Focus Session: ${activeTask.title}` : 'Start Focus Work'}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-purple-500" />
            <span>{isBreak ? 'Relax for 5 minutes' : activeTask ? `Remaining estimate: ${activeTask.estimatedDuration}h` : 'Select a task from your dashboard'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Timer display */}
        <span className="text-2xl font-black font-mono tracking-wider text-slate-100 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl">
          {formatTime(seconds)}
        </span>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggle}
            className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-all ${
              isActive 
                ? 'bg-amber-600/20 border-amber-500/30 text-amber-400 hover:bg-amber-600/30' 
                : 'bg-purple-600 border-purple-500 text-white hover:bg-purple-700 hover:shadow-lg hover:glow-primary'
            }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button 
            onClick={reset}
            className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
