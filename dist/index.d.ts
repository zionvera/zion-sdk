export * from './client/stellarClient';
export * from './contracts/vault';
export * from './wallet/walletConnector';
export * from './utils/networkConfig';
/**
 * Main SDK version.
 */
export declare const VERSION = "0.1.0";
/**
 * Factory for creating a ProtoxVault instance.
 */
import { StellarClient } from './client/stellarClient';
import { ProtoxVault } from './contracts/vault';
import { WalletConnector } from './wallet/walletConnector';
export declare function createProtoxVault(contractAddress: string, client: StellarClient, wallet?: WalletConnector): ProtoxVault;
