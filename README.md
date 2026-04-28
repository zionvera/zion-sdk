# Protox SDK

Protox SDK is a developer-friendly TypeScript toolkit for interacting with Protox smart contracts on the Stellar network.

## Features

- **Soroban Integration**: High-level wrappers for Protox vault contracts.
- **Wallet Support**: Seamless integration with Stellar wallets (Freighter, Albedo, and private keys).
- **Network Management**: Easy switching between Testnet and Mainnet.
- **Transaction Helpers**: Automated fee estimation, footprint calculation, and simulation.

## Installation

Install the SDK via npm or yarn:

```bash
npm install @protox/sdk
# or
yarn add @protox/sdk
```
## Quick Start
Here is a complete, end-to-end example demonstrating how to initialize the SDK, authenticate a wallet, and execute core vault operations (deposit, check balance, and withdraw).
```typescript
import { StellarClient, ProtoxVault, PrivateKeyWallet, WalletConnector, NETWORKS } from '@protox/sdk';

// 1. Initialize the Stellar client (Testnet or Mainnet)
const client = new StellarClient(NETWORKS.TESTNET);

// 2. Connect a wallet (using a private key for backend/testing, or Freighter/Albedo for frontend)
const wallet = new WalletConnector(new PrivateKeyWallet('S...'));

// 3. Initialize the vault contract instance
const vaultContractId = 'CD...';
const vault = new ProtoxVault(vaultContractId, client, wallet);

async function manageVault() {
  try {
    const userAddress = wallet.getPublicKey();

    // 4. Deposit tokens into the vault
    console.log('Depositing 1000 tokens...');
    await vault.deposit(1000);

    // 5. Check your current vault balance
    const balance = await vault.getBalance(userAddress);
    console.log(`Current Vault Balance: ${balance}`);

    // 6. Withdraw tokens from the vault
    console.log('Withdrawing 500 tokens...');
    await vault.withdraw(500);
    
    // Fetch final balance
    const finalBalance = await vault.getBalance(userAddress);
    console.log(`Final Vault Balance: ${finalBalance}`);

  } catch (error) {
    console.error('Vault operation failed:', error);
  }
}

manageVault();
```




## Documentation

- [SDK Overview](docs/sdk-overview.md): Architecture and module breakdown.
- [Configuration Reference](docs/configuration.md): All config options, network setup, RPC override, contract ID, and debug mode.
- [Usage Guide](docs/usage-guide.md): Detailed examples and best practices.
- [Wallet Integration](docs/wallet-integration.md): How to connect frontend wallets like Freighter.
- [Browser Compatibility](docs/browser-compatibility.md): Configuration for Vite, Webpack, and polyfills.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License. See [LICENSE](LICENSE) for details.
