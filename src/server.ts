import express from 'express';
import { MatricaOAuthClient } from './matricaOAuthClient';

const app = express();

// Store for code verifiers and user sessions
const codeVerifiers: Record<string, string> = {};
const userSessions: Record<string, any> = {}; // You might want to store these in a database instead

const client = new MatricaOAuthClient({
  clientId: 'acf6b1eb7f87b8a',
  redirectUri: 'http://localhost:3000/callback',
  clientSecret: 'OGXgKiKy-f-KW04eHSxmpAtTWZmFiB'
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
    
    // Store the session (you might want to use a database in production)
    userSessions[state] = userSession;

    // Clean up code verifier
    delete codeVerifiers[state];

    // Example of using the session to get user data
    const profile = await userSession.getUserProfile();
    console.log('User profile:', profile);

    const wallets = await userSession.getUserWallets();
    console.log('User wallets:', wallets);

    const nfts = await userSession.getUserNFTs();
    console.log('User nfts:', nfts);

    const tokens = await userSession.getUserTokens();
    console.log('User tokens:', tokens);

    res.json({ 
      message: 'Authentication successful',
      userId: profile.id,
      wallets: wallets.map(w => w.id)
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

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
}); 