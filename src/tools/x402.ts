import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolve } from "node:path";
import { z } from "zod";

import { redactSensitiveText } from "../lib/redact.js";
import { writeScaffoldFiles } from "./scaffold.js";

const outputDirSchema = z
  .string()
  .trim()
  .min(1)
  .describe("Directory where x402 scaffold files should be written.")
  .refine((value) => {
    const resolved = resolve(value).replace(/\\/g, "/");
    if (resolved === "/" || resolved === "/root" || resolved === "/etc") return false;
    const restrictedPrefixes = ["/etc/", "/proc/", "/sys/", "/dev/", "/root/", "/boot/", "/var/log/", "/run/"];
    return !restrictedPrefixes.some((prefix) => resolved.startsWith(prefix));
  }, {
    message: "Output directory targets a restricted system path."
  });

const appNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/, "Name must start with a letter and contain only letters, numbers, '_' or '-'.");

const PUBNET_USDC = "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75";
const TESTNET_USDC = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";
const DEFAULT_FACILITATOR = "https://stellar-relayer.perkos.xyz";

type ScaffoldFile = {
  path: string;
  content: string;
};

function toKebabName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "stellar-x402";
}

export function getPerkosX402Guide() {
  return {
    protocol: "x402 over HTTP 402 Payment Required",
    stellarNetworks: {
      pubnet: {
        network: "stellar:pubnet",
        asset: "USDC",
        assetContract: PUBNET_USDC,
        facilitatorUrl: DEFAULT_FACILITATOR
      },
      testnet: {
        network: "stellar:testnet",
        asset: "USDC",
        assetContract: TESTNET_USDC
      }
    },
    perkosRelayer: {
      role: "PerkOS Stellar x402 Relayer verifies and settles Stellar x402 payments.",
      openZeppelinRuntime: "OpenZeppelin Relayer",
      plugin: "@openzeppelin/relayer-plugin-x402-facilitator",
      endpoints: [
        "/api/v1/plugins/x402-facilitator/call/verify",
        "/api/v1/plugins/x402-facilitator/call/settle",
        "/api/v1/plugins/x402-facilitator/call/supported"
      ]
    },
    nextjsServerPattern: {
      packages: ["@x402/next", "@x402/core", "@x402/stellar"],
      flow: [
        "Create HTTPFacilitatorClient with FACILITATOR_URL.",
        "Create x402ResourceServer and register stellar:pubnet with ExactStellarScheme.",
        "Wrap paid API handlers with withX402.",
        "Set accepts.scheme=exact, accepts.network=stellar:pubnet, accepts.price, and accepts.payTo."
      ]
    },
    nextjsClientPattern: {
      packages: ["@x402/fetch", "@x402/stellar", "@stellar/freighter-api"],
      flow: [
        "Connect Freighter.",
        "Create signer with address and signAuthEntry(authEntry, opts).",
        "Register ExactStellarScheme with x402Client.",
        "Use wrapFetchWithPayment(fetch, client).",
        "Retry paid endpoint; x402 client adds X-PAYMENT header."
      ]
    },
    safety: [
      "Never expose relayer API keys or secret seeds in NEXT_PUBLIC variables.",
      "Keep FACILITATOR_URL public but keep facilitator API keys server-side.",
      "Use placeholders for RESOURCE_SERVER_ADDRESS and API keys in examples.",
      "Use testnet first before pubnet payments.",
      "Agents should not settle or sign payments without explicit approval."
    ],
    sourceRepos: [
      "https://github.com/PerkOS-xyz/Stellar-x402-Demo",
      "https://github.com/PerkOS-xyz/Stellar-x402-Relayer"
    ],
    officialReferences: [
      "https://developers.stellar.org/docs/build/agentic-payments/x402",
      "https://developers.stellar.org/docs/build/agentic-payments/x402/quickstart-guide",
      "https://docs.openzeppelin.com/relayer/guides/stellar-x402-facilitator-guide",
      "https://docs.x402.org/introduction"
    ]
  };
}

export function nextX402Files(appName: string): ScaffoldFile[] {
  const label = toKebabName(appName);
  return [
    {
      path: "package.x402-snippet.json",
      content: `{
  "dependencies": {
    "@x402/core": "latest",
    "@x402/fetch": "latest",
    "@x402/next": "latest",
    "@x402/stellar": "^2.6.0",
    "@stellar/freighter-api": "^6.0.1"
  },
  "nextConfig": {
    "transpilePackages": ["@x402/core", "@x402/next"]
  }
}
`
    },
    {
      path: ".env.x402.example",
      content: `FACILITATOR_URL=${DEFAULT_FACILITATOR}
RESOURCE_SERVER_ADDRESS=<STELLAR_PUBLIC_KEY_RECEIVING_PAYMENT>
NEXT_PUBLIC_STELLAR_X402_NETWORK=stellar:pubnet
NEXT_PUBLIC_STELLAR_USDC_CONTRACT=${PUBNET_USDC}
`
    },
    {
      path: "lib/x402-config.ts",
      content: `export const X402_CONFIG = {
  facilitatorUrl: process.env.FACILITATOR_URL || "${DEFAULT_FACILITATOR}",
  network: "stellar:pubnet" as const,
  asset: "${PUBNET_USDC}",
  payTo: process.env.RESOURCE_SERVER_ADDRESS || "<STELLAR_PUBLIC_KEY_RECEIVING_PAYMENT>",
};
`
    },
    {
      path: "lib/x402-server.ts",
      content: `import { HTTPFacilitatorClient } from "@x402/core/server";
import { x402ResourceServer } from "@x402/next";
import { ExactStellarScheme } from "@x402/stellar/exact/server";

import { X402_CONFIG } from "./x402-config";

const facilitatorClient = new HTTPFacilitatorClient({
  url: X402_CONFIG.facilitatorUrl,
});

export const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(X402_CONFIG.network, new ExactStellarScheme());

export const PAYTO = X402_CONFIG.payTo;
`
    },
    {
      path: "app/api/paid-example/route.ts",
      content: `import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";

import { PAYTO, resourceServer } from "@/lib/x402-server";

async function handler(req: NextRequest) {
  const topic = req.nextUrl.searchParams.get("topic") || "${label}";
  return NextResponse.json({
    ok: true,
    topic,
    source: "PerkOS Stellar x402 paid route",
    timestamp: new Date().toISOString(),
  });
}

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.001",
      network: "stellar:pubnet",
      payTo: PAYTO,
    },
    description: "Paid Stellar x402 endpoint",
  },
  resourceServer,
);
`
    },
    {
      path: "components/stellar/X402PaidFetchButton.tsx",
      content: `"use client";

import { useState } from "react";

type FreighterSigner = {
  address: string;
  signAuthEntry: (authEntry: string, opts?: { networkPassphrase?: string; address?: string }) => Promise<{
    signedAuthEntry: string;
    signerAddress?: string;
  }>;
};

export function X402PaidFetchButton({ address }: { address: string }) {
  const [result, setResult] = useState<string>("idle");

  async function callPaidEndpoint() {
    setResult("paying");
    try {
      const freighterApi = await import("@stellar/freighter-api");
      const { x402Client, wrapFetchWithPayment } = await import("@x402/fetch");
      const { ExactStellarScheme } = await import("@x402/stellar/exact/client");

      const signer: FreighterSigner = {
        address,
        signAuthEntry: async (authEntry, opts) => {
          const signed = await freighterApi.signAuthEntry(authEntry, opts);
          if (!signed.signedAuthEntry) {
            throw new Error("Freighter did not return a signed auth entry.");
          }
          return {
            signedAuthEntry: signed.signedAuthEntry,
            signerAddress: signed.signerAddress,
          };
        },
      };

      const client = new x402Client()
        .register("stellar:pubnet", new ExactStellarScheme(signer));
      const fetchWithPayment = wrapFetchWithPayment(fetch, client);
      const response = await fetchWithPayment("/api/paid-example");
      const json = await response.json();
      setResult(JSON.stringify(json, null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Unknown x402 payment error");
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={callPaidEndpoint}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Pay with Stellar x402
      </button>
      <pre className="overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{result}</pre>
    </div>
  );
}
`
    },
    {
      path: "README.x402-stellar.md",
      content: `# Stellar x402 Next.js Scaffold

Generated by Stellar MCP from the PerkOS Stellar x402 demo pattern.

## Install

\`\`\`bash
npm install @x402/core @x402/fetch @x402/next @x402/stellar @stellar/freighter-api
\`\`\`

In \`next.config.ts\`, add:

\`\`\`ts
const nextConfig = {
  transpilePackages: ["@x402/core", "@x402/next"],
};

export default nextConfig;
\`\`\`

Copy \`.env.x402.example\` into your environment and set \`RESOURCE_SERVER_ADDRESS\`.

## Flow

1. API route is wrapped with \`withX402\`.
2. Server returns HTTP 402 payment requirements.
3. Client signs a Stellar auth entry through Freighter.
4. \`@x402/fetch\` retries with \`X-PAYMENT\`.
5. PerkOS facilitator verifies and settles through OpenZeppelin Relayer.

Do not expose relayer API keys or secret seeds in browser code.
`
    }
  ];
}

export function ozX402FacilitatorFiles(): ScaffoldFile[] {
  return [
    {
      path: "x402-facilitator/index.ts",
      content: `export { handler } from "@openzeppelin/relayer-plugin-x402-facilitator";
`
    },
    {
      path: "x402-facilitator/package.json",
      content: `{
  "name": "perkos-x402-facilitator",
  "version": "0.1.0",
  "description": "PerkOS x402 Facilitator plugin for Stellar",
  "main": "index.js",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@openzeppelin/relayer-plugin-x402-facilitator": "^0.4.0",
    "@openzeppelin/relayer-sdk": "^1.10.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.3",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
`
    },
    {
      path: "config/config.example.json",
      content: `{
  "relayers": [
    {
      "id": "stellar-relayer",
      "name": "PerkOS Stellar Relayer",
      "network": "mainnet",
      "paused": false,
      "network_type": "stellar",
      "signer_id": "local-signer",
      "policies": {
        "fee_payment_strategy": "relayer",
        "min_balance": 0
      }
    }
  ],
  "notifications": [],
  "signers": [
    {
      "id": "local-signer",
      "type": "local",
      "config": {
        "path": "config/keys/local-signer.json",
        "passphrase": {
          "type": "env",
          "value": "KEYSTORE_PASSPHRASE"
        }
      }
    }
  ],
  "networks": "./config/networks",
  "plugins": [
    {
      "id": "x402-facilitator",
      "path": "x402-facilitator/index.ts",
      "timeout": 30,
      "emit_logs": false,
      "emit_traces": false,
      "forward_logs": true,
      "raw_response": true,
      "allow_get_invocation": true,
      "config": {
        "networks": [
          {
            "network": "stellar:pubnet",
            "type": "stellar",
            "relayer_id": "stellar-relayer",
            "assets": ["${PUBNET_USDC}"]
          }
        ]
      }
    }
  ]
}
`
    },
    {
      path: "config/networks/stellar.example.json",
      content: `{
  "networks": [
    {
      "type": "stellar",
      "network": "mainnet",
      "rpc_urls": ["https://mainnet.sorobanrpc.com"],
      "explorer_urls": ["https://stellar.expert/explorer/public"],
      "average_blocktime_ms": 5000,
      "is_testnet": false,
      "passphrase": "Public Global Stellar Network ; September 2015",
      "horizon_url": "https://horizon.stellar.org"
    },
    {
      "from": "mainnet",
      "type": "stellar",
      "network": "testnet",
      "rpc_urls": ["https://soroban-testnet.stellar.org"],
      "explorer_urls": ["https://stellar.expert/explorer/testnet"],
      "is_testnet": true,
      "passphrase": "Test SDF Network ; September 2015",
      "horizon_url": "https://horizon-testnet.stellar.org"
    }
  ]
}
`
    },
    {
      path: "README.x402-facilitator.md",
      content: `# PerkOS Stellar x402 Facilitator Scaffold

This scaffold follows the PerkOS Stellar x402 Relayer pattern and the OpenZeppelin Relayer x402 facilitator plugin.

## Endpoints

- \`/api/v1/plugins/x402-facilitator/call/verify\`
- \`/api/v1/plugins/x402-facilitator/call/settle\`
- \`/api/v1/plugins/x402-facilitator/call/supported\`

## Security

- Generate the relayer keystore outside git.
- Keep \`KEYSTORE_PASSPHRASE\` and API keys in environment/secret storage.
- Do not commit \`config/keys/*.json\`, \`.env\`, relayer API keys, or secret seeds.
- Fund the relayer with XLM for fees; clients pay USDC through x402.

## Supported Assets

- pubnet USDC: \`${PUBNET_USDC}\`
- testnet USDC: \`${TESTNET_USDC}\`
`
    }
  ];
}

export function registerX402Tools(server: McpServer): void {
  server.tool(
    "stellar_x402_perkos_guide",
    "Return the PerkOS/OpenZeppelin Stellar x402 architecture, endpoints, assets, Next.js patterns, and safety rules.",
    {},
    async () => ({
      content: [{ type: "text", text: JSON.stringify(getPerkosX402Guide(), null, 2) }]
    })
  );

  server.tool(
    "stellar_x402_nextjs_scaffold",
    "Create a Next.js paid API route and Freighter-based x402 client scaffold using the PerkOS Stellar facilitator pattern.",
    {
      outputDir: outputDirSchema,
      appName: appNameSchema.default("stellar_x402_app"),
      overwrite: z.boolean().default(false)
    },
    async ({ outputDir, appName, overwrite }) => {
      try {
        const files = nextX402Files(appName);
        const writtenFiles = writeScaffoldFiles(outputDir, files, overwrite);
        return {
          content: [{ type: "text", text: JSON.stringify({ status: "created", scaffold: "stellar-x402-nextjs", files: writtenFiles }, null, 2) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: redactSensitiveText(error instanceof Error ? error.message : String(error)) }]
        };
      }
    }
  );

  server.tool(
    "stellar_x402_oz_facilitator_scaffold",
    "Create OpenZeppelin Relayer x402 facilitator plugin/config templates for Stellar/PerkOS deployments.",
    {
      outputDir: outputDirSchema,
      overwrite: z.boolean().default(false)
    },
    async ({ outputDir, overwrite }) => {
      try {
        const files = ozX402FacilitatorFiles();
        const writtenFiles = writeScaffoldFiles(outputDir, files, overwrite);
        return {
          content: [{ type: "text", text: JSON.stringify({ status: "created", scaffold: "stellar-x402-oz-facilitator", files: writtenFiles }, null, 2) }]
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: "text", text: redactSensitiveText(error instanceof Error ? error.message : String(error)) }]
        };
      }
    }
  );
}
