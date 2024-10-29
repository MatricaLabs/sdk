import crypto from 'crypto';

interface MatricaOAuthConfig {
  clientId: string;
  redirectUri: string;
  clientSecret?: string;
  environment?: 'development' | 'staging' | 'production';
  timeout?: number;
  maxRetries?: number;
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

interface NFT {
  id: string;
  tokenId: string | null;
  name: string | null;
  index: number | null;
  image: string | null;
  animation: string | null;
  externalURL: string | null;
  metadataCategory: string | null;
  description: string | null;
  symbol: string;
  uri: string | null;
  url: string | null;
  cacheDate: string | null;
  attributes: string | null;
  collection: string | null;
  collectionId: string | null;
  updateAuthority: string;
  status: string;
  primarySaleHappened: boolean;
  sellerFeeBasisPoints: number;
  isMutable: boolean;
  lastParsed: string;
  networkSymbol: string;
  ownerId: string;
  createdDate: string;
  updatedDate: string;
  metadataUpdatedDate: string;
  isSearchSynced: boolean;
  isCompressed: boolean;
  inscriptionNumber: number | null;
}

interface WalletToken {
  walletId: string;
  tokenId: string | null;
  amount: number;
}

interface OAuthCredential {
  name: string;
  externalId: string;
  externalName: string;
}

// Add interface for email response
interface EmailResponse {
  email: string | null;
}

// Add custom error classes
export class MatricaOAuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'MatricaOAuthError';
  }
}

export class MatricaAuthenticationError extends MatricaOAuthError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'MatricaAuthenticationError';
  }
}

class UserSession {
  private tokens?: TokenResponse;
  private tokenExpiresAt?: Date;

  constructor(
    private clientId: string,
    private clientSecret?: string,
    private baseUrls: { token: string; user: string },
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

    const response = await fetch(`${this.baseUrls.token}`, {
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

  async getUserNFTs(nftId?: string): Promise<NFT[]> {
    const path = '/nfts' + (nftId ? `?nftId=${nftId}` : '');
    return this.makeAuthenticatedRequest<NFT[]>(path);
  }

  async getUserTokens(): Promise<WalletToken[]> {
    return this.makeAuthenticatedRequest<WalletToken[]>('/tokens');
  }

  async getUserTwitter(): Promise<OAuthCredential | null> {
    return this.makeAuthenticatedRequest<OAuthCredential>('/twitter');
  }

  async getUserDiscord(): Promise<OAuthCredential | null> {
    return this.makeAuthenticatedRequest<OAuthCredential>('/discord');
  }

  async getUserTelegram(): Promise<OAuthCredential | null> {
    return this.makeAuthenticatedRequest<OAuthCredential>('/telegram');
  }

  async getUserSocial(platform: 'twitter' | 'discord' | 'telegram'): Promise<OAuthCredential | null> {
    return this.makeAuthenticatedRequest<OAuthCredential>(`/${platform}`);
  }

  async getUserEmail(): Promise<EmailResponse> {
    return this.makeAuthenticatedRequest<EmailResponse>('/email');
  }

  private async makeAuthenticatedRequest<T>(path: string): Promise<T> {
    const accessToken = await this.getValidAccessToken();
    
    const response = await fetch(`${this.baseUrls.user}${path}`, {
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
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly baseUrls: {
    frontend: string;
    auth: string;
    token: string;
    user: string;
  };

  constructor(config: MatricaOAuthConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.clientSecret = config.clientSecret;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;

    // Update URL structure based on environment
    const apiPrefix = config.environment === 'development' ? 'api-dev' : 'api';
    const baseApiUrl = `https://${apiPrefix}.matrica.io/oauth2`;

    this.baseUrls = {
      frontend: `https://${config.environment === 'production' ? '' : 'dev.'}matrica.io/oauth2`,
      auth: `${baseApiUrl}`,
      token: `${baseApiUrl}/token`,
      user: `${baseApiUrl}/user`
    };
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
      url: `${this.baseUrls.frontend}?${params.toString()}`,
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

    const response = await this.fetchWithRetry(this.baseUrls.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const tokens = await response.json();
    return new UserSession(
      this.clientId, 
      this.clientSecret, 
      { 
        token: this.baseUrls.token, 
        user: this.baseUrls.user 
      }, 
      tokens
    );
  }

  createSessionFromTokens(tokens: TokenResponse): UserSession {
    return new UserSession(
      this.clientId, 
      this.clientSecret, 
      { 
        token: this.baseUrls.token, 
        user: this.baseUrls.user 
      }, 
      tokens
    );
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

  // Add helper method for API calls with retries
  private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      console.log('Fetching URL:', url);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.json();
        throw new MatricaOAuthError(
          error.error_description || `Request failed with status ${response.status}`,
          error.error
        );
      }
      
      return response;
    } catch (error) {
      if (error instanceof MatricaOAuthError) throw error;
      
      if (retries < this.maxRetries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        return this.fetchWithRetry(url, options, retries + 1);
      }
      
      throw new MatricaOAuthError(
        error instanceof Error ? error.message : 'Network request failed'
      );
    }
  }
}
