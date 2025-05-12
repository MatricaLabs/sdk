import { MatricaOAuthClient } from './src/matricaOAuthClient';

// --- Configuration ---
// Replace with your actual Client ID and Secret if needed.
// The redirectUri MUST match the one registered for your client ID AND the one in api.ts
const client = new MatricaOAuthClient({
    clientId: '115c053e659aa2b',
    clientSecret: 'HchuRTY73Hf9r6OppDdFt1FvOIauu_', // Optional, include if you have a client secret
    redirectUri: 'http://localhost:3000/callback'
});

const scope = 'profile email wallets'; // Request desired permissions

async function main() {
    console.log('--- Step 1: Generate Authorization URL ---');

    // Generate the URL the user needs to visit
    const authUrlResponse = await client.getAuthorizationUrl(scope);
    console.log('Code Verifier (Keep this safe!):', authUrlResponse.codeVerifier);
    console.log('\n>>> ACTION REQUIRED <<<');
    console.log('1. Make sure the callback server is running: `bun api.ts`');
    console.log('2. Open this URL in your browser:\n');
    console.log(authUrlResponse.url);
    console.log('\n3. Log in and authorize the application.');
    console.log('4. After authorization, you will be redirected to localhost:3000/callback.');
    console.log('5. Check the terminal running `api.ts` for the logged "Authorization Code".');
    console.log('6. Copy the code and the Code Verifier from above.');
    console.log('7. Paste them into the section below and uncomment the code to proceed.');
    console.log('--- Waiting for manual steps ---\n');

    // --- Step 2: Exchange Code for Tokens (Manual Input Required) ---
    // PASTE THE CODE AND VERIFIER HERE:
    const authorizationCode = 'U2FsdGVkX180LQRm6KpVHIapC7LUPo+mtkEdyrxZI7Qw8kjun8pDG1tjbS5hKd/BHa0LPXmvlYczfevTSh3ZI+SrdcO3uOKBdmTs7dS7GV2hI1dGgNUTOdWfBmXwPKuk56D+eZx0+AaB9fqF61ededLG72n0SLIAe/mfHQF+mGH1pe3uhZWmHCJfABP9m3xs2SAIaDfSNdJNEvaN0kQ1OhduRLChGq29+Fww5/q2nJiIsyTJTKsAuzVpiNpPPQeno2Fe+/8LCPkkYFjAPJO03JOE2JznygRH4SpN+Y2rxLoQP+KEo6gHZW0APMrZs95dRGjZgCxaGUPrYqY1PFEjwA7x04Hna/UiqeKFuXP6XlDRGK7WmJqhabawqtIQzuBH';
    const codeVerifier = 'vrYBH0qi9DoweqideJPnHnrmEh3Y3d4zkMFDSm9UwP0';

    // UNCOMMENT THE FOLLOWING BLOCK AFTER PASTING THE VALUES:
    if (authorizationCode === 'PASTE_CODE_FROM_API_LOGS_HERE' || codeVerifier === 'PASTE_CODE_VERIFIER_FROM_ABOVE_HERE') {
        console.log('\nPlease paste the actual authorization code and code verifier into the script and uncomment the block to continue.');
    } else {
        try {
            console.log('\n--- Step 2: Exchanging Code for Tokens ---');
            console.log('Using Code:', authorizationCode);
            console.log('Using Verifier:', codeVerifier);

            const session = await client.createSession(authorizationCode, codeVerifier);
            console.log('\nSession created successfully!');

            console.log('\n--- Step 3: Fetching User Profile ---');
            const userProfile = await session.getUserProfile();
            console.log('User Profile:', userProfile);

            // You can now use the 'session' object to make other authenticated requests
            // Example: Fetch wallets if scope includes 'wallets'
            if (scope.includes('wallets')) {
                console.log('\n--- Fetching User Wallets ---');
                const wallets = await session.getUserWallets();
                console.log('User Wallets:', wallets);
            }

            console.log('\n--- OAuth Flow Complete ---');

        } catch (error) {
            console.error('\n--- Error during token exchange or API call ---');
            console.error(error);
        }
    }
}

main().catch(console.error);