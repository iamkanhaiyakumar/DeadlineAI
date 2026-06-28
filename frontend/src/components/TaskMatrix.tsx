import { CheckCircle2, Circle } from 'lucide-react'

export interface Task {
  id: string;
  title: string;
  deadline: string;
  priorityScore: number;
  status: 'pending' | 'completed';
  category: string;
  complexity: 'low' | 'medium' | 'high';
}

interface TaskMatrixProps {
  tasks: Task[];
  onToggleComplete: (id: string, currentStatus: string) => void;
}

export default function TaskMatrix({ tasks, onToggleComplete }: TaskMatrixProps) {
  // Sort tasks into quadrants
  const getQuadrant = (task: Task) => {
    const isUrgent = task.priorityScore >= 70
    const isImportant = task.priorityScore >= 50

    if (isUrgent && isImportant) return 'urgent-important'
    if (!isUrgent && isImportant) return 'important-not-urgent'
    if (isUrgent && !isImportant) return 'urgent-not-important'
    return 'delegate-delete'
  }

  const renderTaskItem = (task: Task) => {
    const isCompleted = task.status === 'completed'
    return (
      <div 
        key={task.id} 
        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/40 hover:bg-slate-900/80 transition-all text-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => onToggleComplete(task.id, task.status)}
            className="text-slate-500 hover:text-purple-400 shrink-0 transition-colors"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Circle className="w-4 h-4" />
            )}
          </button>
          <span className={`truncate text-slate-200 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
            {task.title}
          </span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
          task.priorityScore >= 80 
            ? 'bg-red-500/10 text-red-400' 
            : task.priorityScore >= 50 
              ? 'bg-purple-500/10 text-purple-400' 
              : 'bg-slate-500/10 text-slate-400'
        }`}>
          {task.priorityScore}
        </span>
      </div>
    )
  }

  const quadrantTasks = (quadrant: string) => tasks.filter(t => getQuadrant(t) === quadrant)

  const quadrants = [
    {
      id: 'urgent-important',
      title: 'Do First (Urgent & Important)',
      borderColor: 'border-red-500/20',
      headerBg: 'bg-red-500/10 text-red-400',
      tasks: quadrantTasks('urgent-important')
    },
    {
      id: 'important-not-urgent',
      title: 'Schedule (Important & Not Urgent)',
      borderColor: 'border-purple-500/20',
      headerBg: 'bg-purple-500/10 text-purple-400',
      tasks: quadrantTasks('important-not-urgent')
    },
    {
      id: 'urgent-not-important',
      title: 'Delegate (Urgent & Not Important)',
      borderColor: 'border-blue-500/20',
      headerBg: 'bg-blue-500/10 text-blue-400',
      tasks: quadrantTasks('urgent-not-important')
    },
    {
      id: 'delegate-delete',
      title: 'Eliminate (Neither)',
      borderColor: 'border-slate-800/40',
      headerBg: 'bg-slate-800/40 text-slate-400',
      tasks: quadrantTasks('delegate-delete')
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {quadrants.map(q => (
        <div key={q.id} className={`border ${q.borderColor} rounded-xl bg-[#090b1a]/40 flex flex-col h-[220px] overflow-hidden`}>
          <div className={`px-4 py-2.5 text-xs font-extrabold uppercase border-b border-slate-800/50 flex items-center justify-between ${q.headerBg}`}>
            <span>{q.title}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900/60 font-semibold">{q.tasks.length}</span>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {q.tasks.length > 0 ? (
              q.tasks.map(renderTaskItem)
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-600 text-[10px]">
                No tasks in this segment
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
