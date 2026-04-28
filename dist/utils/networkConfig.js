"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NETWORK = exports.NETWORKS = void 0;
exports.NETWORKS = {
    TESTNET: {
        networkPassphrase: 'Test SDF Network ; September 2015',
        rpcUrl: 'https://soroban-testnet.stellar.org',
        horizonUrl: 'https://horizon-testnet.stellar.org',
    },
    MAINNET: {
        networkPassphrase: 'Public Global Stellar Network ; October 2015',
        rpcUrl: 'https://soroban-rpc.stellar.org',
        horizonUrl: 'https://horizon.stellar.org',
    },
};
exports.DEFAULT_NETWORK = exports.NETWORKS.TESTNET;
