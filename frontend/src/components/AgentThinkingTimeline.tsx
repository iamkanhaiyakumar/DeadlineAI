import { CheckCircle2, AlertTriangle, PlayCircle, Loader2 } from 'lucide-react'

export interface TraceStep {
  agentName: string;
  actionDescription: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'running';
}

interface AgentThinkingTimelineProps {
  steps: TraceStep[];
  isThinking?: boolean;
}

export default function AgentThinkingTimeline({ steps, isThinking = false }: AgentThinkingTimelineProps) {
  if (steps.length === 0 && !isThinking) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 h-full">
        <PlayCircle className="w-8 h-8 mb-2 opacity-30 text-purple-400" />
        <span className="text-xs font-medium">Ready. Launch a goal to inspect agent traces.</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Agent Reasoning Logs</h3>
        {isThinking && (
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Coordinating agents...</span>
          </div>
        )}
      </div>

      <div className="relative pl-4 border-l border-slate-800 space-y-4 max-h-[350px] overflow-y-auto pr-2">
        {steps.map((step, idx) => {
          const isSuccess = step.status === 'success'
          const isWarning = step.status === 'warning'
          const time = new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

          return (
            <div key={idx} className="relative group">
              {/* Timeline marker */}
              <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${
                isSuccess ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'
              }`} />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    {step.agentName}
                    {isSuccess ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.actionDescription}</p>
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">{time}</span>
              </div>
            </div>
          )
        })}

        {isThinking && (
          <div className="relative group animate-pulse">
            <div className="absolute -left-[20px] top-1 w-2 h-2 rounded-full bg-purple-500" />
            <div className="flex items-start gap-4">
              <div>
                <h4 className="text-xs font-bold text-purple-400">Orchestrator</h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Processing loop feedback parameters...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
