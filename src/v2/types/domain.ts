export interface OwnerWalletInfoV2 {
    id: string; // wallet address
    networkSymbol: string;
}

export interface DomainNameV2 {
    key: string; // domain key / full name
    name: string; // domain name part
    extension: string; // domain extension part
    ownerWallet: OwnerWalletInfoV2;
}