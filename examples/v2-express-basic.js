/**
 * Basic Express.js integration with Matrica OAuth SDK v2
 * 
 * This example demonstrates:
 * - OAuth 2.0 authentication flow
 * - Session management
 * - Paginated data fetching
 * - Error handling
 */

const express = require('express');
const session = require('express-session');
const { v2 } = require('@matrica/oauth-sdk');

const app = express();

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Initialize Matrica OAuth client
const client = new v2.MatricaOAuthClient({
    clientId: process.env.MATRICA_CLIENT_ID,
    clientSecret: process.env.MATRICA_CLIENT_SECRET,
    redirectUri: process.env.MATRICA_REDIRECT_URI || 'http://localhost:3000/callback'
});

// Home page
app.get('/', (req, res) => {
    if (req.session.tokens) {
        res.send(`
            <h1>Welcome to Matrica OAuth Demo</h1>
            <p>You are logged in!</p>
            <a href="/profile">View Profile</a> |
            <a href="/wallets">View Wallets</a> |
            <a href="/nfts">View NFTs</a> |
            <a href="/tokens">View Tokens</a> |
            <a href="/social">View Social</a> |
            <a href="/logout">Logout</a>
        `);
    } else {
        res.send(`
            <h1>Welcome to Matrica OAuth Demo</h1>
            <p>Please log in to continue.</p>
            <a href="/login">Login with Matrica</a>
        `);
    }
});

// Initiate OAuth flow
app.get('/login', async (req, res) => {
    try {
        const scope = 'profile email wallets nfts socials.twitter socials.discord socials.telegram domains';
        const { url, codeVerifier } = await client.getAuthorizationUrl(scope);
        
        // Store code verifier in session
        req.session.codeVerifier = codeVerifier;
        
        console.log('Redirecting to:', url);
        res.redirect(url);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).send('Authentication failed');
    }
});

// Handle OAuth callback
app.get('/callback', async (req, res) => {
    const { code, error } = req.query;
    
    if (error) {
        console.error('OAuth error:', error);
        return res.status(400).send(`Authentication failed: ${error}`);
    }
    
    if (!code) {
        return res.status(400).send('Authorization code missing');
    }
    
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
        return res.status(400).send('Code verifier missing from session');
    }
    
    try {
        // Exchange code for tokens
        const userSession = await client.createSession(code, codeVerifier);
        
        // Store tokens in session
        req.session.tokens = userSession.getTokens();
        
        // Clear code verifier
        delete req.session.codeVerifier;
        
        console.log('User authenticated successfully');
        res.redirect('/');
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Authentication failed during token exchange');
    }
});

// Helper function to get user session
function getUserSession(req) {
    if (!req.session.tokens) {
        return null;
    }
    return client.createSessionFromTokens(req.session.tokens);
}

// Middleware to require authentication
function requireAuth(req, res, next) {
    if (!req.session.tokens) {
        return res.redirect('/login');
    }
    next();
}

// User profile page
app.get('/profile', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        const profile = await session.getUserProfile();
        const email = await session.getUserEmail();
        
        res.json({
            profile,
            email
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
});

// User wallets page
app.get('/wallets', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        const wallets = await session.getUserWallets();
        
        res.json({ wallets });
    } catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ error: error.message });
    }
});

// User NFTs page with pagination
app.get('/nfts', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        const { skip = 0, take = 10, networkSymbol, collectionId } = req.query;
        
        const nfts = await session.getUserNFTs({
            skip: parseInt(skip),
            take: parseInt(take),
            networkSymbol,
            collectionId,
            sortBy: 'created',
            sortDirection: 'DESC'
        });
        
        res.json({
            nfts: nfts.data,
            pagination: nfts.pagination,
            hasMore: nfts.data.length === parseInt(take)
        });
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        res.status(500).json({ error: error.message });
    }
});

// User tokens page with filtering
app.get('/tokens', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        const { skip = 0, take = 10, networkSymbol, minBalance } = req.query;
        
        const tokens = await session.getUserTokens({
            skip: parseInt(skip),
            take: parseInt(take),
            networkSymbol,
            minBalance: minBalance ? parseFloat(minBalance) : undefined,
            sortBy: 'totalAmount',
            sortDirection: 'DESC'
        });
        
        res.json({
            tokens: tokens.data,
            pagination: tokens.pagination
        });
    } catch (error) {
        console.error('Error fetching tokens:', error);
        res.status(500).json({ error: error.message });
    }
});

// User social accounts
app.get('/social', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        
        const [twitter, discord, telegram, roles] = await Promise.all([
            session.getUserTwitter(),
            session.getUserDiscord(),
            session.getUserTelegram(),
            session.getUserRoles()
        ]);
        
        res.json({
            twitter,
            discord,
            telegram,
            roles
        });
    } catch (error) {
        console.error('Error fetching social accounts:', error);
        res.status(500).json({ error: error.message });
    }
});

// User domains
app.get('/domains', requireAuth, async (req, res) => {
    try {
        const session = getUserSession(req);
        const { skip = 0, take = 10, extension, networkSymbol } = req.query;
        
        const domains = await session.getUserDomains({
            skip: parseInt(skip),
            take: parseInt(take),
            extension,
            networkSymbol
        });
        
        res.json({
            domains: domains.data,
            pagination: domains.pagination
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: error.message });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Environment variables needed:');
    console.log('- MATRICA_CLIENT_ID');
    console.log('- MATRICA_CLIENT_SECRET');
    console.log('- MATRICA_REDIRECT_URI (optional, defaults to http://localhost:3000/callback)');
    console.log('- SESSION_SECRET (optional, but recommended for production)');
});