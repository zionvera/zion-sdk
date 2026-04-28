import { Transaction } from '@stellar/stellar-sdk';
/**
 * Interface for wallet adapters (Freighter, Albedo, Private Key, etc.)
 */
export interface WalletSigner {
    getPublicKey(): Promise<string>;
    signTransaction(txXdr: string, network: string): Promise<string>;
}
/**
 * A basic private key wallet implementation for development and testing.
 */
export declare class PrivateKeyWallet implements WalletSigner {
    private keypair;
    constructor(secretKey: string);
    getPublicKey(): Promise<string>;
    signTransaction(txXdr: string, network: string): Promise<string>;
}
/**
 * WalletConnector manages the connection to different wallet providers.
 */
export declare class WalletConnector {
    private signer;
    constructor(signer: WalletSigner);
    getAddress(): Promise<string>;
    sign(transaction: Transaction): Promise<Transaction>;
}
