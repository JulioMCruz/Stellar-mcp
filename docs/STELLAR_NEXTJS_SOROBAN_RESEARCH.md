# Stellar Soroban + Next.js Research Notes

Research source set: official Stellar Developer Docs and Freighter developer docs.

## Decisions

- Soroban smart contract creation should start from a Rust workspace using `soroban-sdk`, `#![no_std]`, and the `wasm32v1-none` target.
- The deploy path should stay compatible with Stellar CLI: build with `stellar contract build`, deploy with `stellar contract deploy`, then create frontend bindings with `stellar contract bindings typescript`.
- Next.js wallet integration should be client-side and Freighter-based. Freighter local development needs a secure browser context, so the scaffold documents `next dev --experimental-https`.
- Frontend contract interaction should prefer generated TypeScript bindings over hand-encoded XDR arguments.

## Sources

- Soroban overview: https://developers.stellar.org/docs/build/smart-contracts/overview
- Soroban setup: https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup
- Hello World contract: https://developers.stellar.org/docs/build/smart-contracts/getting-started/hello-world
- Deploy to Testnet: https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet
- Stellar CLI manual: https://developers.stellar.org/docs/tools/cli/stellar-cli
- Dapp frontend guide: https://developers.stellar.org/docs/build/apps/dapp-frontend
- Comprehensive frontend guide: https://developers.stellar.org/docs/build/guides/dapps/frontend-guide
- Generate bindings: https://developers.stellar.org/docs/build/apps/guestbook/bindings
- Freighter installation/API: https://github.com/stellar/freighter-developer-docs/blob/main/extension/installation.md
- Freighter signing API: https://github.com/stellar/freighter-developer-docs/blob/main/extension/signing.md

## Implementation Mapping

- `stellar_soroban_scaffold_contract` creates the Rust workspace, contract source, tests, and README commands.
- `stellar_nextjs_wallet_scaffold` creates env defaults, a Freighter hook, a wallet button component, and a demo Next.js route.
- `docs/TOOLS.md` is regenerated from live MCP `tools/list`, so agents can discover both scaffold tools directly.
