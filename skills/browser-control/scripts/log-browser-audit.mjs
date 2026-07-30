#!/usr/bin/env node
import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const args = process.argv.slice(2);

function valueFor(name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function originFor(target) {
  if (!target) return "";
  try {
    return new URL(target).origin;
  } catch {
    return target.replace(/[?#].*$/, "");
  }
}

const engine = valueFor("--engine");
const action = valueFor("--action");
const target = valueFor("--target", "");
const risk = valueFor("--risk", "read");
const outcome = valueFor("--outcome");
const workspace = resolve(valueFor("--workspace", process.cwd()));

if (!engine || !action || !outcome) {
  throw new Error(
    "Usage: log-browser-audit.mjs --engine <name> --action <name> --target <url> --risk <read|write|sensitive> --outcome <started|success|failed|blocked|cancelled> [--workspace <path>]",
  );
}

const logPath = resolve(workspace, ".agent", "browser-audit.jsonl");
const event = {
  timestamp: new Date().toISOString(),
  engine,
  action,
  target_origin: originFor(target),
  risk,
  outcome,
};

await mkdir(dirname(logPath), { recursive: true });
await appendFile(logPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`${logPath}\n`);
