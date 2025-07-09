interface PfpNFTCollection {
    id: string;
    name: string;
}

interface PfpNFT {
    id: string;
    collection: PfpNFTCollection;
}

export interface UserProfileDetails {
    id: string;
    name: string;
    vanityURL: string;
    pfp: string | null;
    pfpNFT: PfpNFT | null;
    banner: string | null;
}

export interface UserProfile {
    id: string;
    username: string;
    isAdmin: boolean;
    registered: boolean;
    profile: UserProfileDetails | null;
    isSearchSynced: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface EmailResponse {
    email: string | null;
}