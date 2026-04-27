import { 
  Address, 
  Contract, 
  Transaction, 
  SorobanRpc, 
  nativeToScVal, 
  scValToNative, 
  xdr,
  TransactionBuilder
} from '@stellar/stellar-sdk';
import { StellarClient } from '../client/stellarClient';
import { WalletConnector } from '../wallet/walletConnector';

/**
 * ProtoxVault is the main interface for interacting with the Protox Vault contract.
 */
export class Pending {
  public contract: Contract;
  public client: StellarClient;
  public wallet?: WalletConnector;

  constructor(contractAddress: string, client: StellarClient, wallet?: WalletConnector) {
    this.contract = new Contract(contractAddress);
    this.client = client;
    this.wallet = wallet;
  }

  /**
   * Connect a wallet to the vault instance for signing transactions.
   */
  connect(wallet: WalletConnector): void {
    this.wallet = wallet;
  }

  /**
   * Deposits tokens into the vault.
   */
  async deposit(amount: number | bigint): Promise<SorobanRpc.Api.GetTransactionResponse> {
    if (!this.wallet) throw new Error("Wallet not connected");
    const userAddress = await this.wallet.getAddress();

    const transaction = await this.buildContractCall(
      'deposit',
      [
        new Address(userAddress).toScVal(),
        nativeToScVal(BigInt(amount), { type: 'i128' })
      ]
    );

    return await this.client.submitTransaction(transaction);
  }

  /**
   * Withdraws tokens from the vault.
   */
  async withdraw(amount: number | bigint): Promise<SorobanRpc.Api.GetTransactionResponse> {
    if (!this.wallet) throw new Error("Wallet not connected");
    const userAddress = await this.wallet.getAddress();

    const transaction = await this.buildContractCall(
      'withdraw',
      [
        new Address(userAddress).toScVal(),
        nativeToScVal(BigInt(amount), { type: 'i128' })
      ]
    );

    return await this.client.submitTransaction(transaction);
  }

  /**
   * Fetches the user's share balance in the vault.
   */
  async getBalance(userAddress: string): Promise<bigint> {
    const result = await this.simulateCall(
      'get_balance',
      [new Address(userAddress).toScVal()]
    );
    return scValToNative(result) as bigint;
  }

  /**
   * Fetches the total shares issued by the vault.
   */
  async getTotalShares(): Promise<bigint> {
    const result = await this.simulateCall('get_total_shares', []);
    return scValToNative(result) as bigint;
  }

  /**
   * Internal helper to build and simulate contract calls.
   */
  private async buildContractCall(functionName: string, args: xdr.ScVal[]): Promise<Transaction> {
    if (!this.wallet) throw new Error("Wallet not connected");
    const sourceAccount = await this.wallet.getAddress();

    const txBuilder = await this.client.buildTransaction(sourceAccount);
    txBuilder.addOperation(this.contract.call(functionName, ...args));

    const transaction = txBuilder.build();
    
    // Simulate to get fee and footprint
    const simulation = await this.client.simulateTransaction(transaction);
    if (SorobanRpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
    }

    const assembledTransaction = SorobanRpc.assembleTransaction(transaction, simulation);
    return await this.wallet.sign(assembledTransaction.build());
  }

  /**
   * Internal helper for read-only contract calls (simulation).
   */
  private async simulateCall(functionName: string, args: xdr.ScVal[]): Promise<xdr.ScVal> {
    // We use a dummy address for simulation if no wallet is connected
    const dummyAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    const txBuilder = await this.client.buildTransaction(dummyAccount);
    txBuilder.addOperation(this.contract.call(functionName, ...args));

    const transaction = txBuilder.build();
    const simulation = await this.client.simulateTransaction(transaction);
    
    if (SorobanRpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
    }

    if (!simulation.result) {
      throw new Error("No result in simulation");
    }

    return simulation.result.retval;
  }

  // TODO: Implement claim_rewards function
  // TODO: Add events subscription for vault activities
  // TODO: Add more robust error handling for contract-specific reverts
}
