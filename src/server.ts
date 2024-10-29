import express from 'express';
import { MatricaOAuthClient } from './matricaOAuthClient';

const app = express();

// Simple in-memory store for code verifiers
const codeVerifiers: Record<string, string> = {};

const client = new MatricaOAuthClient({
  clientId: 'acf6b1eb7f87b8a',
  redirectUri: 'http://localhost:3000/callback',
  clientSecret: 'OGXgKiKy-f-KW04eHSxmpAtTWZmFiB'
});

app.get('/', async (req, res) => {
  // Get authorization URL and store codeVerifier
  const auth = await client.getAuthorizationUrl('profile email');
  const stateId = Math.random().toString(36).substring(7); // Simple random ID
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

    const tokens = await client.getToken(code, codeVerifier);
    
    // Clean up
    delete codeVerifiers[state];

    const test = await client.getValidAccessToken();
    
    res.json(tokens);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
}); 