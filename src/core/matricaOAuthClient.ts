import * as crypto from 'crypto';
import {
    MatricaOAuthConfig,
    TokenResponse,
    AuthUrlResponse,
    MatricaLogger
} from '../shared/types/interfaces';
import {
    UserProfile,
    EmailResponse,
} from './types/user';
import {
    UserWallet,
    WalletToken,
} from './types/wallet';
import {
    NFT,
} from './types/nft';
import {
    TwitterInfo,
    DiscordInfo,
    TelegramInfo,
} from './types/social';
import {
    DomainName,
} from './types/domain';
import { UserRole } from './types/roles';
import {
    PaginatedResponse,
    PaginationInfo,
    NFTQueryOptions,
    TokenQueryOptions,
    DomainQueryOptions,
    BaseQueryOptions,
} from './types/common';
import { validateConfig } from '../shared/utils/validation';
import { MatricaOAuthError } from '../shared/errors';

// Export the UserSession class for v2
export class UserSession {
    private tokens?: TokenResponse;
    private clientId: string;
    private clientSecret: string | undefined;
    private baseUrls: { token: string; user: string };

    constructor(
        clientId: string,
        clientSecret: string | undefined,
        baseUrls: { token: string; user: string },
        initialTokens?: TokenResponse
    ) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.baseUrls = baseUrls;
        if (initialTokens) {
            this.setTokens(initialTokens);
        }
    }

    private setTokens(tokens: TokenResponse) {
        this.tokens = tokens;
    }

    public getTokens(): TokenResponse | undefined {
        return this.tokens;
    }

    private _buildQueryString(options?: BaseQueryOptions | NFTQueryOptions | TokenQueryOptions | DomainQueryOptions): string {
        if (!options) return '';
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options)) {
            if (value !== undefined && value !== null) {
                if (key === 'tokenIds' && Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, String(value));
                }
            }
        }
        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    private async makePaginatedRequest<T>(path: string, options?: BaseQueryOptions): Promise<PaginatedResponse<T>> {
        const accessToken = await this.getValidAccessToken();
        const queryString = this._buildQueryString(options);

        const response = await fetch(`${this.baseUrls.user}${path}${queryString}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error_description || `Failed to fetch ${path}`);
        }

        const data = await response.json();
        const pagination: PaginationInfo = {
            count: parseInt(response.headers.get('Pagination-Count') || '0', 10),
            skip: parseInt(response.headers.get('Pagination-Skip') || '0', 10),
            take: parseInt(response.headers.get('Pagination-Take') || '0', 10),
        };

        return { data, pagination };
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

        return this.tokens.access_token;
    }

    async getUserProfile(): Promise<UserProfile | null> {
        const response = await this.makeAuthenticatedRequest<{ profile: UserProfile | null }>('/profile');
        return response.profile;
    }

    async getUserWallets(): Promise<UserWallet[]> {
        const response = await this.makeAuthenticatedRequest<{ wallets: UserWallet[] | [] }>('/wallets');
        return response.wallets;
    }

    async getUserNFTs(options?: NFTQueryOptions): Promise<PaginatedResponse<NFT>> {
        return this.makePaginatedRequest<NFT>('/nfts', options);
    }

    async getUserTokens(options?: TokenQueryOptions): Promise<PaginatedResponse<WalletToken>> {
        return this.makePaginatedRequest<WalletToken>('/tokens', options);
    }

    async getUserTwitter(): Promise<TwitterInfo | null> {
        const response = await this.makeAuthenticatedRequest<{ twitter: TwitterInfo | null }>('/twitter');
        return response.twitter;
    }

    async getUserDiscord(): Promise<DiscordInfo | null> {
        const response = await this.makeAuthenticatedRequest<{ discord: DiscordInfo | null }>('/discord');
        return response.discord;
    }

    async getUserTelegram(): Promise<TelegramInfo | null> {
        const response = await this.makeAuthenticatedRequest<{ telegram: TelegramInfo | null }>('/telegram');
        return response.telegram;
    }

    async getUserSocial(platform: 'twitter' | 'discord' | 'telegram'): Promise<TwitterInfo | DiscordInfo | TelegramInfo | null> {
        const response = await this.makeAuthenticatedRequest<any>(`/${platform}`);
        if (response && response[platform]) {
            return response[platform] as TwitterInfo | DiscordInfo | TelegramInfo | null;
        }
        return null;
    }

    async getUserDomains(options?: DomainQueryOptions): Promise<PaginatedResponse<DomainName>> {
        return this.makePaginatedRequest<DomainName>('/domains', options);
    }

    async getUserEmail(): Promise<EmailResponse | null> {
        const response = await this.makeAuthenticatedRequest<{ email: string | null }>('/email');
        return response;
    }

    async getUserRoles(): Promise<UserRole[] | null> {
        const response = await this.makeAuthenticatedRequest<{ roles: UserRole[] | null }>('/roles');
        return response.roles;
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

        // Update URL structure for v2 endpoints
        const baseApiUrl = config.baseApiUrl || `https://api.matrica.io/oauth2`;

        this.baseUrls = {
            frontend: config.frontend || `https://matrica.io/oauth2`,
            auth: `${baseApiUrl}/authorize`,
            token: `${baseApiUrl}/token`,
            user: `${baseApiUrl}/v2/user`
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

        let response: Response;
        try {
            response = await this.fetchWithRetry(
                this.baseUrls.token,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params
                }
            );
        } catch (error) {
            throw new MatricaOAuthError('Failed to exchange code for tokens', 'TOKEN_EXCHANGE_ERROR');
        }

        if (!response.ok) {
            let errorDescription = 'Failed to exchange code for tokens';
            let errorCode = 'API_ERROR';
            try {
                const errorData = await response.json();
                if (errorData) {
                    errorDescription = errorData.error_description || errorDescription;
                    errorCode = errorData.error || errorCode;
                }
            } catch (e) {
                // Response might not be JSON or errorData is null
                errorDescription = `Failed to exchange code for tokens. Status: ${response.status} ${response.statusText}`;
            }
            throw new MatricaOAuthError(
                errorDescription,
                errorCode
            );
        }

        const tokens = await response.json();
        return new UserSession(this.clientId, this.clientSecret, {
            token: this.baseUrls.token,
            user: this.baseUrls.user
        }, tokens);
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
        const buffer = crypto.randomBytes(64);
        return buffer.toString('base64url');
    }

    static generateCodeChallenge(verifier: string): string {
        const hash = crypto.createHash('sha256').update(verifier).digest();
        return hash.toString('base64url');
    }

    private async fetchWithRetry(url: string, options: RequestInit, retries = 0): Promise<Response> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const opts = {
                ...options,
                signal: controller.signal
            };

            const response = await fetch(url, opts);
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            if (retries >= this.maxRetries) {
                throw error;
            }

            // Exponential backoff
            const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));

            this.logger?.debug(`Retrying request to ${url}, attempt ${retries + 1}/${this.maxRetries}`);
            return this.fetchWithRetry(url, options, retries + 1);
        }
    }
} 