import { Router } from 'express';
import { dbService } from '../services/db.js';
import { orchestrator } from '../agents/orchestrator.js';
import { googleCalendarService } from '../services/googleCalendar.js';

const router = Router();

// Get calendar events
router.get('/', async (req, res) => {
  const userId = (req.query.userId as string) || 'mock-user-123';
  try {
    // Attempt real Google Calendar fetch first
    await googleCalendarService.fetchGoogleEvents(userId).catch(console.error);

    const events = await dbService.getCollection('calendar_events', userId);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch calendar events', message: error.message });
  }
});

// Sync calendar and check for conflicts
router.post('/sync', async (req, res) => {
  const { userId } = req.body;
  const uid = userId || 'mock-user-123';

  try {
    // Proactively run event-driven sync
    const result = await orchestrator.runEventTrigger(uid, 'CALENDAR_CONFLICT', {});
    res.json({
      message: 'Calendar synchronized and optimized.',
      scheduledEvents: result.scheduledEvents,
      trace: result.trace
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Calendar sync failed', message: error.message });
  }
});

// Create manual calendar event
router.post('/', async (req, res) => {
  const { userId, title, startTime, endTime, isFocusSession } = req.body;
  const uid = userId || 'mock-user-123';

  try {
    const eventDoc = {
      userId: uid,
      title,
      startTime,
      endTime,
      isFocusSession: isFocusSession || false,
      isConflict: false,
      createdAt: new Date().toISOString()
    };

    const id = `evt-${Math.random().toString(36).substr(2, 9)}`;
    const createdEvent = await dbService.createDocument('calendar_events', id, eventDoc);

    // Trigger conflict check in the background
    orchestrator.runEventTrigger(uid, 'CALENDAR_CONFLICT', createdEvent).catch(console.error);

    res.status(201).json(createdEvent);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create calendar event', message: error.message });
  }
});

export default router;
