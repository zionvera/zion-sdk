"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarClient = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const networkConfig_1 = require("../utils/networkConfig");
/**
 * StellarClient handles low-level interactions with the Stellar Soroban RPC.
 */
class StellarClient {
    server;
    network;
    constructor(network = networkConfig_1.DEFAULT_NETWORK) {
        this.network = network;
        this.server = new stellar_sdk_1.SorobanRpc.Server(network.rpcUrl);
    }
    /**
     * Fetches the current sequence number for an account.
     */
    async getAccount(publicKey) {
        return await this.server.getAccount(publicKey);
    }
    /**
     * Submits a transaction to the network and waits for results.
     */
    async submitTransaction(transaction) {
        const response = await this.server.sendTransaction(transaction);
        if (response.status !== 'PENDING') {
            throw new Error(`Transaction submission failed: ${JSON.stringify(response)}`);
        }
        // Poll for status
        let statusResponse = await this.server.getTransaction(response.hash);
        while (statusResponse.status === 'NOT_FOUND') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            statusResponse = await this.server.getTransaction(response.hash);
        }
        return statusResponse;
    }
    /**
     * Simulates a contract call to estimate fees and results.
     */
    async simulateTransaction(transaction) {
        return await this.server.simulateTransaction(transaction);
    }
    /**
     * Helper to build a transaction with Soroban specific settings.
     */
    async buildTransaction(sourceAccount, memo) {
        const account = await this.getAccount(sourceAccount);
        return new stellar_sdk_1.TransactionBuilder(account, {
            fee: '1000', // Base fee, will be updated by simulation
            networkPassphrase: this.network.networkPassphrase,
            timebounds: { minTime: 0, maxTime: 0 },
        });
    }
}
exports.StellarClient = StellarClient;
