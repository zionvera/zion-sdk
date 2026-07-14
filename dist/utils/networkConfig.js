"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NETWORK = exports.NETWORKS = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
exports.NETWORKS = {
    TESTNET: {
        networkPassphrase: stellar_sdk_1.Networks.TESTNET,
        rpcUrl: 'https://soroban-testnet.stellar.org',
        horizonUrl: 'https://horizon-testnet.stellar.org',
    },
    MAINNET: {
        networkPassphrase: stellar_sdk_1.Networks.PUBLIC,
        rpcUrl: 'https://soroban-rpc.stellar.org',
        horizonUrl: 'https://horizon.stellar.org',
    },
};
exports.DEFAULT_NETWORK = exports.NETWORKS.TESTNET;
