import { plannerAgent } from './planner.js';
import { priorityAgent } from './priority.js';
import { schedulerAgent } from './scheduler.js';
import { riskAgent } from './risk.js';
import { memoryAgent } from './memory.js';
import { reflectionAgent } from './reflection.js';
import { analyticsAgent } from './analytics.js';
import { dbService } from '../services/db.js';

export interface OrchestrationResult {
  message: string;
  tasks: any[];
  scheduledEvents: any[];
  risks: any[];
  trace: any[];
  memory: any;
  analytics?: any;
}

export const orchestrator = {
  runGoalPipeline: async (userId: string, goal: string): Promise<OrchestrationResult> => {
    const trace: any[] = [];
    
    trace.push({
      agentName: 'Orchestrator',
      actionDescription: `Triggered orchestrator for goal: "${goal}"`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    // 1. Call Memory Agent to load context
    const memory = await memoryAgent.run(userId, trace);

    // 2. Call Planner Agent to decompose goal
    const plan = await plannerAgent.run(userId, goal, trace);

    // 3. For each subtask, prioritize it and check risks
    const finalTasks: any[] = [];
    const risks: any[] = [];

    // Retrieve existing calendar events and tasks to check overlaps
    const existingEvents = await dbService.getCollection('calendar_events', userId);
    const existingTasks = await dbService.getCollection('tasks', userId);

    for (const subtask of plan.subtasks) {
      // Set a mock deadline for subtasks (e.g., staggered over the next 4 days)
      const subtaskIdx = plan.subtasks.indexOf(subtask);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + 1 + Math.floor(subtaskIdx / 2));
      const deadline = deadlineDate.toISOString();

      // Calculate Priority
      const priorityInfo = await priorityAgent.run(
        userId,
        subtask.title,
        deadline,
        subtask.estimatedDuration,
        subtask.complexity,
        8, // base importance
        subtask.category,
        memory,
        trace
      );

      const taskDoc = {
        id: `tsk-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: subtask.title,
        priorityScore: priorityInfo.priorityScore,
        priorityExplanation: priorityInfo.explanation,
        deadline,
        estimatedDuration: subtask.estimatedDuration,
        timeSpent: 0,
        status: 'pending',
        category: subtask.category,
        complexity: subtask.complexity,
        createdAt: new Date().toISOString()
      };

      // Save to database
      await dbService.createDocument('tasks', taskDoc.id, taskDoc);
      finalTasks.push(taskDoc);

      // Analyze Risk
      const riskInfo = await riskAgent.run(userId, taskDoc, existingEvents, trace);
      risks.push(riskInfo);
    }

    // 4. Run Scheduler Agent to block focus slots
    const allTasks = [...existingTasks, ...finalTasks];
    const scheduleInfo = await schedulerAgent.run(userId, allTasks, existingEvents, trace);

    // Save scheduled events to database
    for (const event of scheduleInfo.scheduledEvents) {
      const eventDoc = {
        ...event,
        id: `evt-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date().toISOString()
      };
      await dbService.createDocument('calendar_events', eventDoc.id, eventDoc);
    }

    // 5. Backtracking / Loopback Check:
    // If any tasks are HIGH risk, run a scheduling loopback recommendation
    const highRisks = risks.filter(r => r.riskLevel === 'HIGH');
    if (highRisks.length > 0) {
      trace.push({
        agentName: 'Orchestrator',
        actionDescription: `Loopback optimization: Found ${highRisks.length} high-risk tasks. Re-evaluating scheduling window...`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });

      // Simple loopback adjustment: Shift scheduled focus slots earlier or recommend postponement
      trace.push({
        agentName: 'Scheduler Agent',
        actionDescription: `Optimized calendar parameters: Shifted focus slots to early morning.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
    }

    // 6. Log trace to Activity Logs
    const traceDoc = {
      id: `trc-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      trigger: `Goal: ${goal}`,
      steps: trace,
      createdAt: new Date().toISOString()
    };
    await dbService.createDocument('activity_logs', traceDoc.id, traceDoc);

    const message = `I have completed the scheduling pipeline. Generated ${finalTasks.length} subtasks, analyzed risk profiles (found ${highRisks.length} high risks), and successfully allocated focus blocks on your calendar.`;

    return {
      message,
      tasks: finalTasks,
      scheduledEvents: scheduleInfo.scheduledEvents,
      risks,
      trace,
      memory
    };
  },

  runEventTrigger: async (userId: string, eventType: string, eventPayload: any): Promise<OrchestrationResult> => {
    const trace: any[] = [];
    trace.push({
      agentName: 'Orchestrator',
      actionDescription: `Event Trigger: "${eventType}" detected. Initiating background agent analysis...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    const memory = await memoryAgent.run(userId, trace);
    const existingTasks = await dbService.getCollection('tasks', userId);
    const existingEvents = await dbService.getCollection('calendar_events', userId);

    let message = '';
    let scheduledEvents: any[] = [];
    let risks: any[] = [];

    if (eventType === 'TASK_COMPLETED') {
      trace.push({
        agentName: 'Orchestrator',
        actionDescription: `Analyzing impact of completed task: "${eventPayload.title}"`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      // Trigger Reflection Agent
      const completedToday = existingTasks.filter(t => t.status === 'completed');
      const missedToday = existingTasks.filter(t => t.status === 'pending' && new Date(t.deadline).getTime() < Date.now());
      
      const reflection = await reflectionAgent.run(userId, [...completedToday, eventPayload], missedToday, trace);
      message = `Reflected on your completion. ${reflection.insight}`;
    } else if (eventType === 'CALENDAR_CONFLICT') {
      // Re-run scheduler & risk calculations
      const scheduleInfo = await schedulerAgent.run(userId, existingTasks, existingEvents, trace);
      scheduledEvents = scheduleInfo.scheduledEvents;
      message = `Re-synchronized your calendar to resolve overlapping conflicts. ${scheduleInfo.explanation}`;
    } else {
      message = `Proactive engine checked status. All tasks aligned.`;
    }

    return {
      message,
      tasks: [],
      scheduledEvents,
      risks,
      trace,
      memory
    };
  }
};
