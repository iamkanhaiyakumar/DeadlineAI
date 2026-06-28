import { Router } from 'express';
import { memoryAgent } from '../agents/memory.js';

const router = Router();

router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';
  const trace: any[] = [];
  try {
    const memory = await memoryAgent.run(userId, trace);
    res.json(memory);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch memory profile', message: error.message });
  }
});

router.put('/', async (req, res) => {
  const userId = (req.body.userId as string) || 'mock-user-123';
  const updates = req.body.updates;
  const trace: any[] = [];

  try {
    const updated = await memoryAgent.updateMemory(userId, updates, trace);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update memory profile', message: error.message });
  }
});

export default router;
