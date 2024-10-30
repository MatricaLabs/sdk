export interface OAuthCredential {
    id: string;
    userId: string;
    platform: 'twitter' | 'discord' | 'telegram';
    externalId: string;
    username: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
    createdDate: string;
    updatedDate: string;
} 