export interface OwnerWalletInfo {
    id: string; // wallet address
    networkSymbol: string;
}

export interface DomainName {
    key: string; // domain key / full name
    name: string; // domain name part
    extension: string; // domain extension part
    ownerWallet: OwnerWalletInfo;
}