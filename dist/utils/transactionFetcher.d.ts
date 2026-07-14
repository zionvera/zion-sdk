import { Network } from './networkConfig';
/**
 * Normalized shape for a single transaction record.
 */
export interface TransactionRecord {
    id: string;
    hash: string;
    createdAt: string;
    sourceAccount: string;
    operationCount: number;
    successful: boolean;
    memo?: string;
    feeCharged: string;
}
/**
 * Options for filtering transaction history queries.
 */
export interface TransactionFetchOptions {
    limit?: number;
    order?: 'asc' | 'desc';
    cursor?: string;
}
/**
 * TransactionFetcher queries Horizon for transaction history
 * related to a wallet address or contract.
 */
export declare class TransactionFetcher {
    private horizonUrl;
    constructor(network?: Network);
    /**
     * Fetches and normalizes recent transactions for a given address.
     *
     * @param address - Stellar public key (wallet or contract address)
     * @param options - Optional filters: limit, order, cursor
     * @returns Array of normalized TransactionRecord objects
     */
    getTransactions(address: string, options?: TransactionFetchOptions): Promise<TransactionRecord[]>;
    /**
     * Normalizes a raw Horizon transaction into a clean TransactionRecord.
     */
    private normalize;
}
