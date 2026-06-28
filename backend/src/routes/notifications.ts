import { Router } from 'express';
import { dbService } from '../services/db.js';
import { reflectionAgent } from '../agents/reflection.js';
import { riskAgent } from '../agents/risk.js';

const router = Router();

// Get all notifications for a user
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';
  try {
    const notifications = await dbService.getCollection('notifications', userId);
    const sorted = notifications.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sorted);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await dbService.updateDocument('notifications', id, { read: true });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification', message: error.message });
  }
});

// Generate AI Daily Briefing
router.post('/briefing', async (req, res) => {
  const userId = (req.body.userId as string) || 'mock-user-123';
  const trace: any[] = [];

  try {
    const allTasks = await dbService.getCollection('tasks', userId);
    const pendingTasks = allTasks.filter((t: any) => t.status === 'pending');
    const completedTasks = allTasks.filter((t: any) => t.status === 'completed');
    const overdueTasks = pendingTasks.filter((t: any) =>
      new Date(t.deadline).getTime() < Date.now()
    );
    const dueTodayTasks = pendingTasks.filter((t: any) => {
      const deadline = new Date(t.deadline);
      const today = new Date();
      return deadline.toDateString() === today.toDateString();
    });

    // Run Risk analysis for top pending tasks
    const risks = [];
    for (const task of pendingTasks.slice(0, 3)) {
      const risk = await riskAgent.run(userId, task, [], trace);
      if (risk.riskLevel !== 'LOW') {
        risks.push(risk);
      }
    }

    // Run nightly reflection
    const reflection = await reflectionAgent.run(userId, completedTasks, overdueTasks, trace);

    // Build briefing message
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const briefingText = [
      `${greeting}! Here is your AI daily briefing.`,
      `[TASKS] You have ${pendingTasks.length} pending tasks, ${dueTodayTasks.length} due today, and ${overdueTasks.length} overdue.`,
      risks.length > 0
        ? `[ALERT] ${risks.length} task(s) are at HIGH or MEDIUM risk of missing their deadline.`
        : '[OK] No immediate deadline risks detected.',
      `[ACTION] ${reflection.tomorrowActionPlan}`
    ].join('\n');

    // Save as notification
    const notifDoc = {
      userId,
      title: `${greeting} — Daily AI Briefing`,
      message: briefingText,
      read: false,
      type: 'daily_brief',
      risks,
      reflection,
      pendingCount: pendingTasks.length,
      dueTodayCount: dueTodayTasks.length,
      overdueCount: overdueTasks.length,
      createdAt: new Date().toISOString()
    };

    const id = `notif-${Math.random().toString(36).substr(2, 9)}`;
    const saved = await dbService.createDocument('notifications', id, notifDoc);

    res.json({ briefing: briefingText, notification: saved, trace });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate briefing', message: error.message });
  }
});

// Generate risk alerts for all pending tasks
router.post('/alerts', async (req, res) => {
  const userId = (req.body.userId as string) || 'mock-user-123';
  const trace: any[] = [];
  const generatedAlerts: any[] = [];

  try {
    const tasks = await dbService.getCollection('tasks', userId);
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');

    for (const task of pendingTasks) {
      const risk = await riskAgent.run(userId, task, [], trace);
      if (risk.riskLevel === 'HIGH') {
        const notifDoc = {
          userId,
          title: `🚨 High Risk Alert: ${task.title}`,
          message: risk.explanation.why,
          read: false,
          type: 'alert',
          riskLevel: risk.riskLevel,
          taskId: task.id,
          recommendation: risk.recommendation,
          createdAt: new Date().toISOString()
        };
        const id = `notif-${Math.random().toString(36).substr(2, 9)}`;
        const saved = await dbService.createDocument('notifications', id, notifDoc);
        generatedAlerts.push(saved);
      }
    }

    res.json({ alerts: generatedAlerts, count: generatedAlerts.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate alerts', message: error.message });
  }
});

export default router;
