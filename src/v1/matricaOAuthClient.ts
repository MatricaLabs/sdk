import * as crypto from 'crypto';
import {
    MatricaOAuthConfig,
    TokenResponse,
    AuthUrlResponse,
    MatricaLogger
} from '../shared/types/interfaces';
import { UserProfile, EmailResponse } from '../shared/types/base/user';
import { UserWallet, WalletToken } from '../shared/types/base/wallet';
import { NFT } from '../shared/types/base/nft';
import { OAuthCredential } from '../shared/types/base/social';
import { DomainName, DomainResponse } from '../shared/types/base/domain';
import { validateConfig } from '../shared/utils/validation';
import { MatricaOAuthError } from '../shared/errors';


// Export the UserSession class
export class UserSession {
    private tokens?: TokenResponse;

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

        const response = await fetch(this.baseUrls.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        const newTokens = await response.json() as TokenResponse;
        this.setTokens(newTokens);
        return newTokens;
    }

    private async makeAuthenticatedRequest<T>(endpoint: string): Promise<T> {
        if (!this.tokens?.access_token) {
            throw new Error('No access token available');
        }

        const response = await fetch(`${this.baseUrls.user}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.tokens.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Try to refresh the token
            await this.refreshToken();
            // Retry the request
            const retryResponse = await fetch(`${this.baseUrls.user}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${this.tokens.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!retryResponse.ok) {
                throw new Error(`Request failed after token refresh: ${retryResponse.statusText}`);
            }

            return retryResponse.json();
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.statusText}`);
        }

        return response.json();
    }

    async getProfile(): Promise<UserProfile> {
        return this.makeAuthenticatedRequest<UserProfile>('/profile');
    }

    async getEmail(): Promise<EmailResponse> {
        return this.makeAuthenticatedRequest<EmailResponse>('/email');
    }

    async getWallets(): Promise<UserWallet[]> {
        return this.makeAuthenticatedRequest<UserWallet[]>('/wallets');
    }

    async getWalletTokens(): Promise<WalletToken[]> {
        return this.makeAuthenticatedRequest<WalletToken[]>('/wallets/tokens');
    }

    async getNFTs(): Promise<NFT[]> {
        return this.makeAuthenticatedRequest<NFT[]>('/nfts');
    }

    async getSocials(): Promise<OAuthCredential[]> {
        return this.makeAuthenticatedRequest<OAuthCredential[]>('/socials');
    }

    async getDomains(): Promise<DomainResponse> {
        return this.makeAuthenticatedRequest<DomainResponse>('/domains');
    }

    getTokens(): TokenResponse | undefined {
        return this.tokens;
    }
}

export class MatricaOAuthClient {
    private config: MatricaOAuthConfig;
    private logger?: MatricaLogger;
    private baseUrls: { auth: string; token: string; user: string };

    constructor(config: MatricaOAuthConfig) {
        validateConfig(config);
        this.config = config;
        this.logger = config.logger;

        // Set base URLs based on environment
        const baseApiUrl = config.baseApiUrl || this.getDefaultBaseUrl(config.environment);
        this.baseUrls = {
            auth: `${baseApiUrl}/oauth/authorize`,
            token: `${baseApiUrl}/oauth/token`,
            user: `${baseApiUrl}/api/v1/user`
        };

        this.logger?.debug('MatricaOAuthClient initialized', { 
            clientId: config.clientId,
            environment: config.environment,
            baseUrls: this.baseUrls
        });
    }

    private getDefaultBaseUrl(environment?: string): string {
        switch (environment) {
            case 'development':
                return 'http://localhost:3000';
            case 'staging':
                return 'https://staging-api.matrica.io';
            case 'production':
            default:
                return 'https://api.matrica.io';
        }
    }

    generateAuthUrl(scopes: string[] = ['profile'], state?: string): AuthUrlResponse {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: scopes.join(' '),
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        if (state) {
            params.append('state', state);
        }

        const url = `${this.baseUrls.auth}?${params.toString()}`;
        
        this.logger?.debug('Generated auth URL', { url, scopes, state });
        
        return {
            url,
            codeVerifier
        };
    }

    async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<TokenResponse> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: this.config.clientId,
            code,
            redirect_uri: this.config.redirectUri,
            code_verifier: codeVerifier
        });

        if (this.config.clientSecret) {
            params.append('client_secret', this.config.clientSecret);
        }

        this.logger?.debug('Exchanging code for tokens', { code: code.substring(0, 10) + '...' });

        const response = await this.makeRequest(this.baseUrls.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger?.error('Token exchange failed', { status: response.status, error: errorText });
            throw new MatricaOAuthError(`Token exchange failed: ${response.statusText}`);
        }

        const tokens = await response.json() as TokenResponse;
        this.logger?.debug('Successfully exchanged code for tokens');
        
        return tokens;
    }

    createUserSession(tokens?: TokenResponse): UserSession {
        return new UserSession(
            this.config.clientId,
            this.config.clientSecret,
            { token: this.baseUrls.token, user: this.baseUrls.user },
            tokens
        );
    }

    private generateCodeVerifier(): string {
        return crypto.randomBytes(32).toString('base64url');
    }

    private generateCodeChallenge(verifier: string): string {
        return crypto.createHash('sha256').update(verifier).digest('base64url');
    }

    private async makeRequest(url: string, options: RequestInit): Promise<Response> {
        const timeout = this.config.timeout || 10000;
        const maxRetries = this.config.maxRetries || 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                this.logger?.warn(`Request attempt ${attempt} failed`, { error, url });
                
                if (attempt === maxRetries) {
                    throw new MatricaOAuthError(`Request failed after ${maxRetries} attempts: ${error}`);
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
            }
        }

        throw new MatricaOAuthError('Unexpected error in request retry logic');
    }
}