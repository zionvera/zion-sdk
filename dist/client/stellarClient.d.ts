import { SorobanRpc, Transaction, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import { Network } from '../utils/networkConfig';
import { CacheManager, CacheOptions } from '../utils/cacheManager';
/**
 * Developer-friendly simulation result.
 */
export interface SimulationResult {
    /** Execution status of the simulation */
    status: 'SUCCESS' | 'FAILED';
    /** Whether the simulation was successful */
    success: boolean;
    /** Estimated resource usage */
    resourceUsage: {
        cpuInstructions: number;
        memoryBytes: number;
        minResourceFee: string;
    };
    /** Decoded return value of the contract execution (if success) */
    result?: any;
    /** Decoded return values of all operations in the transaction */
    results?: any[];
    /** Decoded simulation events */
    events?: Array<{
        contractId?: string;
        type: string;
        topics: any[];
        value: any;
    }>;
    /** Simulation error message/details (if failed) */
    error?: {
        message: string;
        raw?: any;
    };
    /** Raw simulation response from Soroban RPC */
    raw: SorobanRpc.Api.SimulateTransactionResponse;
}
/**
 * StellarClient handles low-level interactions with the Stellar Soroban RPC.
 */
export declare class StellarClient {
    server: SorobanRpc.Server;
    network: Network;
    cache: CacheManager;
    constructor(network?: Network, cacheOptions?: CacheOptions);
    /**
     * Fetches the current sequence number for an account.
     */
    getAccount(publicKey: string): Promise<Account>;
    /**
     * Submits a transaction to the network and waits for results.
     */
    submitTransaction(transaction: Transaction): Promise<SorobanRpc.Api.GetTransactionResponse>;
    /**
     * Simulates a contract call to estimate fees and results.
     * Supports optional caching for read-only calls.
     */
    simulateTransaction(transaction: Transaction, useCache?: boolean): Promise<SimulationResult>;
    /**
     * Helper to build a transaction with Soroban specific settings.
     */
    buildTransaction(sourceAccount: string, memo?: string): Promise<TransactionBuilder>;
    /**
     * Parses the raw simulation response into a developer-friendly format.
     */
    private parseSimulationResponse;
}
