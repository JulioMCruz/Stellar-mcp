import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { writeScaffoldFiles } from "../src/tools/scaffold.js";
import {
  getPerkosX402Guide,
  nextX402Files,
  ozX402FacilitatorFiles
} from "../src/tools/x402.js";

test("PerkOS x402 guide captures Stellar facilitator architecture", () => {
  const guide = getPerkosX402Guide();

  assert.equal(guide.stellarNetworks.pubnet.network, "stellar:pubnet");
  assert.equal(guide.stellarNetworks.pubnet.assetContract, "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75");
  assert.ok(guide.perkosRelayer.endpoints.includes("/api/v1/plugins/x402-facilitator/call/verify"));
  assert.ok(guide.nextjsServerPattern.packages.includes("@x402/next"));
  assert.ok(guide.nextjsClientPattern.packages.includes("@x402/fetch"));
});

test("x402 Next.js scaffold creates paid route and Freighter payment client", () => {
  const outDir = mkdtempSync(join(tmpdir(), "stellarmcp-x402-next-"));
  writeScaffoldFiles(outDir, nextX402Files("QuestBoard"), false);

  const server = readFileSync(join(outDir, "lib/x402-server.ts"), "utf8");
  assert.match(server, /HTTPFacilitatorClient/);
  assert.match(server, /ExactStellarScheme/);

  const route = readFileSync(join(outDir, "app/api/paid-example/route.ts"), "utf8");
  assert.match(route, /withX402/);
  assert.match(route, /stellar:pubnet/);

  const button = readFileSync(join(outDir, "components/stellar/X402PaidFetchButton.tsx"), "utf8");
  assert.match(button, /signAuthEntry/);
  assert.match(button, /wrapFetchWithPayment/);
});

test("OpenZeppelin facilitator scaffold creates plugin and config templates", () => {
  const outDir = mkdtempSync(join(tmpdir(), "stellarmcp-x402-oz-"));
  writeScaffoldFiles(outDir, ozX402FacilitatorFiles(), false);

  const plugin = readFileSync(join(outDir, "x402-facilitator/index.ts"), "utf8");
  assert.match(plugin, /@openzeppelin\/relayer-plugin-x402-facilitator/);

  const config = readFileSync(join(outDir, "config/config.example.json"), "utf8");
  assert.match(config, /x402-facilitator/);
  assert.match(config, /stellar-relayer/);
  assert.match(config, /CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75/);
});
