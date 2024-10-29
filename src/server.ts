import express from 'express';
import { MatricaOAuthClient } from './matricaOAuthClient';

const app = express();

// Store for code verifiers and user sessions
const codeVerifiers: Record<string, string> = {};
const userSessions: Record<string, any> = {}; // You might want to store these in a database instead

const client = new MatricaOAuthClient({
  clientId: 'acf6b1eb7f87b8a',
  redirectUri: 'http://localhost:3000/callback',
  clientSecret: 'OGXgKiKy-f-KW04eHSxmpAtTWZmFiB',
  environment: 'development',
});

app.get('/', async (req, res) => {
  // Get authorization URL and store codeVerifier
  const auth = await client.getAuthorizationUrl('profile wallets nfts email socials.twitter socials.discord socials.telegram');
  const stateId = Math.random().toString(36).substring(7);
  codeVerifiers[stateId] = auth.codeVerifier;
  
  // Add state to the auth URL
  const urlWithState = `${auth.url}&state=${stateId}`;
  res.redirect(urlWithState);
});

app.get('/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const codeVerifier = codeVerifiers[state];
    
    if (!code || !codeVerifier) {
      throw new Error('Missing code or codeVerifier');
    }

    // Create a new user session
    const userSession = await client.createSession(code, codeVerifier);
    
    // Store the session
    userSessions[state] = userSession;

    // Clean up code verifier
    delete codeVerifiers[state];

    // Get all user data to test
    const [profile, wallets, twitter, discord, telegram, email] = await Promise.all([
      userSession.getUserProfile(),
      userSession.getUserWallets(),
      userSession.getUserTwitter(),
      userSession.getUserDiscord(),
      userSession.getUserTelegram(),
      userSession.getUserEmail()
    ]);

    console.log('User profile:', profile);
    console.log('User wallets:', wallets);
    console.log('Twitter auth:', twitter);
    console.log('Discord auth:', discord);
    console.log('Telegram auth:', telegram);
    console.log('Email:', email);

    res.json({ 
      message: 'Authentication successful',
      userId: profile.id,
      wallets: wallets.map(w => w.id),
      socials: {
        twitter,
        discord,
        telegram
      },
      email: email.email
    });
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example of an endpoint using a stored session
app.get('/user/:stateId/profile', async (req, res) => {
  try {
    const userSession = userSessions[req.params.stateId];
    if (!userSession) {
      return res.status(401).json({ error: 'No session found' });
    }

    const profile = await userSession.getUserProfile();
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:stateId/wallets', async (req, res) => {
  try {
    const userSession = userSessions[req.params.stateId];
    if (!userSession) {
      return res.status(401).json({ error: 'No session found' });
    }

    const wallets = await userSession.getUserWallets();
    res.json(wallets);
  } catch (error) {
    console.error('Error getting wallets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to reduce duplication
const createSocialEndpoint = (platform: string) => {
  app.get(`/user/:stateId/${platform}`, async (req, res) => {
    try {
      const userSession = userSessions[req.params.stateId];
      if (!userSession) {
        return res.status(401).json({ error: 'No session found' });
      }

      const social = await userSession[`getUser${platform.charAt(0).toUpperCase() + platform.slice(1)}`]();
      res.json(social);
    } catch (error) {
      console.error(`Error getting ${platform} credentials:`, error);
      res.status(500).json({ error: error.message });
    }
  });
};

// Create endpoints for each social platform
createSocialEndpoint('twitter');
createSocialEndpoint('discord');
createSocialEndpoint('telegram');

// Or if you prefer explicit endpoints:
app.get('/user/:stateId/twitter', async (req, res) => {
  try {
    const userSession = userSessions[req.params.stateId];
    if (!userSession) {
      return res.status(401).json({ error: 'No session found' });
    }

    const twitter = await userSession.getUserTwitter();
    res.json(twitter);
  } catch (error) {
    console.error('Error getting Twitter credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:stateId/discord', async (req, res) => {
  try {
    const userSession = userSessions[req.params.stateId];
    if (!userSession) {
      return res.status(401).json({ error: 'No session found' });
    }

    const discord = await userSession.getUserDiscord();
    res.json(discord);
  } catch (error) {
    console.error('Error getting Discord credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/user/:stateId/telegram', async (req, res) => {
  try {
    const userSession = userSessions[req.params.stateId];
    if (!userSession) {
      return res.status(401).json({ error: 'No session found' });
    }

    const telegram = await userSession.getUserTelegram();
    res.json(telegram);
  } catch (error) {
    console.error('Error getting Telegram credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
}); 