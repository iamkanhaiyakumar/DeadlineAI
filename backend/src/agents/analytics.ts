import { aiService } from '../config/geminiConfig.js';

export interface ProductivityReport {
  period: 'daily' | 'weekly' | 'monthly';
  completionRate: number;
  focusHours: number;
  averageTaskDuration: number;
  burnoutScore: number; // 0 to 100
  categoryDistribution: { name: string; value: number }[];
  productivityTrend: { day: string; tasksCompleted: number; focusMins: number }[];
  insights: string[];
}

export const analyticsAgent = {
  name: 'Analytics Agent',

  run: async (
    userId: string,
    tasks: any[],
    completedTasks: any[],
    trace: any[]
  ): Promise<ProductivityReport> => {
    trace.push({
      agentName: 'Analytics Agent',
      actionDescription: `Compiling productivity analytics and computing burnout risk index...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    const totalTasks = tasks.length;
    const completedCount = completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // Calculate simulated focus hours (each completed task counts as estimated duration)
    const focusHours = completedTasks.reduce((sum, t) => sum + (t.estimatedDuration || 1), 0);
    const averageTaskDuration = completedCount > 0 ? parseFloat((focusHours / completedCount).toFixed(1)) : 0;

    // Calculate Burnout Score (0 - 100) based on task completion and workload density
    // High focus hours combined with high task count increases burnout risk.
    const workloadDensity = tasks.reduce((sum, t) => sum + (t.estimatedDuration || 1), 0);
    let burnoutScore = 20; // baseline
    if (workloadDensity > 8) burnoutScore += 30; // too much work planned
    if (focusHours > 6) burnoutScore += 20; // high active work
    if (completionRate < 50 && totalTasks > 5) burnoutScore += 15; // stress of falling behind
    burnoutScore = Math.min(burnoutScore, 100);

    // Compute Category Distribution
    const catMap: { [cat: string]: number } = {};
    tasks.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + 1;
    });
    const categoryDistribution = Object.keys(catMap).map(cat => ({
      name: cat,
      value: catMap[cat]
    }));

    // Mock trend line (past 5 days)
    const productivityTrend = [
      { day: 'Mon', tasksCompleted: Math.max(1, completedCount - 2), focusMins: 120 },
      { day: 'Tue', tasksCompleted: Math.max(2, completedCount - 1), focusMins: 180 },
      { day: 'Wed', tasksCompleted: Math.max(1, completedCount), focusMins: 240 },
      { day: 'Thu', tasksCompleted: Math.max(3, completedCount + 1), focusMins: 300 },
      { day: 'Fri', tasksCompleted: completedCount, focusMins: focusHours * 60 }
    ];

    if (aiService.isMockMode()) {
      return analyticsAgent.runMock(completionRate, focusHours, averageTaskDuration, burnoutScore, categoryDistribution, productivityTrend, trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the Analytics Agent in DeadlineAI.
Analyze the user's productivity data:
- Completion Rate: ${completionRate}%
- Active Focus Hours: ${focusHours} hours
- Average Task Duration: ${averageTaskDuration} hours
- Burnout Risk Score: ${burnoutScore}/100

Generate 3 actionable, highly professional bullet-point insights for the user's dashboard (e.g. suggesting breaks, acknowledging high focus, advising on workload limits).
Return ONLY a valid JSON array of strings:
["Insight 1", "Insight 2", "Insight 3"]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const insights = JSON.parse(response.text.trim());
      trace.push({
        agentName: 'Analytics Agent',
        actionDescription: `Productivity trend compiled. Burnout index: ${burnoutScore}%.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      return {
        period: 'weekly',
        completionRate,
        focusHours,
        averageTaskDuration,
        burnoutScore,
        categoryDistribution,
        productivityTrend,
        insights
      };
    } catch (error: any) {
      console.error('Error in Analytics Agent:', error);
      return analyticsAgent.runMock(completionRate, focusHours, averageTaskDuration, burnoutScore, categoryDistribution, productivityTrend, trace);
    }
  },

  runMock: (
    completionRate: number,
    focusHours: number,
    averageTaskDuration: number,
    burnoutScore: number,
    categoryDistribution: any[],
    productivityTrend: any[],
    trace: any[]
  ): ProductivityReport => {
    const insights = [
      `Your completion rate is at ${completionRate}%. Try breaking remaining complex tasks into smaller 30-min segments to build momentum.`,
      `Focus active hours logged: ${focusHours}h. Maintain a strict buffer of 10-minute breaks every hour to lower your ${burnoutScore}% burnout index.`,
      `Most productive slots occur during morning hours. Plan deep-work focus sessions accordingly.`
    ];

    trace.push({
      agentName: 'Analytics Agent',
      actionDescription: `Rule-based productivity insights compiled.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return {
      period: 'weekly',
      completionRate,
      focusHours,
      averageTaskDuration,
      burnoutScore,
      categoryDistribution,
      productivityTrend,
      insights
    };
  }
};
