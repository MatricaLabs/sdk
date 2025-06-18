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