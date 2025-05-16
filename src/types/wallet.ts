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
    networkSymbol: NetworkSymbol;
    status: WalletStatus;

}

export interface TokenDetails {
    id: string;
    name: string;
    symbol: string;
    networkSymbol: NetworkSymbol;
}

export interface WalletToken {
    walletId: string;
    token: TokenDetails;
    tokenId: string;
    totalAmount: number;
}

export interface UserWalletV2 {
    id: string;
    networkSymbol: string;
    primaryWalletOn: string[];
    activeChains: string[];
}

export interface TokenInfoV2 {
    networkSymbol: string;
    name: string;
    symbol: string;
    id: string
}

export interface WalletTokenV2 {
    totalAmount: string;
    stakedAmount: string;
    amount: string;
    walletId: string;
    tokenId: string;
    token: TokenInfoV2;
} 