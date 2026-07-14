"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = void 0;
exports.createProtoxVault = createProtoxVault;
__exportStar(require("./client/stellarClient"), exports);
__exportStar(require("./contracts/vault"), exports);
__exportStar(require("./contracts/pending"), exports);
__exportStar(require("./contracts/rewards"), exports);
__exportStar(require("./wallet/walletConnector"), exports);
__exportStar(require("./utils/networkConfig"), exports);
/**
 * Main SDK version.
 */
exports.VERSION = '0.1.0';
const vault_1 = require("./contracts/vault");
function createProtoxVault(contractAddress, client, wallet) {
    return new vault_1.ProtoxVault(contractAddress, client, wallet);
}
// TODO: Export helper classes for building custom transactions
// TODO: Add support for multi-sig and advanced wallet patterns
__exportStar(require("./utils/transactionFetcher"), exports);
