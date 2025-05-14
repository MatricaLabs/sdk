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

export interface SocialAccountDetailV2 {
    externalId: string;
    externalName: string;
}

export interface TwitterInfoV2 extends SocialAccountDetailV2 {
    name: "twitter";
}

export interface DiscordInfoV2 extends SocialAccountDetailV2 {
    name: "discord";
}

export interface TelegramInfoV2 extends SocialAccountDetailV2 {
    name: "telegram";
} 