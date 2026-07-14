import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { StellarClient } from "../src/client/stellarClient";
import { ProtoxVault } from "../src/contracts/vault";
import { WalletConnector, PrivateKeyWallet } from "../src/wallet/walletConnector";
import { NETWORKS } from "../src/utils/networkConfig";
import { Keypair } from "@stellar/stellar-sdk";

jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("@stellar/stellar-sdk") as any;
  return {
    ...actual,
    Transaction: jest.fn().mockImplementation(() => ({
      toXDR: () => "mockXDR",
      networkPassphrase: "Test SDF Network ; September 2015",
      sign: jest.fn(),
    })),
    Contract: jest.fn().mockImplementation((address: unknown) => ({
      address: () => ({ toString: () => address }),
      call: jest.fn().mockReturnValue({ type: "operation" }),
    })),
    SorobanRpc: {
      ...actual.SorobanRpc,
      assembleTransaction: jest.fn().mockReturnValue({
        build: jest.fn().mockReturnValue({
          toXDR: () => "mockXDR",
          networkPassphrase: "Test SDF Network ; September 2015",
          sign: jest.fn(),
        }),
      }),
    },
  };
});

const CONTRACT_ADDRESS = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7";
const USER_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

const mockTx: any = {
  toXDR: () => "mockXDR",
  networkPassphrase: "Test SDF Network ; September 2015",
  sign: jest.fn(),
};

const mockBuilder: any = {
  addOperation: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockTx),
};

describe("Vault Deposit Method", () => {
  let client: StellarClient;
  let vault: ProtoxVault;
  let wallet: WalletConnector;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuilder.addOperation.mockReturnThis();
    mockBuilder.build.mockReturnValue(mockTx);

    client = new StellarClient(NETWORKS.TESTNET);

    jest.spyOn(client, "buildTransaction").mockResolvedValue(mockBuilder);
    jest.spyOn(client, "simulateTransaction").mockResolvedValue({
      status: "SUCCESS",
      success: true,
      resourceUsage: {
        cpuInstructions: 0,
        memoryBytes: 0,
        minResourceFee: "200",
      },
      result: {} as any,
      results: [{} as any],
      events: [],
      raw: {
        result: { retval: {} as any },
        minResourceFee: "200",
        transactionData: {} as any,
        events: [],
        latestLedger: 1,
      } as any,
    });
    jest.spyOn(client, "submitTransaction").mockResolvedValue({
      status: "SUCCESS",
      latestLedger: 1,
      latestLedgerCloseTime: 1,
    } as any);

    const signer = new PrivateKeyWallet(Keypair.random().secret());
    jest.spyOn(signer, "getPublicKey").mockResolvedValue(USER_ADDRESS);

    wallet = new WalletConnector(signer);
    jest.spyOn(wallet, "sign").mockResolvedValue(mockTx);

    vault = new ProtoxVault(CONTRACT_ADDRESS, client, wallet);
  });

  test("deposit submits a transaction and returns SUCCESS status", async () => {
    const result = await vault.deposit(1000n);
    expect(result.status).toBe("SUCCESS");
  });

  test("deposit calls client.submitTransaction once", async () => {
    await vault.deposit(500n);
    expect(client.submitTransaction).toHaveBeenCalledTimes(1);
  });

  test("deposit calls client.buildTransaction with the user address", async () => {
    await vault.deposit(250n);
    expect(client.buildTransaction).toHaveBeenCalledWith(USER_ADDRESS);
  });

  test("deposit calls addOperation on the transaction builder", async () => {
    await vault.deposit(250n);
    expect(mockBuilder.addOperation).toHaveBeenCalledTimes(1);
  });

  test("deposit rejects with zero amount", async () => {
    jest.spyOn(client, "submitTransaction").mockRejectedValue(new Error("Invalid amount"));
    await expect(vault.deposit(0n)).rejects.toThrow();
  });

  test("deposit rejects when wallet is not connected", async () => {
    const noWalletVault = new ProtoxVault(CONTRACT_ADDRESS, client);
    await expect(noWalletVault.deposit(1000n)).rejects.toThrow("Wallet not connected");
  });

  test("deposit rejects when simulation fails", async () => {
    jest.spyOn(client, "simulateTransaction").mockResolvedValue({
      status: "FAILED",
      success: false,
      resourceUsage: {
        cpuInstructions: 0,
        memoryBytes: 0,
        minResourceFee: "0",
      },
      error: {
        message: "simulation error",
        raw: { error: "simulation error" },
      },
      events: [],
      raw: {
        error: "simulation error",
      } as any,
    });
    await expect(vault.deposit(500n)).rejects.toThrow();
  });
});