import { 
  SorobanRpc, 
  Transaction, 
  TransactionBuilder, 
  Account, 
  TimeoutInfinite, 
  xdr, 
  Address, 
  Contract,
  Networks,
  scValToNative
} from '@stellar/stellar-sdk';
import { Network, DEFAULT_NETWORK } from '../utils/networkConfig';
import { CacheManager, CacheOptions } from '../utils/cacheManager';

/**
 * Developer-friendly simulation result.
 */
export interface SimulationResult {
  /** Execution status of the simulation */
  status: 'SUCCESS' | 'FAILED';

  /** Whether the simulation was successful */
  success: boolean;

  /** Estimated resource usage */
  resourceUsage: {
    cpuInstructions: number;
    memoryBytes: number;
    minResourceFee: string;
  };

  /** Decoded return value of the contract execution (if success) */
  result?: any;

  /** Decoded return values of all operations in the transaction */
  results?: any[];

  /** Decoded simulation events */
  events?: Array<{
    contractId?: string;
    type: string;
    topics: any[];
    value: any;
  }>;

  /** Simulation error message/details (if failed) */
  error?: {
    message: string;
    raw?: any;
  };

  /** Raw simulation response from Soroban RPC */
  raw: SorobanRpc.Api.SimulateTransactionResponse;
}

/**
 * StellarClient handles low-level interactions with the Stellar Soroban RPC.
 */
export class StellarClient {
  public server: SorobanRpc.Server;
  public network: Network;
  public cache: CacheManager;

  constructor(network: Network = DEFAULT_NETWORK, cacheOptions?: CacheOptions) {
    this.network = network;
    this.server = new SorobanRpc.Server(network.rpcUrl);
    this.cache = new CacheManager(cacheOptions);
  }

  /**
   * Fetches the current sequence number for an account.
   */
  async getAccount(publicKey: string): Promise<Account> {
    return await this.server.getAccount(publicKey);
  }

  /**
   * Submits a transaction to the network and waits for results.
   */
  async submitTransaction(transaction: Transaction): Promise<SorobanRpc.Api.GetTransactionResponse> {
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
  async simulateTransaction(
    transaction: Transaction,
    useCache: boolean = false
  ): Promise<SimulationResult> {
    const cacheKey = `simulate:${transaction.toXDR()}`;
    
    let rawResponse: SorobanRpc.Api.SimulateTransactionResponse;
    if (useCache && this.cache.enabled) {
      const cached = this.cache.get<SorobanRpc.Api.SimulateTransactionResponse>(cacheKey);
      if (cached) {
        rawResponse = cached;
      } else {
        rawResponse = await this.server.simulateTransaction(transaction);
        this.cache.set(cacheKey, rawResponse);
      }
    } else {
      rawResponse = await this.server.simulateTransaction(transaction);
    }

    return this.parseSimulationResponse(rawResponse);
  }

  /**
   * Helper to build a transaction with Soroban specific settings.
   */
  async buildTransaction(sourceAccount: string, memo?: string): Promise<TransactionBuilder> {
    const account = await this.getAccount(sourceAccount);
    return new TransactionBuilder(account, {
      fee: '1000', // Base fee, will be updated by simulation
      networkPassphrase: this.network.networkPassphrase,
      timebounds: { minTime: 0, maxTime: 0 },
    });
  }

  /**
   * Parses the raw simulation response into a developer-friendly format.
   */
  private parseSimulationResponse(
    raw: SorobanRpc.Api.SimulateTransactionResponse
  ): SimulationResult {
    if (SorobanRpc.Api.isSimulationError(raw)) {
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
    let results: any[] = [];
    let result: any = undefined;
    
    const rawAny = raw as any;
    if (rawAny.results && rawAny.results.length > 0) {
      results = rawAny.results.map((r: any) => {
        if (r.retval) {
          try {
            return scValToNative(r.retval);
          } catch (e) {
            return r.retval;
          }
        }
        return undefined;
      });
      result = results[0];
    } else if (rawAny.result?.retval) {
      try {
        result = scValToNative(rawAny.result.retval);
        results = [result];
      } catch (e) {
        result = rawAny.result.retval;
        results = [result];
      }
    }

    // Parse events
    let events: any[] = [];
    const rawEvents = raw.events || [];
    events = rawEvents.map(e => {
      try {
        const contractEvent = (e as any).event ? (e as any).event() : (e as any).event;
        if (!contractEvent) return { type: 'unknown', raw: e };
        
        const contractId = typeof contractEvent.contractId === 'function' && contractEvent.contractId()
          ? contractEvent.contractId().toString('hex')
          : (contractEvent as any).contractId;
        
        const body = typeof contractEvent.body === 'function' ? contractEvent.body() : (contractEvent as any).body;
        const value = body && typeof body.value === 'function' ? scValToNative(body.value()) : undefined;
        const topics = body && typeof body.topics === 'function' ? body.topics().map((t: any) => scValToNative(t)) : [];
        const type = typeof contractEvent.type === 'function' && contractEvent.type() 
          ? (contractEvent.type().name || contractEvent.type().toString()) 
          : (contractEvent as any).type;

        return {
          contractId,
          type,
          topics,
          value,
        };
      } catch (err) {
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

