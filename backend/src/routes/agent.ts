import { Router } from 'express';
import { orchestrator } from '../agents/orchestrator.js';
import { dbService } from '../services/db.js';

const router = Router();

// Copilot Chat / Goal Decomposition endpoint
router.post('/copilot', async (req, res) => {
  const { userId, message } = req.body;
  const uid = userId || 'mock-user-123';

  if (!message) {
    return res.status(400).json({ error: 'Message/Goal is required' });
  }

  try {
    console.log(`>>> Agent Copilot received request for: "${message}"`);
    const result = await orchestrator.runGoalPipeline(uid, message);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Agent execution failed', message: error.message });
  }
});

// Fetch active agent traces for visualizer panel
router.get('/traces', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';
  try {
    const logs = await dbService.getCollection('activity_logs', userId);
    // Sort by latest
    const sorted = logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(sorted.slice(0, 10)); // return last 10 traces
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch activity traces', message: error.message });
  }
});

export default router;
