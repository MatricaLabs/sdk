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
    id: string; // wallet address
    networkSymbol: string; // TODO: this should be chain type (SOL BTC ETH)
    chains: { 
        //TODO: add chains. can be an array of strings.
    }
}

export interface TokenInfoV2 {
    networkSymbol: string;
    // name?: string; // Example: if token name is available
    // symbol?: string; // Example: if token symbol is available
    // decimals?: number; // Example: if token decimals are available
}

export interface WalletTokenV2 {
    totalAmount: string; // API dump: "string (representing a number)"
    walletId: string; // wallet address
    tokenId: string; // token mint address / ID
    token: TokenInfoV2;
} 