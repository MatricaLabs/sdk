export interface MatricaOAuthConfig {
    clientId: string;
    redirectUri: string;
    clientSecret?: string;
    environment?: 'development' | 'staging' | 'production';
    timeout?: number;
    maxRetries?: number;
    logger?: MatricaLogger;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope?: string;
}

export interface AuthUrlResponse {
    url: string;
    codeVerifier: string;
}

export interface MatricaLogger {
    debug: (message: string, ...args: any[]) => void;
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
} 