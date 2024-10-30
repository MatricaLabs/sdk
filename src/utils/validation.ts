import { MatricaOAuthConfig } from '../types/interfaces';
import { MatricaOAuthError } from '../errors';

export function validateConfig(config: MatricaOAuthConfig): void {
    if (!config.clientId) {
        throw new MatricaOAuthError('clientId is required');
    }
    if (!config.redirectUri) {
        throw new MatricaOAuthError('redirectUri is required');
    }
    if (config.timeout && config.timeout < 0) {
        throw new MatricaOAuthError('timeout must be a positive number');
    }
    if (config.maxRetries && config.maxRetries < 0) {
        throw new MatricaOAuthError('maxRetries must be a positive number');
    }
} 