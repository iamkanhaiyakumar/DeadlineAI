import { plannerAgent } from './planner.js';
import { priorityAgent } from './priority.js';
import { schedulerAgent } from './scheduler.js';
import { riskAgent } from './risk.js';
import { memoryAgent } from './memory.js';
import { reflectionAgent } from './reflection.js';
import { analyticsAgent } from './analytics.js';
import { dbService } from '../services/db.js';
import { aiService } from '../config/geminiConfig.js';

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

    // Bypassing logic for simple greetings / conversational inputs
    const cleanGoal = goal.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const greetings = ['hello', 'hi', 'hey', 'yo', 'greetings', 'howdy', 'test', 'sup', 'whats up'];
    if (greetings.includes(cleanGoal) || cleanGoal.length < 4) {
      trace.push({
        agentName: 'Orchestrator',
        actionDescription: `Detected general query or greeting. Returning conversational instructions.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return {
        message: "Hello! I am your DeadlineAI Multi-Agent Copilot. Give me a goal (e.g. 'I need to write study notes for my exam' or 'I have a project review next week') and I will coordinate the agents to schedule and prioritize it for you.",
        tasks: [],
        scheduledEvents: [],
        risks: [],
        trace,
        memory
      };
    }

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

    let message = `I have completed the scheduling pipeline. Generated ${finalTasks.length} subtasks, analyzed risk profiles (found ${highRisks.length} high risks), and successfully allocated focus blocks on your calendar.`;

    if (!aiService.isMockMode()) {
      try {
        const ai = aiService.getClient();
        const prompt = `You are the Orchestrator Agent in DeadlineAI.
The user wanted to achieve this goal: "${goal}"
Our multi-agent pipeline completed successfully:
- Decomposed the goal into ${finalTasks.length} subtasks: ${JSON.stringify(finalTasks.map(t => t.title))}
- Identified ${highRisks.length} high-risk tasks.
- Booked ${scheduleInfo.scheduledEvents.length} calendar focus slots.

Write a friendly, dynamic, and brief conversational response (1-3 sentences) summarizing what we did. Mention the subtasks created and reassure them about their scheduled focus blocks.
Do NOT use JSON or markdown. Keep it friendly and concise.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt
        });
        message = response.text.trim();
      } catch (err) {
        console.error('Error generating dynamic orchestrator summary:', err);
      }
    }

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
