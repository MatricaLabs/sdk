export interface NFTCollectionInfoV2 {
    id: string;
    name: string;
}

export interface NFTV2 {
    id: string;
    name: string;
    image: string | null;
    status: string;
    networkSymbol: string | null;
    isCompressed: boolean;
    inscriptionNumber: number | null;
    ownerId: string; // wallet address
    collection: NFTCollectionInfoV2 | null;
}