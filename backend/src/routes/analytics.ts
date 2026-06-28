import { Router } from 'express';
import { dbService } from '../services/db.js';
import { analyticsAgent } from '../agents/analytics.js';

const router = Router();

router.get('/report', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';

  try {
    const allTasks = await dbService.getCollection('tasks', userId);
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    const trace: any[] = [];

    const report = await analyticsAgent.run(userId, allTasks, completedTasks, trace);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to compile productivity analytics', message: error.message });
  }
});

export default router;
