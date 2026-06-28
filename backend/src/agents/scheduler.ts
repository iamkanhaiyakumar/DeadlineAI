import { aiService } from '../config/geminiConfig.js';

export interface CalendarEvent {
  id?: string;
  title: string;
  startTime: string;
  endTime: string;
  isFocusSession: boolean;
  isConflict: boolean;
}

export interface SchedulerOutput {
  scheduledEvents: CalendarEvent[];
  conflicts: { eventA: string; eventB: string; time: string }[];
  explanation: string;
}

export const schedulerAgent = {
  name: 'Scheduler Agent',

  run: async (
    userId: string,
    tasks: any[],
    events: CalendarEvent[],
    trace: any[]
  ): Promise<SchedulerOutput> => {
    trace.push({
      agentName: 'Scheduler Agent',
      actionDescription: `Analyzing calendar and task deadlines to schedule focus slots...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    // 1. Core conflict detection algorithm (Rule-Based)
    const conflicts: { eventA: string; eventB: string; time: string }[] = [];
    const sortedEvents = [...events].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];
      const currentEnd = new Date(current.endTime).getTime();
      const nextStart = new Date(next.startTime).getTime();

      if (currentEnd > nextStart) {
        conflicts.push({
          eventA: current.title,
          eventB: next.title,
          time: `${new Date(next.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        });
      }
    }

    if (conflicts.length > 0) {
      trace.push({
        agentName: 'Scheduler Agent',
        actionDescription: `Detected ${conflicts.length} calendar conflicts.`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
    }

    // 2. Schedule focus slots for high-priority pending tasks
    const scheduledEvents: CalendarEvent[] = [];
    const pendingTasks = tasks
      .filter(t => t.status === 'pending')
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

    // Simple scheduling: Find a free 2-hour slot tomorrow morning/afternoon (mock algorithm)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let currentHour = 9; // Start scheduling from 9 AM tomorrow
    
    for (const task of pendingTasks.slice(0, 3)) { // Limit to top 3 tasks for daily scheduling
      // Check if slot has a conflict with existing events
      let slotStart = new Date(tomorrow);
      slotStart.setHours(currentHour, 0, 0, 0);
      let slotEnd = new Date(tomorrow);
      slotEnd.setHours(currentHour + 2, 0, 0, 0);

      // Check overlaps
      const overlaps = events.some(e => {
        const eStart = new Date(e.startTime).getTime();
        const eEnd = new Date(e.endTime).getTime();
        return (slotStart.getTime() < eEnd && slotEnd.getTime() > eStart);
      });

      if (overlaps) {
        // Shift slot to afternoon
        currentHour += 3;
        slotStart = new Date(tomorrow);
        slotStart.setHours(currentHour, 0, 0, 0);
        slotEnd = new Date(tomorrow);
        slotEnd.setHours(currentHour + 2, 0, 0, 0);
      }

      scheduledEvents.push({
        title: `Focus Session: ${task.title}`,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        isFocusSession: true,
        isConflict: false
      });

      currentHour += 2.5; // Prepare next slot
    }

    if (aiService.isMockMode()) {
      return schedulerAgent.runMock(conflicts, scheduledEvents, trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Scheduler Agent in DeadlineAI.
We have identified the following:
- Detected Conflicts: ${JSON.stringify(conflicts)}
- Proposed Focus Sessions scheduled: ${JSON.stringify(scheduledEvents.map(e => ({ title: e.title, time: `${e.startTime} to ${e.endTime}` })))}

Provide a brief, professional summary (2-3 sentences) explaining:
1. What schedule conflicts were found (if any) and how you navigated them.
2. Why you scheduled the new focus sessions at these times.
3. The benefit of these specific focus blocks.

Do NOT write JSON. Write a direct, clear paragraph.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });

      const explanation = response.text.trim();
      trace.push({
        agentName: 'Scheduler Agent',
        actionDescription: `Completed calendar optimization.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return { scheduledEvents, conflicts, explanation };
    } catch (error: any) {
      console.error('Error in Scheduler Agent:', error);
      trace.push({
        agentName: 'Scheduler Agent',
        actionDescription: `Error calling Gemini: ${error.message}. Falling back to rule-based explanation.`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
      return schedulerAgent.runMock(conflicts, scheduledEvents, trace);
    }
  },

  runMock: (conflicts: any[], scheduledEvents: CalendarEvent[], trace: any[]): SchedulerOutput => {
    let explanation = '';
    if (conflicts.length > 0) {
      explanation += `Detected schedule conflicts between meetings. We scheduled new focus sessions around these conflicts. `;
    } else {
      explanation += `No immediate calendar conflicts detected. `;
    }
    
    if (scheduledEvents.length > 0) {
      explanation += `We have reserved ${scheduledEvents.length} dedicated focus slots tomorrow to ensure high-priority tasks receive head-start attention.`;
    }

    trace.push({
      agentName: 'Scheduler Agent',
      actionDescription: `Rule-based scheduler explanation generated.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return { scheduledEvents, conflicts, explanation };
  }
};
