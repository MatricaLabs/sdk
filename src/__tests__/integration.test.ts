import { v1, v2 } from '../index';
import { MatricaOAuthConfig } from '../shared/types/interfaces';

describe('Integration Tests', () => {
    const mockConfig: MatricaOAuthConfig = {
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        environment: 'development'
    };

    describe('Package Exports', () => {
        it('should export v1 namespace', () => {
            expect(v1).toBeDefined();
            expect(v1.MatricaOAuthClient).toBeDefined();
            expect(v1.UserSession).toBeDefined();
        });

        it('should export v2 namespace', () => {
            expect(v2).toBeDefined();
            expect(v2.MatricaOAuthClient).toBeDefined();
            expect(v2.UserSession).toBeDefined();
        });

        it('should create v1 client instance', () => {
            const client = new v1.MatricaOAuthClient(mockConfig);
            expect(client).toBeInstanceOf(v1.MatricaOAuthClient);
        });

        it('should create v2 client instance', () => {
            const client = new v2.MatricaOAuthClient(mockConfig);
            expect(client).toBeInstanceOf(v2.MatricaOAuthClient);
        });
    });

    describe('Backward Compatibility', () => {
        it('should export default v1 classes for backward compatibility', () => {
            const { MatricaOAuthClient, UserSession } = require('../index');
            expect(MatricaOAuthClient).toBeDefined();
            expect(UserSession).toBeDefined();
            
            const client = new MatricaOAuthClient(mockConfig);
            expect(client).toBeInstanceOf(MatricaOAuthClient);
        });
    });
});