#!/usr/bin/env node
// AIOS managed update. Refreshes ONLY the kernel files listed in
// system/managed-files.json, pulled from the live /template manifest.
// NEVER touches user data. Overwrite-only (never deletes). Backs up every
// changed file. Dry-run by default — pass --apply to write.
//
//   node system/update.mjs            # preview (safe, writes nothing)
//   node system/update.mjs --apply    # apply the update
//
// Run it from the root of your aios/ folder.
import { readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync, cpSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname, sep } from "node:path";

const ROOT = process.cwd();
// Prod default; overridable for isolated tests (never set in normal use).
const MANIFEST_URL = process.env.AIOS_MANIFEST_URL || "https://aios-skills.vercel.app/template";
const APPLY = process.argv.includes("--apply");
const CHECK = process.argv.includes("--check"); // version compare only; for the session-start nudge
const FORCE_DOWNGRADE = process.argv.includes("--force-downgrade");

// Hardcoded tripwire — directories that hold ONLY user data. No kernel file
// lives here, so a managed entry under these = a bug or a tampered manifest →
// refuse it, no matter what managed-files.json claims. (Lives in code, not in
// the fetched file, so a compromised manifest can't widen its own authority.)
const DENY_PREFIXES = ["areas/", "_inbox/"];

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
function safeRel(p) {
  if (!p || p.startsWith("/") || p.split(/[\\/]/).includes("..")) return false;
  const abs = resolve(ROOT, p);
  return abs === ROOT || abs.startsWith(ROOT + sep);
}
const cmpVer = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });

// 1. local manifest of what's managed
const mfPath = join(ROOT, "system", "managed-files.json");
if (!existsSync(mfPath)) {
  console.error("This doesn't look like an AIOS folder (no system/managed-files.json).");
  console.error("Run this from the root of your aios/ folder.");
  process.exit(1);
}
const mf = JSON.parse(readFileSync(mfPath, "utf8"));
const localVer = mf.aios_version;

// 2. fetch the latest template
let manifest;
try {
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(String(res.status));
  manifest = await res.json();
} catch {
  if (CHECK) process.exit(0); // best-effort: stay silent when offline so the session never blocks
  console.error("Could not reach the AIOS server. Check your connection and try again.");
  process.exit(1);
}
const newVer = manifest.version;

// --check: just compare versions and report one line (the session-start nudge). Never writes.
if (CHECK) {
  if (cmpVer(newVer, localVer) > 0) console.log(`AIOS update available: v${localVer} -> v${newVer}. Say "update aios" to apply.`);
  else console.log(`AIOS is up to date (v${localVer}).`);
  process.exit(0);
}
const fileMap = new Map(manifest.files.map((f) => [f.path, f.content]));

// 3. version / downgrade guard
if (cmpVer(newVer, localVer) < 0 && !FORCE_DOWNGRADE) {
  console.error(`Server version (${newVer}) is older than yours (${localVer}). Refusing downgrade.`);
  process.exit(1);
}
if (cmpVer(newVer, localVer) === 0) {
  console.log(`AIOS is already up to date (v${localVer}).`);
  process.exit(0);
}

// 4. plan — consider every path managed by EITHER the local manifest (the current
// baseline) OR the incoming one. Iterating the INCOMING list is what lets a
// newly-added kernel file (e.g. a new agent) actually be delivered — the old code
// iterated only the local list, so a brand-new managed file was never planned and
// silently never arrived. Conflict detection still uses the LOCAL baseline sha
// (what THIS install was shipped), so a file that legitimately changed upstream
// between versions is refreshed, not mistaken for a user edit. Each path is still
// individually safety-checked (deny-prefix, traversal, symlink) below.
const incomingMf = (() => {
  try { return JSON.parse(fileMap.get("system/managed-files.json") || "{}"); } catch { return {}; }
})();
const localBaseline = new Map((mf.managed || []).map((e) => [e.path, e.sha256]));
const managedPaths = [...new Set([
  ...(mf.managed || []).map((e) => e.path),
  ...(incomingMf.managed || []).map((e) => e.path),
])];

const refresh = [], conflicts = [], blocked = [], removed = [];
for (const p of managedPaths) {
  if (DENY_PREFIXES.some((d) => p.startsWith(d))) { blocked.push(`${p} (user-data area)`); continue; }
  if (!safeRel(p)) { blocked.push(`${p} (unsafe path)`); continue; }
  const abs = join(ROOT, p);
  if (existsSync(abs) && lstatSync(abs).isSymbolicLink()) { blocked.push(`${p} (symlink)`); continue; }
  const next = fileMap.get(p);
  if (next === undefined) {
    // No content shipped for this managed path. If WE had it locally, it was
    // dropped from the template → report it (never auto-delete). If it appears
    // ONLY in the incoming list with no shipped file, that's a malformed/tampered
    // manifest entry — ignore it (nothing to write, it was never ours to remove).
    if (localBaseline.has(p)) removed.push(p);
    continue;
  }
  if (!existsSync(abs)) { refresh.push({ p, abs, next, reason: "new" }); continue; }
  const localSha = sha(readFileSync(abs));
  if (sha(Buffer.from(next)) === localSha) continue; // identical — nothing to do
  const baseline = localBaseline.get(p);
  if (baseline && localSha === baseline) { refresh.push({ p, abs, next, reason: "update" }); continue; } // unedited → refresh
  conflicts.push({ p, abs, next }); // user-edited, or a pre-existing file at a newly-managed path → back up, overwrite on confirm
}

// 5. report (plain language)
console.log(`\nAIOS update: v${localVer} → v${newVer}\n`);
if (refresh.length) { console.log(`${refresh.length} system file(s) will be refreshed:`); refresh.forEach((r) => console.log(`  ~ ${r.p}`)); }
else console.log("No system files need refreshing.");
if (conflicts.length) { console.log(`\n${conflicts.length} file(s) YOU changed — will be backed up, then overwritten on --apply:`); conflicts.forEach((c) => console.log(`  ! ${c.p}`)); }
if (removed.length) { console.log(`\n${removed.length} file(s) are no longer part of AIOS (NOT deleted — remove manually if you want):`); removed.forEach((p) => console.log(`  - ${p}`)); }
if (blocked.length) { console.log(`\nBlocked for safety (never written):`); blocked.forEach((b) => console.log(`  x ${b}`)); }
console.log(`\nYour data — areas/, projects/, calendar/, knowledge/, network/, _inbox/ — is NOT touched.`);

if (!APPLY) { console.log(`\n(Preview only — nothing was written. Re-run with --apply to update.)\n`); process.exit(0); }

// 6. apply — backup, then write; version marker last; idempotent re-run
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(ROOT, ".aios-backup", stamp);
const toWrite = [...refresh, ...conflicts];
for (const w of toWrite) {
  if (existsSync(w.abs)) { const bdest = join(backupDir, w.p); mkdirSync(dirname(bdest), { recursive: true }); cpSync(w.abs, bdest); }
  mkdirSync(dirname(w.abs), { recursive: true });
  writeFileSync(w.abs, w.next);
}
// managed-files.json (carries the new version + baseline hashes) written LAST,
// so an interrupted run keeps the old version marker and is safely re-runnable.
const newMf = fileMap.get("system/managed-files.json");
if (newMf) { const b = join(backupDir, "system/managed-files.json"); mkdirSync(dirname(b), { recursive: true }); cpSync(mfPath, b); writeFileSync(mfPath, newMf); }
console.log(`\nDone — updated ${toWrite.length} file(s) to v${newVer}. Backups in .aios-backup/${stamp}/\n`);
