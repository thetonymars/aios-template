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
const MANIFEST_URL = "https://aios-skills.vercel.app/template";
const APPLY = process.argv.includes("--apply");
const FORCE_DOWNGRADE = process.argv.includes("--force-downgrade");

// Hardcoded tripwire — directories that hold ONLY user data. No kernel file
// lives here, so a managed entry under these = a bug or a tampered manifest →
// refuse it, no matter what managed-files.json claims. (Lives in code, not in
// the fetched file, so a compromised manifest can't widen its own authority.)
const DENY_PREFIXES = ["user/", "business/", "_inbox/"];

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
  console.error("Could not reach the AIOS server. Check your connection and try again.");
  process.exit(1);
}
const newVer = manifest.version;
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

// 4. plan — only exact whitelisted paths, each safety-checked
const refresh = [], conflicts = [], blocked = [], removed = [];
for (const entry of mf.managed) {
  const p = entry.path;
  if (DENY_PREFIXES.some((d) => p.startsWith(d))) { blocked.push(`${p} (user-data area)`); continue; }
  if (!safeRel(p)) { blocked.push(`${p} (unsafe path)`); continue; }
  const abs = join(ROOT, p);
  if (existsSync(abs) && lstatSync(abs).isSymbolicLink()) { blocked.push(`${p} (symlink)`); continue; }
  const next = fileMap.get(p);
  if (next === undefined) { removed.push(p); continue; } // gone from new template — never auto-delete
  if (!existsSync(abs)) { refresh.push({ p, abs, next, reason: "new" }); continue; }
  const local = readFileSync(abs);
  const localSha = sha(local);
  if (sha(Buffer.from(next)) === localSha) continue; // identical — nothing to do
  if (entry.sha256 && localSha !== entry.sha256) { conflicts.push({ p, abs, next }); continue; } // user-edited
  refresh.push({ p, abs, next, reason: "update" });
}

// 5. report (plain language)
console.log(`\nAIOS update: v${localVer} → v${newVer}\n`);
if (refresh.length) { console.log(`${refresh.length} system file(s) will be refreshed:`); refresh.forEach((r) => console.log(`  ~ ${r.p}`)); }
else console.log("No system files need refreshing.");
if (conflicts.length) { console.log(`\n${conflicts.length} file(s) YOU changed — will be backed up, then overwritten on --apply:`); conflicts.forEach((c) => console.log(`  ! ${c.p}`)); }
if (removed.length) { console.log(`\n${removed.length} file(s) are no longer part of AIOS (NOT deleted — remove manually if you want):`); removed.forEach((p) => console.log(`  - ${p}`)); }
if (blocked.length) { console.log(`\nBlocked for safety (never written):`); blocked.forEach((b) => console.log(`  x ${b}`)); }
console.log(`\nYour data — user/, business/, projects/, kb/, _inbox/ — is NOT touched.`);

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
