#!/usr/bin/env node

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const [command, ...rawArgs] = process.argv.slice(2);
const args = {};
for (let i = 0; i < rawArgs.length; i += 1) {
  const token = rawArgs[i];
  if (!token.startsWith("--")) continue;
  const key = token.slice(2);
  const next = rawArgs[i + 1];
  args[key] = next && !next.startsWith("--") ? rawArgs[++i] : true;
}

const vault = path.resolve(
  String(args.vault || process.env.CONTENT_IDEA_VAULT || path.join(os.homedir(), "Documents", "Codex", "self-media-vault")),
);

function usage() {
  console.error(`Usage:
  idea-vault.mjs capture --text <text> [--title <title>] [--tags tag1,tag2] [--source thought] [--vault <dir>] [--dry-run]
  idea-vault.mjs list [--status inbox] [--tag <tag>] [--limit 50] [--vault <dir>] [--json]`);
  process.exit(2);
}

function quote(value) {
  return JSON.stringify(value);
}

function slug(value) {
  const normalized = String(value).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 36) || "idea";
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return {};
  const values = {};
  for (const line of match[1].split("\n")) {
    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim();
    const raw = line.slice(colon + 1).trim();
    try { values[key] = JSON.parse(raw); } catch { values[key] = raw; }
  }
  return values;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

if (command === "capture") {
  if (!args.text || typeof args.text !== "string") usage();
  const text = args.text.trim();
  if (!text) usage();
  const title = String(args.title || text.replace(/\s+/g, " ").slice(0, 28));
  const tags = String(args.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
  const source = String(args.source || "thought");
  const createdAt = new Date().toISOString();
  const day = createdAt.slice(0, 10);
  const relative = path.join("inbox", day, `${stamp()}-${slug(title)}.md`);
  const target = path.join(vault, relative);
  const content = `---\nid: ${quote(stamp())}\ncreated_at: ${quote(createdAt)}\nstatus: "inbox"\ntitle: ${quote(title)}\ntags: ${quote(tags)}\nsource: ${quote(source)}\n---\n\n# 原始素材\n\n${text}\n\n# 后续备注\n\n- \n`;
  if (args["dry-run"]) {
    console.log(JSON.stringify({ dryRun: true, vault, relative, title, tags, source }, null, 2));
  } else {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, { encoding: "utf8", flag: "wx" });
    console.log(JSON.stringify({ vault, relative, path: target, title, tags, source }, null, 2));
  }
} else if (command === "list") {
  const requestedStatus = String(args.status || "");
  const requestedTag = String(args.tag || "").trim();
  const limit = Math.max(1, Math.min(Number(args.limit || 50), 200));
  const files = await walk(path.join(vault, "inbox"));
  const records = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const meta = parseFrontmatter(content);
    if (requestedStatus && meta.status !== requestedStatus) continue;
    if (requestedTag && !(Array.isArray(meta.tags) && meta.tags.includes(requestedTag))) continue;
    records.push({ path: path.relative(vault, file), title: meta.title || path.basename(file), status: meta.status || "", tags: meta.tags || [], source: meta.source || "", created_at: meta.created_at || "" });
  }
  records.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const result = records.slice(0, limit);
  if (args.json) console.log(JSON.stringify({ vault, count: result.length, entries: result }, null, 2));
  else for (const item of result) console.log(`${item.created_at}\t${item.title}\t${item.tags.join(",")}\t${item.path}`);
} else {
  usage();
}
