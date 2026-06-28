import { aiService } from '../config/geminiConfig.js';

export interface PriorityOutput {
  priorityScore: number;
  explanation: string;
  urgency: number;
  importance: number;
}

export const priorityAgent = {
  name: 'Priority Agent',

  run: async (
    userId: string,
    taskTitle: string,
    deadline: string,
    estimatedDuration: number,
    complexity: 'low' | 'medium' | 'high',
    userImportance: number, // 1 to 10
    category: string,
    memory: any,
    trace: any[]
  ): Promise<PriorityOutput> => {
    trace.push({
      agentName: 'Priority Agent',
      actionDescription: `Evaluating priority rating for task: "${taskTitle}"`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    // 1. Calculate Urgency based on remaining time
    const now = Date.now();
    const deadlineTime = new Date(deadline).getTime();
    const msRemaining = deadlineTime - now;
    const hoursRemaining = msRemaining / (1000 * 60 * 60);

    let urgency = 1;
    if (hoursRemaining <= 0) {
      urgency = 10; // Already overdue
    } else if (hoursRemaining <= 12) {
      urgency = 10;
    } else if (hoursRemaining <= 24) {
      urgency = 9.5;
    } else if (hoursRemaining <= 48) {
      urgency = 8.5;
    } else if (hoursRemaining <= 72) {
      urgency = 7;
    } else if (hoursRemaining <= 168) {
      urgency = 5; // Within a week
    } else {
      urgency = 2; // Further away
    }

    // 2. Adjust based on Complexity multiplier
    let complexityMultiplier = 1.0;
    if (complexity === 'high') complexityMultiplier = 1.3;
    else if (complexity === 'low') complexityMultiplier = 0.8;

    // 3. User Historical Delay factor (from Memory Agent)
    let delayFactor = 1.0;
    if (memory && memory.categoryDelays && memory.categoryDelays[category]) {
      delayFactor += memory.categoryDelays[category]; // e.g., +0.1 for high delay
    }

    // 4. Calculate Raw Priority Score (0-100)
    // Formula balances urgency, importance, complexity, and historical delay
    const importance = userImportance || 5;
    let rawScore = (urgency * 6 + importance * 4) * complexityMultiplier * delayFactor;

    // Cap score at 100
    const priorityScore = Math.min(Math.max(Math.round(rawScore), 1), 100);

    if (aiService.isMockMode()) {
      return priorityAgent.runMock(taskTitle, deadline, priorityScore, urgency, importance, trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Priority Agent in DeadlineAI.
Explain the Priority Score assigned to this task.
Task Title: "${taskTitle}"
Priority Score: ${priorityScore}/100
Urgency Rating: ${urgency.toFixed(1)}/10
Importance Rating: ${importance}/10
Estimated Time: ${estimatedDuration} hours
Category: ${category}

Provide a short explanation (2-3 sentences) detailing:
1. Why the task has this priority.
2. Why it matters *now*.
3. The risk or consequence if the user ignores it.

Do NOT include any formatting like JSON, markdown headings, or bullet points. Just write a single plain paragraph.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
      });

      const explanation = response.text.trim();
      trace.push({
        agentName: 'Priority Agent',
        actionDescription: `Calculated priority score: ${priorityScore}/100 with explanation.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return { priorityScore, explanation, urgency, importance };
    } catch (error: any) {
      console.error('Error in Priority Agent:', error);
      trace.push({
        agentName: 'Priority Agent',
        actionDescription: `Error calling Gemini: ${error.message}. Falling back to rule-based explanation.`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
      return priorityAgent.runMock(taskTitle, deadline, priorityScore, urgency, importance, trace);
    }
  },

  runMock: (
    taskTitle: string,
    deadline: string,
    priorityScore: number,
    urgency: number,
    importance: number,
    trace: any[]
  ): PriorityOutput => {
    let explanation = `This task is rated ${priorityScore}/100. `;
    const daysLeft = Math.round((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (priorityScore >= 80) {
      explanation += `The deadline is extremely close (${daysLeft <= 0 ? 'overdue' : `in ${daysLeft} days`}) and the task has high importance. Ignoring this immediately risks missing the deadline and disrupting dependent workflows.`;
    } else if (priorityScore >= 50) {
      explanation += `This task is moderately urgent with a deadline in ${daysLeft} days. It should be scheduled in upcoming focus blocks to prevent a bottleneck as the deadline approaches.`;
    } else {
      explanation += `The deadline is relatively far away (${daysLeft} days) with low current urgency. It is safe to postpone in favor of higher priority tasks.`;
    }

    trace.push({
      agentName: 'Priority Agent',
      actionDescription: `Rule-based priority explanation generated. Score: ${priorityScore}/100.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return { priorityScore, explanation, urgency, importance };
  }
};
