import { MatricaOAuthClient, UserSession } from '../core/matricaOAuthClient';
import { MatricaOAuthConfig, TokenResponse } from '../shared/types/interfaces';
import { MatricaOAuthError } from '../shared/errors';

describe('MatricaOAuthClient', () => {
    const mockConfig: MatricaOAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        environment: 'development'
    };

    const mockTokenResponse: TokenResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Constructor & Configuration', () => {
        it('should create instance with valid config', () => {
            const client = new MatricaOAuthClient(mockConfig);
            expect(client).toBeInstanceOf(MatricaOAuthClient);
        });

        it('should throw error with missing clientId', () => {
            const invalidConfig = { ...mockConfig, clientId: '' };
            expect(() => new MatricaOAuthClient(invalidConfig)).toThrow('clientId is required');
        });

        it('should throw error with missing redirectUri', () => {
            const invalidConfig = { ...mockConfig, redirectUri: '' };
            expect(() => new MatricaOAuthClient(invalidConfig)).toThrow('redirectUri is required');
        });

        it('should set correct environment URLs', () => {
            const devClient = new MatricaOAuthClient({ ...mockConfig, environment: 'development' });
            const prodClient = new MatricaOAuthClient({ ...mockConfig, environment: 'production' });
            
            expect((devClient as any).baseUrls.auth).toContain('api.matrica.io');
            expect((prodClient as any).baseUrls.auth).toContain('api.matrica.io');
        });
    });

    describe('Auth URL Generation', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
        });

        it('should generate authorization URL with PKCE', async () => {
            const scopes = 'profile email';
            const authResponse = await client.getAuthorizationUrl(scopes);
            
            expect(authResponse.url).toContain('response_type=code');
            expect(authResponse.url).toContain('client_id=test-client-id');
            expect(authResponse.url).toContain('redirect_uri=');
            expect(authResponse.url).toContain('code_challenge=');
            expect(authResponse.url).toContain('code_challenge_method=S256');
            expect(authResponse.url).toContain('scope=profile+email');
            expect(authResponse.codeVerifier).toBeDefined();
            expect(authResponse.codeVerifier.length).toBeGreaterThan(40);
        });

        it('should generate authorization URL with default scopes', async () => {
            const authResponse = await client.getAuthorizationUrl();
            
            expect(authResponse.url).toContain('scope=profile');
            expect(authResponse.codeVerifier).toBeDefined();
        });
    });

    describe('Token Exchange', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
        });

        it('should create session from code and verifier', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTokenResponse)
            });
            global.fetch = mockFetch;

            const session = await client.createSession('test-code', 'test-verifier');
            
            expect(session).toBeInstanceOf(UserSession);
            expect(session.getTokens()).toEqual(mockTokenResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/oauth2/token'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/x-www-form-urlencoded'
                    })
                })
            );
        });

        it('should handle token exchange failure', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                text: jest.fn().mockResolvedValue('Invalid authorization code')
            });
            global.fetch = mockFetch;

            await expect(
                client.createSession('invalid-code', 'test-verifier')
            ).rejects.toThrow(MatricaOAuthError);
        });

        it('should handle network errors', async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
            global.fetch = mockFetch;

            await expect(
                client.createSession('test-code', 'test-verifier')
            ).rejects.toThrow(MatricaOAuthError);
        }, 10000);
    });

    describe('Session Creation from Tokens', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
        });

        it('should create session from existing tokens', () => {
            const session = client.createSessionFromTokens(mockTokenResponse);
            
            expect(session).toBeInstanceOf(UserSession);
            expect(session.getTokens()).toEqual(mockTokenResponse);
        });

        it('should create session with client secret', () => {
            const configWithSecret = { ...mockConfig, clientSecret: 'test-secret' };
            const clientWithSecret = new MatricaOAuthClient(configWithSecret);
            const session = clientWithSecret.createSessionFromTokens(mockTokenResponse);
            
            expect(session).toBeInstanceOf(UserSession);
        });
    });
});