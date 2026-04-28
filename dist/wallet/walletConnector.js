"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnector = exports.PrivateKeyWallet = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
/**
 * A basic private key wallet implementation for development and testing.
 */
class PrivateKeyWallet {
    keypair;
    constructor(secretKey) {
        this.keypair = stellar_sdk_1.Keypair.fromSecret(secretKey);
    }
    async getPublicKey() {
        return this.keypair.publicKey();
    }
    async signTransaction(txXdr, network) {
        const transaction = new stellar_sdk_1.Transaction(txXdr, network);
        transaction.sign(this.keypair);
        return transaction.toXDR();
    }
}
exports.PrivateKeyWallet = PrivateKeyWallet;
/**
 * WalletConnector manages the connection to different wallet providers.
 */
class WalletConnector {
    signer;
    constructor(signer) {
        this.signer = signer;
    }
    async getAddress() {
        return await this.signer.getPublicKey();
    }
    async sign(transaction) {
        const signedXdr = await this.signer.signTransaction(transaction.toXDR(), transaction.networkPassphrase);
        return new stellar_sdk_1.Transaction(signedXdr, transaction.networkPassphrase);
    }
}
exports.WalletConnector = WalletConnector;
