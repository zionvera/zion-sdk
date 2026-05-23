import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { Keypair } from "@stellar/stellar-sdk";
import { StellarClient } from "../src/client/stellarClient";
import { ProtoxVault } from "../src/contracts/vault";
import { NETWORKS } from "../src/utils/networkConfig";
import { PrivateKeyWallet, WalletConnector } from "../src/wallet/walletConnector";

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

const successfulWithdrawResponse = {
  status: "SUCCESS",
  latestLedger: 10,
  latestLedgerCloseTime: 20,
} as any;

describe("Vault Withdraw Method", () => {
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
      result: { retval: {} as any },
      minResourceFee: "200",
      transactionData: {} as any,
      events: [],
      latestLedger: 1,
    } as any);
    jest.spyOn(client, "submitTransaction").mockResolvedValue(successfulWithdrawResponse);

    const signer = new PrivateKeyWallet(Keypair.random().secret());
    jest.spyOn(signer, "getPublicKey").mockResolvedValue(USER_ADDRESS);

    wallet = new WalletConnector(signer);
    jest.spyOn(wallet, "sign").mockResolvedValue(mockTx);

    vault = new ProtoxVault(CONTRACT_ADDRESS, client, wallet);
  });

  test("withdraw submits a transaction and returns the network response", async () => {
    const result = await vault.withdraw(500n);

    expect(result).toBe(successfulWithdrawResponse);
    expect(client.submitTransaction).toHaveBeenCalledTimes(1);
  });

  test("withdraw builds the transaction from the connected wallet address", async () => {
    await vault.withdraw(250n);

    expect(client.buildTransaction).toHaveBeenCalledWith(USER_ADDRESS);
    expect(mockBuilder.addOperation).toHaveBeenCalledTimes(1);
  });

  test("withdraw accepts numeric integer amounts", async () => {
    await vault.withdraw(125);

    expect(client.submitTransaction).toHaveBeenCalledTimes(1);
  });

  test("withdraw rejects when wallet is not connected", async () => {
    const noWalletVault = new ProtoxVault(CONTRACT_ADDRESS, client);

    await expect(noWalletVault.withdraw(100n)).rejects.toThrow("Wallet not connected");
  });

  test.each([
    [0n, "Withdrawal amount must be greater than zero."],
    [-1n, "Withdrawal amount must be greater than zero."],
    [1.5, "Withdrawal amount must be an integer."],
    [Number.NaN, "Withdrawal amount must be an integer."],
  ])("withdraw rejects invalid amount %p", async (amount, message) => {
    await expect(vault.withdraw(amount as number | bigint)).rejects.toThrow(message);
    expect(client.submitTransaction).not.toHaveBeenCalled();
  });

  test("withdraw surfaces insufficient balance errors from submission", async () => {
    jest
      .spyOn(client, "submitTransaction")
      .mockRejectedValue(new Error("ContractError: insufficient balance"));

    await expect(vault.withdraw(1000n)).rejects.toThrow("insufficient balance");
  });

  test("withdraw rejects when simulation fails before signing", async () => {
    jest.spyOn(client, "simulateTransaction").mockResolvedValue({
      error: "simulation error",
    } as any);

    await expect(vault.withdraw(500n)).rejects.toThrow("Simulation failed");
    expect(wallet.sign).not.toHaveBeenCalled();
  });
});
