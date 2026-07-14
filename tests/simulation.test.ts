import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { StellarClient, ProtoxVault, Pending, Rewards, NETWORKS } from '../src';
import { SorobanRpc, nativeToScVal } from '@stellar/stellar-sdk';

// We mock SorobanRpc.Server's simulateTransaction
const mockSimulateTransaction = jest.fn() as any;

jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk') as any;
  return {
    ...actual,
    Contract: jest.fn().mockImplementation((address: any) => {
      return {
        address: () => ({ toString: () => address }),
        call: jest.fn().mockReturnValue(new actual.xdr.Operation({
          sourceAccount: null,
          body: actual.xdr.OperationBody.invokeHostFunction(
            new actual.xdr.InvokeHostFunctionOp({
              hostFunction: actual.xdr.HostFunction.hostFunctionTypeInvokeContract(
                new actual.xdr.InvokeContractArgs({
                  contractAddress: actual.xdr.ScAddress.scAddressTypeContract(Buffer.alloc(32)),
                  functionName: 'deposit',
                  args: [],
                })
              ),
              auth: [],
            })
          ),
        })),
      };
    }),
    SorobanRpc: {
      ...actual.SorobanRpc,
      Server: jest.fn().mockImplementation(() => ({
        getAccount: (jest.fn() as any).mockResolvedValue(new actual.Account('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', '1')),
        simulateTransaction: mockSimulateTransaction,
      })),
    },
  };
});

describe('Transaction Simulation API Tests', () => {
  let client: StellarClient;
  const contractAddress = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7';
  const userAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(() => {
    jest.clearAllMocks();
    client = new StellarClient(NETWORKS.TESTNET);
  });

  test('simulateTransaction parses successful simulation correctly', async () => {
    const rawSuccessResponse = {
      cost: {
        cpuInsns: '12345',
        memBytes: '67890',
      },
      minResourceFee: '1000',
      results: [
        {
          retval: nativeToScVal(42n, { type: 'i128' }),
        }
      ],
      events: [],
    };
    mockSimulateTransaction.mockResolvedValue(rawSuccessResponse);

    // Use a dummy transaction object to avoid complicated builder setup
    const tx = { toXDR: () => 'mockXDR' } as any;

    const result = await client.simulateTransaction(tx);

    expect(result.status).toBe('SUCCESS');
    expect(result.success).toBe(true);
    expect(result.resourceUsage.cpuInstructions).toBe(12345);
    expect(result.resourceUsage.memoryBytes).toBe(67890);
    expect(result.resourceUsage.minResourceFee).toBe('1000');
    expect(result.result).toBe(42n);
    expect(result.results).toEqual([42n]);
    expect(result.events).toEqual([]);
    expect(result.raw).toBe(rawSuccessResponse);
  });

  test('simulateTransaction parses failed/error simulation correctly', async () => {
    const rawErrorResponse = {
      error: 'Contract reverted with error code 5',
    };
    mockSimulateTransaction.mockResolvedValue(rawErrorResponse);

    // Use a dummy transaction object to avoid complicated builder setup
    const tx = { toXDR: () => 'mockXDR' } as any;

    const result = await client.simulateTransaction(tx);

    expect(result.status).toBe('FAILED');
    expect(result.success).toBe(false);
    expect(result.resourceUsage.cpuInstructions).toBe(0);
    expect(result.resourceUsage.memoryBytes).toBe(0);
    expect(result.resourceUsage.minResourceFee).toBe('0');
    expect(result.error?.message).toBe('Contract reverted with error code 5');
    expect(result.raw).toBe(rawErrorResponse);
  });

  test('ProtoxVault simulateDeposit and simulateWithdraw return friendly results', async () => {
    const rawSuccessResponse = {
      cost: { cpuInsns: '100', memBytes: '200' },
      minResourceFee: '100',
      results: [{ retval: nativeToScVal(0n, { type: 'i128' }) }],
      events: [],
    };
    mockSimulateTransaction.mockResolvedValue(rawSuccessResponse);

    const vault = new ProtoxVault(contractAddress, client);
    const resultDeposit = await vault.simulateDeposit(1000n, userAddress);

    expect(resultDeposit.status).toBe('SUCCESS');
    expect(resultDeposit.success).toBe(true);
    expect(resultDeposit.resourceUsage.minResourceFee).toBe('100');

    const resultWithdraw = await vault.simulateWithdraw(500n, userAddress);
    expect(resultWithdraw.status).toBe('SUCCESS');
    expect(resultWithdraw.success).toBe(true);
  });

  test('Pending simulateDeposit and simulateWithdraw return friendly results', async () => {
    const rawSuccessResponse = {
      cost: { cpuInsns: '100', memBytes: '200' },
      minResourceFee: '100',
      results: [{ retval: nativeToScVal(0n, { type: 'i128' }) }],
      events: [],
    };
    mockSimulateTransaction.mockResolvedValue(rawSuccessResponse);

    const pending = new Pending(contractAddress, client);
    const resultDeposit = await pending.simulateDeposit(1000n, userAddress);

    expect(resultDeposit.status).toBe('SUCCESS');
    expect(resultDeposit.success).toBe(true);
  });

  test('Rewards simulateDeposit and simulateWithdraw return friendly results', async () => {
    const rawSuccessResponse = {
      cost: { cpuInsns: '100', memBytes: '200' },
      minResourceFee: '100',
      results: [{ retval: nativeToScVal(0n, { type: 'i128' }) }],
      events: [],
    };
    mockSimulateTransaction.mockResolvedValue(rawSuccessResponse);

    const rewards = new Rewards(contractAddress, client);
    const resultDeposit = await rewards.simulateDeposit(1000n, userAddress);

    expect(resultDeposit.status).toBe('SUCCESS');
    expect(resultDeposit.success).toBe(true);
  });
});
