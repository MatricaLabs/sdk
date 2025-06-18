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