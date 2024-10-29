export interface UserProfile {
    id: string;
    username: string;
    isAdmin: boolean;
    registered: boolean;
    profile: UserProfileDetails;
    isSearchSynced: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface UserProfileDetails {
    id: string;
    name: string;
    vanityURL: string;
    about: string | null;
    website: string | null;
    emailVerified: boolean;
    twitter: string | null;
    twitterExternalId: string | null;
    showTwitter: boolean | null;
    discord: string | null;
    pfp: string | null;
    banner: string | null;
    bannerOffsetTop: number | null;
    bannerBorder: string | null;
    bannerNFTCount: number | null;
    bannerLeft: string | null;
    bannerMiddle: string | null;
    bannerRight: string | null;
    border: string | null;
    showGraveyard: boolean | null;
    createdDate: string;
    updatedDate: string;
}

export interface EmailResponse {
    email: string | null;
} 