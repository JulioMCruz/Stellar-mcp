# PerkOS Stellar x402 Guide

This guide captures the Stellar x402 flow used by PerkOS demo and relayer repositories.

## Source Repositories

- Demo app: https://github.com/PerkOS-xyz/Stellar-x402-Demo
- Relayer: https://github.com/PerkOS-xyz/Stellar-x402-Relayer

## Runtime Pattern

- Paid APIs use x402 HTTP 402 Payment Required.
- Next.js API routes are wrapped with `withX402` from `@x402/next`.
- The resource server uses `HTTPFacilitatorClient` from `@x402/core/server`.
- Stellar support is registered with `ExactStellarScheme` from `@x402/stellar/exact/server`.
- Browser clients use Freighter plus `@x402/fetch` to sign auth entries and retry requests with `X-PAYMENT`.
- PerkOS Stellar Relayer verifies and settles payments through OpenZeppelin Relayer and the x402 facilitator plugin.

## PerkOS Facilitator

Default facilitator:

```text
https://stellar-relayer.perkos.xyz
```

OpenZeppelin Relayer plugin endpoints:

```text
/api/v1/plugins/x402-facilitator/call/verify
/api/v1/plugins/x402-facilitator/call/settle
/api/v1/plugins/x402-facilitator/call/supported
```

## Stellar Networks And Assets

| Network | x402 network | Asset | Contract |
| --- | --- | --- | --- |
| Pubnet | `stellar:pubnet` | USDC | `CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75` |
| Testnet | `stellar:testnet` | USDC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

## MCP Tools

- `stellar_x402_perkos_guide` returns the architecture, endpoints, package names, supported assets, and safety rules.
- `stellar_x402_nextjs_scaffold` writes a Next.js paid route and Freighter x402 client component.
- `stellar_x402_oz_facilitator_scaffold` writes OpenZeppelin Relayer facilitator plugin/config templates.

## Agent Rules

- Do not invent x402 payload shapes. Use `@x402/*` libraries for server/client flows.
- Do not hand-roll facilitator verification. Use the PerkOS facilitator or an OpenZeppelin Relayer plugin deployment.
- Keep `FACILITATOR_URL` public/server config, but keep relayer API keys server-side.
- Never expose relayer API keys, Stellar secret seeds, keystore passphrases, or `.env` files.
- Use testnet first for experiments.
- Ask for explicit approval before signing or settling real payments.

## Official References

- Stellar x402: https://developers.stellar.org/docs/build/agentic-payments/x402
- Stellar x402 quickstart: https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide
- OpenZeppelin x402 facilitator guide: https://docs.openzeppelin.com/relayer/guides/stellar-x402-facilitator-guide
- x402 protocol docs: https://docs.x402.org/introduction
