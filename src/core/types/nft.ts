export interface NFTCollectionInfo {
    id: string;
    name: string;
}

export interface NFT {
    id: string;
    name: string;
    image: string | null;
    status: string;
    networkSymbol: string | null;
    isCompressed: boolean;
    inscriptionNumber: number | null;
    ownerId: string; // wallet address
    collection: NFTCollectionInfo | null;
}