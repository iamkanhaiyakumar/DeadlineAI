import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Firebase Admin if configuration is provided
let db: any = null;
let isMock = true;

// Mock database storage for out-of-the-box local development
const mockStorage: { [collection: string]: any[] } = {
  users: [],
  tasks: [],
  calendar_events: [],
  ai_memory: [],
  ai_suggestions: [],
  productivity_reports: [],
  notifications: [],
  activity_logs: []
};

// Insert some default mock data for local demo
mockStorage.tasks = [
  {
    id: 'task-1',
    userId: 'mock-user-123',
    title: 'Review System Design Docs',
    priorityScore: 85,
    priorityExplanation: 'Deadline tomorrow and complexity is high. Ignoring this will delay the project kickoff.',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    estimatedDuration: 4, // 4 hours
    timeSpent: 0,
    status: 'pending',
    parentTaskId: null,
    subtasks: [],
    category: 'Work',
    complexity: 'high',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    userId: 'mock-user-123',
    title: 'Prepare DSA Practice Questions',
    priorityScore: 60,
    priorityExplanation: 'Deadline in 3 days. High importance but medium urgency.',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedDuration: 3,
    timeSpent: 0,
    status: 'pending',
    parentTaskId: null,
    subtasks: [],
    category: 'Study',
    complexity: 'medium',
    createdAt: new Date().toISOString()
  }
];

mockStorage.calendar_events = [
  {
    id: 'event-1',
    userId: 'mock-user-123',
    googleEventId: 'g-event-1',
    title: 'Team Sync Meeting',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    isFocusSession: false,
    isConflict: false
  }
];

mockStorage.ai_memory = [
  {
    userId: 'mock-user-123',
    preferredWorkingHours: { start: 9, end: 18 },
    preferredMeetingTimes: 'afternoons',
    workStyle: 'Focus blocks, dislikes fragmented meetings',
    avgFocusDuration: 1.5,
    categoryDelays: { Study: 0.1, Work: 0.05 },
    lastReflectedAt: new Date().toISOString()
  }
];

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Fix escaped newlines in private_key that get mangled by dotenv
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccount = JSON.parse(raw);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    isMock = false;
    console.log('>>> Firebase Firestore Initialized Successfully!');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    db = admin.firestore();
    isMock = false;
    console.log('>>> Firebase Firestore Initialized (Project ID) Successfully!');
  } else {
    console.log('>>> No Firebase Config found. Using Mock In-Memory Database.');
  }
} catch (error) {
  console.error('Firebase initialization error. Falling back to Mock Database:', error);
}

export const dbService = {
  isMockMode: () => isMock,

  getCollection: async (collectionName: string, userId?: string) => {
    if (!isMock && db) {
      let query = db.collection(collectionName);
      if (userId) {
        query = query.where('userId', '==', userId);
      }
      const snapshot = await query.get();
      const results: any[] = [];
      snapshot.forEach((doc: any) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      return results;
    } else {
      const items = mockStorage[collectionName] || [];
      if (userId) {
        return items.filter(item => item.userId === userId);
      }
      return items;
    }
  },

  getDocument: async (collectionName: string, id: string) => {
    if (!isMock && db) {
      const doc = await db.collection(collectionName).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } else {
      const items = mockStorage[collectionName] || [];
      return items.find(item => item.id === id) || null;
    }
  },

  createDocument: async (collectionName: string, id: string, data: any) => {
    if (!isMock && db) {
      await db.collection(collectionName).doc(id).set(data);
      return { id, ...data };
    } else {
      if (!mockStorage[collectionName]) {
        mockStorage[collectionName] = [];
      }
      const existingIdx = mockStorage[collectionName].findIndex(item => item.id === id);
      const docData = { id, ...data };
      if (existingIdx >= 0) {
        mockStorage[collectionName][existingIdx] = docData;
      } else {
        mockStorage[collectionName].push(docData);
      }
      return docData;
    }
  },

  updateDocument: async (collectionName: string, id: string, data: any) => {
    if (!isMock && db) {
      await db.collection(collectionName).doc(id).update(data);
      const updatedDoc = await db.collection(collectionName).doc(id).get();
      return { id, ...updatedDoc.data() };
    } else {
      const items = mockStorage[collectionName] || [];
      const itemIdx = items.findIndex(item => item.id === id);
      if (itemIdx === -1) {
        throw new Error(`Document ${id} not found in collection ${collectionName}`);
      }
      const updatedItem = { ...items[itemIdx], ...data };
      items[itemIdx] = updatedItem;
      return updatedItem;
    }
  },

  deleteDocument: async (collectionName: string, id: string) => {
    if (!isMock && db) {
      await db.collection(collectionName).doc(id).delete();
      return true;
    } else {
      if (mockStorage[collectionName]) {
        mockStorage[collectionName] = mockStorage[collectionName].filter(item => item.id !== id);
      }
      return true;
    }
  }
};
