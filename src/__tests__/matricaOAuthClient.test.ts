import { MatricaOAuthClient } from '../matricaOAuthClient';
import { MatricaOAuthConfig } from '../types/interfaces';
import { MatricaOAuthError } from '../errors';

describe('MatricaOAuthClient', () => {
  const mockConfig: MatricaOAuthConfig = {
    clientId: 'test-client-id',
    redirectUri: 'http://localhost:3000/callback',
    environment: 'development'
  };

  describe('Constructor', () => {
    it('should create instance with valid config', () => {
      const client = new MatricaOAuthClient(mockConfig);
      expect(client).toBeInstanceOf(MatricaOAuthClient);
    });

    it('should throw error with invalid config', () => {
      const invalidConfig = { ...mockConfig, clientId: '' };
      expect(() => new MatricaOAuthClient(invalidConfig)).toThrow(MatricaOAuthError);
    });

    it('should set correct URLs for development environment', () => {
      const client = new MatricaOAuthClient(mockConfig);
      expect(client['baseUrls'].auth).toContain('api-dev.matrica.io');
    });

    it('should set correct URLs for production environment', () => {
      const prodConfig = { ...mockConfig, environment: 'production' as const };
      const client = new MatricaOAuthClient(prodConfig);
      expect(client['baseUrls'].auth).toContain('api.matrica.io');
    });
  });

  describe('Authorization URL Generation', () => {
    let client: MatricaOAuthClient;

    beforeEach(() => {
      client = new MatricaOAuthClient(mockConfig);
    });

    it('should generate valid authorization URL', async () => {
      const { url, codeVerifier } = await client.getAuthorizationUrl();
      expect(url).toContain('dev.matrica.io/oauth2');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test-client-id');
      expect(codeVerifier).toBeTruthy();
    });

    it('should include custom scope in authorization URL', async () => {
      const { url } = await client.getAuthorizationUrl('custom_scope');
      expect(url).toContain('scope=custom_scope');
    });
  });

  describe('Session Management', () => {
    let client: MatricaOAuthClient;
    const mockTokens = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'Bearer',
      expires_in: 3600
    };

    beforeEach(() => {
      client = new MatricaOAuthClient(mockConfig);
      global.fetch = jest.fn();
    });

    it('should create session from tokens', () => {
      const session = client.createSessionFromTokens(mockTokens);
      expect(session).toBeTruthy();
    });

    it('should create session from authorization code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokens)
      });

      const session = await client.createSession('test-code', 'test-verifier');
      expect(session).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    let client: MatricaOAuthClient;

    beforeEach(() => {
      client = new MatricaOAuthClient({
        ...mockConfig,
        maxRetries: 0, // Disable retries for testing
        timeout: 1000  // Short timeout for testing
      });
      global.fetch = jest.fn();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError);
      
      await expect(
        client.createSession('test-code', 'test-verifier')
      ).rejects.toThrow(MatricaOAuthError);
    }, 10000); // Increase test timeout if needed

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ 
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        })
      });

      await expect(
        client.createSession('test-code', 'test-verifier')
      ).rejects.toThrow(/Invalid authorization code/);
    });
  });
}); 