# What's New in v2

Version 2.0 of the Matrica OAuth SDK introduces significant improvements including pagination, better type safety, enhanced filtering, and improved developer experience. This version uses the new v2 API endpoints for better performance and functionality.

## Key Improvements in v2

- **Pagination Support**: All list endpoints now return paginated responses with metadata
- **Enhanced Filtering**: Query options for NFTs, tokens, and domains with network-specific filtering
- **Better Type Safety**: More specific and structured TypeScript types
- **Improved Social Types**: Platform-specific social account types (`TwitterInfo`, `DiscordInfo`, `TelegramInfo`)
- **Network-Specific Queries**: Filter by blockchain networks (`SOL`, `ETH`, etc.)
- **Consistent API**: Standardized response formats across all endpoints
- **New Helper Methods**: Additional convenience methods like `getUserSocial()` and `refreshToken()`

## New Features

### Pagination

All list methods now return paginated responses:

```typescript
const nfts = await userSession.getUserNFTs({ skip: 0, take: 20 });
console.log(nfts.data);       // NFT[]
console.log(nfts.pagination); // { count: 150, skip: 0, take: 20 }
```

### Advanced Filtering

Filter data at the API level for better performance:

```typescript
// Filter NFTs by network and collection
const solNFTs = await userSession.getUserNFTs({
    networkSymbol: 'SOL',
    collectionId: 'collection-id',
    skip: 0,
    take: 50
});

// Filter tokens by network and minimum balance
const ethTokens = await userSession.getUserTokens({
    networkSymbol: 'ETH',
    minBalance: 0.01,
    skip: 0,
    take: 100
});
```

### New Helper Methods

```typescript
// Generic social account helper
const twitter = await userSession.getUserSocial('twitter');
const discord = await userSession.getUserSocial('discord');

// Domain names with filtering
const domains = await userSession.getUserDomains({ 
    networkSymbol: 'SOL',
    extension: '.sol' 
});

// Token refresh for confidential apps
await userSession.refreshToken();
```

## API Methods

### User Data
- `getUserProfile()` - Get user profile information
- `getUserWallets()` - Get user's connected wallets
- `getUserEmail()` - Get user's email address
- `getUserRoles()` - Get user's roles and permissions

### Assets (Paginated)
- `getUserNFTs(options?)` - Get user's NFTs with filtering
- `getUserTokens(options?)` - Get user's tokens with filtering  
- `getUserDomains(options?)` - Get user's domain names with filtering

### Social Accounts
- `getUserTwitter()` - Get Twitter account info
- `getUserDiscord()` - Get Discord account info
- `getUserTelegram()` - Get Telegram account info
- `getUserSocial(platform)` - Generic social account helper

### Session Management
- `getValidAccessToken()` - Get current access token
- `refreshToken()` - Refresh access token (confidential apps)
- `getTokens()` - Get current token set

## If You're Upgrading from v1

If you were using an older version of this SDK, here are the key changes you need to make:

### Method Name Changes

```typescript
// v1 → v2
session.getNFTs()           → session.getUserNFTs()
session.getWalletTokens()   → session.getUserTokens()  
session.getDomains()        → session.getUserDomains()
session.getSocials()        → session.getUserTwitter() / getUserDiscord() / getUserTelegram()
```

### Response Format Changes

**Before (v1):**
```typescript
const nfts: NFT[] = await session.getNFTs();
const tokens: WalletToken[] = await session.getWalletTokens();
```

**After (v2):**
```typescript
const nfts: PaginatedResponse<NFT> = await session.getUserNFTs();
const tokens: PaginatedResponse<WalletToken> = await session.getUserTokens();

// Access the data
console.log(nfts.data);       // NFT[]
console.log(nfts.pagination); // { count, skip, take }
```

### Type Updates

Some types have been simplified and improved:

```typescript
// v2 NFT type (simplified)
interface NFT {
    id: string;
    name: string;
    image: string | null;
    status: string;
    networkSymbol: string | null;
    isCompressed: boolean;
    inscriptionNumber: number | null;
    ownerId: string;
    collection: NFTCollectionInfo | null;
}

// v2 WalletToken type (better precision)
interface WalletToken {
    totalAmount: string;    // string for precision
    stakedAmount: string;   // new field
    amount: string;         // new field
    walletId: string;
    tokenId: string;
    token: TokenInfo;
}
```

### Migration Steps

1. **Update your dependencies:**
   ```bash
   npm install @matrica/oauth-sdk@^2.0.0
   ```

2. **Update method calls:**
   ```typescript
   // Before
   const nfts = await session.getNFTs();
   
   // After
   const nftsResponse = await session.getUserNFTs({ skip: 0, take: 50 });
   const nfts = nftsResponse.data;
   ```

3. **Update TypeScript types:**
   ```typescript
   import { PaginatedResponse, NFT, WalletToken } from '@matrica/oauth-sdk';
   
   function processNFTs(response: PaginatedResponse<NFT>) {
       response.data.forEach(nft => {
           // Process each NFT
       });
   }
   ```

4. **Handle pagination:**
   ```typescript
   // Get all NFTs with pagination
   async function getAllUserNFTs() {
       let allNFTs: NFT[] = [];
       let skip = 0;
       const take = 50;
       
       while (true) {
           const response = await session.getUserNFTs({ skip, take });
           allNFTs.push(...response.data);
           
           if (response.data.length < take) {
               break; // No more data
           }
           skip += take;
       }
       
       return allNFTs;
   }
   ```

## Common Migration Patterns

### Simple List Conversion
```typescript
// v1 Pattern
const nfts = await session.getNFTs();
nfts.forEach(nft => console.log(nft.name));

// v2 Pattern  
const response = await session.getUserNFTs({ skip: 0, take: 100 });
response.data.forEach(nft => console.log(nft.name));
```

### Network Filtering
```typescript
// v1 Pattern - Filter after fetching
const tokens = await session.getWalletTokens();
const solTokens = tokens.filter(token => token.token.networkSymbol === 'SOL');

// v2 Pattern - Filter at API level
const response = await session.getUserTokens({ networkSymbol: 'SOL' });
const solTokens = response.data;
```

## Need Help?

- Check the [README](./README.md) for complete usage examples
- Review [Examples](./examples/) for implementation patterns  
- Visit [business.matrica.io](https://business.matrica.io) for support

## Summary

v2 provides significant improvements in developer experience, type safety, and API performance. The key benefits include:

1. **Pagination** - Handle large datasets efficiently
2. **Server-side filtering** - Reduce bandwidth and improve performance  
3. **Better types** - Improved TypeScript experience
4. **Consistent API** - Standardized response formats
5. **New helpers** - Additional convenience methods

The migration from v1 requires updating method names and handling paginated responses, but the improved functionality and performance make it worthwhile.