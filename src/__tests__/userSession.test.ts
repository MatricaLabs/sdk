import { UserSession } from '../matricaOAuthClient';
import { TokenResponse } from '../types/interfaces';

describe('UserSession', () => {
    const mockTokens: TokenResponse = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
    };

    const mockBaseUrls = {
        token: 'https://api-dev.matrica.io/oauth2/token',
        user: 'https://api-dev.matrica.io/oauth2/user'
    };

    describe('Token Management', () => {
        let session: UserSession;

        beforeEach(() => {
            global.fetch = jest.fn();
            session = new UserSession('test-client', undefined, mockBaseUrls, mockTokens);
        });

        it('should return valid access token', async () => {
            const token = await session.getValidAccessToken();
            expect(token).toBe(mockTokens.access_token);
        });

    });
}); 