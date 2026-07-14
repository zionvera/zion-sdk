export interface Network {
    networkPassphrase: string;
    rpcUrl: string;
    horizonUrl?: string;
}
export declare const NETWORKS: Record<string, Network>;
export declare const DEFAULT_NETWORK: Network;
