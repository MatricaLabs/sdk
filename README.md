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

## Examples

Check out the `/examples` directory for complete implementation examples.

### Basic Usage

```typescript
// Initialize the client
const client = new MatricaOAuthClient({
    clientId: 'your-client-id',
    redirectUri: 'http://localhost:3000/callback'
});

const code = 'random-string';
const codeVerifier = MatricaOAuthClient.generateCodeChallenge(code);

const userSession = await client.createSession(code, codeVerifier);

const wallets = await userSession.getUserWallets();
const profile = await userSession.getUserProfile();

console.log('Wallets:', wallets);
console.log('Profile:', profile);
```

## Handling Token Refresh

The `UserSession` object automatically handles token refreshing for you. When you call methods like `getUserProfile()`, `getUserWallets()`, etc., the SDK checks if the access token is expired or nearing expiration. If it is, it automatically uses the refresh token to get a new access token before making the requested API call.

You generally don't need to manually refresh tokens. Just continue using the `UserSession` methods:

```typescript
const userSession = await client.createSession(code, codeVerifier);

// This will automatically refresh the token if needed
const nfts = await userSession.getUserNFTs();
console.log('NFTs:', nfts);

// Subsequent calls will use the existing or newly refreshed token
const twitterInfo = await userSession.getUserTwitter();
console.log('Twitter Info:', twitterInfo);
```

If you explicitly need the current valid access token (e.g., to make a custom API call), you can use `getValidAccessToken()`:

```typescript
const accessToken = await userSession.getValidAccessToken();
// This token is guaranteed to be valid, refreshed if necessary
console.log('Current Access Token:', accessToken);
```

While the `refreshToken()` method exists on the `UserSession` object, direct usage is typically unnecessary due to the automatic handling.