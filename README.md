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

const code = 'your-code';
const codeVerifier = 'your-code-verifier';

const userSession = await client.createSession(code, codeVerifier);

const wallets = await userSession.getUserWallets();
const profile = await userSession.getUserProfile();

console.log('Wallets:', wallets);
console.log('Profile:', profile);
```