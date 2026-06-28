import { aiService } from '../config/geminiConfig.js';
import { dbService } from '../services/db.js';

export interface UserMemory {
  userId: string;
  preferredWorkingHours: { start: number; end: number };
  preferredMeetingTimes: string;
  workStyle: string;
  avgFocusDuration: number;
  categoryDelays: { [category: string]: number };
  lastReflectedAt: string;
}

export const memoryAgent = {
  name: 'Memory Agent',

  run: async (userId: string, trace: any[]): Promise<UserMemory> => {
    trace.push({
      agentName: 'Memory Agent',
      actionDescription: `Loading and analyzing long-term user memory profile...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    // Fetch memory from db
    const memories = await dbService.getCollection('ai_memory', userId);
    let memory: UserMemory;

    if (memories.length > 0) {
      memory = memories[0];
    } else {
      // Default memory schema
      memory = {
        userId,
        preferredWorkingHours: { start: 9, end: 18 },
        preferredMeetingTimes: 'mornings',
        workStyle: 'Prefers long uninterrupted deep work slots (1.5h - 2h)',
        avgFocusDuration: 1.5,
        categoryDelays: { Study: 0.15, Work: 0.05, Personal: 0.0 },
        lastReflectedAt: new Date().toISOString()
      };
      await dbService.createDocument('ai_memory', `mem-${userId}`, memory);
    }

    trace.push({
      agentName: 'Memory Agent',
      actionDescription: `Loaded user profile. Work style: "${memory.workStyle}". Preferred hours: ${memory.preferredWorkingHours.start}:00 to ${memory.preferredWorkingHours.end}:00.`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    return memory;
  },

  updateMemory: async (userId: string, updates: Partial<UserMemory>, trace: any[]): Promise<UserMemory> => {
    trace.push({
      agentName: 'Memory Agent',
      actionDescription: `Updating user profile memory...`,
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    const memories = await dbService.getCollection('ai_memory', userId);
    let updated: UserMemory;

    if (memories.length > 0) {
      updated = await dbService.updateDocument('ai_memory', memories[0].id, updates);
    } else {
      const newMem = {
        userId,
        preferredWorkingHours: { start: 9, end: 18 },
        preferredMeetingTimes: 'mornings',
        workStyle: 'Prefers long focus slots',
        avgFocusDuration: 1.5,
        categoryDelays: {},
        lastReflectedAt: new Date().toISOString(),
        ...updates
      };
      updated = await dbService.createDocument('ai_memory', `mem-${userId}`, newMem);
    }

    return updated;
  }
};
