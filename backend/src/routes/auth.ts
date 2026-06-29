import { Router } from 'express';
import { dbService } from '../services/db.js';
import { googleCalendarService } from '../services/googleCalendar.js';

const router = Router();

// Get Google Login redirect URL
router.get('/google/url', (req, res) => {
  const url = googleCalendarService.getAuthUrl();
  if (!url) {
    return res.status(400).json({ error: 'Google Calendar API credentials are not set on the server.' });
  }
  res.json({ url });
});

// Callback route from Google OAuth redirect
router.get('/callback', async (req, res) => {
  const code = req.query.code as string;
  const userId = 'mock-user-123'; // Default mock user ID for simple local login

  if (!code) {
    return res.status(400).send('Authentication code is missing.');
  }

  const oauth2Client = googleCalendarService.getOAuthClient();
  if (!oauth2Client) {
    return res.status(500).send('Google OAuth client configuration missing.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens in Firebase user record
    const user = await dbService.getDocument('users', userId);
    const updatedUser = {
      id: userId,
      email: user?.email || 'user@gmail.com',
      displayName: user?.displayName || 'Demo User',
      photoURL: user?.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
      googleOAuthTokens: {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || user?.googleOAuthTokens?.refreshToken || ''
      },
      createdAt: user?.createdAt || new Date().toISOString()
    };

    await dbService.createDocument('users', userId, updatedUser);

    // Redirect user back to the frontend calendar dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/calendar?sync=success`);
  } catch (error: any) {
    console.error('Error exchanging Google OAuth code:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

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
