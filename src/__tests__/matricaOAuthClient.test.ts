import { MatricaOAuthClient, UserSession } from '../matricaOAuthClient';
import { MatricaOAuthConfig } from '../types/interfaces';
import { MatricaOAuthError } from '../errors';

jest.setTimeout(10000); // Increase global timeout

describe('MatricaOAuthClient', () => {
    const mockConfig: MatricaOAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        environment: 'development',
        maxRetries: 0, // Disable retries for tests
        timeout: 1000
    };

    describe('Constructor & Config Validation', () => {
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

        it('should throw error with invalid timeout', () => {
            const invalidConfig = { ...mockConfig, timeout: -1 };
            expect(() => new MatricaOAuthClient(invalidConfig)).toThrow('timeout must be a positive number');
        });

        it('should throw error with invalid maxRetries', () => {
            const invalidConfig = { ...mockConfig, maxRetries: -1 };
            expect(() => new MatricaOAuthClient(invalidConfig)).toThrow('maxRetries must be a positive number');
        });
    });

    describe('UserSession Methods', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
            global.fetch = jest.fn();
        });

        it('should handle token refresh failure', async () => {
            const session = client.createSessionFromTokens({
                access_token: 'old-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 0
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error_description: 'Invalid refresh token' })
            });

            await expect(session.getUserProfile()).rejects.toThrow('Invalid refresh token');
        });

        it('should handle missing tokens', async () => {
            const session = client.createSessionFromTokens({
                access_token: 'test-token',
                refresh_token: '',
                token_type: 'Bearer',
                expires_in: 3600
            });

            await expect(session.refreshToken()).rejects.toThrow('No refresh token available');
        });

        it('should handle API errors in authenticated requests', async () => {
            const session = client.createSessionFromTokens({
                access_token: 'test-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 3600
            });

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.resolve({ error_description: 'Profile not found' })
            });

            await expect(session.getUserProfile()).rejects.toThrow('Profile not found');
        });

        it('should handle all social platform requests', async () => {
            const session = client.createSessionFromTokens({
                access_token: 'test-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 3600
            });

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ id: 'test-id' })
            });

            await expect(session.getUserTwitter()).resolves.toBeTruthy();
            await expect(session.getUserDiscord()).resolves.toBeTruthy();
            await expect(session.getUserTelegram()).resolves.toBeTruthy();
            await expect(session.getUserEmail()).resolves.toBeTruthy();
        });
    });

    describe('Environment and URL Generation', () => {
        it('should generate correct URLs for production', () => {
            const prodClient = new MatricaOAuthClient({
                ...mockConfig,
                environment: 'production'
            });

            expect(prodClient['baseUrls'].frontend).toContain('matrica.io/oauth2');
            expect(prodClient['baseUrls'].auth).toContain('api.matrica.io/oauth2');
        });

        it('should generate correct URLs for development', () => {
            const devClient = new MatricaOAuthClient({
                ...mockConfig,
                environment: 'development'
            });

            expect(devClient['baseUrls'].frontend).toContain('dev.matrica.io/oauth2');
            expect(devClient['baseUrls'].auth).toContain('api-dev.matrica.io/oauth2');
        });
    });

    describe('Authorization URL Generation', () => {
        it('should generate valid code verifier and challenge', async () => {
            const client = new MatricaOAuthClient(mockConfig);
            const { url, codeVerifier } = await client.getAuthorizationUrl('custom_scope');

            expect(url).toContain('code_challenge_method=S256');
            expect(url).toContain('scope=custom_scope');
            expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
        });
    });

    describe('Error Handling', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
            global.fetch = jest.fn();
        });

        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(
                client.createSession('test-code', 'test-verifier')
            ).rejects.toThrow(MatricaOAuthError);
        });

        it('should handle non-JSON responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: () => Promise.reject(new Error('Invalid JSON'))
            });

            await expect(
                client.createSession('test-code', 'test-verifier')
            ).rejects.toThrow(MatricaOAuthError);
        });

        it('should handle successful session creation', async () => {
            const mockTokens = {
                access_token: 'test-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 3600
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockTokens)
            });

            const session = await client.createSession('test-code', 'test-verifier');
            expect(session).toBeInstanceOf(UserSession);
        });
    });

    describe('Session Management', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient({
                ...mockConfig,
                clientSecret: 'test-secret' // Test with clientSecret
            });
        });

        it('should create session with client secret', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    access_token: 'test-token',
                    refresh_token: 'refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600
                })
            });

            const session = await client.createSession('test-code', 'test-verifier');
            expect(session).toBeInstanceOf(UserSession);
        });

        it('should create session from existing tokens', () => {
            const tokens = {
                access_token: 'test-token',
                refresh_token: 'refresh-token',
                token_type: 'Bearer',
                expires_in: 3600
            };

            const session = client.createSessionFromTokens(tokens);
            expect(session).toBeInstanceOf(UserSession);
        });
    });

    describe('Logger Integration', () => {
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        it('should log API calls and errors', async () => {
            const client = new MatricaOAuthClient({
                ...mockConfig,
                logger: mockLogger
            });

            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            try {
                await client.createSession('test-code', 'test-verifier');
            } catch (error) {
                // Expected error
            }

            expect(mockLogger.debug).toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
}); 