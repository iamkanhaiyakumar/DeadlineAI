import { useMemo } from 'react'
import { Brain, Layers, ShieldAlert, Calendar, UserCheck, RefreshCw, Cpu } from 'lucide-react'
import type { TraceStep } from './AgentThinkingTimeline.tsx'

interface AgentGraphProps {
  steps: TraceStep[]
  isThinking: boolean
}

export default function AgentGraph({ steps, isThinking }: AgentGraphProps) {
  // Determine which agent is currently active by looking at the latest trace step
  const activeAgent = useMemo(() => {
    if (!isThinking || steps.length === 0) return null
    const latestStep = steps[steps.length - 1]
    return latestStep.agentName
  }, [steps, isThinking])

  // Get completed agents (which have appeared in trace steps)
  const completedAgents = useMemo(() => {
    return new Set(steps.map(s => s.agentName))
  }, [steps])

  const agentNodes = [
    { name: 'Memory Agent', icon: UserCheck, angle: 0, desc: 'User Profiler' },
    { name: 'Planner Agent', icon: Layers, angle: 60, desc: 'Task Decomposer' },
    { name: 'Priority Agent', icon: Cpu, angle: 120, desc: 'Eisenhower Scorer' },
    { name: 'Risk Prediction Agent', icon: ShieldAlert, angle: 180, desc: 'Failure Predictor' },
    { name: 'Scheduler Agent', icon: Calendar, angle: 240, desc: 'Focus Slot Booker' },
    { name: 'Reflection Agent', icon: RefreshCw, angle: 300, desc: 'Retrospective Analyzer' }
  ]

  // Render SVG connector line with dynamic pulse animations
  const renderConnector = (angle: number, isActive: boolean) => {
    const rad = (angle * Math.PI) / 180
    // Center of graph is at (120, 120)
    const startX = 120
    const startY = 120
    // Radius of outer nodes is 90
    const endX = 120 + 85 * Math.cos(rad)
    const endY = 120 + 85 * Math.sin(rad)

    return (
      <g key={angle}>
        {/* Static Line */}
        <line 
          x1={startX} 
          y1={startY} 
          x2={endX} 
          y2={endY} 
          stroke={isActive ? 'url(#activeGrad)' : 'rgba(255, 255, 255, 0.08)'} 
          strokeWidth={isActive ? '2' : '1'}
          className="transition-all duration-500"
        />
        {/* Pulsing signal bullet running from Orchestrator to Agent node */}
        {isActive && (
          <circle r="3.5" fill="#a855f7" className="glow-primary">
            <animateMotion 
              path={`M ${startX} ${startY} L ${endX} ${endY}`} 
              dur="1.2s" 
              repeatCount="indefinite" 
            />
          </circle>
        )}
      </g>
    )
  }

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-[#070918]/60 shrink-0 min-h-[320px]">
      {/* Glow definitions for SVG */}
      <svg className="absolute w-0 h-0">
        <defs>
          <linearGradient id="activeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 self-start">
        Agent Network Topography
      </span>

      {/* Network Plot */}
      <div className="relative w-[240px] h-[240px]">
        {/* SVG Connector Lines Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 240 240">
          {agentNodes.map(node => {
            const isActive = activeAgent === node.name
            return renderConnector(node.angle, isActive)
          })}
        </svg>

        {/* Center Node: Orchestrator */}
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 border flex flex-col items-center justify-center shadow-2xl transition-all duration-500 z-10 ${
            isThinking 
              ? 'border-purple-400 scale-105 shadow-purple-500/25 animate-pulse' 
              : 'border-slate-800'
          }`}
          title="Orchestrator (Reasoning Coordinator)"
        >
          <Brain className={`w-6 h-6 text-white ${isThinking ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span className="text-[7px] font-extrabold uppercase mt-1 text-white tracking-widest">CO-ORD</span>
        </div>

        {/* Outer Agent Nodes */}
        {agentNodes.map(node => {
          const rad = (node.angle * Math.PI) / 180
          // Plot nodes in circle around Orchestrator
          const x = 120 + 85 * Math.cos(rad)
          const y = 120 + 85 * Math.sin(rad)
          
          const isActive = activeAgent === node.name
          const isComplete = completedAgents.has(node.name)
          const Icon = node.icon

          return (
            <div 
              key={node.name}
              style={{ left: `${x}px`, top: `${y}px` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 cursor-default border group z-10 ${
                isActive 
                  ? 'bg-purple-950/80 border-purple-500 text-purple-400 scale-110 shadow-lg shadow-purple-500/25 glow-primary' 
                  : isComplete
                  ? 'bg-slate-900/90 border-indigo-500/40 text-indigo-400' 
                  : 'bg-slate-950/60 border-slate-900 text-slate-600 opacity-60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />
              
              {/* Tooltip/Label */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 bottom-11 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded px-2 py-1 pointer-events-none whitespace-nowrap z-20">
                <p className="font-bold text-slate-100">{node.name}</p>
                <p className="text-[8px] text-purple-400">{node.desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* active trace summary */}
      {isThinking && activeAgent && (
        <div className="mt-4 text-center">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Active Agent Processing</p>
          <p className="text-xs text-slate-200 font-semibold mt-0.5">{activeAgent}</p>
        </div>
      )}
    </div>
  )
}
