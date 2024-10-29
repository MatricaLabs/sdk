import crypto from 'crypto';

interface MatricaOAuthConfig {
  clientId: string;
  redirectUri: string;
  clientSecret?: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}

interface AuthUrlResponse {
  url: string;
  codeVerifier: string;
}

export class MatricaOAuthClient {
  private clientId: string;
  private redirectUri: string;
  private clientSecret?: string;
  private codeVerifier?: string;
  private frontendUrl: string = 'https://dev.matrica.io/oauth2';
  private baseUrl: string = 'https://api-dev.matrica.io/oauth2'; // Replace with your actual OAuth server URL
  private tokens?: TokenResponse;
  private tokenExpiresAt?: Date;

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

  async getAuthorizationUrl(scope: string = 'profile'): Promise<AuthUrlResponse> {
    const codeVerifier = await this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return {
      url: `${this.frontendUrl}?${params.toString()}`,
      codeVerifier
    };
  }

  async getToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: codeVerifier
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
      throw new Error(error.error_description || 'Failed to get token');
    }

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }

  async refreshToken(): Promise<TokenResponse> {
    if (!this.tokens?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.tokens.refresh_token,
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

    const tokens = await response.json();
    this.setTokens(tokens);
    return tokens;
  }

  private setTokens(tokens: TokenResponse) {
    this.tokens = tokens;
    this.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  }

  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('No tokens available. User needs to authenticate.');
    }

    // If token is expired or about to expire in the next minute, refresh it
    if (!this.tokenExpiresAt || this.tokenExpiresAt.getTime() - Date.now() < 60000) {
      await this.refreshToken();
    }

    return this.tokens.access_token;
  }
}
