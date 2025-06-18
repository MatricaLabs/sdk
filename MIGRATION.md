# Migration Guide: v1 → v2

This guide will help you migrate from Matrica OAuth SDK v1 to v2. Version 2.0 introduces significant improvements including pagination, better type safety, enhanced filtering, and improved developer experience.

## Overview of Changes

### Key Improvements in v2
- **Pagination Support**: All list endpoints now return paginated responses
- **Enhanced Filtering**: Query options for NFTs, tokens, and domains
- **Better Type Safety**: More specific and structured TypeScript types
- **Improved Social Types**: Platform-specific social account types
- **Network-Specific Queries**: Filter by blockchain networks
- **Consistent API**: Standardized response formats across all endpoints

## Breaking Changes

### 1. Import Changes

**v1 (Legacy)**
```typescript
import { MatricaOAuthClient } from '@matrica/oauth-sdk';
```

**v2 (New)**
```typescript
import { v2 } from '@matrica/oauth-sdk';
// or
import { MatricaOAuthClient, UserSession } from '@matrica/oauth-sdk/v2';
```

### 2. Client Instantiation

**v1**
```typescript
const client = new MatricaOAuthClient({
    clientId: 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/callback'
});
```

**v2**
```typescript
const client = new v2.MatricaOAuthClient({
    clientId: 'your-client-id',
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:3000/callback'
});
```

### 3. Method Signature Changes

#### getUserNFTs()

**v1**
```typescript
// Simple array response, optional nftId filter
const nfts: NFT[] = await session.getUserNFTs('optional-nft-id');
```

**v2**
```typescript
// Paginated response with comprehensive filtering
const nfts: PaginatedResponse<NFTV2> = await session.getUserNFTs({
    skip: 0,
    take: 10,
    networkSymbol: 'SOL',
    collectionId: 'collection-id',
    sortBy: 'created',
    sortDirection: 'DESC'
});

// Access the data
console.log(nfts.data); // NFTV2[]
console.log(nfts.pagination); // { count: 150, skip: 0, take: 10 }
```

#### getUserTokens()

**v1**
```typescript
// Simple array response
const tokens: WalletToken[] = await session.getUserTokens();
```

**v2**
```typescript
// Paginated response with filtering
const tokens: PaginatedResponse<WalletTokenV2> = await session.getUserTokens({
    skip: 0,
    take: 20,
    networkSymbol: 'ETH',
    minBalance: 0.01,
    tokenIds: ['token-1', 'token-2']
});
```

#### getUserDomains()

**v1**
```typescript
// Returns DomainResponse wrapper
const domains: DomainResponse = await session.getUserDomains();
console.log(domains.domains); // DomainName[]
```

**v2**
```typescript
// Paginated response
const domains: PaginatedResponse<DomainNameV2> = await session.getUserDomains({
    skip: 0,
    take: 10,
    extension: '.sol',
    networkSymbol: 'SOL'
});
console.log(domains.data); // DomainNameV2[]
```

#### Social Account Methods

**v1**
```typescript
// Generic OAuthCredential type
const twitter: OAuthCredential | null = await session.getUserTwitter();
const discord: OAuthCredential | null = await session.getUserDiscord();
const telegram: OAuthCredential | null = await session.getUserTelegram();
```

**v2**
```typescript
// Platform-specific types
const twitter: TwitterInfoV2 | null = await session.getUserTwitter();
const discord: DiscordInfoV2 | null = await session.getUserDiscord();
const telegram: TelegramInfoV2 | null = await session.getUserTelegram();

// Generic method still available
const social = await session.getUserSocial('twitter'); // TwitterInfoV2 | DiscordInfoV2 | TelegramInfoV2 | null
```

### 4. Type Changes

#### Wallet Types

**v1: UserWallet**
```typescript
interface UserWallet {
    id: string;
    networkSymbol: NetworkSymbol; // enum
    status: WalletStatus; // enum
}
```

**v2: UserWalletV2**
```typescript
interface UserWalletV2 {
    id: string;
    networkSymbol: string; // more flexible
    primaryWalletOn: string[]; // new field
    activeChains: string[]; // new field
}
```

#### Token Types

**v1: WalletToken**
```typescript
interface WalletToken {
    walletId: string;
    token: TokenDetails;
    tokenId: string;
    totalAmount: number; // precision issues
}
```

**v2: WalletTokenV2**
```typescript
interface WalletTokenV2 {
    totalAmount: string; // string for precision
    stakedAmount: string; // new field
    amount: string; // new field
    walletId: string;
    tokenId: string;
    token: TokenInfoV2;
}
```

#### NFT Types

**v1: NFT** (31 fields, complex)
```typescript
interface NFT {
    id: string;
    tokenId: string | null;
    name: string | null;
    // ... 28 more fields
}
```

**v2: NFTV2** (simplified, focused)
```typescript
interface NFTV2 {
    id: string;
    name: string;
    image: string | null;
    status: string;
    networkSymbol: string | null;
    isCompressed: boolean;
    inscriptionNumber: number | null;
    ownerId: string;
    collection: NFTCollectionInfoV2 | null;
}
```

## Step-by-Step Migration

### Step 1: Update Dependencies

Ensure you're using v2.0.0 or later:

```bash
npm install @matrica/oauth-sdk@^2.0.0
```

### Step 2: Update Imports

Replace all v1 imports:

```typescript
// Before
import { MatricaOAuthClient } from '@matrica/oauth-sdk';

// After
import { v2 } from '@matrica/oauth-sdk';
```

### Step 3: Update Client Instantiation

```typescript
// Before
const client = new MatricaOAuthClient(config);

// After
const client = new v2.MatricaOAuthClient(config);
```

### Step 4: Update Method Calls

For each method that now returns paginated results, update your code:

```typescript
// Before - NFTs
const nfts = await session.getUserNFTs();
nfts.forEach(nft => console.log(nft.name));

// After - NFTs
const nftsResponse = await session.getUserNFTs({ skip: 0, take: 50 });
nftsResponse.data.forEach(nft => console.log(nft.name));

// Handle pagination if needed
if (nftsResponse.pagination.count > nftsResponse.pagination.take) {
    // Fetch more pages...
}
```

### Step 5: Update Type Definitions

Update your TypeScript types to use v2 types:

```typescript
// Before
import { NFT, WalletToken, UserWallet } from '@matrica/oauth-sdk';

// After
import { NFTV2, WalletTokenV2, UserWalletV2, PaginatedResponse } from '@matrica/oauth-sdk';

// Update function signatures
function processNFTs(nfts: PaginatedResponse<NFTV2>) {
    nfts.data.forEach(nft => {
        // Process each NFT
    });
}
```

## Common Migration Patterns

### Pattern 1: Simple List to Paginated Response

```typescript
// v1 Pattern
async function getAllUserNFTs() {
    const nfts = await session.getUserNFTs();
    return nfts;
}

// v2 Pattern
async function getAllUserNFTs() {
    const response = await session.getUserNFTs({ skip: 0, take: 100 });
    return response.data;
}

// v2 Pattern with Pagination
async function getAllUserNFTsPaginated() {
    let allNFTs: NFTV2[] = [];
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

### Pattern 2: Filtering Data

```typescript
// v1 Pattern - Filter after fetching
async function getSolanaTokens() {
    const tokens = await session.getUserTokens();
    return tokens.filter(token => token.token.networkSymbol === 'SOL');
}

// v2 Pattern - Filter at API level
async function getSolanaTokens() {
    const response = await session.getUserTokens({ 
        networkSymbol: 'SOL',
        skip: 0,
        take: 100
    });
    return response.data;
}
```

### Pattern 3: Error Handling

Error handling remains similar, but you may want to handle pagination-specific errors:

```typescript
// v2 Error Handling
try {
    const response = await session.getUserNFTs({ skip: 0, take: 10 });
    return response.data;
} catch (error) {
    if (error.message.includes('pagination')) {
        // Handle pagination-specific errors
        console.error('Pagination error:', error);
    } else {
        // Handle other errors
        console.error('API error:', error);
    }
    throw error;
}
```

## Backward Compatibility

The SDK maintains backward compatibility by:

1. **Default exports remain v1**: Existing code using default imports continues to work
2. **v1 namespace available**: You can explicitly use `v1` namespace if needed
3. **Gradual migration**: You can migrate endpoints one by one

```typescript
// Mixed usage during migration
import { MatricaOAuthClient, v2 } from '@matrica/oauth-sdk';

// Use v1 for some endpoints
const v1Client = new MatricaOAuthClient(config);
const v1Session = await v1Client.createSession(code, codeVerifier);

// Use v2 for others
const v2Client = new v2.MatricaOAuthClient(config);
const v2Session = await v2Client.createSession(code, codeVerifier);
```

## Testing Your Migration

1. **Unit Tests**: Update test assertions for new response formats
2. **Integration Tests**: Verify pagination works correctly
3. **Type Checking**: Ensure TypeScript compilation passes
4. **Runtime Testing**: Test with real API responses

## Need Help?

- Check the [API Reference](./README.md#api-reference) for detailed method documentation
- Review [Examples](./examples/) for complete implementation patterns
- Visit [business.matrica.io](https://business.matrica.io) for support

## Summary

v2 provides significant improvements in developer experience, type safety, and API consistency. While there are breaking changes, the migration path is straightforward, and the benefits of pagination, filtering, and better types make the upgrade worthwhile.

The key changes to remember:
1. Use `v2` namespace for imports
2. Handle paginated responses
3. Update type definitions
4. Leverage new filtering capabilities
5. Enjoy improved developer experience!