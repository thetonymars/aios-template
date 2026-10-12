#!/usr/bin/env node
// AIOS managed update. Refreshes ONLY the kernel files listed in
// system/managed-files.json, pulled from the live /template manifest.
// Never WRITES user data and never deletes it. Backs up every changed file.
// Dry-run by default — pass --apply to write.
//
// One exception, by design: the 0.7 layout migration MOVES areas/user and
// areas/business to the root (see "4a"), because the kernel it installs routes
// there. It copies both to the backup first and changes nothing inside them.
// The 0.8 business layout (see "2a") is the second: business.md MOVES into core/
// unchanged, and the files a business never had are created — never overwritten.
// The same release creates four files that belong to the customer from then on
// (see "2b") — once, if missing — and adds missing shared rows to their router.
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
    // The destination file is one the incoming manifest manages, so the source copy is
    // a superseded SYSTEM file — its replacement is already in place. Drop it: keeping
    // a renamed duplicate would litter the user's folder with our old plumbing. The
    // pre-move backup holds it, so nothing is unrecoverable.
    if (managedNow.has(`${to}/${name}`)) { stale.push({ s, rel, why: `replaced by ${to}/${name}` }); continue; }
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
  // best-effort: never block the session — but say so, because silence here was read as "up to date"
  if (CHECK) { console.log("AIOS update check could not reach the update server (no network access here). This is NOT the same as up to date."); process.exit(0); }
  console.error("Could not reach the AIOS server. Check your connection and try again.");
  process.exit(1);
}
const newVer = manifest.version;
const fileMap = new Map(manifest.files.map((f) => [f.path, f.content]));

// 2a. BUSINESS LAYOUT (0.8). A business used to be one file, business/<slug>/business.md.
// Now it is core/ (business.md · numbers.md · goals.md) plus a map, CONTEXT.md, and the
// kernel this update installs routes there. For every business still in the old shape,
// business.md MOVES into core/ byte for byte (a copy goes to the backup first) and the
// files it never had are CREATED — only where nothing is in the way. Nothing here ever
// overwrites or rewrites a file.
// This does not go through the managed list, and DENY_PREFIXES stays as it is: the paths
// are fixed in this code (a manifest cannot add one), and the text of the new files is
// read from the setup skill — the one place that owns those templates.
const BIZ_SETUP = "system/skills/setup/02_business/CONTEXT.md";
const BIZ_NEW = ["core/numbers.md", "core/goals.md", "CONTEXT.md"];
const there = (p) => { try { lstatSync(p); return true; } catch { return false; } };   // true for a symlink too
const plainFile = (p) => { try { return lstatSync(p).isFile(); } catch { return false; } };
const plainDir = (p) => { try { return lstatSync(p).isDirectory(); } catch { return false; } };

// The three templates, cut out of the setup skill by the heading that names each file
// (not by position, so reordering that file cannot make this write the wrong text).
// Anything unexpected → null, and no business folder is touched.
function bizTemplates() {
  let src = fileMap.get(BIZ_SETUP);
  if (src === undefined && plainFile(join(ROOT, BIZ_SETUP))) src = readFileSync(join(ROOT, BIZ_SETUP), "utf8");
  if (!src) return null;
  src = src.replace(/\r\n/g, "\n");
  const block = (file) => {
    const m = src.match(new RegExp("^###[^\\n]*`business/<slug>/" + file.replace(/\./g, "\\.") + "`[^\\n]*\\n[\\s\\S]*?^```\\n([\\s\\S]*?)\\n```$", "m"));
    return m ? m[1] + "\n" : "";
  };
  const t = { numbers: block("core/numbers.md"), goals: block("core/goals.md"), map: block("CONTEXT.md") };
  const tokens = (s) => s.replace(/\[(DATE|BUSINESS_NAME|CLOUD_ROW)\]/g, "");
  const shaped = t.numbers.startsWith("---\ntype: numbers\n") && t.goals.startsWith("---\ntype: goals\n") &&
    t.map.startsWith("# [BUSINESS_NAME]") && t.map.includes("\n[CLOUD_ROW]\n") &&
    ![t.numbers, t.goals, t.map].some((s) => /\[[A-Z][A-Z_]+\]/.test(tokens(s)));
  return shaped && bizMap(t.map, "", [], "x") ? t : null;
}

// The map of one business, from the template: folders that are already there go into
// "What lives here" (and leave "No folder yet"); a folder no table names goes under
// "Own to this business" as unknown — the assistant asks the user what it is.
function bizMap(tplMap, desc, folders, slug) {
  const body = desc.replace(/^---\n[\s\S]*?\n---\n/, "").split("\n");
  const name = (body.find((l) => /^# +\S/.test(l)) || "").replace(/^# +/, "").trim() || slug;
  const at = body.findIndex((l) => /^## Cloud storage\s*$/.test(l));
  const end = at < 0 ? -1 : body.findIndex((l, i) => i > at && /^## /.test(l));
  const cloud = at >= 0 && /[\p{L}\p{N}]/u.test(body.slice(at + 1, end < 0 ? undefined : end).join(" "));
  const cloudRow = cloud ? "| Cloud storage | the business's files | `core/business.md` › `## Cloud storage` |" : "| _(none yet)_ | | |";

  const L = tplMap.replace("[BUSINESS_NAME]", () => name).replace("[CLOUD_ROW]", () => cloudRow).split("\n");
  const lives = L.indexOf("## What lives here"), noYet = L.findIndex((l) => l.startsWith("No folder yet")),
    own = L.indexOf("## Own to this business"), sources = L.indexOf("## Sources");
  const none = L.findIndex((l, i) => i > own && i < sources && l.startsWith("| _(none yet)_"));
  if (!(0 <= lives && lives < noYet && noYet < own && own < none && none < sources)) return null;

  const cells = (l) => l.split("|").slice(1, -1).map((c) => c.trim());
  const folderOf = (l) => (cells(l)[1] || "").match(/^`([^`/]+)\//)?.[1];
  const known = [], unknown = [];
  for (const f of folders) (L.some((l, i) => i > noYet && i < own && l.startsWith("|") && folderOf(l) === f) ? known : unknown).push(f);

  // bottom-up, so the line numbers found above stay valid
  if (unknown.length) L.splice(none, 1, ...unknown.map((f) => `| \`${f.replace(/\|/g, "\\|")}/\` | unknown |`));
  const rows = [];
  for (const f of known) {
    const mine = L.map((l, i) => ({ l, i })).filter(({ l, i }) => i > noYet && i < own && l.startsWith("|") && folderOf(l) === f);
    const pairs = mine.map(({ l }) => cells(l));
    rows.push(pairs.length === 1
      ? `| \`${f}/\` | ${pairs[0][0]} | ${pairs[0][1]} |`
      : `| \`${f}/\` | ${pairs.length} kinds of fact, each with its own file | ${pairs.map(([about, goes]) => `${about} → ${goes}`).join(" · ")} |`);
    for (const { i } of mine.reverse()) L.splice(i, 1);
  }
  let last = lives; while (!L[last].startsWith("|")) last++; while (L[last + 1].startsWith("|")) last++;
  L.splice(last + 1, 0, ...rows);
  return L.join("\n");
}

// What each business folder needs. Looks in areas/business too: on a pre-0.7 install the
// folder move in 1a brings it to business/ in this same run, so the preview must count it.
function scanBusinesses() {
  const plans = [];
  for (const base of ["business", "areas/business"]) {
    if (!plainDir(join(ROOT, base))) continue;
    for (const slug of readdirSync(join(ROOT, base))) {
      if (slug.startsWith(".")) continue;
      const d = join(ROOT, base, slug), label = `business/${slug}`;
      if (!plainDir(d)) continue;
      const oldP = join(d, "business.md"), coreDir = join(d, "core"), coreP = join(coreDir, "business.md");
      const old = there(oldP), cur = there(coreDir) && plainDir(coreDir) && there(coreP);
      if ((old && !plainFile(oldP)) || (there(coreDir) && !plainDir(coreDir)) || (cur && !plainFile(coreP))) { plans.push({ label, odd: true }); continue; }
      if (!old && !cur) { if (there(join(d, ".business.md.icloud"))) plans.push({ label, evicted: true }); continue; }   // neither → not a business
      const twin = old && cur ? (sha(readFileSync(oldP)) === sha(readFileSync(coreP)) ? "same" : "differ") : null;
      plans.push({ label, slug, d, oldP, coreP, move: old && !cur, twin, create: BIZ_NEW.filter((rel) => !there(join(d, rel))) });
    }
  }
  return plans;
}
const bizTodo = (p) => p.evicted || p.move || p.twin === "same" || (p.create && p.create.length > 0);
const bizTpl = bizTemplates();
const bizPlans = scanBusinesses();
// Without the templates nothing can be finished, so nothing is called pending either —
// "pending" that an update cannot clear would nag the user at every session.
const bizPending = bizTpl ? bizPlans.filter(bizTodo) : [];

function bizReport(plans) {
  const work = plans.filter((p) => p.d && bizTodo(p));
  if (work.length) {
    console.log(`\nYour business folder(s) get the new layout:`);
    for (const p of work) {
      console.log(`  ${p.label}/`);
      if (p.move) console.log(`    → business.md  moves into  core/   (copied to the backup first — not a word in it changes)`);
      if (p.twin === "same") console.log(`    - business.md  is a second, identical copy of core/business.md — removed (a copy stays in the backup)`);
      if (p.create.length) console.log(`    + new: ${p.create.join(", ")}`);
    }
    console.log(`  Nothing else is deleted, and no file you already have is overwritten.`);
  }
  for (const p of plans) {
    if (p.twin === "differ") console.log(`\n${p.label}/ has TWO descriptions — business.md and core/business.md — and they differ. Both are left exactly as they are. Ask the user which one is current, bring what is missing into core/business.md, then delete business.md.`);
    if (p.evicted) console.log(`\n${p.label}/business.md is in iCloud and not on this computer, so it could not be moved. Open that folder once so the file downloads, then say "update aios" again.`);
    if (p.odd) console.log(`\n${p.label}/ was left exactly as it is: its business.md or core/ is a link, not a plain file or folder.`);
  }
}

function bizApply(p, tpl, backupDir) {
  if (p.move || p.twin === "same") { const b = join(backupDir, p.label, "business.md"); mkdirSync(dirname(b), { recursive: true }); cpSync(p.oldP, b); }
  if (p.move) { mkdirSync(dirname(p.coreP), { recursive: true }); renameSync(p.oldP, p.coreP); }
  if (p.twin === "same") rmSync(p.oldP);
  const desc = readFileSync(p.coreP, "utf8");
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const folders = readdirSync(p.d).filter((n) => !n.startsWith(".") && n !== "core" && plainDir(join(p.d, n))).sort();
  for (const rel of p.create) {
    const text = rel === "CONTEXT.md" ? bizMap(tpl.map, desc, folders, p.slug) : tpl[rel === "core/numbers.md" ? "numbers" : "goals"].replace("[DATE]", today);
    if (!text) continue;
    mkdirSync(dirname(join(p.d, rel)), { recursive: true });
    try { writeFileSync(join(p.d, rel), text, { flag: "wx" }); } catch {}   // wx = create only; something appeared meanwhile → theirs stays
  }
}

// 2b. FILES THAT ARE THE CUSTOMER'S (0.8). Four files ship in the template, are written
// at install, and from then on belong to the customer: the root router, the map of
// user/, the project registry, the index of their own skills. An install made before
// they existed gets each one ONCE, if it is missing. They are never refreshed — and a
// manifest that lists one as managed is refused below, so an update cannot overwrite a
// customer's router by a release mistake. Paths are fixed here; user/CONTEXT.md is the
// one file this script creates under user/.
const SEED = ["CONTEXT.md", "user/CONTEXT.md", "projects/_index.md", "system/skills/_index.md"];
const ROUTER = "CONTEXT.md";
function seedTodo(movesDone) {
  return SEED.filter((p) => {
    const text = fileMap.get(p), parent = dirname(join(ROOT, p));
    // a parent that a folder move in 1a is about to create counts in the preview (areas/user → user)
    const parentOk = plainDir(parent) || (!movesDone && !there(parent) && migrations.some((m) => m.to === dirname(p)));
    return typeof text === "string" && text.trim() && parentOk && !there(join(ROOT, p));
  });
}
// The registry for an install that already has projects: one row per project folder,
// as projects/CONTEXT.md tells an assistant to do when the file is missing.
function seedText(p) {
  let text = fileMap.get(p);
  if (p !== "projects/_index.md") return text;
  const rows = [];
  for (const stage of readdirSync(join(ROOT, "projects"))) {
    if (stage.startsWith(".") || !plainDir(join(ROOT, "projects", stage))) continue;
    for (const name of readdirSync(join(ROOT, "projects", stage))) {
      const m = plainDir(join(ROOT, "projects", stage, name)) && name.match(/^prj-p(\d{4})-(.+?)(?:-\d{6}){0,2}$/i);
      if (m) rows.push(`| P${m[1]} | ${m[2].replace(/\|/g, "\\|")} | here |`);
    }
  }
  if (!text.endsWith("\n")) text += "\n";
  return text + [...new Set(rows)].sort().map((r) => r + "\n").join("");
}

// The router is the customer's file, with one promise: a shared row that is missing
// gets ADDED at the end of its table. A row is "there" when some row of the customer's
// table sends to the same file (second column) — reworded rows are left alone, and no
// row is ever changed or removed.
function routerTable(text) {
  const L = text.split(/\r?\n/);
  let i = L.findIndex((l) => /^## Task Router\s*$/.test(l));
  if (i < 0) return null;
  for (i++; i < L.length && !L[i].startsWith("|"); i++) if (L[i].startsWith("#")) return null;
  if (i >= L.length - 1) return null;
  const start = i; while (i < L.length && L[i].startsWith("|")) i++;
  const rows = L.slice(start + 2, i).map((line) => ({ line, key: ((line.split("|")[2] || "").match(/`([^`]+)`/) || [])[1] }));
  return { header: L.slice(start, start + 2), rows, end: i };
}
function routesTodo() {
  const abs = join(ROOT, ROUTER), tplText = fileMap.get(ROUTER);
  if (typeof tplText !== "string" || !plainFile(abs)) return null;
  const shared = routerTable(tplText);
  if (!shared) return null;
  const text = readFileSync(abs, "utf8"), mine = routerTable(text);
  const have = new Set((mine ? mine.rows : []).map((r) => r.key));
  const add = shared.rows.filter((r) => r.key && !have.has(r.key));
  return add.length ? { abs, text, mine, shared, add } : null;
}
function routesApply(r, backupDir) {
  const eol = r.text.includes("\r\n") ? "\r\n" : "\n";
  const b = join(backupDir, ROUTER); mkdirSync(dirname(b), { recursive: true }); cpSync(r.abs, b);
  let out;
  if (r.mine) { const L = r.text.split(/\r?\n/); L.splice(r.mine.end, 0, ...r.add.map((a) => a.line)); out = L.join(eol); }
  // no router table in their file (their own notes, or an assistant's draft): add the section at the end
  else out = r.text.replace(/\s*$/, "") + eol + eol + ["## Task Router", "", ...r.shared.header, ...r.add.map((a) => a.line)].join(eol) + eol;
  writeFileSync(r.abs, out);
}
const seedPending = seedTodo(false);
const routePending = routesTodo();
const unfinished = [
  ...(bizPending.length ? [`the business folder layout (${bizPending.map((p) => p.label).join(", ")})`] : []),
  ...(seedPending.length ? [`new files (${seedPending.join(", ")})`] : []),
  ...(routePending ? [`${routePending.add.length} shared route(s) missing from ${ROUTER}`] : []),
];

// --check: just compare versions and report one line (the session-start nudge). Never writes.
if (CHECK) {
  if (cmpVer(newVer, localVer) > 0) console.log(`AIOS update available: v${localVer} -> v${newVer}. Say "update aios" to apply.`);
  else if (migrations.length) console.log(`AIOS has a pending folder move (${migrations.map((m) => m.from).join(", ")}). Say "update aios" to finish it.`);
  else if (unfinished.length) console.log(`AIOS has an unfinished update: ${unfinished.join("; ")}. Say "update aios" to finish it.`);
  else console.log(`AIOS is up to date (v${localVer}).`);
  process.exit(0);
}

// 3. version / downgrade guard
if (cmpVer(newVer, localVer) < 0 && !FORCE_DOWNGRADE) {
  console.error(`Server version (${newVer}) is older than yours (${localVer}). Refusing downgrade.`);
  process.exit(1);
}
if (cmpVer(newVer, localVer) === 0 && !migrations.length && !unfinished.length) {
  console.log(`AIOS is already up to date (v${localVer}).`);
  process.exit(0);
}
// Same version + a pending move = this script was delivered by the PREVIOUS run
// (the old updater could not run code it was still installing). Finish the job.
if (cmpVer(newVer, localVer) === 0) console.log(`\nAIOS v${localVer} — finishing what the last update started.`);

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
  if (SEED.includes(p)) { blocked.push(`${p} (yours — created once, never refreshed)`); continue; }
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
if (bizTpl) bizReport(bizPlans);
else if (bizPlans.some(bizTodo)) console.log(`\nBusiness folders are left exactly as they are: this update did not carry the templates for their new files.`);
if (seedPending.length) {
  console.log(`\n${seedPending.length} new file(s) for you — created once, yours from then on (no update changes them):`);
  seedPending.forEach((p) => console.log(`  + ${p}`));
}
if (routePending) {
  console.log(`\n${routePending.add.length} shared route(s) will be added at the end of the table in your ${ROUTER} (a copy goes to the backup first; no row of yours is changed or removed):`);
  routePending.add.forEach((a) => console.log(`  + ${a.key}`));
}
const stale = migrations.flatMap((m) => m.stale || []);
if (stale.length) {
  console.log(`\nOld system file(s) dropped after the move (copies stay in the backup):`);
  stale.forEach((t) => console.log(`  - ${t.rel} — ${t.why}`));
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

// Business layout — after the folder moves, so a business that just arrived from
// areas/business is found where it now sits. Scanned again here for the same reason.
if (bizTpl) for (const p of scanBusinesses().filter((p) => p.d && bizTodo(p))) {
  bizApply(p, bizTpl, backupDir);
  console.log(`${p.label}/ is in the new layout${p.move ? " — business.md moved into core/" : ""}${p.create.length ? ` — new: ${p.create.join(", ")}` : ""}`);
}

// The customer's own files — after the folder moves too (user/ may have just arrived).
for (const p of seedTodo(true)) {
  try { writeFileSync(join(ROOT, p), seedText(p), { flag: "wx" }); console.log(`created ${p}`); } catch {}   // wx = create only
}
const routesNow = routesTodo();
if (routesNow) { routesApply(routesNow, backupDir); console.log(`added ${routesNow.add.length} shared route(s) to ${ROUTER}`); }

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
