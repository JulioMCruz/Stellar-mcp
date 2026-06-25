# AGENTS.md - Stellar MCP Agent Instructions

These instructions are for coding agents working in this repository or using this MCP server to generate Stellar/Soroban app code.

## Git Safety

- Work on a feature branch. Do not commit directly to `main`.
- Open a pull request for review. Do not merge without Julio's explicit approval.
- Before every commit, run `git diff --cached` and check for secrets.
- Never commit secret seeds, private keys, wallet mnemonics, PATs, API keys, `.env` files, server IPs, or private infrastructure notes.
- Use placeholders such as `<STELLAR_SECRET_KEY>`, `<CONTRACT_ID>`, `<PUBLIC_KEY>`, and `<RPC_URL>` in docs and examples.

## Soroban Contract Code

- Use Rust and `soroban-sdk` for Soroban contracts.
- Start new contracts with `stellar_soroban_scaffold_contract` unless the user asks for a different layout.
- Keep contracts `#![no_std]`.
- Keep contract state explicit. Prefer clear persistent or temporary storage keys over hidden/global state.
- Add unit tests under the contract crate before proposing deploy steps.
- Use `cargo test` for logic tests and `stellar contract build` for WASM builds.
- Use `wasm32v1-none` as the WASM target in new build instructions.
- Do not hand-roll deployment transactions when Stellar CLI or existing MCP tools can do it.
- For deployed contract frontends, generate TypeScript bindings with `stellar contract bindings typescript` and use those bindings from Next.js.

## Stellar Frontend Code

- Use `stellar_nextjs_wallet_scaffold` for new Next.js wallet components.
- Keep wallet code client-side with `"use client"`.
- Use Freighter for browser wallet connection and transaction signing unless the user asks for another wallet strategy.
- Local Freighter testing should use a secure browser context, for example `next dev --experimental-https`.
- Never expose server secrets through `NEXT_PUBLIC_*`.
- `NEXT_PUBLIC_*` values are only for public network, RPC, Horizon, and contract IDs.
- Keep transaction signing in the wallet. Do not put secret seeds in a Next.js app.

## MCP Usage

- For read-only contract exploration, prefer `stellar_soroban_simulate`, `stellar_soroban_read_state`, and `stellar_soroban_get_events`.
- For writes, default to unsigned or user-reviewed flows unless Julio explicitly approves signing/submission.
- When generating code, include concrete commands for build, test, deploy, and binding generation.
- If an argument shape is uncertain, inspect the generated TypeScript bindings or the contract spec instead of guessing XDR manually.

## Stellar x402

- Use `stellar_x402_perkos_guide` before writing x402 code.
- Use `stellar_x402_nextjs_scaffold` for paid Next.js API routes and Freighter-based client payment flows.
- Use `stellar_x402_oz_facilitator_scaffold` for OpenZeppelin Relayer facilitator config/templates.
- Do not invent x402 payloads or Stellar auth-entry signing formats. Use `@x402/*`, `@x402/stellar`, and `@stellar/freighter-api`.
- Keep relayer API keys, keystore passphrases, and signer material server-side only.
- Use the PerkOS facilitator URL as public config, but never expose facilitator auth tokens.
- Do not settle real x402 payments without explicit approval.
