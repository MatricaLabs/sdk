import crypto from 'crypto';
import {
    MatricaOAuthConfig,
    TokenResponse,
    AuthUrlResponse,
    MatricaLogger
} from './types/interfaces';
import { UserProfile, EmailResponse } from './types/user';
import { UserWallet, WalletToken } from './types/wallet';
import { NFT } from './types/nft';
import { OAuthCredential } from './types/social';
import { validateConfig } from './utils/validation';
import { MatricaOAuthError } from './errors';

// Export the UserSession class
export class UserSession {
    private tokens?: TokenResponse;
    private tokenExpiresAt?: Date;

    constructor(
        private clientId: string,
        private clientSecret: string | undefined,
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
    private readonly logger?: MatricaLogger;

    constructor(config: MatricaOAuthConfig) {
        validateConfig(config);
        this.logger = config.logger;
        this.clientId = config.clientId;
        this.redirectUri = config.redirectUri;
        this.clientSecret = config.clientSecret;
        this.timeout = config.timeout || 30000;
        this.maxRetries = config.maxRetries || 3;

        // Update URL structure based on environment
        const baseApiUrl = `https://api.matrica.io/oauth2`;

        this.baseUrls = {
            frontend: `https://matrica.io/oauth2`,
            auth: `${baseApiUrl}/authorize`,
            token: `${baseApiUrl}/token`,
            user: `${baseApiUrl}/user`
        };
    }

    async getAuthorizationUrl(scope: string = 'profile'): Promise<AuthUrlResponse> {
        const codeVerifier = MatricaOAuthClient.generateRandomCode();
        const codeChallenge = MatricaOAuthClient.generateCodeChallenge(codeVerifier);

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

    static generateRandomCode(): string {
        const buffer = crypto.randomBytes(32);
        return buffer.toString('base64url');
    }

    static generateCodeChallenge(verifier: string): string {
        const hash = crypto.createHash('sha256');
        hash.update(verifier);
        return hash.digest('base64url');
    }

    // Add helper method for API calls with retries
    private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
        try {
            this.logger?.debug('Making request to:', url);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            // console.log('Fetching URL:', url);

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
            this.logger?.error('Request failed:', error);
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
