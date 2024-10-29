import { MatricaOAuthClient } from './matricaOAuthClient';

async function main() {
  try {
    const client = new MatricaOAuthClient({
      clientId: 'acf6b1eb7f87b8a',
      redirectUri: 'http://localhost:3000/callback',
      clientSecret: 'OGXgKiKy-f-KW04eHSxmpAtTWZmFiB' // Optional for public clients
    });

    // Step 1: Get the authorization URL
    const authUrl = await client.getAuthorizationUrl('profile email');
    console.log('Authorization URL:', authUrl);

    // they visit this url 
    //http://dev.matrica.io/oauth2?response_type=code&client_id=acf6b1eb7f87b8a&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=profile+email&code_challenge=-Nih6ByuULNZa1miXmRwNFlDmgan2Xuad3WgvlGtFhs&code_challenge_method=S256

    // redirects to callback url with code

    // we get the code from the callback url and then call POST / on token.controller with the code to get access tokens

    // on token controller, use grant_type to change between refresh and access token


    /*
    add functions to:
    getUserAccessTokens(code: string) to POST /token with grant_type=authorization_code returns { access_token, refresh_token }
    refreshUserAccessToken(refresh_token: string) to POST /token with grant_type=refresh_token returns { access_token, refresh_token }

    each route on the user.controller needs a wrapper where we pass in the access token and it returns the response

    revoke isn't implemented currently, can add it if needed

    */


    // Step 2: After user authorizes and you get the code from the callback
    // const code = '...'; // Get this from the callback URL
    // const tokens = await client.getToken(code);
    // console.log('Tokens:', tokens);

    // Step 3: Later, you can refresh the token
    // const newTokens = await client.refreshToken(tokens.refresh_token);
    // console.log('New tokens:', newTokens);

  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 