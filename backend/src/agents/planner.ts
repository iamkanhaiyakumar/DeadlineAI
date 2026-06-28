import { aiService } from '../config/geminiConfig.js';

export interface PlannedSubtask {
  title: string;
  estimatedDuration: number; // in hours
  complexity: 'low' | 'medium' | 'high';
  category: string;
}

export interface PlannerOutput {
  subtasks: PlannedSubtask[];
  executionStrategy: string;
}

export const plannerAgent = {
  name: 'Planner Agent',

  run: async (userId: string, goal: string, trace: any[]): Promise<PlannerOutput> => {
    trace.push({
      agentName: 'Planner Agent',
      actionDescription: `Decomposing user goal: "${goal}"`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    if (aiService.isMockMode()) {
      return plannerAgent.runMock(goal, trace);
    }

    try {
      const ai = aiService.getClient();
      const prompt = `You are the specialized Planner Agent in DeadlineAI.
Your goal is to take a high-level productivity goal and decompose it into 4-6 smaller, actionable, concrete subtasks.
For each subtask, estimate the time required in hours (decimal values allowed, e.g. 1.5) and classify the complexity (low, medium, high).
Also, provide an overall "executionStrategy" summarizing how the user should approach these tasks.

User Goal: "${goal}"

Return ONLY a valid JSON object matching the following structure:
{
  "subtasks": [
    { "title": "subtask name", "estimatedDuration": 2.5, "complexity": "medium", "category": "Work|Study|Personal|Other" }
  ],
  "executionStrategy": "Brief high-level strategy overview"
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
        agentName: 'Planner Agent',
        actionDescription: `Successfully generated execution plan with ${result.subtasks?.length || 0} subtasks.`,
        timestamp: new Date().toISOString(),
        status: 'success'
      });
      return result;
    } catch (error: any) {
      console.error('Error in Planner Agent:', error);
      trace.push({
        agentName: 'Planner Agent',
        actionDescription: `Error calling Gemini: ${error.message}. Falling back to rule-based planner.`,
        timestamp: new Date().toISOString(),
        status: 'warning'
      });
      return plannerAgent.runMock(goal, trace);
    }
  },

  runMock: (goal: string, trace: any[]): PlannerOutput => {
    const goalLower = goal.toLowerCase();
    let subtasks: PlannedSubtask[] = [];
    let strategy = '';

    if (goalLower.includes('interview')) {
      subtasks = [
        { title: 'Update and Review Resume', estimatedDuration: 1.5, complexity: 'medium', category: 'Work' },
        { title: 'Practice Core DSA Algorithms', estimatedDuration: 3, complexity: 'high', category: 'Study' },
        { title: 'Prepare Answers for Behavioral HR Questions', estimatedDuration: 2, complexity: 'medium', category: 'Study' },
        { title: 'Research Target Company & Products', estimatedDuration: 1.5, complexity: 'low', category: 'Work' },
        { title: 'Conduct Mock Interview Session', estimatedDuration: 2, complexity: 'high', category: 'Personal' }
      ];
      strategy = 'Focus on review early, drill coding questions in the middle, and research the company the day before the interview.';
    } else if (goalLower.includes('exam') || goalLower.includes('study') || goalLower.includes('test')) {
      subtasks = [
        { title: 'Create Chapter Summary & Study Notes', estimatedDuration: 3, complexity: 'medium', category: 'Study' },
        { title: 'Solve Mock Test & Practice Questions', estimatedDuration: 2.5, complexity: 'high', category: 'Study' },
        { title: 'Review Weak Subjects & Formula Sheets', estimatedDuration: 1.5, complexity: 'medium', category: 'Study' },
        { title: 'Run Flashcard Study Session', estimatedDuration: 1, complexity: 'low', category: 'Study' }
      ];
      strategy = 'Break study modules into pomodoro chunks, tackling the hardest concepts first while your energy levels are high.';
    } else if (goalLower.includes('report') || goalLower.includes('paper') || goalLower.includes('writing')) {
      subtasks = [
        { title: 'Gather References & Literature Sources', estimatedDuration: 2, complexity: 'low', category: 'Work' },
        { title: 'Draft Outline and Structure', estimatedDuration: 1, complexity: 'medium', category: 'Work' },
        { title: 'Write Initial Content Draft', estimatedDuration: 4, complexity: 'high', category: 'Work' },
        { title: 'Proofread, Format and Edit Reference List', estimatedDuration: 1.5, complexity: 'medium', category: 'Work' }
      ];
      strategy = 'Complete the outline and gathering phase quickly to avoid writer block, then dedicate a large uninterrupted block to continuous drafting.';
    } else {
      // Generic breakdown
      subtasks = [
        { title: 'Initial Planning & Requirements Gathering', estimatedDuration: 1.5, complexity: 'low', category: 'Other' },
        { title: 'Core Execution Phase (Deep Work)', estimatedDuration: 4, complexity: 'high', category: 'Other' },
        { title: 'Review, Refinement & Polishing', estimatedDuration: 2, complexity: 'medium', category: 'Other' }
      ];
      strategy = 'Organize the core tasks sequentially. Ensure you block focused study/work windows free from distraction.';
    }

    trace.push({
      agentName: 'Planner Agent',
      actionDescription: `Rule-based decomposition generated ${subtasks.length} subtasks.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return { subtasks, executionStrategy: strategy };
  }
};
