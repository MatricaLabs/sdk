export interface PaginationInfo {
    count: number;
    skip: number;
    take: number;
}

export interface PaginatedResponse<T> {
    data: T[]; // Assuming T is the item type, so data is an array of T
    pagination: PaginationInfo;
}

export interface BaseQueryOptions {
    skip?: number;
    take?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}

export interface NFTQueryOptionsV2 extends BaseQueryOptions {
    nftId?: string;
    collectionId?: string;
    networkSymbol?: string;
}

export interface TokenQueryOptionsV2 extends BaseQueryOptions {
    networkSymbol?: string;
    tokenIds?: string[];
    minBalance?: number;
}

export interface DomainQueryOptionsV2 extends BaseQueryOptions {
    extension?: string;
    networkSymbol?: string;
} 