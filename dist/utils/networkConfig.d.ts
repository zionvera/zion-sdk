export interface Network {
    networkPassphrase: string;
    rpcUrl: string;
    horizonUrl?: string;
}
export declare const NETWORKS: {
    TESTNET: {
        networkPassphrase: string;
        rpcUrl: string;
        horizonUrl: string;
    };
    MAINNET: {
        networkPassphrase: string;
        rpcUrl: string;
        horizonUrl: string;
    };
};
export declare const DEFAULT_NETWORK: {
    networkPassphrase: string;
    rpcUrl: string;
    horizonUrl: string;
};
