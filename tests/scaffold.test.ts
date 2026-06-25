import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  nextWalletFiles,
  sorobanContractFiles,
  writeScaffoldFiles
} from "../src/tools/scaffold.js";

test("soroban contract scaffold creates Rust workspace and contract template", () => {
  const outDir = mkdtempSync(join(tmpdir(), "stellarmcp-contract-"));
  const files = sorobanContractFiles("QuestBoard");
  const written = writeScaffoldFiles(outDir, files, false);

  assert.ok(written.some((path) => path.endsWith("Cargo.toml")));
  const workspaceManifest = readFileSync(join(outDir, "Cargo.toml"), "utf8");
  assert.match(workspaceManifest, /\[profile\.release\]/);
  assert.match(workspaceManifest, /overflow-checks = true/);

  const contract = readFileSync(join(outDir, "contracts/quest_board/src/lib.rs"), "utf8");
  assert.match(contract, /#!\[no_std\]/);
  assert.match(contract, /pub struct QuestBoardContract/);
  assert.match(contract, /pub fn increment/);

  const readme = readFileSync(join(outDir, "README.md"), "utf8");
  assert.match(readme, /stellar contract build/);
  assert.match(readme, /stellar contract bindings typescript/);
});

test("next wallet scaffold creates Freighter hook and component", () => {
  const outDir = mkdtempSync(join(tmpdir(), "stellarmcp-next-"));
  const files = nextWalletFiles("QuestBoard");
  writeScaffoldFiles(outDir, files, false);

  const hook = readFileSync(join(outDir, "hooks/useStellarWallet.ts"), "utf8");
  assert.match(hook, /@stellar\/freighter-api/);
  assert.match(hook, /requestAccess/);
  assert.match(hook, /signTransaction/);
  assert.match(hook, /stellarNetworkPassphrase/);

  const button = readFileSync(join(outDir, "components/stellar/WalletButton.tsx"), "utf8");
  assert.match(button, /Connect Freighter/);

  const env = readFileSync(join(outDir, ".env.local.example"), "utf8");
  assert.match(env, /NEXT_PUBLIC_STELLAR_RPC_URL=https:\/\/soroban-testnet\.stellar\.org/);
});

test("scaffold writer refuses to overwrite without explicit overwrite", () => {
  const outDir = mkdtempSync(join(tmpdir(), "stellarmcp-overwrite-"));
  const files = [{ path: "README.md", content: "first\n" }];
  writeScaffoldFiles(outDir, files, false);

  assert.throws(
    () => writeScaffoldFiles(outDir, [{ path: "README.md", content: "second\n" }], false),
    /Refusing to overwrite/
  );

  writeScaffoldFiles(outDir, [{ path: "README.md", content: "second\n" }], true);
  assert.equal(readFileSync(join(outDir, "README.md"), "utf8"), "second\n");
});
