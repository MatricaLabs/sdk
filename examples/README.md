# Matrica OAuth SDK Examples

This directory contains comprehensive examples for integrating the Matrica OAuth SDK into your applications.

## v2 Examples (Recommended)

### 🚀 [v2-express-basic.js](./v2-express-basic.js)
**Complete Express.js integration with session management**

Features:
- OAuth 2.0 authentication flow
- Session management with express-session
- Paginated data fetching (NFTs, tokens, domains)
- Social account integration
- Error handling
- Authentication middleware

```bash
npm install express express-session
node examples/v2-express-basic.js
```

### 📱 [v2-nextjs-app.tsx](./v2-nextjs-app.tsx)
**Modern Next.js App Router integration**

Features:
- React hooks for authentication
- Client-side data fetching
- Infinite scroll pagination
- Error boundaries
- TypeScript support
- Responsive UI components

```bash
# Add to your Next.js project
cp examples/v2-nextjs-app.tsx app/dashboard/page.tsx
```

### 📄 [v2-pagination.js](./v2-pagination.js)
**Comprehensive pagination patterns and examples**

Features:
- Basic pagination
- Fetch all data across pages
- Network-specific filtering
- Parallel queries
- Error handling
- Cursor-style pagination simulation

```bash
node -e "
const { paginationExamples } = require('./examples/v2-pagination.js');
// Use with your session object
"
```

## v1 Examples (Legacy)

### 🔧 [server.ts](./server.ts)
**Basic v1 Express.js example**

⚠️ **Legacy**: This example uses v1 API. New projects should use v2 examples above.

## Quick Start Guide

### 1. Environment Setup

Create a `.env` file in your project root:

```env
MATRICA_CLIENT_ID=your_client_id_here
MATRICA_CLIENT_SECRET=your_client_secret_here
MATRICA_REDIRECT_URI=http://localhost:3000/callback
SESSION_SECRET=your_session_secret_here
```

### 2. Choose Your Framework

| Framework | Example | Features |
|-----------|---------|----------|
| **Express.js** | `v2-express-basic.js` | Server-side rendering, sessions |
| **Next.js** | `v2-nextjs-app.tsx` | React, App Router, TypeScript |
| **Custom** | `v2-pagination.js` | Pagination patterns only |

### 3. Install Dependencies

```bash
# For Express.js example
npm install express express-session @matrica/oauth-sdk

# For Next.js example
npm install @matrica/oauth-sdk

# For TypeScript projects
npm install -D @types/express @types/express-session
```

### 4. Run Examples

```bash
# Express.js example
MATRICA_CLIENT_ID=your_id MATRICA_CLIENT_SECRET=your_secret node examples/v2-express-basic.js

# Next.js (add to your project)
npm run dev
```

## Example Walkthroughs

### Express.js Integration

1. **Setup**: Configure client with your credentials
2. **Login Route**: Generate authorization URL and redirect
3. **Callback Route**: Exchange code for tokens, create session
4. **Protected Routes**: Use session to fetch user data
5. **Pagination**: Handle large datasets efficiently

### Next.js Integration

1. **Auth Hook**: Custom React hook for authentication state
2. **Server Actions**: API routes for OAuth flow
3. **Client Components**: React components with pagination
4. **Error Handling**: Graceful error boundaries
5. **TypeScript**: Full type safety

### Pagination Patterns

1. **Basic Pagination**: Skip/take with page numbers
2. **Infinite Scroll**: Load more data on demand
3. **Filtering**: Network-specific queries
4. **Parallel Requests**: Multiple networks simultaneously
5. **Error Recovery**: Graceful failure handling

## Common Patterns

### Authentication Flow

```typescript
// 1. Generate authorization URL
const { url, codeVerifier } = await client.getAuthorizationUrl(scope);

// 2. Store code verifier securely
req.session.codeVerifier = codeVerifier;

// 3. Redirect user to Matrica
res.redirect(url);

// 4. Handle callback
const session = await client.createSession(code, codeVerifier);

// 5. Store tokens securely
req.session.tokens = session.getTokens();
```

### Paginated Data Fetching

```typescript
// Fetch first page
const response = await session.getUserNFTs({
    skip: 0,
    take: 20,
    networkSymbol: 'SOL'
});

// Check for more data
const hasMore = response.data.length === 20;

// Fetch next page
const nextPage = await session.getUserNFTs({
    skip: 20,
    take: 20,
    networkSymbol: 'SOL'
});
```

### Error Handling

```typescript
try {
    const data = await session.getUserProfile();
} catch (error) {
    if (error instanceof MatricaOAuthError) {
        // Handle API errors
        console.error('API Error:', error.code, error.message);
    } else {
        // Handle network/other errors
        console.error('Unexpected error:', error);
    }
}
```

## Best Practices

### Security
- ✅ Store client secret securely (environment variables)
- ✅ Use HTTPS in production
- ✅ Encrypt session data
- ✅ Validate redirect URIs
- ✅ Handle token refresh gracefully

### Performance
- ✅ Use appropriate page sizes (20-50 items)
- ✅ Implement infinite scroll for large datasets
- ✅ Cache user data when appropriate
- ✅ Use parallel requests for multiple networks
- ✅ Handle rate limiting

### User Experience
- ✅ Show loading states
- ✅ Handle errors gracefully
- ✅ Provide clear authentication flows
- ✅ Display pagination information
- ✅ Implement search and filtering

## Troubleshooting

### Common Issues

1. **"Code verifier missing"** - Ensure you store the code verifier before redirecting
2. **"Token expired"** - Implement token refresh or re-authentication
3. **"Pagination not working"** - Check response structure and parameters
4. **"CORS errors"** - Configure proper origins in your Matrica app settings

### Debug Mode

Enable debug logging:

```typescript
const client = new v2.MatricaOAuthClient({
    // ... other config
    logger: {
        debug: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
    }
});
```

## Support

- 📖 [Main Documentation](../README.md)
- 🔄 [Migration Guide](../MIGRATION.md)
- 🐛 [Report Issues](https://github.com/matrica-io/oauth-sdk/issues)
- 💬 [Community Discord](https://discord.gg/matrica)

---

**Choose the example that best fits your tech stack and start building! 🚀**