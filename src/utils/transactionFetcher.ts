import { DEFAULT_NETWORK, Network } from './networkConfig';

/**
 * Normalized shape for a single transaction record.
 */


export interface TransactionRecord {
  id: string;
  hash: string;
  createdAt: string;
  sourceAccount: string;
  operationCount: number;
  successful: boolean;
  memo?: string;
  feeCharged: string;
}

/**
 * Options for filtering transaction history queries.
 */
export interface TransactionFetchOptions {
  limit?: number;
  order?: 'asc' | 'desc';
  cursor?: string;
}

/**
 * Raw Horizon transaction response shape (subset used for normalization).
 */
interface HorizonTransaction {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  operation_count: number;
  successful: boolean;
  memo?: string;
  fee_charged: string;
}

/**
 * TransactionFetcher queries Horizon for transaction history
 * related to a wallet address or contract.
 */
export class TransactionFetcher {
  private horizonUrl: string;

  constructor(network: Network = DEFAULT_NETWORK) {
    if (!network.horizonUrl) {
      throw new Error(
        `Network "${network.networkPassphrase}" has no horizonUrl configured.`
      );
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
  async getTransactions(
    address: string,
    options: TransactionFetchOptions = {}
  ): Promise<TransactionRecord[]> {
    const { limit = 10, order = 'desc', cursor } = options;

    const url = new URL(
      `/accounts/${address}/transactions`,
      this.horizonUrl
    );
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('order', order);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Horizon request failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const records: HorizonTransaction[] = data._embedded?.records ?? [];
    return records.map(this.normalize);
  }

  /**
   * Normalizes a raw Horizon transaction into a clean TransactionRecord.
   */
  private normalize(tx: HorizonTransaction): TransactionRecord {
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