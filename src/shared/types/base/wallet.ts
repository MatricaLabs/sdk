import { NetworkSymbol, WalletStatus } from '../enum';

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