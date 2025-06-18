export interface UserWallet {
    id: string;
    networkSymbol: string;
    primaryWalletOn: string[];
    activeChains: string[];
}

export interface TokenInfo {
    networkSymbol: string;
    name: string;
    symbol: string;
    id: string
}

export interface WalletToken {
    totalAmount: string;
    stakedAmount: string;
    amount: string;
    walletId: string;
    tokenId: string;
    token: TokenInfo;
}