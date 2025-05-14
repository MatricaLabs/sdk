export interface NFT {
    id: string;
    tokenId: string | null;
    name: string | null;
    index: number | null;
    image: string | null;
    animation: string | null;
    externalURL: string | null;
    metadataCategory: string | null;
    description: string | null;
    symbol: string;
    uri: string | null;
    url: string | null;
    cacheDate: string | null;
    attributes: string | null;
    collection: string | null;
    collectionId: string | null;
    updateAuthority: string;
    status: string;
    primarySaleHappened: boolean;
    sellerFeeBasisPoints: number;
    isMutable: boolean;
    lastParsed: string;
    networkSymbol: string;
    ownerId: string;
    createdDate: string;
    updatedDate: string;
    metadataUpdatedDate: string;
    isSearchSynced: boolean;
    isCompressed: boolean;
    inscriptionNumber: number | null;
}

export interface NFTCollectionInfoV2 {
    id: string;
    name: string;
}

//TODO: get the final types from olen and finish this

/*
TODO: 

{
    "id": "3XrK2QTeG7zNGhJ1tjjNVpx4G2fKVuNRB9XzdxvnEzSg",
    "name": "Faceless #70635",
    "image": "https://arweave.net/BTuEmnmkzwZYzPV6DcVAdaujKwBgreiXXKd9a9BuNic?ext=png",
    "collection": {
      "id": "cdca7992-ffff-413a-a5fd-304e3e0cf130",
      "name": "The Faceless",
      "community": {
        "id": "f52a7851-b5e5-4f71-b4b7-0a13050d9f4c",
        "name": "Mummies"
      }
    },
    "status": "HODLED",
    "networkSymbol": "SOL",
    "ownerId": "7XuK1RrVhDDvf3kBysA5w1u9wbE11DUY6fgZjwpkUz5q",
    "isCompressed": true,
    "inscriptionNumber": null
  }
*/
export interface NFTV2 {
    id: string;
    name: string;
    image: string | null;
    status: string;
    networkSymbol: string;
    isCompressed: boolean;
    inscriptionNumber: number | null;
    ownerId: string; // wallet address
    collection: NFTCollectionInfoV2 | null;
    // tokenId: string | null; (id is likely the primary identifier)
} 