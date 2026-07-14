"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnector = exports.PrivateKeyWallet = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const networkConfig_1 = require("../utils/networkConfig");
class PrivateKeyWallet {
    keypair;
    constructor(secretKey) {
        this.keypair = stellar_sdk_1.Keypair.fromSecret(secretKey);
    }
    async getPublicKey() {
        return this.keypair.publicKey();
    }
    async signTransaction(txXdr, network = networkConfig_1.DEFAULT_NETWORK.networkPassphrase) {
        const transaction = new stellar_sdk_1.Transaction(txXdr, network);
        transaction.sign(this.keypair);
        return transaction.toXDR();
    }
}
exports.PrivateKeyWallet = PrivateKeyWallet;
class WalletConnector {
    signer;
    network;
    constructor(signer, network = networkConfig_1.DEFAULT_NETWORK) {
        this.signer = signer;
        this.network = network;
    }
    async getAddress() {
        return await this.signer.getPublicKey();
    }
    async sign(transaction) {
        const passphrase = transaction.networkPassphrase ?? this.network.networkPassphrase;
        const signedXdr = await this.signer.signTransaction(transaction.toXDR(), passphrase);
        return new stellar_sdk_1.Transaction(signedXdr, passphrase);
    }
}
exports.WalletConnector = WalletConnector;
