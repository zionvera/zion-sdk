import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { StellarClient, ProtoxVault, NETWORKS } from '../src';
import { SorobanRpc } from '@stellar/stellar-sdk';

// We need to mock the SorobanRpc.Server's simulateTransaction method specifically
const mockSimulate = (jest.fn() as any).mockResolvedValue({
  result: { retval: (jest.requireActual('@stellar/stellar-sdk') as any).nativeToScVal(100n, { type: 'i128' }) },
});

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
                  functionName: 'get_balance',
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
        simulateTransaction: mockSimulate,
      })),
    },
  };
});

describe('CacheManager Tests', () => {
  let client: StellarClient;
  let vault: ProtoxVault;
  const userAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

  beforeEach(() => {
    jest.clearAllMocks();
    // Enable cache with a short TTL for testing
    client = new StellarClient(NETWORKS.TESTNET, { enabled: true, ttl: 5000 });
    vault = new ProtoxVault('CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7', client);
  });

  test('Should hit cache on second call', async () => {
    // First call - should trigger RPC
    await vault.getBalance(userAddress);
    expect(mockSimulate).toHaveBeenCalledTimes(1);

    // Second call - should hit cache
    await vault.getBalance(userAddress);
    expect(mockSimulate).toHaveBeenCalledTimes(1);
  });

  test('Should bypass cache when useCache is false', async () => {
    await vault.getBalance(userAddress);
    expect(mockSimulate).toHaveBeenCalledTimes(1);

    await vault.getBalance(userAddress, false);
    expect(mockSimulate).toHaveBeenCalledTimes(2);
  });

  test('Should respect cache invalidation', async () => {
    await vault.getBalance(userAddress);
    expect(mockSimulate).toHaveBeenCalledTimes(1);

    client.cache.clear();
    
    await vault.getBalance(userAddress);
    expect(mockSimulate).toHaveBeenCalledTimes(2);
  });

  test('Should not use cache when disabled in config', async () => {
    const disabledClient = new StellarClient(NETWORKS.TESTNET, { enabled: false });
    const disabledVault = new ProtoxVault('CA...', disabledClient);

    await disabledVault.getBalance(userAddress);
    await disabledVault.getBalance(userAddress);
    
    // Total calls should be 4 (2 from previous tests + 2 from here)
    // but we cleared mocks in beforeEach, so it should be 2.
    expect(mockSimulate).toHaveBeenCalledTimes(2);
  });
});
