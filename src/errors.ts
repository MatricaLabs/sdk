export class MatricaOAuthError extends Error {
    constructor(message: string, public code?: string) {
        super(message);
        this.name = 'MatricaOAuthError';
        Object.setPrototypeOf(this, MatricaOAuthError.prototype);
    }
}

export class MatricaAuthenticationError extends MatricaOAuthError {
    constructor(message: string) {
        super(message, 'AUTHENTICATION_ERROR');
        this.name = 'MatricaAuthenticationError';
        Object.setPrototypeOf(this, MatricaAuthenticationError.prototype);
    }
}

export default {
    MatricaOAuthError,
    MatricaAuthenticationError
}; 