import express, { Request, Response } from 'express';
import { MatricaOAuthClient } from './matricaOAuthClient';

const app = express();
const port = 3000;

const client = new MatricaOAuthClient({
  clientId: 'acf6b1eb7f87b8a',
  clientSecret: 'OGXgKiKy-f-KW04eHSxmpAtTWZmFiB',
  redirectUri: 'http://localhost:3000/callback'
});

app.get('/', async (_req: Request, res: Response) => {
  try {
    const authUrl = await client.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error getting authorization URL:', error);
    res.status(500).send('Error initiating OAuth flow');
  }
});

app.get('/callback', async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string | undefined;
  
  if (!code) {
    res.status(400).send('No code provided');
    return;
  }

  try {
    const tokens = await client.getToken(code);
    res.json(tokens);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Error getting tokens');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 