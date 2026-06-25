import assert from "node:assert/strict";
import test from "node:test";

import { getStellarZkProofGuide } from "../src/tools/zk.js";

test("Stellar ZK guide captures Protocol 25 primitives and safe architecture", () => {
  const guide = getStellarZkProofGuide();

  assert.equal(guide.currentProtocolContext.protocolUpgrade, "X-Ray / Protocol 25");
  assert.ok(guide.currentProtocolContext.nativePrimitives.bn254.hostFunctions.includes("pairing_check"));
  assert.ok(guide.currentProtocolContext.nativePrimitives.poseidon.hostFunctions.includes("poseidon2"));
  assert.ok(guide.architecture.some((step) => step.includes("Generate proofs off-chain")));
  assert.ok(guide.supportedPatterns.some((pattern) => pattern.name === "Noir verifier"));
  assert.ok(guide.supportedPatterns.some((pattern) => pattern.name === "Reclaim/zkFetch-style proof"));
  assert.ok(guide.agentRules.some((rule) => rule.includes("Never invent proof bytes")));
  assert.ok(guide.officialReferences.includes("https://developers.stellar.org/docs/build/apps/zk"));
});
