"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtoxVault = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
/**
 * ProtoxVault is the main interface for interacting with the Protox Vault contract.
 */
class ProtoxVault {
    contract;
    client;
    wallet;
    constructor(contractAddress, client, wallet) {
        this.contract = new stellar_sdk_1.Contract(contractAddress);
        this.client = client;
        this.wallet = wallet;
    }
    /**
     * Connect a wallet to the vault instance for signing transactions.
     */
    connect(wallet) {
        this.wallet = wallet;
    }
    /**
     * Deposits tokens into the vault.
     */
    async deposit(amount) {
        if (!this.wallet)
            throw new Error("Wallet not connected");
        const userAddress = await this.wallet.getAddress();
        const transaction = await this.buildContractCall('deposit', [
            new stellar_sdk_1.Address(userAddress).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(BigInt(amount), { type: 'i128' })
        ]);
        return await this.client.submitTransaction(transaction);
    }
    /**
     * Withdraws tokens from the vault.
     */
    async withdraw(amount) {
        if (!this.wallet)
            throw new Error("Wallet not connected");
        const userAddress = await this.wallet.getAddress();
        const transaction = await this.buildContractCall('withdraw', [
            new stellar_sdk_1.Address(userAddress).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(BigInt(amount), { type: 'i128' })
        ]);
        return await this.client.submitTransaction(transaction);
    }
    /**
     * Fetches the user's share balance in the vault.
     */
    async getBalance(userAddress) {
        const result = await this.simulateCall('get_balance', [new stellar_sdk_1.Address(userAddress).toScVal()]);
        return (0, stellar_sdk_1.scValToNative)(result);
    }
    /**
     * Fetches the total shares issued by the vault.
     */
    async getTotalShares() {
        const result = await this.simulateCall('get_total_shares', []);
        return (0, stellar_sdk_1.scValToNative)(result);
    }
    /**
     * Internal helper to build and simulate contract calls.
     */
    async buildContractCall(functionName, args) {
        if (!this.wallet)
            throw new Error("Wallet not connected");
        const sourceAccount = await this.wallet.getAddress();
        const txBuilder = await this.client.buildTransaction(sourceAccount);
        txBuilder.addOperation(this.contract.call(functionName, ...args));
        const transaction = txBuilder.build();
        // Simulate to get fee and footprint
        const simulation = await this.client.simulateTransaction(transaction);
        if (stellar_sdk_1.SorobanRpc.Api.isSimulationError(simulation)) {
            throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
        }
        const assembledTransaction = stellar_sdk_1.SorobanRpc.assembleTransaction(transaction, simulation);
        return await this.wallet.sign(assembledTransaction.build());
    }
    /**
     * Internal helper for read-only contract calls (simulation).
     */
    async simulateCall(functionName, args) {
        // We use a dummy address for simulation if no wallet is connected
        const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
        const txBuilder = await this.client.buildTransaction(dummyAccount);
        txBuilder.addOperation(this.contract.call(functionName, ...args));
        const transaction = txBuilder.build();
        const simulation = await this.client.simulateTransaction(transaction);
        if (stellar_sdk_1.SorobanRpc.Api.isSimulationError(simulation)) {
            throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
        }
        if (!simulation.result) {
            throw new Error("No result in simulation");
        }
        return simulation.result.retval;
    }
}
exports.ProtoxVault = ProtoxVault;
