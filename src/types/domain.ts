export interface DomainName {
    key: string;
    name: string;
    owner?: string;
    extension: string;
}

export interface DomainResponse {
    domains: DomainName[];
} 