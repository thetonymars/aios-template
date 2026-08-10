#!/usr/bin/env node
// AIOS managed update. Refreshes ONLY the kernel files listed in
// system/managed-files.json, pulled from the live /template manifest.
// Never WRITES user data and never deletes it. Backs up every changed file.
// Dry-run by default — pass --apply to write.
//
// One exception, by design: the 0.7 layout migration MOVES areas/user and
// areas/business to the root (see "4a"), because the kernel it installs routes
// there. It copies both to the backup first and changes nothing inside them.
//
//   node system/update.mjs            # preview (safe, writes nothing)
//   node system/update.mjs --apply    # apply the update
//
// Run it from the root of your aios/ folder.
import { readFileSync, writeFileSync, mkdirSync, existsSync, lstatSync, cpSync, renameSync, readdirSync, rmdirSync, rmSync } from "node:fs";
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
const DENY_PREFIXES = ["user/", "business/", "areas/", "_inbox/"];
// Only folders that hold NOTHING but user data belong here. people/ · projects/ ·
// calendar/ · knowledge/ each ship a managed CONTEXT.md, so listing them would make
// the updater refuse to deliver their own router (caught by harness S17).
// "areas/" is the pre-0.7 name, kept so a half-migrated folder is still protected.

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

const blockedMoves = [];

// 1a. LAYOUT MIGRATIONS. When a folder is renamed in the template, the kernel we are
// about to write routes to the NEW name, so the user's data has to move with it or
// every path in the new AGENTS.md points at nothing. This is the ONE case where the
// updater touches user data — it MOVES, never deletes, and copies to the backup
// first. Each entry is skipped once its old folder is gone, so this list is
// self-clearing and safe to keep growing.
//   0.7.0  areas/user → user, areas/business → business
//   0.7.3  network → people (same folder, clearer name)
const RENAMES = [["areas/user", "user"], ["areas/business", "business"], ["network", "people"]];
const migrations = [];
for (const [from, to] of RENAMES) {
  const src = join(ROOT, from), dest = join(ROOT, to);
  if (!existsSync(src)) continue;
  if (lstatSync(src).isSymbolicLink()) { blockedMoves.push(`${from} (symlink)`); continue; }
  migrations.push({ from, to, src, dest, files: [] });
}

// Move the CONTENTS across, file by file, and never overwrite something already at
// the destination. A plain folder rename looks simpler but breaks on the real case:
// the run that delivers the new kernel also creates people/CONTEXT.md, so by the
// time the move runs the destination is no longer empty. Anything that would
// collide is left where it is and reported.
function planMove(src, dest, from, to, baseline, managedNow, out = [], stale = []) {
  for (const name of readdirSync(src)) {
    const s = join(src, name), d = join(dest, name);
    const rel = `${from}/${name}`;
    if (lstatSync(s).isSymbolicLink()) { blockedMoves.push(`${rel} (symlink)`); continue; }
    if (lstatSync(s).isDirectory()) { planMove(s, d, rel, `${to}/${name}`, baseline, managedNow, out, stale); continue; }
    if (!existsSync(d)) { out.push({ s, d }); continue; }
    // Something is already there. If the SOURCE copy is a kernel file we shipped and
    // the user never touched, it is our own leftover (the new kernel already put its
    // replacement at the destination) — drop it, don't cry collision. Anything else
    // is the user's, and the user's file always wins.
    const shipped = baseline.get(rel);
    if (shipped && sha(readFileSync(s)) === shipped) { stale.push({ s, rel, why: "unchanged since we shipped it" }); continue; }
    // The baseline only knows the CURRENT layout, and the run that delivered the new
    // kernel already rewrote it — so by the time the move runs, the old path is not in
    // it any more. Second signal: the destination file is one WE manage, which makes
    // the source copy a superseded router, not the user's note. The backup keeps it.
    if (managedNow.has(`${to}/${name}`)) {
      // The user may have written their OWN notes into that old system file. Deleting
      // it would be data loss, so it travels across under a name that cannot collide.
      const dot = name.lastIndexOf(".");
      const alt = dot > 0 ? `${name.slice(0, dot)} (old copy)${name.slice(dot)}` : `${name} (old copy)`;
      const altPath = join(dest, alt);
      if (!existsSync(altPath)) { out.push({ s, d: altPath, renamedTo: `${to}/${alt}` }); continue; }
      blockedMoves.push(`${rel} (both ${to}/${name} and ${to}/${alt} are taken)`);
      continue;
    }
    blockedMoves.push(`${rel} (a file of that name is already in ${to}/)`);
  }
  return { out, stale };
}

// Drop any directory the move emptied, deepest first. Never recursive-deletes.
function pruneEmpty(dir) {
  if (!existsSync(dir)) return true;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (lstatSync(p).isDirectory()) pruneEmpty(p);
  }
  const left = readdirSync(dir).filter((n) => n !== ".DS_Store");
  if (left.length) return false;
  try { for (const n of readdirSync(dir)) rmSync(join(dir, n), { force: true }); rmdirSync(dir); return true; }
  catch { return false; }
}

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
  else if (migrations.length) console.log(`AIOS has a pending folder move (${migrations.map((m) => m.from).join(", ")}). Say "update aios" to finish it.`);
  else console.log(`AIOS is up to date (v${localVer}).`);
  process.exit(0);
}
const fileMap = new Map(manifest.files.map((f) => [f.path, f.content]));

// 3. version / downgrade guard
if (cmpVer(newVer, localVer) < 0 && !FORCE_DOWNGRADE) {
  console.error(`Server version (${newVer}) is older than yours (${localVer}). Refusing downgrade.`);
  process.exit(1);
}
if (cmpVer(newVer, localVer) === 0 && !migrations.length) {
  console.log(`AIOS is already up to date (v${localVer}).`);
  process.exit(0);
}
// Same version + a pending move = this script was delivered by the PREVIOUS run
// (the old updater could not run code it was still installing). Finish the job.
if (cmpVer(newVer, localVer) === 0) console.log(`\nAIOS v${localVer} — finishing the folder move started by the last update.`);

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

// File-level move plan. Runs here, not at apply time, for two reasons: it needs the
// baseline hashes built just above, and a collision found later would print after the
// summary the user reads before confirming.
const managedNow = new Set((incomingMf.managed || []).map((e) => e.path));
for (const m of migrations) {
  const { out, stale } = planMove(m.src, m.dest, m.from, m.to, localBaseline, managedNow);
  m.files = out; m.stale = stale;
}

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
    // A path whose folder is being renamed has not been dropped — it moved. Saying
    // "no longer part of AIOS" about it would be wrong and alarming.
    const beingRenamed = migrations.some((m) => p === m.from || p.startsWith(m.from + "/"));
    if (localBaseline.has(p) && !beingRenamed) removed.push(p);
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
if (migrations.length) {
  console.log(`\nYour folders will be MOVED to the new layout (copied to the backup first):`);
  migrations.forEach((m) => console.log(`  → ${m.from}/  becomes  ${m.to}/   (${m.files.length} file(s))`));
  console.log(`  Nothing inside them changes — only where the folder sits.`);
}
if (blockedMoves.length) { console.log(`\nCould not move (left exactly as-is, do it by hand):`); blockedMoves.forEach((b) => console.log(`  x ${b}`)); }
const stale = migrations.flatMap((m) => m.stale || []);
if (stale.length) {
  console.log(`\nOld system file(s) dropped after the move (copies stay in the backup):`);
  stale.forEach((t) => console.log(`  - ${t.rel} — ${t.why}`));
}
const renamedAcross = migrations.flatMap((m) => (m.files || []).filter((f) => f.renamedTo));
if (renamedAcross.length) {
  console.log(`\nKept under a new name (a system file of that name already exists there):`);
  renamedAcross.forEach((f) => console.log(`  → ${f.renamedTo}`));
}
console.log(`\nThe CONTENT of your data — ${migrations.length ? "the moved folders, " : ""}projects/, calendar/, knowledge/, people/, _inbox/ — is NOT changed.`);

if (!APPLY) { console.log(`\n(Preview only — nothing was written. Re-run with --apply to update.)\n`); process.exit(0); }

// 6. apply — backup, then write; version marker last; idempotent re-run
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = join(ROOT, ".aios-backup", stamp);

// Move first: the kernel written below routes to the new locations.
for (const m of migrations) {
  const bdest = join(backupDir, m.from);
  mkdirSync(dirname(bdest), { recursive: true });
  cpSync(m.src, bdest, { recursive: true });   // full copy in the backup before moving
  for (const f of m.files) { mkdirSync(dirname(f.d), { recursive: true }); renameSync(f.s, f.d); }
  for (const t of m.stale) { try { rmSync(t.s, { force: true }); } catch {} }   // our own superseded copy
  const gone = pruneEmpty(m.src);
  console.log(`moved ${m.from}/ → ${m.to}/ (${m.files.length} file(s))${gone ? "" : ` — ${m.from}/ kept, something is still in it`}`);
}
// areas/ is only a parent: once its children moved out it has nothing of its own.
if (migrations.some((m) => m.from.startsWith("areas/"))) {
  const areasDir = join(ROOT, "areas");
  if (existsSync(areasDir) && pruneEmpty(areasDir)) console.log("removed the now-empty areas/");
}

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
console.log(`\nDone — updated ${toWrite.length} file(s) to v${newVer}. Backups in .aios-backup/${stamp}/`);

// If this run replaced the updater itself, the NEW version's work (e.g. a folder
// move) could not run here — the old code was already in memory. Say so loudly:
// "Done" on its own has been read as "finished" when it was not.
if (toWrite.some((w) => w.p === "system/update.mjs")) {
  console.log(`\nNOT FINISHED YET — this update replaced update.mjs itself, so anything the`);
  console.log(`new version adds has not run. Run "node system/update.mjs --check" now and`);
  console.log(`follow what it says before calling this done.`);
}
console.log("");
