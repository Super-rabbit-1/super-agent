#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

function parseArgs(argv) {
  let cwd = process.cwd();
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--cwd" && argv[i + 1]) {
      cwd = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { cwd };
}

function existsFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

function existsDir(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function realPathOrSelf(file) {
  try {
    return fs.realpathSync(file);
  } catch {
    return file;
  }
}

function projectRoot(cwd) {
  try {
    return execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return cwd;
  }
}

function directoriesBetween(root, cwd) {
  const relative = path.relative(root, cwd);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return [cwd];
  const parts = relative ? relative.split(path.sep) : [];
  const dirs = [root];
  let current = root;
  for (const part of parts) {
    current = path.join(current, part);
    dirs.push(current);
  }
  return dirs;
}

function instructionFiles(home, root, cwd) {
  const files = [];
  const globalCandidates = [
    path.join(home, ".codex", "AGENTS.override.md"),
    path.join(home, ".codex", "AGENTS.md"),
    path.join(home, ".agents", "AGENTS.md"),
    path.join(home, ".claude", "CLAUDE.md"),
  ];
  for (const file of globalCandidates) {
    if (existsFile(file)) files.push({ scope: "global", path: file, realPath: realPathOrSelf(file) });
  }
  for (const dir of directoriesBetween(root, cwd)) {
    const candidates = [path.join(dir, "AGENTS.override.md"), path.join(dir, "AGENTS.md")];
    const selected = candidates.find(existsFile);
    if (selected) files.push({ scope: "project", path: selected, realPath: realPathOrSelf(selected) });
  }
  return files.filter((item, index, list) =>
    list.findIndex((other) => other.path === item.path && other.scope === item.scope) === index
  );
}

function readFrontmatter(file) {
  try {
    const text = fs.readFileSync(file, "utf8").slice(0, 32768);
    const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return {};
    const lines = match[1].split("\n");
    const scalar = (key) => {
      const index = lines.findIndex((line) => new RegExp(`^${key}:\\s*`).test(line));
      if (index < 0) return undefined;
      const raw = lines[index].replace(new RegExp(`^${key}:\\s*`), "").trim();
      if (raw === ">" || raw === "|" || raw === ">-" || raw === "|-") {
        const chunks = [];
        for (let i = index + 1; i < lines.length && /^\s+\S/.test(lines[i]); i += 1) {
          chunks.push(lines[i].trim());
        }
        return (raw.startsWith(">") ? chunks.join(" ") : chunks.join("\n")).trim();
      }
      return raw.replace(/^(["'])([\s\S]*)\1$/, "$2").trim();
    };
    const name = scalar("name");
    const description = scalar("description");
    return { name, description };
  } catch {
    return {};
  }
}

function skillDirs(root) {
  if (!existsDir(root)) return [];
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    const skillFile = path.join(dir, "SKILL.md");
    if (!existsFile(skillFile)) continue;
    result.push({ path: dir, skillFile, ...readFrontmatter(skillFile) });
  }
  return result;
}

function walkRuleFiles(root, depth = 2) {
  if (!existsDir(root) || depth < 0) return [];
  const result = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...walkRuleFiles(file, depth - 1));
    else if (/\.(md|mdc|txt)$/i.test(entry.name)) result.push(file);
  }
  return result;
}

const { cwd } = parseArgs(process.argv.slice(2));
const home = os.homedir();
const root = projectRoot(cwd);
const skillRoots = [
  path.join(home, ".codex", "skills"),
  path.join(home, ".agents", "skills"),
  path.join(home, ".claude", "skills"),
];
const directAgentSkills = existsDir(path.join(home, ".agents"))
  ? fs.readdirSync(path.join(home, ".agents"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== "skills")
      .map((entry) => path.join(home, ".agents", entry.name))
      .filter((dir) => existsFile(path.join(dir, "SKILL.md")))
      .map((dir) => ({ path: dir, skillFile: path.join(dir, "SKILL.md"), ...readFrontmatter(path.join(dir, "SKILL.md")) }))
  : [];
const skills = [...skillRoots.flatMap(skillDirs), ...directAgentSkills]
  .filter((item, index, list) => list.findIndex((other) => realPathOrSelf(other.path) === realPathOrSelf(item.path)) === index)
  .sort((a, b) => (a.name ?? a.path).localeCompare(b.name ?? b.path));
const ruleRoots = [
  path.join(home, ".claude", "rules"),
  path.join(home, ".cursor", "rules"),
  path.join(root, ".claude", "rules"),
  path.join(root, ".cursor", "rules"),
];
const rules = ruleRoots.flatMap((ruleRoot) => walkRuleFiles(ruleRoot));

const output = {
  generatedAt: new Date().toISOString(),
  cwd,
  projectRoot: root,
  instructions: instructionFiles(home, root, cwd),
  rules,
  skills,
  summary: {
    instructionCount: instructionFiles(home, root, cwd).length,
    ruleCount: rules.length,
    skillCount: skills.length,
  },
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
