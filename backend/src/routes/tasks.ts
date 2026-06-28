import { Router } from 'express';
import { dbService } from '../services/db.js';
import { priorityAgent } from '../agents/priority.js';
import { memoryAgent } from '../agents/memory.js';
import { orchestrator } from '../agents/orchestrator.js';

const router = Router();

// Get all tasks for a user
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';
  try {
    const tasks = await dbService.getCollection('tasks', userId);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch tasks', message: error.message });
  }
});

// Create task (triggers Priority and Risk calculations)
router.post('/', async (req, res) => {
  const { userId, title, deadline, estimatedDuration, complexity, importance, category } = req.body;

  try {
    const uid = userId || 'mock-user-123';
    const trace: any[] = [];
    const memory = await memoryAgent.run(uid, trace);

    // Calculate priority & explanation
    const priorityInfo = await priorityAgent.run(
      uid,
      title,
      deadline,
      estimatedDuration || 1,
      complexity || 'medium',
      importance || 5,
      category || 'Other',
      memory,
      trace
    );

    const taskDoc = {
      userId: uid,
      title,
      deadline,
      estimatedDuration: estimatedDuration || 1,
      timeSpent: 0,
      status: 'pending',
      category: category || 'Other',
      complexity: complexity || 'medium',
      priorityScore: priorityInfo.priorityScore,
      priorityExplanation: priorityInfo.explanation,
      createdAt: new Date().toISOString()
    };

    const taskId = `tsk-${Math.random().toString(36).substr(2, 9)}`;
    const createdTask = await dbService.createDocument('tasks', taskId, taskDoc);

    // Trigger Orchestrator Event Loop in the background
    orchestrator.runEventTrigger(uid, 'TASK_CREATED', createdTask).catch(console.error);

    res.status(201).json(createdTask);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create task', message: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const originalTask = await dbService.getDocument('tasks', id);
    if (!originalTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await dbService.updateDocument('tasks', id, updates);

    // If task was completed, trigger execution and reflection agents via orchestrator
    if (updates.status === 'completed' && originalTask.status !== 'completed') {
      orchestrator.runEventTrigger(originalTask.userId, 'TASK_COMPLETED', updatedTask).catch(console.error);
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update task', message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await dbService.deleteDocument('tasks', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete task', message: error.message });
  }
});

export default router;
