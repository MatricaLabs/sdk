import express from 'express';
import dotenv from 'dotenv';

// Import directly from the package root (no v2 namespace needed anymore)
import { MatricaOAuthClient, UserSession } from '../src';

// Import types directly from the package root
import type {
  UserProfile,
  UserWallet,
  TwitterInfo,
  DiscordInfo,
  TelegramInfo
} from '../src';

// MatricaScope enum is re-exported through shared types, so import separately
import { MatricaScope } from '../src/shared/types/enum';

import type { EmailResponse } from '../src/shared/types/base/user';
dotenv.config();

const app = express();

// Store for code verifiers and user sessions
const codeVerifiers: Record<string, string> = {};
const userSessions: Record<string, UserSession> = {}; // in memory storage for sessions, should be replaced with a database

const client = new MatricaOAuthClient({
    clientId: process.env.MATRICA_CLIENT_ID!,
    clientSecret: process.env.MATRICA_CLIENT_SECRET!,
    redirectUri: process.env.MATRICA_REDIRECT_URI!,
    environment: 'development',
});

const scopeList = Object.values(MatricaScope);

app.get('/', async (req, res) => {
    const scopes = scopeList.join(' '); // get all scopes
    const auth = await client.getAuthorizationUrl(scopes);
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

        // Get all user data to test - using allSettled to handle potential failures
        const results = await Promise.allSettled([
            userSession.getUserProfile(),
            userSession.getUserWallets(),
            userSession.getUserTwitter(),
            userSession.getUserDiscord(),
            userSession.getUserTelegram(),
            userSession.getUserEmail()
        ]);

        // Process results and log them with proper typing
        const [
            profile,
            wallets,
            twitter,
            discord,
            telegram,
            email
        ] = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            console.error(`Failed to fetch data for index ${index}:`, result.reason);
            return null;
        }) as [
            UserProfile | null,
            UserWallet[] | null,
            TwitterInfo | null,
            DiscordInfo | null,
            TelegramInfo | null,
            EmailResponse | null
        ];

        console.log('User profile:', profile);
        console.log('User wallets:', wallets);
        console.log('Twitter auth:', twitter);
        console.log('Discord auth:', discord);
        console.log('Telegram auth:', telegram);
        console.log('Email:', email);

        res.json({
            message: 'Authentication successful',
            userId: profile?.id,
            wallets: wallets?.map((w: { id: string }) => w.id),
            socials: {
                twitter,
                discord,
                telegram
            },
            email: email?.email
        });
    } catch (error) {
        console.error('Error in callback:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unexpected error occurred' });
        }
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});