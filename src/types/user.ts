import { NFTV2 } from './nft';

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

interface PfpNFTCollection {
    id: string;
    name: string;
}

interface PfpNFT {
    id: string;
    collection: PfpNFTCollection;
}

export interface UserProfileDetails {
    name: string;
    vanityURL: string;
    pfp: string | null;
    pfpNFT: PfpNFT | null;
    banner: string | null;
}

export interface EmailResponse {
    email: string | null;
} 