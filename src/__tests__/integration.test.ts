import { MatricaOAuthClient, UserSession } from '../index';
import { MatricaOAuthConfig } from '../shared/types/interfaces';

describe('Integration Tests', () => {
    const mockConfig: MatricaOAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        environment: 'development'
    };

    describe('Package Exports', () => {
        it('should export core classes', () => {
            expect(MatricaOAuthClient).toBeDefined();
            expect(UserSession).toBeDefined();
        });

        it('should create client instance', () => {
            const client = new MatricaOAuthClient(mockConfig);
            expect(client).toBeInstanceOf(MatricaOAuthClient);
        });
    });
});