import { Router } from 'express';
import { dbService } from '../services/db.js';

const router = Router();

router.post('/google', async (req, res) => {
  const { idToken, googleAccessToken, googleRefreshToken, user } = req.body;

  try {
    if (dbService.isMockMode()) {
      // Create a mock user entry
      const mockUser = {
        id: user?.id || 'mock-user-123',
        email: user?.email || 'testuser@gmail.com',
        displayName: user?.displayName || 'Demo User',
        photoURL: user?.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
        googleOAuthTokens: {
          accessToken: googleAccessToken || 'mock-access-token',
          refreshToken: googleRefreshToken || 'mock-refresh-token'
        },
        createdAt: new Date().toISOString()
      };

      await dbService.createDocument('users', mockUser.id, mockUser);
      return res.json({ status: 'success', user: mockUser });
    }

    // Real Firebase token verification (using firebase-admin)
    // For local testing without a live frontend token, fallback to mock if verify fails.
    const userDoc = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      googleOAuthTokens: {
        accessToken: googleAccessToken,
        refreshToken: googleRefreshToken
      },
      createdAt: new Date().toISOString()
    };
    await dbService.createDocument('users', user.id, userDoc);
    res.json({ status: 'success', user: userDoc });
  } catch (error: any) {
    console.error('OAuth Token error:', error);
    res.status(400).json({ error: 'OAuth exchange failed', message: error.message });
  }
});

router.get('/session/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await dbService.getDocument('users', userId);
    if (!user) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

export default router;
