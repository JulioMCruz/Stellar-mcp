# Agent Soroban Coding Guide

This guide tells coding agents how to create Soroban smart contracts and Stellar wallet frontends with this repo.

## Default Workflow

1. Create a feature branch.
2. Scaffold the Rust contract:

```json
{
  "name": "stellar_soroban_scaffold_contract",
  "arguments": {
    "outputDir": "./contracts-workspace",
    "contractName": "quest_board"
  }
}
```

3. Implement contract logic in Rust.
4. Add or update contract unit tests.
5. Run:

```bash
rustup target add wasm32v1-none
cargo test
stellar contract build
```

6. Deploy only after explicit approval:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/<contract>.wasm \
  --source <stellar-cli-key-name> \
  --network testnet
```

7. Generate TypeScript bindings:

```bash
stellar contract bindings typescript \
  --contract-id <CONTRACT_ID> \
  --output-dir ./packages/<contract-name> \
  --overwrite
```

8. Scaffold the Next.js wallet/client pieces:

```json
{
  "name": "stellar_nextjs_wallet_scaffold",
  "arguments": {
    "outputDir": "./web",
    "appName": "quest_board"
  }
}
```

9. Wire the generated bindings into the Next.js app.
10. Run local frontend testing with HTTPS:

```bash
npm run dev -- --experimental-https
```

## Contract Rules

- Use `soroban-sdk`.
- Keep contracts `#![no_std]`.
- Keep public methods small and explicit.
- Prefer exact integer types (`u32`, `i128`, etc.) and clear storage keys.
- Do not store secrets on-chain or in frontend code.
- Do not assume a contract exists. Verify the `CONTRACT_ID` and network.
- Use Testnet first. Mainnet deploys require explicit approval.
- If the app needs auth, model authorization in the contract and tests before wiring UI.

## Frontend Rules

- Use client components for wallet interactions.
- Use Freighter for signing unless the task asks for another wallet.
- Never put secret seeds in Next.js, browser code, or `NEXT_PUBLIC_*`.
- Treat `NEXT_PUBLIC_STELLAR_CONTRACT_ID`, RPC URL, Horizon URL, and network passphrase as public config only.
- Prefer generated TypeScript bindings over manual XDR.
- Show wallet errors clearly. Do not hide failed signatures or rejected wallet prompts.

## x402 Rules

- Use `stellar_x402_perkos_guide` before writing Stellar x402 code.
- Use `stellar_x402_nextjs_scaffold` when adding paid Next.js endpoints.
- Use `stellar_x402_oz_facilitator_scaffold` when preparing an OpenZeppelin Relayer facilitator deployment.
- Server-side route pattern: `withX402` from `@x402/next`, `HTTPFacilitatorClient` from `@x402/core/server`, and `ExactStellarScheme` from `@x402/stellar/exact/server`.
- Client-side payment pattern: Freighter `signAuthEntry`, `x402Client`, `ExactStellarScheme`, and `wrapFetchWithPayment`.
- Use `stellar:pubnet` or `stellar:testnet` explicitly. Do not mix network labels with Stellar passphrases.
- Keep relayer API keys, keystore passphrases, and signer material out of browser code.
- Do not settle real payments without explicit approval.

## Review Checklist

- `cargo test` passes for contract code.
- `stellar contract build` succeeds before deploy instructions are claimed.
- Generated TypeScript bindings match the deployed contract ID and network.
- `npm run build` or the app's equivalent type/build check passes for Next.js changes.
- No secret seeds, `.env` files, private keys, or real wallet material were staged.
- PR description includes test/build commands actually run.

## Useful Official References

- Soroban setup: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup
- Hello World contract: https://developers.stellar.org/docs/build/smart-contracts/getting-started/hello-world
- Deploy to Testnet: https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet
- Stellar CLI: https://developers.stellar.org/docs/tools/cli/stellar-cli
- Stellar dapp frontend: https://developers.stellar.org/docs/build/apps/dapp-frontend
- TypeScript bindings: https://developers.stellar.org/docs/build/apps/guestbook/bindings
- Freighter signing: https://github.com/stellar/freighter-developer-docs/blob/main/extension/signing.md
