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

interface UserProfile {
  id: string;
  username: string;
  isAdmin: boolean;
  registered: boolean;
  profile: {
    id: string;
    name: string;
    vanityURL: string;
    about: string | null;
    website: string | null;
    emailVerified: boolean;
    twitter: string | null;
    twitterExternalId: string | null;
    showTwitter: boolean | null;
    discord: string | null;
    pfp: string | null;
    banner: string | null;
    bannerOffsetTop: number | null;
    bannerBorder: string | null;
    bannerNFTCount: number | null;
    bannerLeft: string | null;
    bannerMiddle: string | null;
    bannerRight: string | null;
    border: string | null;
    showGraveyard: boolean | null;
    createdDate: string;
    updatedDate: string;
  };
  isSearchSynced: boolean;
  createdDate: string;
  updatedDate: string;
}

enum NetworkSymbol {
  SOL = 'SOL',
  ETH = 'ETH',
  BTC = 'BTC',
  MATIC = 'MATIC'
}

enum WalletStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY'
}

interface UserWallet {
  id: string;
  index: number;
  networkSymbol: NetworkSymbol;
  createdDate: string;
  updatedDate: string;
  status: WalletStatus;
  isSearchSynced: boolean;
}

class UserSession {
  private tokens?: TokenResponse;
  private tokenExpiresAt?: Date;

  constructor(
    private clientId: string,
    private clientSecret?: string,
    initialTokens?: TokenResponse
  ) {
    if (initialTokens) {
      this.setTokens(initialTokens);
    }
  }

  private setTokens(tokens: TokenResponse) {
    this.tokens = tokens;
    this.tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
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

    const response = await fetch(`${MatricaOAuthClient.AUTH_BASE_URL}/token`, {
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

  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('No tokens available. User needs to authenticate.');
    }

    if (!this.tokenExpiresAt || this.tokenExpiresAt.getTime() - Date.now() < 60000) {
      await this.refreshToken();
    }

    return this.tokens.access_token;
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.makeAuthenticatedRequest<UserProfile>('/profile');
  }

  async getUserWallets(): Promise<UserWallet[]> {
    return this.makeAuthenticatedRequest<UserWallet[]>('/wallets');
  }

  private async makeAuthenticatedRequest<T>(path: string): Promise<T> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await fetch(`${MatricaOAuthClient.USER_BASE_URL}${path}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || `Failed to fetch ${path}`);
    }

    return response.json();
  }
}

export class MatricaOAuthClient {
  private clientId: string;
  private redirectUri: string;
  private clientSecret?: string;
  private frontendUrl: string = 'https://dev.matrica.io/oauth2';
  public static readonly AUTH_BASE_URL = 'https://api-dev.matrica.io/oauth2';
  public static readonly TOKEN_URL = `${MatricaOAuthClient.AUTH_BASE_URL}/token`;
  public static readonly USER_BASE_URL = `${MatricaOAuthClient.AUTH_BASE_URL}/user`;

  constructor(config: MatricaOAuthConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.clientSecret = config.clientSecret;
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

  async createSession(code: string, codeVerifier: string): Promise<UserSession> {
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

    const response = await fetch(MatricaOAuthClient.TOKEN_URL, {
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
    return new UserSession(this.clientId, this.clientSecret, tokens);
  }

  createSessionFromTokens(tokens: TokenResponse): UserSession {
    return new UserSession(this.clientId, this.clientSecret, tokens);
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
}
