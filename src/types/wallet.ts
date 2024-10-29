export enum NetworkSymbol {
    SOL = 'SOL',
    ETH = 'ETH',
    BTC = 'BTC',
    MATIC = 'MATIC'
}

export enum WalletStatus {
    HEALTHY = 'HEALTHY',
    UNHEALTHY = 'UNHEALTHY'
}

export interface UserWallet {
    id: string;
    index: number;
    networkSymbol: NetworkSymbol;
    createdDate: string;
    updatedDate: string;
    status: WalletStatus;
    isSearchSynced: boolean;
}

export interface WalletToken {
    walletId: string;
    tokenId: string | null;
    amount: number;
} 