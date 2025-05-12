# Matrica OAuth SDK

A lightweight SDK for integrating Matrica authentication into your applications.

> To get started with Matrica OAuth, visit [business.matrica.io](https://business.matrica.io) or contact us through the website.

## Installation

```bash
npm install @matrica/oauth-sdk
```

## Quick Start

```typescript
import { MatricaOAuthClient } from '@matrica/oauth-sdk';

const client = new MatricaOAuthClient({
    clientId: 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET, // for private apps
    redirectUri: 'http://localhost:3000/callback'
});

app.get('/', async (req, res) => {
  const redirectUrl = await client.getAuthorizationUrl('profile wallets nfts');
  res.redirect(urlWithState);
});

```

## Features

- Easy-to-use OAuth 2.0 authentication flow
- Zero dependencies
- Secure token handling

## Authorization Code Flow Explained

The most common way to authenticate users is through the OAuth 2.0 Authorization Code Grant flow. Here's how it works with this SDK:

**Step 1: Configure the Client**

First, instantiate the client with your application's details. The `redirectUri` must match the one registered in your Matrica developer settings.

```typescript
import { MatricaOAuthClient } from '@matrica/oauth-sdk';

const client = new MatricaOAuthClient({
    clientId: 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET, // Include if your app is private/confidential
    redirectUri: 'https://your-app.com/callback' // Your callback endpoint
});

const scope = 'profile email wallets'; // Define requested permissions
```

**Step 2: Generate the Authorization URL and Redirect the User**

Create an endpoint in your application (e.g., `/login`) that generates the unique authorization URL and redirects the user's browser to Matrica. You **must** store the `codeVerifier` securely (e.g., in the user's session) as it's needed after the redirect.

```typescript
app.get('/login', async (req, res) => {
    try {
        const { url, codeVerifier } = await client.getAuthorizationUrl(scope);

        // Store codeVerifier securely in the user's session
        // req.session.codeVerifier = codeVerifier; // Example using express-session

        console.log('Redirecting user to:', url);
        console.log('Storing codeVerifier:', codeVerifier); // For demonstration

        // Redirect the user's browser
        res.redirect(url);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).send('Authentication failed');
    }
});
```

**Step 3: Handle the Callback**

After the user logs in and authorizes your application on Matrica, they will be redirected back to your `redirectUri` (e.g., `/callback`). Matrica will append an authorization `code` (and potentially `state`) as query parameters.

In your callback handler, retrieve the `code` from the query parameters and the `codeVerifier` you stored earlier. Use these to exchange the code for access and refresh tokens by creating a `UserSession`.

```typescript
// Example using Express.js
app.get('/callback', async (req, res) => {
    const { code, state } = req.query; // Get code from query params
    // const codeVerifier = req.session.codeVerifier; // Retrieve stored codeVerifier

    // --- For Demonstration (replace with session retrieval) ---
    const codeVerifier = 'RETRIEVE_YOUR_STORED_CODE_VERIFIER_HERE';
    console.log('Callback received. Code:', code);
    console.log('Using stored codeVerifier:', codeVerifier);
    // --- End Demonstration ---

    if (!code) {
        return res.status(400).send('Authorization code missing');
    }
    if (!codeVerifier) {
        return res.status(400).send('Code verifier missing from session');
    }

    try {
        // Exchange the code for tokens and create a session
        const userSession = await client.createSession(code as string, codeVerifier);
        console.log('UserSession created successfully!');

        // Store session/tokens securely (e.g., encrypt and store in session/database)
        // req.session.tokens = userSession.getTokens(); // Example

        // Now you can use the session to get user data
        const profile = await userSession.getUserProfile();
        console.log('User Profile:', profile);

        // Redirect user to their dashboard or desired page
        res.redirect('/dashboard');

    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.status(500).send('Authentication failed during token exchange');
    }
});
```

**Step 4: Use the UserSession**

Once you have the `UserSession` (either newly created or reconstructed from stored tokens using `client.createSessionFromTokens(tokens)`), you can use its methods to access protected resources on behalf of the user.

```typescript
// Example: Accessing data in another request handler
app.get('/dashboard', async (req, res) => {
    // const tokens = req.session.tokens; // Retrieve stored tokens
    // if (!tokens) {
    //    return res.redirect('/login');
    // }
    // const userSession = client.createSessionFromTokens(tokens);

    // --- For Demonstration (replace with session retrieval) ---
    // Assuming you have a valid session object from the callback step
    // const userSession = ...;
    // --- End Demonstration ---

    try {
        // Example: Fetch user's wallets
        // const wallets = await userSession.getUserWallets();
        // res.render('dashboard', { userProfile: profile, wallets: wallets }); // Pass data to template

        res.send('User authenticated! Check server logs for profile data.'); // Simplified response

    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Failed to fetch user data');
    }
});
```

## Examples

Check out the `/examples` directory for complete implementation examples.

## Managing Access Tokens

When using the `UserSession` methods like `getUserProfile()`, `getUserWallets()`, etc., you'll need to handle token expiration yourself. If a token has expired, the API will return an error.

If you need the current access token (e.g., to make a custom API call), you can use `getValidAccessToken()`:

```typescript
const accessToken = await userSession.getValidAccessToken();
console.log('Current Access Token:', accessToken);
```

Note that if the token has expired, you'll need to create a new user session by redirecting the user through the authentication flow again.