"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionFetcher = void 0;
const networkConfig_1 = require("./networkConfig");
/**
 * TransactionFetcher queries Horizon for transaction history
 * related to a wallet address or contract.
 */
class TransactionFetcher {
    horizonUrl;
    constructor(network = networkConfig_1.DEFAULT_NETWORK) {
        if (!network.horizonUrl) {
            throw new Error(`Network "${network.networkPassphrase}" has no horizonUrl configured.`);
        }
        this.horizonUrl = network.horizonUrl;
    }
    /**
     * Fetches and normalizes recent transactions for a given address.
     *
     * @param address - Stellar public key (wallet or contract address)
     * @param options - Optional filters: limit, order, cursor
     * @returns Array of normalized TransactionRecord objects
     */
    async getTransactions(address, options = {}) {
        const { limit = 10, order = 'desc', cursor } = options;
        const url = new URL(`/accounts/${address}/transactions`, this.horizonUrl);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('order', order);
        if (cursor)
            url.searchParams.set('cursor', cursor);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Horizon request failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const records = data._embedded?.records ?? [];
        return records.map(this.normalize);
    }
    /**
     * Normalizes a raw Horizon transaction into a clean TransactionRecord.
     */
    normalize(tx) {
        return {
            id: tx.id,
            hash: tx.hash,
            createdAt: tx.created_at,
            sourceAccount: tx.source_account,
            operationCount: tx.operation_count,
            successful: tx.successful,
            memo: tx.memo,
            feeCharged: tx.fee_charged,
        };
    }
}
exports.TransactionFetcher = TransactionFetcher;
