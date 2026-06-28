import { aiService } from '../config/geminiConfig.js';

export interface ReflectionInsight {
  completedCount: number;
  missedCount: number;
  insight: string;
  tomorrowActionPlan: string;
}

export const reflectionAgent = {
  name: 'Reflection Agent',

  run: async (
    userId: string,
    completedTasks: any[],
    missedTasks: any[],
    trace: any[]
  ): Promise<ReflectionInsight> => {
    trace.push({
      agentName: 'Reflection Agent',
      actionDescription: `Running nightly reflection and analyzing daily productivity metrics...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    const completedCount = completedTasks.length;
    const missedCount = missedTasks.length;

    if (aiService.isMockMode()) {
      return reflectionAgent.runMock(completedCount, missedCount, trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Reflection Agent in DeadlineAI.
Analyze the user's daily performance:
- Completed Tasks: ${completedCount}
- Missed/Delayed Tasks: ${missedCount}

Provide:
1. A smart productivity insight (e.g., noting if meetings overrun, or identifying peak focus hours).
2. A concrete tomorrow action plan (e.g., recommend moving coding blocks to the morning).

Return a valid JSON object matching this structure:
{
  "insight": "Insight about user performance trends",
  "tomorrowActionPlan": "Actionable checklist or recommendation for tomorrow"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text.trim());
      trace.push({
        agentName: 'Reflection Agent',
        actionDescription: `Nightly reflection completed. Insight: "${result.insight}"`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return {
        completedCount,
        missedCount,
        insight: result.insight,
        tomorrowActionPlan: result.tomorrowActionPlan
      };
    } catch (error: any) {
      console.error('Error in Reflection Agent:', error);
      return reflectionAgent.runMock(completedCount, missedCount, trace);
    }
  },

  runMock: (completedCount: number, missedCount: number, trace: any[]): ReflectionInsight => {
    let insight = '';
    let tomorrowActionPlan = '';

    if (completedCount === 0 && missedCount === 0) {
      insight = 'No activity logged today. Let\'s make progress tomorrow!';
      tomorrowActionPlan = 'Plan your top 3 tasks for tomorrow morning.';
    } else if (missedCount > 0) {
      insight = `You completed ${completedCount} tasks but missed ${missedCount} tasks today. Data indicates meetings exceeded planned durations, fragmenting your afternoon focus blocks.`;
      tomorrowActionPlan = 'Move high-priority coding or writing sessions to tomorrow morning before calendar sync calls begin.';
    } else {
      insight = `Excellent work! You achieved a 100% task completion rate today (${completedCount}/${completedCount}). Your focus depth was optimal.`;
      tomorrowActionPlan = 'Maintain this momentum. Schedule another 90-minute focus session tomorrow morning for complex tasks.';
    }

    trace.push({
      agentName: 'Reflection Agent',
      actionDescription: `Rule-based nightly reflection insight generated.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return { completedCount, missedCount, insight, tomorrowActionPlan };
  }
};
