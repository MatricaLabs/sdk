export interface SocialAccountDetail {
    externalId: string;
    externalName: string;
}

export interface TwitterInfo extends SocialAccountDetail {
    name: "twitter";
}

export interface DiscordInfo extends SocialAccountDetail {
    name: "discord";
}

export interface TelegramInfo extends SocialAccountDetail {
    name: "telegram";
}