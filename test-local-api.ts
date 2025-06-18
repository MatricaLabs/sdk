import { MatricaOAuthClient, NFTQueryOptions, TokenQueryOptions, UserSession } from './dist';
import { MatricaOAuthConfig, TokenResponse, AuthUrlResponse } from './dist/shared/types/interfaces';
// import { v2 } from '@matrica/oauth-sdk';

// Updated credentials
const TEST_CLIENT_ID = '05b4e460e2fd2ac';
const TEST_REDIRECT_URI = 'http://localhost:3000/callback';
const TEST_CLIENT_SECRET = 'jgoRpDzXk4C2e3QEz_9jLY7J-Y1r0-';

const config: MatricaOAuthConfig = {
  clientId: TEST_CLIENT_ID,
  redirectUri: TEST_REDIRECT_URI,
  clientSecret: TEST_CLIENT_SECRET,
  baseApiUrl: 'http://localhost:5000/oauth2',
  frontend: 'http://localhost:3000/oauth2',
};

const client = new MatricaOAuthClient(config);

// --- Option A: Obtain tokens via full OAuth flow (requires manual steps) ---
async function getAuthUrlAndVerifier(): Promise<AuthUrlResponse> {
  // Define the scopes your test user will need for the API calls below
  const scopes = 'profile wallets nfts email socials.twitter socials.discord socials.telegram roles'; // Add all relevant scopes
  console.log('Requesting scopes:', scopes);
  const authDetails = await client.getAuthorizationUrl(scopes);
  console.log('\n--- Step 1: Get Authorization URL & Code Verifier ---');
  console.log('1. Open this URL in your browser:');
  console.log(authDetails.url);
  console.log('\n2. Authenticate with your local OAuth server.');
  console.log('3. After redirection to your redirectUri, copy the \'code\' from the browser URL.');
  console.log('\n4. Use this codeVerifier with the copied code in Step 2 below:');
  console.log('Code Verifier:', authDetails.codeVerifier);
  console.log('----------------------------------------------------\n');
  return authDetails;
}

async function getSessionWithCode(code: string, codeVerifier: string): Promise<UserSession> {
  console.log('\n--- Step 2: Exchange Code for Tokens ---');
  console.log(`Attempting to create session with code: ${code} and verifier: ${codeVerifier}`)
  const session = await client.createSession(code, codeVerifier);
  console.log('Session created successfully with tokens from local auth server!');
  console.log('----------------------------------------------------\n');
  return session;
}

// --- Option B: Use pre-existing tokens (if you can get them directly) ---
// Replace with actual encrypted tokens your local API accepts if using this option
const PRE_EXISTING_ACCESS_TOKEN = 'YOUR_ENCRYPTED_ACCESS_TOKEN'; 
const PRE_EXISTING_REFRESH_TOKEN = 'YOUR_ENCRYPTED_REFRESH_TOKEN';

const preExistingTokens: TokenResponse = {
  access_token: PRE_EXISTING_ACCESS_TOKEN,
  refresh_token: PRE_EXISTING_REFRESH_TOKEN,
  token_type: 'Bearer',
  expires_in: 3600, // 1 hour
};

async function runApiTests(userSession: UserSession | null) {
  if (!userSession) {
    console.error('User session is not available. Cannot run API tests.');
    console.log('Please complete the OAuth flow (Option A) or provide direct tokens (Option B).');
    return;
  }
  console.log('Starting API tests with local server configuration...');

  try {
    console.log('\n--- Testing getUserProfile ---');
    const userProfile = await userSession.getUserProfile();
    console.log('User Profile:', userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  try {
    console.log('\n--- Testing getUserWallets ---');
    const userWallets = await userSession.getUserWallets();
    console.log('User Wallets:', userWallets);
  } catch (error) {
    console.error('Error fetching user wallets:', error);
  }

  try {
    console.log('\n--- Modified Test: Iterating Wallets to test NFT/Token Pagination ---');
    const userWallets = await userSession.getUserWallets(); // Fetch wallets again or use from above if scoped

    if (userWallets && userWallets.length > 0) {
      console.log(`Found ${userWallets.length} wallets. Testing with the first few (up to 2).`);
      const walletsToTest = userWallets.slice(0, 2); // Test with first 2 wallets

      for (const wallet of walletsToTest) {
        console.log(`\n--- Testing for wallet: ${wallet.id} on network: ${wallet.networkSymbol} ---`);

        // Test NFTs for this wallet's network
        try {
          console.log(`--- Testing getUserNFTs for network ${wallet.networkSymbol} (Paginated) ---`);
          const nftOptions: NFTQueryOptions = { skip: 0, take: 1, networkSymbol: wallet.networkSymbol };
          const paginatedNFTs = await userSession.getUserNFTs(nftOptions);
          console.log(`Paginated NFTs (${wallet.networkSymbol}):`, paginatedNFTs.data);
          console.log(`Pagination Info:`, paginatedNFTs.pagination);
        } catch (error) {
          console.error(`Error fetching NFTs for wallet ${wallet.id} (network ${wallet.networkSymbol}):`, error);
        }

        // Test Tokens for this wallet's network
        try {
          console.log(`--- Testing getUserTokens for network ${wallet.networkSymbol} (Paginated) ---`);
          const tokenOptions: TokenQueryOptions = { skip: 0, take: 1, networkSymbol: wallet.networkSymbol };
          const paginatedTokens = await userSession.getUserTokens(tokenOptions);
          console.log(`Paginated Tokens (${wallet.networkSymbol}):`, paginatedTokens.data);
          console.log(`Pagination Info:`, paginatedTokens.pagination);
        } catch (error) {
          console.error(`Error fetching Tokens for wallet ${wallet.id} (network ${wallet.networkSymbol}):`, error);
        }
      }
    } else {
      console.log('No wallets found to iterate through for NFT/Token pagination tests.');
    }
  } catch (error) {
    console.error('Error in modified wallet iteration test for NFTs/Tokens:', error);
  }

  // Restoring original getUserNFTs test
  try {
    console.log('\n--- Testing getUserNFTs (Paginated) ---');
    const nftOptions: NFTQueryOptions = { skip: 0, take: 2, networkSymbol: 'SOL' };
    const paginatedNFTs = await userSession.getUserNFTs(nftOptions);
    console.log('Paginated NFTs (SOL):', paginatedNFTs.data);
    console.log('Pagination Info:', paginatedNFTs.pagination);
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
  }

  // Restoring original getUserTokens test
  try {
    console.log('\n--- Testing getUserTokens (Paginated) ---');
    const tokenOptions: TokenQueryOptions = { skip: 0, take: 3, networkSymbol: 'ETH' };
    const paginatedTokens = await userSession.getUserTokens(tokenOptions);
    console.log('Paginated Tokens (ETH):', paginatedTokens.data);
    console.log('Pagination Info:', paginatedTokens.pagination);
  } catch (error) {
    console.error('Error fetching user tokens:', error);
  }

  try {
    console.log('\n--- Testing getUserTwitter ---');
    const twitterInfo = await userSession.getUserTwitter();
    console.log('Twitter Info:', twitterInfo);
  } catch (error) {
    console.error('Error fetching Twitter info:', error);
  }

  try {
    console.log('\n--- Testing getUserDiscord ---');
    const discordInfo = await userSession.getUserDiscord();
    console.log('Discord Info:', discordInfo);
  } catch (error) {
    console.error('Error fetching Discord info:', error);
  }
  
  try {
    console.log('\n--- Testing getUserTelegram ---');
    const telegramInfo = await userSession.getUserTelegram();
    console.log('Telegram Info:', telegramInfo);
  } catch (error) {
    console.error('Error fetching Telegram info:', error);
  }

  try {
    console.log('\n--- Testing getUserEmail ---');
    const emailInfo = await userSession.getUserEmail();
    console.log('User Email:', emailInfo);
  } catch (error) {
    console.error('Error fetching user email:', error);
  }

  try {
    console.log('\n--- Testing getUserRoles ---');
    const userRoles = await userSession.getUserRoles();
    console.log('User Roles:', userRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
  }

  console.log('\nAPI tests finished.');
}

async function main() {
  let session: UserSession | null = null;



  // --- CHOOSE ONE METHOD TO GET THE SESSION ---

  // === Method 1: Full OAuth flow (manual steps required) ===
  // 1.a. Run this part first to get the URL and codeVerifier
//   const authDetails = await getAuthUrlAndVerifier(); 
  //
  // 1.b. Then, after getting the 'code' manually from the browser, 
  //      fill it in below and uncomment to get the session:
  const manualCode = 'U2FsdGVkX18HZpxdAjRNiQbdvVlsxkc8JpEF7oiRqZrUeV25L65h6rR/RO1jbEZRPeo8qtsOzh6rUgSYynMjYOVDAFsq0lxXa3e1mn7nU4MZR2WGkdUTqoFjUam1HJRexuK7cmsVZfpqYZdJDKmXz8ph+qCCn8ZAsX04SA0VjxVLFGsEoZW34zTu97DQkHaPxYNZxXagFluZc94KYNj2pJ8/CSrn1wzXQ+/GvPi7HWd7PrTV4AVXBOjafbZpU6UKWmTM5pKodIxvyO8Wab3x6VvnEScYUisZedPaxojpP1fQ/kXvPndK0W0cF8FEu8f1GLqTc0Fx2iOyKSmRR3fgmo3xSMHl8m5g/0bkT2iwH5VJOcAh6o4UkPBw7ulZ8SjC2yBeFuat+AJZPg8x/6ZzKhA6noDYoqhpGeEn+G3ZCOIUxMHbW0zcTN7wu3t/p6LB797BogQcxTI43OvD2+6idA==';
  const manualCodeVerifier = 'TfLck-2U6IYouwGhK5zxVsOorbKuriJVhuj7lo7okjVTwy3tG-7JO79sXDh15rLatcdVBvH3erGct1tvCB8TZA'; // e.g., authDetails.codeVerifier - REMEMBER TO REPLACE THIS WITH THE NEW VERIFIER FROM CONSOLE
  if (manualCode && manualCodeVerifier) {
    try {
      session = await getSessionWithCode(manualCode, manualCodeVerifier);
    } catch (e) {
      console.error("Failed to get session with code:", e);
    }
  } else {
    console.log("To use Method 1, please ensure manualCode and manualCodeVerifier are correctly filled in.");
  }

//   // === Method 2: Use pre-existing tokens (if your local auth server can issue them directly) ===
// //   if (PRE_EXISTING_ACCESS_TOKEN !== 'YOUR_ENCRYPTED_ACCESS_TOKEN') {
// //     console.log('Using pre-existing tokens (Option B)...');
// //     session = client.createSessionFromTokens(preExistingTokens);
// //   } else {
// //     // Defaulting to asking for Method 1 if no pre-existing token is set.
// //     await getAuthUrlAndVerifier(); 
// //     console.log("\nPlease update PRE_EXISTING_ACCESS_TOKEN if you have direct tokens, or follow Method 1 instructions above.");
// //   }
  
  await runApiTests(session);
}

main().catch(error => {
  console.error('Unhandled error during script execution:', error);
}); 