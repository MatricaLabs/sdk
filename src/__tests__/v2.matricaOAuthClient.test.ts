import { MatricaOAuthClient, UserSession } from '../v2/matricaOAuthClient';
import { MatricaOAuthConfig, TokenResponse } from '../shared/types/interfaces';
import { MatricaOAuthError } from '../shared/errors';

describe('V2 MatricaOAuthClient', () => {
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

        it('should validate required fields', () => {
            expect(() => new MatricaOAuthClient({ ...mockConfig, clientId: '' }))
                .toThrow('clientId is required');
            expect(() => new MatricaOAuthClient({ ...mockConfig, redirectUri: '' }))
                .toThrow('redirectUri is required');
        });

        it('should set environment-specific URLs', () => {
            const devClient = new MatricaOAuthClient({ ...mockConfig, environment: 'development' });
            const prodClient = new MatricaOAuthClient({ ...mockConfig, environment: 'production' });
            
            // V2 uses the same base URL regardless of environment, but can be customized via baseApiUrl
            expect((devClient as any).baseUrls.auth).toContain('api.matrica.io');
            expect((prodClient as any).baseUrls.auth).toContain('api.matrica.io');
        });
    });

    describe('Authorization URL Generation', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
        });

        it('should generate authorization URL with default scope', async () => {
            const authResponse = await client.getAuthorizationUrl();
            
            expect(authResponse.url).toContain('response_type=code');
            expect(authResponse.url).toContain('client_id=test-client-id');
            expect(authResponse.url).toContain('code_challenge=');
            expect(authResponse.url).toContain('scope=profile');
            expect(authResponse.codeVerifier).toBeDefined();
            expect(authResponse.codeVerifier.length).toBeGreaterThan(40);
        });

        it('should generate authorization URL with custom scope', async () => {
            const authResponse = await client.getAuthorizationUrl('profile email wallets');
            
            expect(authResponse.url).toContain('scope=profile+email+wallets');
            expect(authResponse.codeVerifier).toBeDefined();
        });
    });

    describe('Session Creation', () => {
        let client: MatricaOAuthClient;

        beforeEach(() => {
            client = new MatricaOAuthClient(mockConfig);
        });

        it('should create session from authorization code', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockTokenResponse)
            });
            global.fetch = mockFetch;

            const session = await client.createSession('auth-code', 'code-verifier');
            
            expect(session).toBeInstanceOf(UserSession);
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

        it('should create session from existing tokens', () => {
            const session = client.createSessionFromTokens(mockTokenResponse);
            
            expect(session).toBeInstanceOf(UserSession);
            expect(session.getTokens()).toEqual(mockTokenResponse);
        });

        it('should handle session creation errors', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: jest.fn().mockResolvedValue({
                    error: 'invalid_grant',
                    error_description: 'Invalid authorization code'
                })
            });
            global.fetch = mockFetch;

            await expect(
                client.createSession('invalid-code', 'verifier')
            ).rejects.toThrow(MatricaOAuthError);
        });
    });

    describe('V2 UserSession', () => {
        let session: UserSession;

        beforeEach(() => {
            session = new UserSession(
                'test-client',
                undefined,
                { token: 'https://api.matrica.io/oauth2/token', user: 'https://api.matrica.io/oauth2/v2/user' },
                mockTokenResponse
            );
        });

        it('should get user profile', async () => {
            const mockProfile = { id: '123', username: 'testuser' };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ profile: mockProfile })
            });
            global.fetch = mockFetch;

            const profile = await session.getUserProfile();
            
            expect(profile).toEqual(mockProfile);
        });

        it('should get user wallets', async () => {
            const mockWallets = [{ id: '1', address: '0x123...', blockchain: 'ethereum' }];
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ wallets: mockWallets })
            });
            global.fetch = mockFetch;

            const wallets = await session.getUserWallets();
            
            expect(wallets).toEqual(mockWallets);
        });

        it('should get user NFTs with pagination', async () => {
            const mockNFTs = [{ id: '1', name: 'Test NFT' }];
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockNFTs),
                headers: {
                    get: jest.fn((header: string) => {
                        switch (header) {
                            case 'Pagination-Count': return '1';
                            case 'Pagination-Skip': return '0';
                            case 'Pagination-Take': return '10';
                            default: return null;
                        }
                    })
                }
            };
            const mockFetch = jest.fn().mockResolvedValue(mockResponse);
            global.fetch = mockFetch;

            const result = await session.getUserNFTs({ skip: 0, take: 10 });
            
            expect(result.data).toEqual(mockNFTs);
            expect(result.pagination.count).toBe(1);
        });

        it('should refresh tokens', async () => {
            const newTokens = { ...mockTokenResponse, access_token: 'new-token' };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(newTokens)
            });
            global.fetch = mockFetch;

            const refreshedTokens = await session.refreshToken();
            
            expect(refreshedTokens).toEqual(newTokens);
            expect(session.getTokens()?.access_token).toBe('new-token');
        });
    });

});