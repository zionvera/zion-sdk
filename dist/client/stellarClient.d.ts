import { SorobanRpc, Transaction, TransactionBuilder, Account } from '@stellar/stellar-sdk';
import { Network } from '../utils/networkConfig';
/**
 * StellarClient handles low-level interactions with the Stellar Soroban RPC.
 */
export declare class StellarClient {
    server: SorobanRpc.Server;
    network: Network;
    constructor(network?: Network);
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
     */
    simulateTransaction(transaction: Transaction): Promise<SorobanRpc.Api.SimulateTransactionResponse>;
    /**
     * Helper to build a transaction with Soroban specific settings.
     */
    buildTransaction(sourceAccount: string, memo?: string): Promise<TransactionBuilder>;
}
