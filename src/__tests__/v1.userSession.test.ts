import { UserSession } from '../v1/matricaOAuthClient';
import { TokenResponse } from '../shared/types/interfaces';

describe('V1 UserSession', () => {
    const mockTokens: TokenResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
    };

    const mockBaseUrls = {
        auth: 'https://api-dev.matrica.io/oauth/authorize',
        token: 'https://api-dev.matrica.io/oauth2/token',
        user: 'https://api-dev.matrica.io/oauth2/user'
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Token Management', () => {
        let session: UserSession;

        beforeEach(() => {
            session = new UserSession('test-client', undefined, mockBaseUrls, mockTokens);
        });

        it('should return current tokens', () => {
            const tokens = session.getTokens();
            expect(tokens).toEqual(mockTokens);
        });

        it('should refresh tokens successfully', async () => {
            const newTokens = {
                ...mockTokens,
                access_token: 'new-access-token'
            };

            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(newTokens)
            });
            global.fetch = mockFetch;

            await session.refreshToken();
            
            expect(session.getTokens()?.access_token).toBe('new-access-token');
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/oauth2/token'),
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('should handle refresh token failure', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Invalid refresh token'
            });
            global.fetch = mockFetch;

            await expect(session.refreshToken()).rejects.toThrow('Token refresh failed: Invalid refresh token');
        });
    });

    describe('API Requests', () => {
        let session: UserSession;

        beforeEach(() => {
            session = new UserSession('test-client', undefined, mockBaseUrls, mockTokens);
        });

        it('should get user profile', async () => {
            const mockProfile = { id: '123', username: 'testuser' };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockProfile)
            });
            global.fetch = mockFetch;

            const profile = await session.getProfile();
            
            expect(profile).toEqual(mockProfile);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('/profile'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer mock-access-token'
                    })
                })
            );
        });

        it('should get user email', async () => {
            const mockEmail = { email: 'test@example.com' };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockEmail)
            });
            global.fetch = mockFetch;

            const email = await session.getEmail();
            
            expect(email).toEqual(mockEmail);
        });

        it('should get user wallets', async () => {
            const mockWallets = [{ id: '1', address: '0x123...', blockchain: 'ethereum' }];
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockWallets)
            });
            global.fetch = mockFetch;

            const wallets = await session.getWallets();
            
            expect(wallets).toEqual(mockWallets);
        });

        it('should get user domains', async () => {
            const mockDomains = { domains: [{ id: '1', name: 'test.com' }] };
            const mockFetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockDomains)
            });
            global.fetch = mockFetch;

            const domains = await session.getDomains();
            
            expect(domains).toEqual(mockDomains);
        });

        it('should handle API errors', async () => {
            const mockFetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });
            global.fetch = mockFetch;

            await expect(session.getProfile()).rejects.toThrow('Request failed: Not Found');
        });

        it('should automatically refresh expired tokens on 401', async () => {
            const newTokens = { ...mockTokens, access_token: 'refreshed-token' };
            const mockProfile = { id: '123', username: 'testuser' };

            const mockFetch = jest.fn()
                .mockResolvedValueOnce({
                    ok: false,
                    status: 401,
                    statusText: 'Unauthorized'
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(newTokens)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: jest.fn().mockResolvedValue(mockProfile)
                });
            global.fetch = mockFetch;

            const profile = await session.getProfile();
            
            expect(profile).toEqual(mockProfile);
            expect(mockFetch).toHaveBeenCalledTimes(3); // Initial request, refresh, retry
        });
    });

    describe('Session State', () => {
        it('should detect valid session with tokens', () => {
            const session = new UserSession('test-client', undefined, mockBaseUrls, mockTokens);
            expect(session.getTokens()).toBeDefined();
            expect(session.getTokens()?.access_token).toBe('mock-access-token');
        });

        it('should detect invalid session without tokens', () => {
            const session = new UserSession('test-client', undefined, mockBaseUrls);
            expect(session.getTokens()).toBeUndefined();
        });
    });
});