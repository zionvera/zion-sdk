import { Networks } from '@stellar/stellar-sdk';



export interface Network {
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl?: string;
}

export const NETWORKS: Record<string, Network> = {
  TESTNET: {
    networkPassphrase: Networks.TESTNET,
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
  },
  MAINNET: {
    networkPassphrase: Networks.PUBLIC,
    rpcUrl: 'https://soroban-rpc.stellar.org',
    horizonUrl: 'https://horizon.stellar.org',
  },
};

export const DEFAULT_NETWORK: Network = NETWORKS.TESTNET;