#!/usr/bin/env node
/**
 * Charge un fichier .env puis exécute une commande.
 * Usage: node scripts/with-env.mjs .env.staging npm run dev
 */
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const envFile = process.argv[2];
const cmd = process.argv.slice(3);

if (!envFile || cmd.length === 0) {
  console.error("Usage: node scripts/with-env.mjs <env-file> <command...>");
  process.exit(1);
}

const abs = path.resolve(envFile);
if (!existsSync(abs)) {
  console.error(`Fichier introuvable: ${abs}`);
  console.error(`Copiez ${envFile}.example vers ${envFile}`);
  process.exit(1);
}

for (const line of readFileSync(abs, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!process.env[key]) process.env[key] = val;
}

const child = spawn(cmd[0], cmd.slice(1), {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
