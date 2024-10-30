import { MatricaOAuthError, MatricaAuthenticationError } from '../errors';

describe('Error Classes', () => {
    describe('MatricaOAuthError', () => {
        it('should create error with message and code', () => {
            const error = new MatricaOAuthError('Test error', 'TEST_ERROR');
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(MatricaOAuthError);
        });
    });

    describe('MatricaAuthenticationError', () => {
        it('should create authentication error', () => {
            const error = new MatricaAuthenticationError('Auth failed');
            expect(error.message).toBe('Auth failed');
            expect(error.code).toBe('AUTHENTICATION_ERROR');
            expect(error).toBeInstanceOf(MatricaOAuthError);
            expect(error).toBeInstanceOf(MatricaAuthenticationError);
        });
    });
}); 