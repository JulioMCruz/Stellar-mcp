import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StrKey } from "@stellar/stellar-sdk";

import { calculateMinimumBalance } from "../src/tools/accounts.js";

test("calculateMinimumBalance computes reserve with base formula", () => {
  const minBalance = calculateMinimumBalance(3, 5_000_000);
  assert.equal(minBalance, "2.5000000");
});

function parseToolText(result: unknown): Record<string, unknown> {
  const maybe = result as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = maybe.content?.find((entry) => entry.type === "text")?.text;
  if (!text) {
    throw new Error("Tool response did not include text payload.");
  }
  return JSON.parse(text) as Record<string, unknown>;
}

test("stellar_generate_test_wallet creates a valid testnet wallet without funding", async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["build/src/index.js"],
    cwd: process.cwd(),
    env: {
      ...Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      ),
      MCP_TRANSPORT: "stdio",
      STELLAR_NETWORK: "testnet"
    }
  });
  const client = new Client({
    name: "stellarmcp-wallet-unit",
    version: "0.1.0"
  });

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "stellar_generate_test_wallet",
      arguments: { fundWithFriendbot: false, label: "unit" }
    });
    const payload = parseToolText(result);
    assert.equal(payload.status, "created");
    assert.equal(payload.network, "testnet");
    assert.equal(StrKey.isValidEd25519PublicKey(payload.publicKey as string), true);
    assert.equal(StrKey.isValidEd25519SecretSeed(payload.secretKey as string), true);
    assert.match(payload.warning as string, /never commit/i);
  } finally {
    await client.close();
  }
});
