"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarClient = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const networkConfig_1 = require("../utils/networkConfig");
const cacheManager_1 = require("../utils/cacheManager");
/**
 * StellarClient handles low-level interactions with the Stellar Soroban RPC.
 */
class StellarClient {
    server;
    network;
    cache;
    constructor(network = networkConfig_1.DEFAULT_NETWORK, cacheOptions) {
        this.network = network;
        this.server = new stellar_sdk_1.SorobanRpc.Server(network.rpcUrl);
        this.cache = new cacheManager_1.CacheManager(cacheOptions);
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
     * Supports optional caching for read-only calls.
     */
    async simulateTransaction(transaction, useCache = false) {
        const cacheKey = `simulate:${transaction.toXDR()}`;
        let rawResponse;
        if (useCache && this.cache.enabled) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                rawResponse = cached;
            }
            else {
                rawResponse = await this.server.simulateTransaction(transaction);
                this.cache.set(cacheKey, rawResponse);
            }
        }
        else {
            rawResponse = await this.server.simulateTransaction(transaction);
        }
        return this.parseSimulationResponse(rawResponse);
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
    /**
     * Parses the raw simulation response into a developer-friendly format.
     */
    parseSimulationResponse(raw) {
        if (stellar_sdk_1.SorobanRpc.Api.isSimulationError(raw)) {
            return {
                status: 'FAILED',
                success: false,
                resourceUsage: {
                    cpuInstructions: 0,
                    memoryBytes: 0,
                    minResourceFee: '0',
                },
                error: {
                    message: raw.error,
                    raw: raw,
                },
                events: [],
                raw,
            };
        }
        const cost = raw.cost || { cpuInsns: '0', memBytes: '0' };
        const cpuInstructions = parseInt(cost.cpuInsns, 10) || 0;
        const memoryBytes = parseInt(cost.memBytes, 10) || 0;
        const minResourceFee = raw.minResourceFee || '0';
        // Parse results
        let results = [];
        let result = undefined;
        const rawAny = raw;
        if (rawAny.results && rawAny.results.length > 0) {
            results = rawAny.results.map((r) => {
                if (r.retval) {
                    try {
                        return (0, stellar_sdk_1.scValToNative)(r.retval);
                    }
                    catch (e) {
                        return r.retval;
                    }
                }
                return undefined;
            });
            result = results[0];
        }
        else if (rawAny.result?.retval) {
            try {
                result = (0, stellar_sdk_1.scValToNative)(rawAny.result.retval);
                results = [result];
            }
            catch (e) {
                result = rawAny.result.retval;
                results = [result];
            }
        }
        // Parse events
        let events = [];
        const rawEvents = raw.events || [];
        events = rawEvents.map(e => {
            try {
                const contractEvent = e.event ? e.event() : e.event;
                if (!contractEvent)
                    return { type: 'unknown', raw: e };
                const contractId = typeof contractEvent.contractId === 'function' && contractEvent.contractId()
                    ? contractEvent.contractId().toString('hex')
                    : contractEvent.contractId;
                const body = typeof contractEvent.body === 'function' ? contractEvent.body() : contractEvent.body;
                const value = body && typeof body.value === 'function' ? (0, stellar_sdk_1.scValToNative)(body.value()) : undefined;
                const topics = body && typeof body.topics === 'function' ? body.topics().map((t) => (0, stellar_sdk_1.scValToNative)(t)) : [];
                const type = typeof contractEvent.type === 'function' && contractEvent.type()
                    ? (contractEvent.type().name || contractEvent.type().toString())
                    : contractEvent.type;
                return {
                    contractId,
                    type,
                    topics,
                    value,
                };
            }
            catch (err) {
                return {
                    type: 'unknown',
                    raw: e,
                };
            }
        });
        return {
            status: 'SUCCESS',
            success: true,
            resourceUsage: {
                cpuInstructions,
                memoryBytes,
                minResourceFee,
            },
            result,
            results,
            events,
            raw,
        };
    }
}
exports.StellarClient = StellarClient;
