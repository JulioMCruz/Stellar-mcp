# Stellar ZK Proof Guide

This guide is for agents using Stellar MCP to design or review zero-knowledge proof flows on Stellar/Soroban.

## Current Stellar ZK Context

Stellar Protocol 25 / X-Ray adds native ZK-friendly primitives for Soroban verifier contracts:

- BN254 host functions:
  - `g1_add`
  - `g1_mul`
  - `pairing_check`
- Poseidon host functions:
  - `poseidon`
  - `poseidon2`

These primitives help verify proof systems and build ZK-friendly commitments, hashes, nullifiers, and Merkle structures. They do not automatically make an app private. The app still needs a proof system, a verifier contract, and a careful public-input design.

## Recommended Architecture

1. Define the private statement off-chain.
2. Write the circuit or zkVM method using a real framework such as Noir, RISC Zero, Circom, or a proof service such as Reclaim/zkFetch.
3. Generate proofs off-chain.
4. Deploy a Soroban verifier contract.
5. Submit only proof material, public inputs, commitments, nullifiers, and verification results on-chain.
6. Generate TypeScript bindings for the verifier contract.
7. Wire the verifier call into Next.js with clear wallet, proof generation, and transaction states.

## Agent Rules

- Never invent proof bytes, verifying keys, trusted setup artifacts, or witness data.
- Keep witnesses and private inputs off-chain.
- Keep proving keys and generated proof artifacts out of git unless they are explicitly public test fixtures.
- Bind proofs to the Stellar network, verifier contract id, statement version, domain, and public inputs.
- Use nullifiers for one-time claims, membership spends, private redemptions, and similar flows.
- Add tests for at least one valid proof and one invalid proof before wiring UI.
- Use generated TypeScript bindings to call verifier contracts from Next.js.

## Useful Patterns

### Noir Verifier

Use when the app needs a circuit-oriented SNARK flow. The Soroban contract verifies proof data with BN254 primitives where applicable.

### RISC Zero Verifier

Use when the app needs verifiable computation through a zkVM. The private computation and proof generation happen off-chain; Soroban verifies public outputs.

### Circom/Groth16 Verifier

Use when the project already has Circom circuits or Groth16-style artifacts. Be explicit about proof serialization and public input ordering.

### Reclaim/zkFetch

Use when the app needs to prove facts about external APIs or websites. A useful reference pattern is generating off-chain proofs for external data and verifying them through Soroban contracts.

## UI Rules

- Show proof generation separately from wallet signing.
- Show public inputs before submission.
- Explain what remains private and what goes on-chain.
- Treat proof generation failure, verifier rejection, wallet rejection, and transaction failure as different errors.
- Link confirmed verification transactions in a Stellar explorer.

## References

- Stellar ZK docs: <https://developers.stellar.org/docs/build/apps/zk>
- DoraHacks Stellar Hacks ZK resources: <https://dorahacks.io/hackathon/stellar-hacks-zk/resources>
- CAP-74 BN254: <https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md>
- CAP-75 Poseidon: <https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md>
- Reclaim zkFetch Stellar example: <https://github.com/reclaimprotocol/zkfetch-stellar-example>
- Noir docs: <https://noir-lang.org/docs>
- RISC Zero docs: <https://dev.risczero.com>
