import { Contract, SorobanRpc } from '@stellar/stellar-sdk';
import { StellarClient, SimulationResult } from '../client/stellarClient';
import { WalletConnector } from '../wallet/walletConnector';
/**
 * ProtoxVault is the main interface for interacting with the Protox Vault contract.
 */
export declare class Pending {
    contract: Contract;
    client: StellarClient;
    wallet?: WalletConnector;
    constructor(contractAddress: string, client: StellarClient, wallet?: WalletConnector);
    /**
     * Connect a wallet to the vault instance for signing transactions.
     */
    connect(wallet: WalletConnector): void;
    /**
     * Deposits tokens into the vault.
     */
    deposit(amount: number | bigint): Promise<SorobanRpc.Api.GetTransactionResponse>;
    /**
     * Withdraws tokens from the vault.
     */
    withdraw(amount: number | bigint): Promise<SorobanRpc.Api.GetTransactionResponse>;
    /**
     * Simulates depositing tokens into the vault.
     */
    simulateDeposit(amount: number | bigint, sourceAccount?: string): Promise<SimulationResult>;
    /**
     * Simulates withdrawing tokens from the vault.
     */
    simulateWithdraw(amount: number | bigint, sourceAccount?: string): Promise<SimulationResult>;
    /**
     * Fetches the user's share balance in the vault.
     */
    getBalance(userAddress: string): Promise<bigint>;
    /**
     * Fetches the total shares issued by the vault.
     */
    getTotalShares(): Promise<bigint>;
    /**
     * Internal helper to build an unsigned transaction.
     */
    private buildUnsignedTransaction;
    /**
     * Internal helper to build and simulate contract calls.
     */
    private buildContractCall;
    /**
     * Internal helper for read-only contract calls (simulation).
     */
    private simulateCall;
}
