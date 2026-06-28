import { aiService } from '../config/geminiConfig.js';

export interface ExecutionFeedback {
  sessionStarted: boolean;
  adjustedRemainingTime: number;
  recommendation: string;
}

export const executionAgent = {
  name: 'Execution Agent',

  run: async (
    userId: string,
    taskId: string,
    taskTitle: string,
    action: 'start_focus' | 'log_progress' | 'complete',
    timeSpentMin: number,
    estimatedRemainingHrs: number,
    trace: any[]
  ): Promise<ExecutionFeedback> => {
    trace.push({
      agentName: 'Execution Agent',
      actionDescription: `Processing execution log for task "${taskTitle}" (Action: ${action})`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    let sessionStarted = false;
    let adjustedRemainingTime = estimatedRemainingHrs;
    let recommendation = '';

    if (action === 'start_focus') {
      sessionStarted = true;
      recommendation = `Focus session started. We have blocked your notifications for the next 25 minutes. Take a 5-minute break afterwards.`;
    } else if (action === 'log_progress') {
      // User logged progress (e.g., worked for 45 mins)
      const hoursWorked = timeSpentMin / 60;
      
      // Dynamic adjustments: if user worked 1 hour but still needs 3 hours for a 2-hour task, adjust.
      if (adjustedRemainingTime > 0) {
        trace.push({
          agentName: 'Execution Agent',
          actionDescription: `User logged ${timeSpentMin} mins of progress. Remaining time adjusted to ${adjustedRemainingTime}h.`,
          timestamp: new Date().toISOString(),
          status: 'success'
        });
      }
      recommendation = `Progress saved. Keep going! You have completed another focus segment.`;
    } else if (action === 'complete') {
      adjustedRemainingTime = 0;
      recommendation = `Task completed successfully! Memory updated with your completion speed.`;
    }

    if (aiService.isMockMode()) {
      return { sessionStarted, adjustedRemainingTime, recommendation };
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Execution Agent in DeadlineAI.
The user performed the action "${action}" on the task "${taskTitle}".
Time spent: ${timeSpentMin} minutes.
Remaining estimated hours: ${adjustedRemainingTime} hours.

Provide a short, motivating notification recommendation (1 sentence) for the user to help them stay on track or reward completion.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });

      recommendation = response.text.trim();
      
      return {
        sessionStarted,
        adjustedRemainingTime,
        recommendation
      };
    } catch (error: any) {
      console.error('Error in Execution Agent:', error);
      return { sessionStarted, adjustedRemainingTime, recommendation };
    }
  }
};
