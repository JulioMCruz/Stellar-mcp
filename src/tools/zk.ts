import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function getStellarZkProofGuide() {
  return {
    topic: "Zero-knowledge proofs on Stellar/Soroban",
    currentProtocolContext: {
      protocolUpgrade: "X-Ray / Protocol 25",
      summary:
        "Stellar exposes ZK-friendly host primitives for verifier contracts. These are building blocks, not a complete private-payment protocol.",
      nativePrimitives: {
        bn254: {
          purpose: "Pairing-friendly elliptic curve operations used by many succinct proof verifiers.",
          hostFunctions: ["g1_add", "g1_mul", "pairing_check"],
          typicalUse: "Verify pairing-based proofs in Soroban verifier contracts."
        },
        poseidon: {
          purpose: "ZK-friendly hash for commitments, Merkle trees, nullifiers, and circuit-aligned hashing.",
          hostFunctions: ["poseidon", "poseidon2"],
          typicalUse: "Hash field elements consistently between off-chain circuits and on-chain contracts."
        }
      }
    },
    architecture: [
      "Write the private statement as a circuit or zkVM program off-chain.",
      "Generate proofs off-chain with a framework such as Noir, RISC Zero, Circom, or a proof service such as Reclaim/zkFetch.",
      "Deploy a Soroban verifier contract that checks public inputs and proof material.",
      "Call the verifier contract from a Next.js UI or backend after wallet/test-wallet setup.",
      "Store only verification results, commitments, nullifiers, and public inputs on-chain."
    ],
    supportedPatterns: [
      {
        name: "Noir verifier",
        useWhen: "You need a SNARK-style circuit and verifier contract flow.",
        stellarPieces: ["Soroban verifier contract", "BN254 pairing_check", "TypeScript bindings"]
      },
      {
        name: "RISC Zero verifier",
        useWhen: "You want zkVM-style verifiable computation outside the chain.",
        stellarPieces: ["Off-chain proof generation", "Soroban verification adapter", "public inputs"]
      },
      {
        name: "Circom verifier",
        useWhen: "You already have Circom circuits or Groth16-style proof artifacts.",
        stellarPieces: ["BN254 verifier contract", "proof/public input serialization"]
      },
      {
        name: "Reclaim/zkFetch-style proof",
        useWhen: "You need to prove facts about external web/API data.",
        stellarPieces: ["Proof generation service", "Soroban proof verifier", "testnet wallet for transaction fees"]
      }
    ],
    agentRules: [
      "Do not claim a Stellar app is private just because it uses BN254 or Poseidon.",
      "Keep witness/private inputs off-chain.",
      "Bind proofs to domain, network, contract id, statement version, and public inputs to reduce replay risk.",
      "Use nullifiers for one-time private claims or membership spends.",
      "Use generated TypeScript bindings for verifier contract calls.",
      "Treat verifier keys, proving keys, and generated proof artifacts as build artifacts with explicit provenance.",
      "Never invent proof bytes, verifying keys, or trusted setup material.",
      "Test verifier contracts with known valid and invalid proof fixtures before wiring UI."
    ],
    nextjsUxChecklist: [
      "Show proof generation as a separate pending state from wallet signing.",
      "Show public inputs before signing/submission.",
      "Explain what remains private and what becomes public on-chain.",
      "Handle proof generation failure, verifier rejection, wallet rejection, and transaction failure separately.",
      "Link confirmed verification transactions in Stellar explorer."
    ],
    projectIdeas: [
      "Private eligibility proof for a Stellar payment or x402 route.",
      "Proof of off-chain credential without revealing the credential.",
      "Reclaim/zkFetch proof of external data, then Soroban verification.",
      "Privacy-preserving treasury or payroll eligibility check.",
      "Nullifier-based one-time claim or redemption on Stellar."
    ],
    officialReferences: [
      "https://developers.stellar.org/docs/build/apps/zk",
      "https://dorahacks.io/hackathon/stellar-hacks-zk/resources",
      "https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md",
      "https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md"
    ],
    ecosystemReferences: [
      "https://github.com/reclaimprotocol/zkfetch-stellar-example",
      "https://noir-lang.org/docs",
      "https://dev.risczero.com"
    ]
  };
}

export function registerZkTools(server: McpServer): void {
  server.tool(
    "stellar_zkproof_guide",
    "Return Stellar/Soroban zero-knowledge proof architecture, native primitives, framework choices, and agent safety rules.",
    {},
    async () => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(getStellarZkProofGuide(), null, 2)
        }
      ]
    })
  );
}
