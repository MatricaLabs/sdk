import crypto from 'crypto';

interface MatricaOAuthConfig {
  clientId: string;
  redirectUri: string;
  clientSecret?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export class MatricaOAuthClient {
  private clientId: string;
  private redirectUri: string;
  private clientSecret?: string;
  private codeVerifier?: string;
  private frontendUrl: string = 'https://dev.matrica.io/oauth2';
  private baseUrl: string = 'https://api-dev.matrica.io/oauth2'; // Replace with your actual OAuth server URL

  constructor(config: MatricaOAuthConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.clientSecret = config.clientSecret;
  }

  private async generateCodeVerifier(): Promise<string> {
    const buffer = crypto.randomBytes(32);
    return buffer.toString('base64url');
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(verifier);
    return hash.digest('base64url');
  }

  async getAuthorizationUrl(scope: string = 'profile'): Promise<string> {
    this.codeVerifier = await this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return `${this.frontendUrl}?${params.toString()}`;
  }

  async getToken(code: string): Promise<TokenResponse> {
    // if (!this.codeVerifier) {
    //   throw new Error('Code verifier not found. Call getAuthorizationUrl first.');
    // }

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      // code_verifier: this.codeVerifier
    });

    if (this.clientSecret) {
      params.append('client_secret', this.clientSecret);
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    console.log(response);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to get token');
    }

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.clientId
    });

    if (this.clientSecret) {
      params.append('client_secret', this.clientSecret);
    }

    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'Failed to refresh token');
    }

    return response.json();
  }
}
