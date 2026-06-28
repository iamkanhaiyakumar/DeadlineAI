import { aiService } from '../config/geminiConfig.js';

export interface RiskAnalysis {
  taskId: string;
  taskTitle: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  availableHours: number;
  requiredHours: number;
  explanation: {
    why: string;
    whyNow: string;
    riskIfIgnored: string;
  };
  recommendation: string;
}

export const riskAgent = {
  name: 'Risk Prediction Agent',

  run: async (
    userId: string,
    task: any,
    events: any[],
    trace: any[]
  ): Promise<RiskAnalysis> => {
    trace.push({
      agentName: 'Risk Prediction Agent',
      actionDescription: `Analyzing failure risk for task: "${task.title}"`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    const now = Date.now();
    const deadlineTime = new Date(task.deadline).getTime();
    const msRemaining = deadlineTime - now;
    const hoursRemaining = Math.max(0, msRemaining / (1000 * 60 * 60));

    // 1. Calculate available hours in calendar before deadline (Simulated logic)
    // Assume 30% of total remaining time is available as free work hours, or count actual gaps
    // For a 24 hour period, assume max 6 hours of work.
    let availableWorkHours = 0;
    if (hoursRemaining <= 24) {
      // Calculate how many free hours exist between now and tomorrow (simulate calendar check)
      // Suppose we have 2 hours free.
      availableWorkHours = Math.max(1, Math.min(hoursRemaining * 0.3, 4));
    } else {
      availableWorkHours = Math.max(2, hoursRemaining * 0.25);
    }

    const requiredHours = task.estimatedDuration || 2;
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (requiredHours > availableWorkHours) {
      riskLevel = 'HIGH';
    } else if (requiredHours > availableWorkHours * 0.7) {
      riskLevel = 'MEDIUM';
    }

    if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') {
      trace.push({
        agentName: 'Risk Prediction Agent',
        actionDescription: `Warning: Predicted ${riskLevel} risk of missing deadline for "${task.title}".`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
    }

    if (aiService.isMockMode()) {
      return riskAgent.runMock(task.id, task.title, riskLevel, availableWorkHours, requiredHours, daysLeftString(hoursRemaining), trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Risk Prediction Agent in DeadlineAI.
Analyze the risk of a user failing to complete a task before its deadline.

Task Title: "${task.title}"
Required Work Hours: ${requiredHours} hours
Available Calendar Work Hours Before Deadline: ${availableWorkHours.toFixed(1)} hours
Time Remaining Until Deadline: ${hoursRemaining.toFixed(1)} hours
Calculated Risk Level: ${riskLevel}

Provide an analysis in valid JSON matching this exact structure:
{
  "explanation": {
    "why": "Clear explanation of why this risk level was assigned",
    "whyNow": "Explanation of why this requires attention right now",
    "riskIfIgnored": "What will happen if the user ignores this warning"
  },
  "recommendation": "Concrete recommendation (e.g. 'Postpone meeting X' or 'Start 2h focus session now')"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text.trim());
      
      return {
        taskId: task.id,
        taskTitle: task.title,
        riskLevel,
        availableHours: parseFloat(availableWorkHours.toFixed(1)),
        requiredHours,
        explanation: result.explanation,
        recommendation: result.recommendation
      };
    } catch (error: any) {
      console.error('Error in Risk Agent:', error);
      trace.push({
        agentName: 'Risk Prediction Agent',
        actionDescription: `Error calling Gemini: ${error.message}. Falling back to rule-based risk prediction.`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
      return riskAgent.runMock(task.id, task.title, riskLevel, availableWorkHours, requiredHours, daysLeftString(hoursRemaining), trace);
    }
  },

  runMock: (
    taskId: string,
    taskTitle: string,
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH',
    availableHours: number,
    requiredHours: number,
    timeLeftStr: string,
    trace: any[]
  ): RiskAnalysis => {
    let why = '';
    let whyNow = '';
    let riskIfIgnored = '';
    let recommendation = '';

    const avail = parseFloat(availableHours.toFixed(1));

    if (riskLevel === 'HIGH') {
      why = `You need ${requiredHours} hours to finish this task, but you only have ${avail} hours of unallocated time on your calendar before the deadline.`;
      whyNow = `The deadline is approaching rapidly. Overlapping appointments leave you with insufficient time.`;
      riskIfIgnored = `You will fail to submit or complete "${taskTitle}" on time, causing project delays.`;
      recommendation = `We highly recommend rescheduling tomorrow's non-urgent meetings or splitting this task into smaller chunks.`;
    } else if (riskLevel === 'MEDIUM') {
      why = `You have ${avail} available hours, which is just barely enough to cover the estimated ${requiredHours} hours needed.`;
      whyNow = `Any minor delay or calendar expansion (like a meeting overrunning) will push you into the high-risk zone.`;
      riskIfIgnored = `You will have to rush to complete the work, leading to lower quality or potential last-minute stress.`;
      recommendation = `Start a Pomodoro focus block today to secure early progress.`;
    } else {
      why = `You have ${avail} available hours, which is well above the ${requiredHours} hours required.`;
      whyNow = `You have ample preparation time.`;
      riskIfIgnored = `No immediate critical threat, but keeping procrastination in check is always advised.`;
      recommendation = `Ensure you stick to your scheduled focus blocks to complete this smoothly.`;
    }

    trace.push({
      agentName: 'Risk Prediction Agent',
      actionDescription: `Rule-based risk analysis compiled. Risk: ${riskLevel}.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return {
      taskId,
      taskTitle,
      riskLevel,
      availableHours: avail,
      requiredHours,
      explanation: { why, whyNow, riskIfIgnored },
      recommendation
    };
  }
};

function daysLeftString(hours: number): string {
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} days`;
  return `${Math.round(hours)} hours`;
}
