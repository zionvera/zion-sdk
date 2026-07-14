"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pending = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
/**
 * ProtoxVault is the main interface for interacting with the Protox Vault contract.
 */
class Pending {
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
     * Simulates depositing tokens into the vault.
     */
    async simulateDeposit(amount, sourceAccount) {
        const address = sourceAccount || (this.wallet ? await this.wallet.getAddress() : 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
        const transaction = await this.buildUnsignedTransaction(address, 'deposit', [
            new stellar_sdk_1.Address(address).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(BigInt(amount), { type: 'i128' })
        ]);
        return await this.client.simulateTransaction(transaction);
    }
    /**
     * Simulates withdrawing tokens from the vault.
     */
    async simulateWithdraw(amount, sourceAccount) {
        const address = sourceAccount || (this.wallet ? await this.wallet.getAddress() : 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
        const transaction = await this.buildUnsignedTransaction(address, 'withdraw', [
            new stellar_sdk_1.Address(address).toScVal(),
            (0, stellar_sdk_1.nativeToScVal)(BigInt(amount), { type: 'i128' })
        ]);
        return await this.client.simulateTransaction(transaction);
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
     * Internal helper to build an unsigned transaction.
     */
    async buildUnsignedTransaction(sourceAccount, functionName, args) {
        const txBuilder = await this.client.buildTransaction(sourceAccount);
        txBuilder.addOperation(this.contract.call(functionName, ...args));
        return txBuilder.build();
    }
    /**
     * Internal helper to build and simulate contract calls.
     */
    async buildContractCall(functionName, args) {
        if (!this.wallet)
            throw new Error("Wallet not connected");
        const sourceAccount = await this.wallet.getAddress();
        const transaction = await this.buildUnsignedTransaction(sourceAccount, functionName, args);
        // Simulate to get fee and footprint
        const simulation = await this.client.simulateTransaction(transaction);
        if (!simulation.success) {
            throw new Error(`Simulation failed: ${simulation.error?.message}`);
        }
        const assembledTransaction = stellar_sdk_1.SorobanRpc.assembleTransaction(transaction, simulation.raw);
        return await this.wallet.sign(assembledTransaction.build());
    }
    /**
     * Internal helper for read-only contract calls (simulation).
     */
    async simulateCall(functionName, args) {
        // We use a dummy address for simulation if no wallet is connected
        const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
        const transaction = await this.buildUnsignedTransaction(dummyAccount, functionName, args);
        const simulation = await this.client.simulateTransaction(transaction);
        if (!simulation.success) {
            throw new Error(`Simulation failed: ${simulation.error?.message}`);
        }
        const raw = simulation.raw;
        const retval = raw.results?.[0]?.retval || raw.result?.retval;
        if (!retval) {
            throw new Error("No result in simulation");
        }
        return retval;
    }
}
exports.Pending = Pending;
