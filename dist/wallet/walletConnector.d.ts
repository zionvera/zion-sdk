import { Transaction } from '@stellar/stellar-sdk';
import { Network } from '../utils/networkConfig';
export interface WalletSigner {
    getPublicKey(): Promise<string>;
    signTransaction(txXdr: string, network?: string): Promise<string>;
}
export declare class PrivateKeyWallet implements WalletSigner {
    private keypair;
    constructor(secretKey: string);
    getPublicKey(): Promise<string>;
    signTransaction(txXdr: string, network?: string): Promise<string>;
}
export declare class WalletConnector {
    private signer;
    network: Network;
    constructor(signer: WalletSigner, network?: Network);
    getAddress(): Promise<string>;
    sign(transaction: Transaction): Promise<Transaction>;
}
