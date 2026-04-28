# Browser Compatibility Guide

The Protox SDK is designed to work seamlessly in both Node.js and browser environments. However, because it relies on `@stellar/stellar-sdk`, there are some specific configurations required for modern frontend bundlers.

## Supported Environments

- **Browsers**: All modern evergreen browsers (Chrome, Firefox, Safari, Edge).
- **Bundlers**: Vite, Webpack 5, Rollup, Esbuild.

## Bundler Configuration

Modern bundlers no longer include Node.js polyfills by default. Since `@stellar/stellar-sdk` uses some Node-native features (like `Buffer`), you may need to add polyfills to your project.

### Vite

If you are using [Vite](https://vitejs.dev/), you might need to install `vite-plugin-node-polyfills`:

```bash
npm install --save-dev vite-plugin-node-polyfills
```

Then update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
    }),
  ],
});
```

### Webpack 5

If you are using Webpack 5 (e.g., via Create React App), you will need to add fallback polyfills in your `webpack.config.js`:

```javascript
module.exports = {
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/"),
      "process": require.resolve("process/browser"),
    },
  },
};
```

## Browser Limitations

1. **Private Keys**: Avoid hardcoding private keys in frontend code. Use wallet connectors (Freighter, Albedo) for signing transactions.
2. **CORS**: Ensure the Soroban RPC endpoint you are using supports CORS for the domain your app is hosted on.
3. **Environment Variables**: Use your bundler's specific way to handle environment variables (e.g., `import.meta.env` for Vite instead of `process.env`).

## Examples

For a detailed example of how to connect a frontend wallet, please refer to the [Wallet Integration Guide](wallet-integration.md).
