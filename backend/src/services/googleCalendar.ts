import { google } from 'googleapis';
import { dbService } from './db.js';

export const googleCalendarService = {
  /**
   * Get OAuth2 Client configured with env credentials
   */
  getOAuthClient: () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/callback';

    if (!clientId || !clientSecret) {
      return null;
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  },

  /**
   * Generate Auth URL for frontend redirects
   */
  getAuthUrl: () => {
    const oauth2Client = googleCalendarService.getOAuthClient();
    if (!oauth2Client) return null;

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    });
  },

  /**
   * Fetch events from Google Calendar using user's OAuth tokens
   */
  fetchGoogleEvents: async (userId: string) => {
    const oauth2Client = googleCalendarService.getOAuthClient();
    if (!oauth2Client) {
      console.log('>>> Google OAuth credentials not set. Skipping real Google Calendar sync.');
      return [];
    }

    const user = await dbService.getDocument('users', userId);
    if (!user || !user.googleOAuthTokens?.accessToken) {
      console.log(`>>> No OAuth tokens found for user ${userId}. Skipping Google Calendar sync.`);
      return [];
    }

    oauth2Client.setCredentials({
      access_token: user.googleOAuthTokens.accessToken,
      refresh_token: user.googleOAuthTokens.refreshToken
    });

    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const now = new Date();
      const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: oneWeekLater.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const formattedEvents = events.map((item: any) => ({
        id: `evt-${item.id}`,
        userId,
        googleEventId: item.id,
        title: item.summary || 'Untitled Event',
        startTime: item.start?.dateTime || item.start?.date,
        endTime: item.end?.dateTime || item.end?.date,
        isFocusSession: false,
        isConflict: false
      }));

      // Cache / Sync in Firestore database
      for (const event of formattedEvents) {
        await dbService.createDocument('calendar_events', event.id, event);
      }

      console.log(`>>> Successfully synced ${formattedEvents.length} events from Google Calendar.`);
      return formattedEvents;
    } catch (error) {
      console.error('Error fetching from Google Calendar API:', error);
      return [];
    }
  },

  /**
   * Push a focus session back to Google Calendar
   */
  createGoogleFocusSession: async (userId: string, title: string, startTime: string, endTime: string) => {
    const oauth2Client = googleCalendarService.getOAuthClient();
    if (!oauth2Client) return null;

    const user = await dbService.getDocument('users', userId);
    if (!user || !user.googleOAuthTokens?.accessToken) return null;

    oauth2Client.setCredentials({
      access_token: user.googleOAuthTokens.accessToken,
      refresh_token: user.googleOAuthTokens.refreshToken
    });

    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: `Focus Session: ${title}`,
          description: 'Auto-scheduled deep work session by DeadlineAI.',
          start: { dateTime: startTime },
          end: { dateTime: endTime },
          colorId: '6' // Violet color in Google Calendar
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error inserting focus session into Google Calendar:', error);
      return null;
    }
  }
};
