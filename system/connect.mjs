#!/usr/bin/env node
// system/connect.mjs — connect the AIOS skills server to the user's AI client.
// Hides every per-client MCP config format behind ONE script so install is
// "run this", not "hand-edit TOML/JSON". SAFE by design: never overwrites a
// config it can't parse, validates the token, writes atomically, and keeps the
// first backup (<file>.bak-aios) intact across re-runs.
//
//   node system/connect.mjs                       # reads .aios-license at the AIOS root
//   node system/connect.mjs --license AIOS-XXXX   # explicit token
//
// Writes the `aios` MCP server into each client's GLOBAL config (so the license
// token stays OUT of the portable AIOS folder), for whichever clients are present:
//   - ~/.claude/settings.json                  Claude Code  (only if ~/.claude exists)
//   - ~/.config/opencode/opencode.jsonc        OpenCode     (only if its dir exists)
//   - ~/.codex/config.toml                     Codex        (only if ~/.codex exists)
//   - ~/.gemini/antigravity/mcp_config.json    Antigravity  (only if that dir exists)
// Auth travels as a standard `Authorization: Bearer <token>` header.
// Then tells the user to RESTART. Apps (Claude Desktop, Manus, Perplexity) are
// GUI/cloud — not scriptable; connect those once in the app's own Settings.

import { readFileSync, writeFileSync, existsSync, copyFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const URL_MCP = "https://aios-skills.vercel.app/mcp";
const NAME = "aios";
const SENTINEL = Symbol("unparseable");

// --- token: --license arg, else .aios-license at cwd; VALIDATED before use ---
function getToken() {
  const i = process.argv.indexOf("--license");
  let t =
    i !== -1 && process.argv[i + 1] ? process.argv[i + 1] :
    existsSync(join(process.cwd(), ".aios-license")) ? readFileSync(join(process.cwd(), ".aios-license"), "utf8") :
    null;
  if (t == null) return null;
  t = t.trim();
  if (!/^[A-Za-z0-9._-]+$/.test(t)) {
    console.error("License token has unexpected characters — aborting so we don't write a malformed config.");
    process.exit(1);
  }
  return t;
}
const token = getToken();
if (!token) {
  console.error("No license token. Run from the AIOS root (needs .aios-license) or pass --license <token>.");
  process.exit(1);
}
const AUTH = `Bearer ${token}`; // standard Authorization header value

const done = [], skipped = [];

// Back up only if the file exists AND no backup exists yet — never clobber the
// original good copy on a re-run. Returns false only if a needed backup failed.
function backup(p) {
  if (!existsSync(p) || existsSync(p + ".bak-aios")) return true;
  try { copyFileSync(p, p + ".bak-aios"); return true; } catch { return false; }
}
// {} if absent (safe to create); SENTINEL if present but not valid JSON (must skip).
function readJSONSafe(p) {
  if (!existsSync(p)) return {};
  try {
    let s = readFileSync(p, "utf8");
    if (s.charCodeAt(0) === 0xfeff) s = s.slice(1); // tolerate a BOM
    return s.trim() === "" ? {} : JSON.parse(s);
  } catch { return SENTINEL; }
}
function writeAtomic(p, text) {
  const tmp = p + ".tmp-aios";
  writeFileSync(tmp, text);
  renameSync(tmp, p); // atomic on the same filesystem
}
const writeJSON = (p, o) => writeAtomic(p, JSON.stringify(o, null, 2) + "\n");

// Merge an `aios` entry into a JSON client config, safely.
function mergeJSON(p, label, mutate) {
  const cfg = readJSONSafe(p);
  if (cfg === SENTINEL) { skipped.push(`${label} — EXISTS but isn't valid JSON; left untouched (add aios manually)`); return; }
  if (!backup(p)) { skipped.push(`${label} — couldn't back up the existing file; left untouched`); return; }
  mutate(cfg);
  writeJSON(p, cfg); // mutate REPLACES the whole `aios` entry, so no stale keys linger
  done.push(label);
}
// Remove a TOML table ([name] header + its lines, up to the next table or EOF).
function stripTomlTable(text, name) {
  const esc = name.replace(/[.]/g, "\\.");
  const re = new RegExp(`^[ \\t]*\\[${esc}\\][ \\t]*\\r?\\n(?:(?![ \\t]*\\[)[^\\n]*\\r?\\n?)*`, "gm");
  return text.replace(re, "");
}

// 1. ~/.claude/settings.json — Claude Code (global user config)
{
  const dir = join(homedir(), ".claude");
  if (!existsSync(dir)) { skipped.push("Claude Code not detected (~/.claude absent)"); }
  else mergeJSON(join(dir, "settings.json"), "~/.claude/settings.json (Claude Code)", (cfg) => {
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers[NAME] = { type: "http", url: URL_MCP, headers: { Authorization: AUTH } };
  });
}

// 2. ~/.config/opencode/opencode.jsonc — OpenCode (global). Local mcp-remote bridge:
// reliable across versions and sidesteps the upstream "remote connects but injects
// no tools" bug. Merge into the existing .jsonc/.json (or create .json).
{
  const dir = join(homedir(), ".config", "opencode");
  if (!existsSync(dir)) { skipped.push("OpenCode not detected (~/.config/opencode absent)"); }
  else {
    const jsonc = join(dir, "opencode.jsonc"), jsonp = join(dir, "opencode.json");
    const target = existsSync(jsonc) ? jsonc : jsonp;
    mergeJSON(target, `${target.replace(homedir(), "~")} (OpenCode)`, (cfg) => {
      cfg["$schema"] = cfg["$schema"] || "https://opencode.ai/config.json";
      cfg.mcp = cfg.mcp || {};
      cfg.mcp[NAME] = {
        type: "local",
        command: ["npx", "-y", "mcp-remote", URL_MCP, "--header", `Authorization:${AUTH}`],
        enabled: true,
      };
    });
  }
}

// 3. ~/.codex/config.toml — Codex (only if installed). String-level TOML handling.
// REPLACE any existing aios tables so a re-install/re-license refreshes the token.
try {
  const dir = join(homedir(), ".codex");
  if (!existsSync(dir)) { skipped.push("Codex not detected (~/.codex absent)"); }
  else {
    const p = join(dir, "config.toml");
    const cur = existsSync(p) ? readFileSync(p, "utf8") : "";
    if (existsSync(p) && !backup(p)) { skipped.push("Codex — couldn't back up config.toml; left untouched"); }
    else {
      let base = stripTomlTable(stripTomlTable(cur, "mcp_servers.aios.http_headers"), "mcp_servers.aios");
      base = base.replace(/\s+$/, "");
      const sep = base.length ? "\n\n" : "";
      const block = `[mcp_servers.aios]\nurl = "${URL_MCP}"\nstartup_timeout_sec = 30\n\n[mcp_servers.aios.http_headers]\nAuthorization = "${AUTH}"\n`;
      writeAtomic(p, base + sep + block);
      done.push("~/.codex/config.toml (Codex)");
    }
  }
} catch (e) { skipped.push("Codex — " + e.message); }

// 4. ~/.gemini/antigravity/mcp_config.json — Antigravity (only if installed)
{
  const dir = join(homedir(), ".gemini", "antigravity");
  if (!existsSync(dir)) { skipped.push("Antigravity not detected"); }
  else mergeJSON(join(dir, "mcp_config.json"), "Antigravity mcp_config.json", (cfg) => {
    cfg.mcpServers = cfg.mcpServers || {};
    cfg.mcpServers[NAME] = { serverUrl: URL_MCP, headers: { Authorization: AUTH } }; // serverUrl, not url
  });
}

console.log("AIOS skills server connected to:");
done.length ? done.forEach((d) => console.log("  ✓ " + d)) : console.log("  (nothing written)");
if (skipped.length) { console.log("Notes:"); skipped.forEach((s) => console.log("  - " + s)); }
console.log("\nNEXT: restart your AI client so it loads the server, then ask: \"list my AIOS skills\".");
console.log("Apps (Claude Desktop / Manus / Perplexity) can't be scripted — in the app's Settings add");
console.log("server `aios` at " + URL_MCP + " with header  Authorization: " + AUTH);
