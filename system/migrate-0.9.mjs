// AIOS migration 0.8 → 0.9. Called by system/update.mjs; never run on its own.
//
// It moves the customer's settings into the 0.9 layout, on this disk only (no network):
//   SOUL.md (created, or a block added at its end) · user/user.md (three point edits) ·
//   user/CONTEXT.md and business/<slug>/CONTEXT.md (the new maps) · business/<slug>/offers/CONTEXT.md ·
//   business/<slug>/core/business.md (a block added at its end) · .gitignore (one line).
// Every other path is never opened for writing. The list is fixed in this code (ALLOWED below);
// a manifest cannot widen it.
//
// Order: copy every file it will change to .aios-backup/<time>-migrate-0.9/, then move the
// customer's own lines, then replace. Each action is written to system/.aios-migration.json
// with its fingerprint before and after, so a run that was cut off continues where it stopped
// and a second run changes nothing. Old files are deleted only after the customer says yes
// (--delete-old=all|none|<list>). --restore puts 0.8.3 back from the backups.
//
// Interface (used by update.mjs):
//   export async function run({ root, apply, deleteOld, restore, check })
//     → { needed, status, lines, pendingDeletions }
//   export function needsMigration(root) → boolean
// Test-only: AIOS_MIGRATE_STOP_AFTER=S3 stops the process right after step S3 (never set in normal use).
import { readFileSync, writeFileSync, lstatSync, readdirSync, mkdirSync, renameSync, rmSync, rmdirSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, basename, resolve } from "node:path";

export const MODULE_VERSION = "0.9.0";
export const STATE_REL = "system/.aios-migration.json";
export const BASE_REL = "system/migrate-0.9-base.json";
export const TEMPLATES_DIR = "system/skills/setup/templates";
export const PERSONAS = ["assistant", "ceo", "finance", "it", "legal", "marketer", "pm", "product", "researcher", "sales"];
export const DELETE_CANDIDATES = ["CLAUDE.md", "GEMINI.md", "system/offers.md",
  ...PERSONAS.map((p) => `system/agents/${p}/AGENT.md`), "CONTEXT.md"];
export const NOT_FINISHED = "AIOS update is NOT finished. Tell the person in this reply, in their language: \"The AIOS update is not finished yet — say “update aios”.\" If you are running “update aios” right now: run `node system/update.mjs --apply` again. Never delete or move a file by hand: the update asks about old files itself.";
const HEADING = "Moved here by the 0.9 update — check";
// Folders of a business that have a system map of their own (D48). The map is created when the folder
// exists without one; a map that exists is replaced, and its own lines go to <folder>/<folder>.md first.
const SUBMAPS = ["products", "markets", "channels", "data", "brand"];
const STEPS = ["S1-backup", "S2-collect", "S3-soul", "S4-user", "S5-user-map", "S6-business", "S7-gitignore", "S8-deletions"];
const TMP = ".aios-migrate.tmp";
const LOCK_MS = 10 * 60 * 1000;
const SECRETS_LINE = "system/.secrets/";
const FIELD_TOKENS = { "Tone": "TONE", "Length": "LENGTH", "What bugs me in AI replies": "BUGS_LIST" };
const IDENTITY_TOKENS = { "Address me as": "DISPLAY_NAME", "Language": "LANGUAGE" };

// ---------- small helpers ----------
const sha = (b) => createHash("sha256").update(b).digest("hex");
const normWhole = (s) => s.replace(/^﻿/, "").replace(/\r\n/g, "\n");   // same as gen-migrate-base.mjs
const normLine = (l) => l.replace(/^﻿/, "").replace(/\r$/, "").replace(/\s+$/, "");
const lineSha = (l) => sha(normLine(l)).slice(0, 16);
const lst = (p) => { try { return lstatSync(p); } catch { return null; } };
const isFile = (p) => !!lst(p)?.isFile();
const isDir = (p) => !!lst(p)?.isDirectory();
const there = (p) => !!lst(p);
const readBuf = (p) => (isFile(p) ? readFileSync(p) : null);
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");
const cmpVer = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true });
const range = (a, b) => (a === b ? `${a}` : `${a}-${b}`);
const rangeText = (r) => (r.includes("-") ? `lines ${r.replace("-", "–")}` : `line ${r}`);
const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isRow = (l) => l.trim().startsWith("|");
const isSep = (l) => /^\s*\|[\s:|-]+\|?\s*$/.test(l) && l.includes("-");

function decode(buf) {
  let s = buf.toString("utf8");
  const bom = s.startsWith("﻿");
  if (bom) s = s.slice(1);
  return { bom, eol: s.includes("\r\n") ? "\r\n" : "\n", text: s.replace(/\r\n/g, "\n") };
}
const encode = (meta, text) => Buffer.from((meta.bom ? "﻿" : "") + (meta.eol === "\n" ? text : text.replace(/\n/g, meta.eol)), "utf8");
function writeAtomic(p, buf) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p + TMP, buf);
  renameSync(p + TMP, p);
}
function appendBlock(text, block) {
  const head = text.replace(/\n*$/, "");
  return (head ? head + "\n\n" : "") + block.join("\n") + "\n";
}
function headingOf(text) {
  const body = normWhole(text).replace(/^---\n[\s\S]*?\n---\n/, "");
  const m = body.match(/^# +(.+?)\s*$/m);
  return m ? m[1].trim() : "";
}

// ---------- context ----------
function ctx(root) {
  const R = resolve(root);
  const C = { root: R, lines: [], notes: [] };
  C.abs = (rel) => join(R, ...rel.split("/"));
  C.evicted = (rel) => { const a = C.abs(rel); return !there(a) && there(join(dirname(a), "." + basename(a) + ".icloud")); };
  return C;
}

function loadState(C) {
  const b = readBuf(C.abs(STATE_REL));
  if (!b) return null;
  try { return JSON.parse(b.toString("utf8")); }
  catch { throw new Error(`${STATE_REL} is damaged (not valid JSON). Nothing was changed. Contact support.`); }
}
function saveState(C) { writeAtomic(C.abs(STATE_REL), Buffer.from(JSON.stringify(C.st, null, 2) + "\n")); }
const log = (C, msg) => { C.st.log.push(`${nowIso()} ${msg}`); };

function readMf(p) { const b = readBuf(p); if (!b) return null; try { return JSON.parse(b.toString("utf8")); } catch { return null; } }
const kernelNow = (C) => new Set(((readMf(C.abs("system/managed-files.json")) || {}).managed || []).map((e) => e.path));
const deleteList = (C) => { const k = kernelNow(C); return DELETE_CANDIDATES.filter((p) => !k.has(p)); };

function loadBase(C) {
  const b = readBuf(C.abs(BASE_REL));
  if (!b) return null;
  let j; try { j = JSON.parse(b.toString("utf8")); } catch { return null; }
  if (j.schema !== 1 || !j.files) return null;
  const files = {};
  for (const [k, f] of Object.entries(j.files)) files[k] = { whole: new Set(f.whole), lines: new Set(f.lines) };
  return { files, pairs: j.pairs || {} };
}

function readTemplates(C) {
  const names = { soul: "soul.md", userMap: "user-map.md", bizMap: "business-map.md", offersMap: "offers-map.md" };
  const t = {};
  for (const [k, n] of Object.entries(names)) {
    const rel = `${TEMPLATES_DIR}/${n}`, b = readBuf(C.abs(rel));
    if (!b || !b.toString("utf8").trim()) return { error: rel };
    t[k] = b;
  }
  if (!/^## The person you work with\s*$/m.test(normWhole(t.soul.toString("utf8")))) return { error: `${TEMPLATES_DIR}/soul.md` };
  for (const [k, n] of [["userMap", "user-map.md"], ["bizMap", "business-map.md"], ["offersMap", "offers-map.md"]])
    if (/\[[A-Z][A-Z_]+\]/.test(t[k].toString("utf8"))) return { error: `${TEMPLATES_DIR}/${n}` };
  t.sub = {};
  for (const f of SUBMAPS) {   // optional: a missing one only skips that folder's map
    const b = readBuf(C.abs(`${TEMPLATES_DIR}/${f}-map.md`));
    if (b && b.toString("utf8").trim() && !/\[[A-Z][A-Z_]+\]/.test(b.toString("utf8"))) t.sub[f] = b;
  }
  return { tpl: t };
}

// ---------- backups of the first run (the old updater) ----------
// prev = the newest .aios-backup/<time>/ holding system/managed-files.json of 0.8.x, plus the
// backups right before it that hold no managed-files.json (a run 1 that was cut off and repeated).
// A file is looked up oldest first, so the text from before the 0.9 kernel wins.
function findPrev(C) {
  const base = C.abs(".aios-backup");
  if (!isDir(base)) return null;
  const dirs = readdirSync(base).filter((n) => !n.startsWith(".") && !/-migrate-0\.9$|-restore$/.test(n) && isDir(join(base, n))).sort();
  const mfVer = (d) => (readMf(join(base, d, "system", "managed-files.json")) || {}).aios_version;
  const localVer = (readMf(C.abs("system/managed-files.json")) || {}).aios_version || "";
  let end = -1;
  if (/^0\.8\./.test(localVer)) {
    // managed-files.json was never replaced: run 1 was cut off. Its backups are the newest dirs without one.
    end = dirs.length - 1;
    if (end < 0 || mfVer(dirs[end]) !== undefined) return null;
  } else {
    for (let i = dirs.length - 1; i >= 0; i--) if (/^0\.8\./.test(mfVer(dirs[i]) || "")) { end = i; break; }
    if (end < 0) return null;
  }
  const set = [dirs[end]];
  for (let j = end - 1; j >= 0 && mfVer(dirs[j]) === undefined; j--) set.unshift(dirs[j]);
  return set.map((d) => `.aios-backup/${d}`);
}
function prevLookup(C, prev, rel) {
  for (const d of prev || []) { const p = C.abs(`${d}/${rel}`); if (isFile(p)) return { rel: `${d}/${rel}`, buf: readFileSync(p) }; }
  return null;
}
function prevMf(C, prev) {
  if (!prev) return null;
  const f = prevLookup(C, [prev[prev.length - 1]], "system/managed-files.json") || prevLookup(C, prev, "system/managed-files.json");
  if (f) { try { return JSON.parse(f.buf.toString("utf8")); } catch { return null; } }
  const local = readMf(C.abs("system/managed-files.json"));
  return local && /^0\.8\./.test(local.aios_version || "") ? local : null;
}

// ---------- businesses ----------
function scanBusinesses(C) {
  const out = [], bdir = C.abs("business");
  if (!isDir(bdir)) return out;
  for (const slug of readdirSync(bdir).sort()) {
    if (slug.startsWith(".")) continue;
    const s = lst(join(bdir, slug));
    if (!s) continue;
    if (s.isSymbolicLink()) { C.notes.push(`business/${slug}/ was skipped: it is a link, not a folder.`); continue; }
    if (!s.isDirectory()) continue;
    const coreDir = lst(C.abs(`business/${slug}/core`));
    const coreRel = `business/${slug}/core/business.md`, cs = lst(C.abs(coreRel));
    if (C.evicted(coreRel)) { out.push({ slug, evicted: true }); continue; }
    if (!cs || !coreDir?.isDirectory()) { C.notes.push(`business/${slug}/ was skipped: it has no core/business.md.`); continue; }
    if (!cs.isFile()) { C.notes.push(`business/${slug}/ was skipped: its core/business.md is a link, not a plain file.`); continue; }
    const name = headingOf(readFileSync(C.abs(coreRel), "utf8"));
    const os = lst(C.abs(`business/${slug}/offers`));
    let offers;
    if (!os) offers = "create-dir";
    else if (!os.isDirectory()) { offers = "skip"; C.notes.push(`business/${slug}/offers is a link or a file: its offers map was not written.`); }
    else { const m = lst(C.abs(`business/${slug}/offers/CONTEXT.md`)); offers = !m ? "create" : m.isFile() ? "replace" : "skip"; }
    const ms = lst(C.abs(`business/${slug}/CONTEXT.md`));
    const map = !ms ? "create" : ms.isFile() ? "replace" : "skip";
    if (map === "skip") C.notes.push(`business/${slug}/CONTEXT.md is a link: the map was not replaced.`);
    const subs = {};
    for (const f of SUBMAPS) {
      const ds = lst(C.abs(`business/${slug}/${f}`));
      if (!ds || !ds.isDirectory()) continue;                 // no folder (or a link) → no map; it comes with the first file
      const ms2 = lst(C.abs(`business/${slug}/${f}/CONTEXT.md`));
      subs[f] = !ms2 ? "create" : ms2.isFile() ? "replace" : "skip";
    }
    out.push({ slug, name, offers, map, subs });
  }
  return out;
}

// ---------- does this folder need the move? ----------
function signs(C) {
  const s = [];
  if (isFile(C.abs("CONTEXT.md"))) s.push("CONTEXT.md");
  for (const p of deleteList(C)) if (p !== "CONTEXT.md" && there(C.abs(p))) { s.push(p); break; }
  const u = readBuf(C.abs("user/user.md"));
  if (u && /^## How to respond to me\s*$/m.test(normWhole(u.toString("utf8")))) s.push("user/user.md › How to respond to me");
  const bdir = C.abs("business");
  if (isDir(bdir)) for (const slug of readdirSync(bdir)) {
    if (slug.startsWith(".") || !isDir(join(bdir, slug)) || !isFile(join(bdir, slug, "core", "business.md"))) continue;
    if (!there(join(bdir, slug, "offers", "CONTEXT.md"))) { s.push(`business/${slug} without offers/CONTEXT.md`); break; }
  }
  if (findPrev(C)) s.push("a backup of 0.8.x");
  return s;
}

export function needsMigration(root) {
  const C = ctx(root);
  let st; try { st = loadState(C); } catch { return true; }
  if (st) return st.status === "running";
  return signs(C).length > 0;
}

// ---------- finding the customer's own lines (4.4, 4.6) ----------
function clientGroups(text, lineSet) {
  const L = text.replace(/\n$/, "").split("\n");
  const cls = L.map((l) => (!normLine(l) ? "b" : lineSet.has(lineSha(l)) ? "t" : "c"));
  const groups = [];
  let cur = null;
  for (let i = 0; i < L.length; i++) {
    if (cls[i] === "c") { if (cur) cur.end = i; else cur = { start: i, end: i }; }
    else if (cls[i] === "t") { if (cur) groups.push(cur); cur = null; }
  }
  if (cur) groups.push(cur);
  // a group made only of table rows: each row is its own fact (a route), routed on its own
  const split = groups.flatMap((g) => {
    const idx = []; for (let i = g.start; i <= g.end; i++) if (normLine(L[i])) idx.push(i);
    return idx.length > 1 && idx.every((i) => isRow(L[i])) ? idx.map((i) => ({ start: i, end: i })) : [g];
  });
  return split.map((g) => ({ ...g, L, text: L.slice(g.start, g.end + 1).join("\n"), heading: headingAbove(L, g.start) }));
}
function headingAbove(L, i) { for (let j = i - 1; j >= 0; j--) if (/^#{1,6}\s/.test(L[j])) return L[j].trim(); return null; }
function tableHeader(L, i) {
  if (!isRow(L[i])) return null;
  let k = i; while (k > 0 && isRow(L[k - 1])) k--;
  return k + 1 < i && isSep(L[k + 1]) ? [L[k], L[k + 1]] : null;
}
function derived(c, pairLists) {
  if (c.length !== 3) return false;
  const folder = (c[0].match(/^`([^`/]+)\/`$/) || [])[1];
  if (!folder) return false;
  const folderOf = (goes) => (goes.match(/^`([^`/]+)\//) || [])[1];
  for (const list of pairLists) {
    if (list.some(([a, g]) => a === c[1] && g === c[2] && folderOf(g) === folder)) return true;
    const mine = list.filter(([, g]) => folderOf(g) === folder);
    if (mine.length > 1 && c[1] === `${mine.length} kinds of fact, each with its own file` &&
      c[2] === mine.map(([a, g]) => `${a} → ${g}`).join(" · ")) return true;
  }
  return false;
}
function classifyMap(text, info, pairLists, biz) {
  const L = normWhole(text).replace(/\n$/, "").split("\n");
  const res = { name: null, sources: [], sourcesHeader: null, own: [], ownHeader: null, other: [] };
  let section = null;
  const other = [];
  for (let i = 0; i < L.length; i++) {
    const l = L[i];
    if (/^## /.test(l)) section = l.slice(3).trim();
    if (!normLine(l) || info.lines.has(lineSha(l))) continue;
    const m = biz && l.match(/^# +(.+?) — business map\s*$/);
    if (m) { if (m[1].trim() !== biz.name) res.name = m[1].trim(); continue; }
    const c = isRow(l) ? cells(l) : null;
    if (c && /^_\(none yet\)_$/.test(c[0])) continue;
    if (c && section === "What lives here" && derived(c, pairLists)) continue;
    if (biz && c && section === "Sources") {
      // the row update.mjs 0.8 wrote points back at core/business.md itself — the fact is already there
      if (c[0] === "Cloud storage" && c[2] === "`core/business.md` › `## Cloud storage`") continue;
      res.sources.push(l); res.sourcesHeader ||= tableHeader(L, i); continue;
    }
    if (biz && c && section === "Own to this business") { res.own.push(l); res.ownHeader ||= tableHeader(L, i); continue; }
    other.push(i);
  }
  // neighbouring lines (blank lines between them too) make one group
  for (const i of other) {
    const g = res.other[res.other.length - 1];
    if (g && L.slice(g.end + 1, i).every((x) => !normLine(x))) g.end = i;
    else res.other.push({ start: i, end: i });
  }
  res.other = res.other.map((g) => ({ ...g, text: L.slice(g.start, g.end + 1).join("\n"), header: tableHeader(L, g.start), heading: headingAbove(L, g.start) }));
  return res;
}
function route(text, businesses) {
  const hits = new Set(), low = text.toLowerCase();
  for (const b of businesses) {
    if (new RegExp(`business/${b.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_-])`).test(text)) hits.add(b.slug);
    if (b.name && b.name.length >= 4 && low.includes(b.name.toLowerCase())) hits.add(b.slug);
  }
  return hits.size === 1 ? [...hits][0] : null;
}
function parseUser(buf) {
  const { text } = decode(buf);
  const L = text.replace(/\n$/, "").split("\n");
  const sec = (re) => { const h = L.findIndex((l) => re.test(l)); if (h < 0) return null; let e = L.findIndex((l, i) => i > h && /^## /.test(l)); if (e < 0) e = L.length; return { h, e }; };
  const out = { fields: {}, respond: null, respondLines: [], identity: [], identityLines: [], extra: [] };
  const field = (l) => l.match(/^\s*[-*]\s*\*\*(.+?):\*\*\s*(.*?)\s*$/);
  const r = sec(/^## How to respond to me\s*$/);
  if (r) {
    out.respond = [r.h, r.e];
    const body = []; for (let i = r.h + 1; i < r.e; i++) body.push(i);
    while (body.length && !normLine(L[body[0]])) body.shift();
    while (body.length && !normLine(L[body[body.length - 1]])) body.pop();
    out.respondLines = body.map((i) => L[i]);
    let g = null;
    for (const i of body) {
      const m = field(L[i]);
      if (m && FIELD_TOKENS[m[1]]) { out.fields[FIELD_TOKENS[m[1]]] = m[2]; if (g) { out.extra.push(g); g = null; } continue; }
      if (!normLine(L[i])) continue;
      if (g && L.slice(g.end + 1, i).every((x) => !normLine(x))) g.end = i; else { if (g) out.extra.push(g); g = { start: i, end: i }; }
    }
    if (g) out.extra.push(g);
    out.extra = out.extra.map((x) => ({ ...x, text: L.slice(x.start, x.end + 1).join("\n") }));
  }
  const id = sec(/^## Identity\s*$/);
  if (id) for (let i = id.h + 1; i < id.e; i++) {
    const m = field(L[i]);
    if (m && IDENTITY_TOKENS[m[1]]) { out.fields[IDENTITY_TOKENS[m[1]]] = m[2]; out.identity.push(i); out.identityLines.push(L[i]); }
  }
  return out;
}

// ---------- S2: collect (pure; reads the backup copies) ----------
function collect(C, businesses) {
  const { base } = C;
  const additions = [];
  const add = (a) => additions.push({ id: `A${additions.length + 1}`, ...a });
  const target = (slug) => (slug ? `business/${slug}/core/business.md` : "SOUL.md");

  const userBuf = C.readOrig("user/user.md");
  const person = userBuf ? parseUser(userBuf) : { fields: {}, respondLines: [], identityLines: [], extra: [] };
  for (const g of person.extra) add({ source: "user/user.md", source_backup: C.origRel("user/user.md"), lines: range(g.start + 1, g.end + 1),
    after_heading: "## How to respond to me", text: g.text, header: null, kind: "respond", target: "SOUL.md", reason: "own line under How to respond to me → a rule of the person" });

  const sources = [["AGENTS.md", C.prev ? prevLookup(C, C.prev, "AGENTS.md") : null], ...["CONTEXT.md", "CLAUDE.md", "GEMINI.md", "system/offers.md",
    ...PERSONAS.map((p) => `system/agents/${p}/AGENT.md`)].map((rel) => [rel, C.readOrig(rel) ? { rel: C.origRel(rel), buf: C.readOrig(rel) } : null])];
  for (const [rel, f] of sources) {
    if (!f) { if (rel === "AGENTS.md") C.notes.push("The old AGENTS.md was not found in .aios-backup/: lines you may have added to it were not checked."); continue; }
    const info = base.files[rel];
    if (!info) continue;
    const text = normWhole(f.buf.toString("utf8"));
    if (info.whole.has(sha(text))) continue;
    for (const g of clientGroups(text, info.lines)) {
      const slug = route(g.text, businesses);
      add({ source: rel, source_backup: f.rel, lines: range(g.start + 1, g.end + 1), after_heading: g.heading, text: g.text,
        header: rel === "CONTEXT.md" ? tableHeader(g.L, g.start) : null, kind: "rule", target: target(slug),
        reason: slug ? `names business/${slug} → that business` : "names no single business → a rule of the person" });
    }
  }

  const um = C.readOrig("user/CONTEXT.md");
  if (um && base.files["user/CONTEXT.md"]) {
    const r = classifyMap(um.toString("utf8"), base.files["user/CONTEXT.md"], base.pairs["user/CONTEXT.md"] || [], null);
    for (const g of r.other) add({ source: "user/CONTEXT.md", source_backup: C.origRel("user/CONTEXT.md"), lines: range(g.start + 1, g.end + 1),
      after_heading: g.heading, text: g.text, header: g.header, kind: "user-map", target: "user/user.md", reason: "own line of the old map of user/ (D47, question 2)" });
  }

  const key = "business/<slug>/CONTEXT.md";
  for (const b of businesses) {
    const mapRel = `business/${b.slug}/CONTEXT.md`, core = target(b.slug);
    const mb = b.map === "replace" ? C.readOrig(mapRel) : null;
    if (mb && base.files[key]) {
      const r = classifyMap(mb.toString("utf8"), base.files[key], base.pairs[key] || [], b);
      const common = { source: mapRel, source_backup: C.origRel(mapRel), target: core };
      if (r.name) add({ ...common, lines: "1", after_heading: null, text: `- Name in the old map: ${r.name}`, header: null, kind: "name", reason: "the old map named the business differently" });
      if (r.sources.length) add({ ...common, lines: null, after_heading: "## Sources", text: r.sources.join("\n"), header: r.sourcesHeader || ["| Source | What it holds | How to reach it |", "|---|---|---|"], kind: "sources", reason: "a source of this business (cloud, CRM, payments) → core/business.md" });
      if (r.own.length) add({ ...common, lines: null, after_heading: "## Own to this business", text: r.own.join("\n"), header: r.ownHeader || ["| Folder | What |", "|---|---|"], kind: "own", reason: "a folder only this business has → core/business.md" });
      for (const g of r.other) add({ ...common, lines: range(g.start + 1, g.end + 1), after_heading: g.heading, text: g.text, header: g.header, kind: "other", reason: "own line of the old business map" });
    }
    if (b.offers === "replace") {
      const rel = `business/${b.slug}/offers/CONTEXT.md`, ob = C.readOrig(rel);
      if (ob && sha(ob) !== sha(C.tpl.offersMap)) {
        const t = normWhole(ob.toString("utf8")).replace(/\s+$/, "");
        if (t) add({ source: rel, source_backup: C.origRel(rel), lines: range(1, t.split("\n").length), after_heading: null, text: t, header: null, kind: "offers-map", target: core, reason: "a self-made offers map → core/business.md; the system map takes its place" });
      }
    }
  }
  return { additions, person: { fields: person.fields, respondLines: person.respondLines, identityLines: person.identityLines } };
}

// ---------- rendering the blocks ----------
const comment = (a) => `<!-- from ${a.source}${a.lines ? `, ${rangeText(a.lines)}` : ""} -->`;
// A heading inside moved text (a customer's "## My rules") would open a new section of the target file
// and push the rest out of the block. Moved text keeps its words; its headings drop to level 4.
const demote = (s) => s.replace(/^#{1,3}(?=\s)/gm, "####");
function entry(a, withComment = true) { return [...(withComment ? [comment(a)] : []), ...(a.header || []), demote(a.text)]; }
function soulEntries(C) {
  const out = [];
  for (const a of C.st.additions.filter((x) => x.target === "SOUL.md")) out.push("", ...entry(a));
  return out;
}
function bizBlock(C, slug) {
  // Sources and Own to this business are sections of core/business.md itself (coordinator, 2026-11-07):
  // the new business map points at them. Everything else that moved goes to the block.
  const adds = C.st.additions.filter((a) => a.target === `business/${slug}/core/business.md` && a.kind !== "sources" && a.kind !== "own");
  if (!adds.length) return null;
  const srcs = [...new Set(adds.map((a) => a.source))];
  const B = [`## ${HEADING}`, `<!-- from ${srcs.join(" and ")}; old files: ${C.st.backup}/ -->`];
  const of = (k) => adds.filter((a) => a.kind === k);
  for (const a of of("name")) B.push("", a.text);
  for (const [k, h] of [["other", "### Other lines from the old map"], ["rule", "### Your own rules"], ["offers-map", "### Lines from the old offers map"]]) {
    const xs = of(k); if (!xs.length) continue;
    B.push("", h);
    xs.forEach((a, i) => B.push(...(i ? [""] : []), ...entry(a)));
  }
  return B;
}

// core/business.md › ## Sources and › ## Own to this business. A section that is missing is added at the
// end with its table (or a "_(none yet)_" row); a section that is there gets the rows it does not have yet.
const SECTIONS = [["sources", "Sources", ["| Source | What it holds | How to reach it |", "|---|---|---|"], "| _(none yet)_ | | |"],
  ["own", "Own to this business", ["| Folder | What |", "|---|---|"], "| _(none yet)_ | |"]];
function ensureSection(text, title, header, rows, none) {
  const L = text.replace(/\n+$/, "").split("\n");
  const h = L.findIndex((l) => l.trim() === `## ${title}`);
  if (h < 0) return appendBlock(text, [`## ${title}`, "", ...header, ...(rows.length ? rows : [none])]);
  if (!rows.length) return text;
  let e = L.findIndex((l, i) => i > h && /^## /.test(l)); if (e < 0) e = L.length;
  const r0 = L.findIndex((l, i) => i > h && i < e && isRow(l));
  if (r0 < 0) {
    // no table yet: the table takes the place of "None written yet." (or goes at the end of the section)
    const nw = L.findIndex((l, i) => i > h && i < e && /^none written yet\.?$/i.test(l.trim()));
    if (nw >= 0) L.splice(nw, 1, ...header, ...rows);
    else { let k = e; while (k > h + 1 && !normLine(L[k - 1])) k--; L.splice(k, 0, "", ...header, ...rows); }
    return L.join("\n") + "\n";
  }
  let r1 = r0; while (r1 + 1 < e && isRow(L[r1 + 1])) r1++;
  const have = new Set(L.slice(r0, r1 + 1).map(normLine));
  const add = rows.filter((r) => !have.has(normLine(r)));
  if (!add.length) return text;
  for (let i = r1; i >= r0; i--) if (/^_\(none yet\)_$/.test(cells(L[i])[0] || "")) { L.splice(i, 1); r1--; }
  L.splice(r1 + 1, 0, ...add);
  return L.join("\n") + "\n";
}
function coreText(C, slug, text) {
  const adds = C.st.additions.filter((a) => a.target === `business/${slug}/core/business.md`);
  let t = text;
  for (const [kind, title, header, none] of SECTIONS)
    t = ensureSection(t, title, header, adds.filter((a) => a.kind === kind).flatMap((a) => a.text.split("\n")), none);
  const B = bizBlock(C, slug);
  return B ? appendBlock(t, B) : t;
}

// ---------- the narrow permission (4.2) ----------
function allowed(rel, action) {
  const biz = (re) => { const m = rel.match(re); return m && !m[1].startsWith("."); };
  return (rel === "SOUL.md" && ["create", "append"].includes(action)) ||
    (rel === "user/CONTEXT.md" && ["replace", "create"].includes(action)) ||
    (rel === "user/user.md" && action === "edit") ||
    (rel === ".gitignore" && ["create", "edit"].includes(action)) ||
    (rel === "system/skills/skill-settings.md" && action === "create") ||
    (biz(/^business\/([^/]+)\/CONTEXT\.md$/) && ["replace", "create"].includes(action)) ||
    (biz(/^business\/([^/]+)\/offers\/CONTEXT\.md$/) && ["replace", "create"].includes(action)) ||
    (biz(/^business\/([^/]+)\/core\/business\.md$/) && ["append", "edit"].includes(action)) ||
    (biz(new RegExp(`^business/([^/]+)/(?:${SUBMAPS.join("|")})/CONTEXT\\.md$`)) && ["replace", "create"].includes(action)) ||
    (SUBMAPS.some((f) => biz(new RegExp(`^business/([^/]+)/${f}/${f}\\.md$`))) && ["append", "create"].includes(action)) ||
    (DELETE_CANDIDATES.includes(rel) && action === "delete");
}

// One write, recorded. Returns "done" | "skip" (nothing to do) | "blocked".
function doOp(C, step, rel, action, desired, source, reason, extra = {}) {
  const st = C.st, key = `${step}:${rel}`;
  if (!allowed(rel, action)) throw new Error(`migrate-0.9: refused to write ${rel} (${action}) — not in the allowed list.`);
  const p = C.abs(rel), s = lst(p);
  if (s && !s.isFile()) { C.notes.push(`${rel} was not changed: it is a link or a folder, not a plain file.`); return "blocked"; }
  const cur = s ? readFileSync(p) : null, curSha = cur ? sha(cur) : null;
  const want = desired ? sha(desired) : null;
  let op = st.ops.find((o) => o.key === key);
  if (!op) {
    if (curSha === want) return "skip";
    const backup = action === "create" ? null : `${st.backup}/${rel}`;
    if (backup && (!isFile(C.abs(backup)) || sha(readFileSync(C.abs(backup))) !== curSha)) {
      C.notes.push(`${rel} was not changed: it changed after the backup copy was made.`); log(C, `${key} blocked: no matching backup`); return "blocked";
    }
    op = { id: `O${st.ops.length + 1}`, key, step, path: rel, action, sha_before: curSha, sha_after: want, backup, source, reason, done: false, ...extra };
    st.ops.push(op); saveState(C);
  }
  if (op.done) return "done";
  if (curSha === op.sha_after) { op.done = true; saveState(C); return "done"; }
  if (curSha !== op.sha_before || want !== op.sha_after) {
    op.blocked = "the file changed while the update ran"; C.notes.push(`${rel} was not changed: it changed while the update ran. Your text is safe; tell support.`);
    log(C, `${key} blocked: fingerprint is neither before nor after`); saveState(C); return "blocked";
  }
  if (desired) writeAtomic(p, desired); else rmSync(p, { force: true });
  op.done = true; op.at = nowIso(); C.ran.push(op); saveState(C);
  return "done";
}
const opState = (C, key) => { const o = C.st.ops.find((x) => x.key === key); return !o ? "none" : o.done ? "done" : "open"; };

// ---------- steps ----------
function backupList(C) {
  const L = ["user/CONTEXT.md", "user/user.md", "SOUL.md", ".gitignore"];
  for (const b of C.st.businesses) {
    L.push(`business/${b.slug}/CONTEXT.md`, `business/${b.slug}/core/business.md`, `business/${b.slug}/offers/CONTEXT.md`);
    for (const f of Object.keys(b.subs || {})) L.push(`business/${b.slug}/${f}/CONTEXT.md`, `business/${b.slug}/${f}/${f}.md`);
  }
  L.push(...deleteList(C));
  return L;
}
function S1(C) {
  let n = 0;
  for (const rel of backupList(C)) {
    const s = lst(C.abs(rel));
    if (!s) continue;
    if (!s.isFile()) { C.notes.push(`${rel} is a link: it is left as it is.`); continue; }
    const src = readFileSync(C.abs(rel)), dst = C.abs(`${C.st.backup}/${rel}`);
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(C.abs(rel), dst);
    if (sha(readFileSync(dst)) !== sha(src)) throw new Error(`The backup copy of ${rel} does not match the original. Nothing was changed. Free some disk space and say "update aios" again.`);
    const key = `S1-backup:${rel}`;
    const op = { id: null, key, step: "S1-backup", path: rel, action: "backup", sha_before: sha(src), sha_after: sha(src), backup: `${C.st.backup}/${rel}`, source: rel, reason: "a copy before the 0.9 move", done: true };
    const i = C.st.ops.findIndex((o) => o.key === key);
    if (i >= 0) { op.id = C.st.ops[i].id; C.st.ops[i] = op; } else { op.id = `O${C.st.ops.length + 1}`; C.st.ops.push(op); }
    n++;
  }
  log(C, `S1-backup: ${n} files`);
}
function S2(C) {
  const r = collect(C, C.st.businesses);
  C.st.additions = r.additions; C.st.person = r.person;
  log(C, `S2-collect: ${r.additions.length} own text pieces`);
}
function soulDesired(C) {
  const orig = C.readOrig("SOUL.md");
  const P = C.st.person;
  if (!orig || !C.origRel("SOUL.md").startsWith(".aios-backup/")) {
    // create from the template
    const meta = decode(C.tpl.soul);
    let t = meta.text;
    for (const tok of ["TONE", "LENGTH", "BUGS_LIST", "DISPLAY_NAME", "LANGUAGE"]) {
      const v = (P.fields[tok] || "").trim() || "unknown";
      t = t.split(`[${tok}]`).join(v);
    }
    t = t.replace(/\[[A-Z][A-Z_]+\]/g, "unknown");
    const ent = soulEntries(C);
    if (ent.length) {
      const L = t.replace(/\n$/, "").split("\n");
      const h = L.findIndex((l) => /^## The person you work with\s*$/.test(l));
      let e = L.findIndex((l, i) => i > h && /^## /.test(l)); if (e < 0) e = L.length;
      let k = e; while (k > h + 1 && !normLine(L[k - 1])) k--;
      const block = ["", `### ${HEADING}`, `<!-- old files: ${C.st.backup}/ -->`, ...ent, ...(e < L.length ? [""] : [])];
      L.splice(k, e - k, ...block);
      t = L.join("\n") + "\n";
    }
    return { action: "create", buf: encode(meta, t) };
  }
  // SOUL.md was the customer's: never rewritten, a block goes at its end
  const B = [`## ${HEADING}`, "If anything below contradicts the text above, the text above wins.", `<!-- old files: ${C.st.backup}/ -->`];
  const lines = [...P.identityLines, ...P.respondLines];
  if (lines.length) B.push("", "<!-- from user/user.md, Identity and How to respond to me -->", ...lines);
  const ent = soulEntries(C);
  B.push(...ent);
  if (!lines.length && !ent.length) return null;
  const meta = decode(orig);
  return { action: "append", buf: encode(meta, appendBlock(meta.text, B)) };
}
function S3(C) {
  const d = soulDesired(C);
  if (d) doOp(C, "S3-soul", "SOUL.md", d.action, d.buf, d.action === "create" ? `${TEMPLATES_DIR}/soul.md + user/user.md` : "user/user.md + your own lines",
    d.action === "create" ? "SOUL.md is new in 0.9: how to talk to you, and your own rules" : "your SOUL.md stays as it was; the moved text is added at its end");
}
function S4(C) {
  const orig = C.readOrig("user/user.md");
  if (!orig || !isFile(C.abs("user/user.md"))) return;
  if (opState(C, "S3-soul:SOUL.md") === "open") { C.notes.push("user/user.md was not changed: SOUL.md could not be written first."); return; }
  const meta = decode(orig), hadNL = meta.text.endsWith("\n");
  const L = meta.text.replace(/\n$/, "").split("\n");
  const p = parseUser(orig);
  const rm = new Set(p.identity);
  if (p.respond) for (let i = p.respond[0]; i < p.respond[1]; i++) rm.add(i);
  const out = [];
  for (let i = 0; i < L.length; i++) {
    if (rm.has(i)) continue;
    if (!normLine(L[i]) && rm.has(i - 1) && out.length && !normLine(out[out.length - 1])) continue;
    out.push(L[i]);
  }
  while (out.length && !normLine(out[out.length - 1]) && rm.has(L.length - 1)) out.pop();
  let t = out.join("\n") + (hadNL ? "\n" : "");
  const um = C.st.additions.filter((a) => a.target === "user/user.md");
  if (um.length) {
    const B = [`## ${HEADING}`, `<!-- from user/CONTEXT.md; old file: ${C.st.backup}/user/CONTEXT.md -->`];
    for (const a of um) B.push("", ...entry(a, false));
    t = appendBlock(t, B);
  }
  if (t === meta.text) return;
  doOp(C, "S4-user", "user/user.md", "edit", encode(meta, t), "user/user.md + user/CONTEXT.md",
    "How to respond to me and the name and language lines moved to SOUL.md; own lines of the old user map added at the end");
}
function S5(C) {
  if (opState(C, "S4-user:user/user.md") === "open") { C.notes.push("user/CONTEXT.md was not replaced: user/user.md could not be written first."); return; }
  const s = lst(C.abs("user/CONTEXT.md"));
  if (s && !s.isFile()) return;
  if (!isDir(C.abs("user"))) return;
  doOp(C, "S5-user-map", "user/CONTEXT.md", s ? "replace" : "create", C.tpl.userMap, `${TEMPLATES_DIR}/user-map.md`, "the system map of user/ in 0.9 (D36)");
}
function S6(C) {
  for (const b of C.st.businesses) {
    const core = `business/${b.slug}/core/business.md`;
    const orig = C.readOrig(core);
    if (!orig) { C.notes.push(`${core} is missing: business/${b.slug}/ was left as it is.`); continue; }
    const meta = decode(orig), t = coreText(C, b.slug, meta.text);
    if (t !== meta.text) {
      const appended = t.startsWith(meta.text.replace(/\n+$/, ""));
      doOp(C, "S6-business", core, appended ? "append" : "edit", encode(meta, t), `business/${b.slug}/CONTEXT.md and others`,
        "Sources and Own to this business (the new map points there), and what else only this business has, moved out of the old maps");
      if (opState(C, `S6-business:${core}`) === "open") { C.notes.push(`business/${b.slug}/: the maps were not replaced, because core/business.md could not be written first.`); continue; }
    }
    if (b.map !== "skip") doOp(C, "S6-business", `business/${b.slug}/CONTEXT.md`, b.map, C.tpl.bizMap, `${TEMPLATES_DIR}/business-map.md`, "the same business map for every business in 0.9 (D36)");
    if (b.offers !== "skip") doOp(C, "S6-business", `business/${b.slug}/offers/CONTEXT.md`, b.offers === "replace" ? "replace" : "create", C.tpl.offersMap,
      `${TEMPLATES_DIR}/offers-map.md`, "the offers map of every business in 0.9 (contract 3.6)", b.offers === "create-dir" && !there(C.abs(`business/${b.slug}/offers`)) ? { created_dirs: [`business/${b.slug}/offers`] } : {});
    for (const [f, how] of Object.entries(b.subs || {})) {
      const tplBuf = C.tpl.sub?.[f];
      if (!tplBuf) { C.notes.push(`business/${b.slug}/${f}/: its map was not written (no template ${TEMPLATES_DIR}/${f}-map.md).`); continue; }
      if (how === "skip") { C.notes.push(`business/${b.slug}/${f}/CONTEXT.md is a link: it was left as it is.`); continue; }
      const mapRel = `business/${b.slug}/${f}/CONTEXT.md`, dataRel = `business/${b.slug}/${f}/${f}.md`;
      if (how === "replace") {
        const old = C.readOrig(mapRel);
        if (old && sha(old) !== sha(tplBuf)) {
          // the old map's own lines (not in the new map) → a block in the folder's own file, first
          const tplLines = new Set(tplBuf.toString("utf8").split("\n").map(normLine).filter((l) => l.trim()));
          const own = decode(old).text.split("\n").filter((l) => !tplLines.has(normLine(l)));
          while (own.length && !own[0].trim()) own.shift();
          while (own.length && !own[own.length - 1].trim()) own.pop();
          if (own.some((l) => l.trim())) {
            const block = [`## ${HEADING}`, `<!-- from ${mapRel}; old file: ${C.st.backup}/${mapRel} -->`, "", demote(own.join("\n"))].join("\n") + "\n";
            const curData = C.readOrig(dataRel);
            const meta = curData ? decode(curData) : null;
            const desired = meta ? encode(meta, appendBlock(meta.text, block)) : Buffer.from(`# ${f[0].toUpperCase() + f.slice(1)}\n\n` + block);
            doOp(C, "S6-business", dataRel, meta ? "append" : "create", desired, mapRel, `what only this business had in its ${f}/ map: the system map routes by kind and lists no content (D48)`);
            if (opState(C, `S6-business:${dataRel}`) === "open") { C.notes.push(`${mapRel} was not replaced, because ${dataRel} could not be written first.`); continue; }
          }
        }
      }
      doOp(C, "S6-business", mapRel, how, tplBuf, `${TEMPLATES_DIR}/${f}-map.md`, `the system map of ${f}/ in 0.9, the same in every business (D48)`);
    }
  }
}
// The settings file of skills (0.9: the person's data next to the skills catalog). Same text as the template's
// system/skills/skill-settings.md — a test keeps the two equal. Created only when missing.
const SKILL_SETTINGS = "# Skill settings\n\nOne file for all skills: one section `## <skill>` per skill. Your own data and preferences that a skill reads while it works live here. The skills themselves hold none of it, so a skill can be given to another person without anything personal.\n\nEdit it as plain text. Never write a secret (a key, a token) here: keys live in `system/.secrets/`; here only the names of those files.\n";
function S7(C) {
  if (!there(C.abs("system/skills/skill-settings.md")) && isDir(C.abs("system/skills")))
    doOp(C, "S7-gitignore", "system/skills/skill-settings.md", "create", Buffer.from(SKILL_SETTINGS), "0.9 template", "the settings file of skills, next to the skills catalog (0.9)");
  const p = C.abs(".gitignore"), s = lst(p);
  if (s && !s.isFile()) return;
  if (!s) return void doOp(C, "S7-gitignore", ".gitignore", "create", Buffer.from(SECRETS_LINE + "\n"), "D34", "keeps API keys (system/.secrets/) out of git");
  const op = C.st.ops.find((o) => o.key === "S7-gitignore:.gitignore");
  const orig = op ? C.readOrig(".gitignore") : readFileSync(p);
  const meta = decode(orig);
  if (meta.text.split("\n").some((l) => ["system/.secrets/", "system/.secrets", "/system/.secrets/", "/system/.secrets"].includes(l.trim()))) return;
  const t = meta.text.replace(/\n*$/, "") + (meta.text.trim() ? "\n" : "") + SECRETS_LINE + "\n";
  doOp(C, "S7-gitignore", ".gitignore", "edit", encode(meta, t), "D34", "keeps API keys (system/.secrets/) out of git");
}
const WHAT = (rel) => rel === "CLAUDE.md" ? "an old pointer for Claude Code"
  : rel === "GEMINI.md" ? "an old pointer for Gemini"
  : rel === "system/offers.md" ? "the old offer rules (each business now has offers/CONTEXT.md)"
  : rel === "CONTEXT.md" ? "the old map of tasks; the routes are now in AGENTS.md"
  : `an old agent role (${rel.split("/")[2]})`;
function S8(C) {
  const st = C.st;
  for (const rel of deleteList(C)) {
    let e = st.deletions.find((x) => x.path === rel);
    if (!e) { e = { path: rel }; st.deletions.push(e); }
    const s = lst(C.abs(rel));
    if (!s) { Object.assign(e, { kind: rel === "CONTEXT.md" ? "router" : "kernel", answer: "gone", asked_at: null, done_at: null }); log(C, `S8: ${rel} was gone before the move`); continue; }
    if (!s.isFile()) { Object.assign(e, { answer: "skipped-link" }); continue; }
    markAsked(C, e);
  }
  log(C, `S8-deletions: ${st.deletions.filter((e) => e.answer === "asked").length} asked`);
}
function markAsked(C, e) {
  const cur = readFileSync(C.abs(e.path)), info = C.base?.files[e.path];
  const bk = `${C.st.backup}/${e.path}`;
  e.kind = e.path === "CONTEXT.md" ? "router" : "kernel";
  e.changed_by_client = info ? !info.whole.has(sha(normWhole(cur.toString("utf8")))) : true;
  e.moved_to = C.st.additions.filter((a) => a.source === e.path).map((a) => a.id);
  e.sha_at_ask = sha(cur);
  // the copy that a delete will rely on: the S1 copy if it is this text, else a fresh one
  if (isFile(C.abs(bk)) && sha(readFileSync(C.abs(bk))) === e.sha_at_ask) e.backup = bk;
  else { const b = `${C.st.backup}/asked-${e.sha_at_ask.slice(0, 12)}/${e.path}`; mkdirSync(dirname(C.abs(b)), { recursive: true }); copyFileSync(C.abs(e.path), C.abs(b)); e.backup = b; }
  e.answer = "asked"; e.asked_at = nowIso(); e.done_at = null;
}
function deletionText(C, list, fresh) {
  if (!list.length) return [];
  const where = (e) => [...new Set((e.moved_to || []).map((id) => C.st.additions.find((a) => a.id === id)?.target).filter(Boolean))];
  const out = [fresh ? `The update is finished. ${list.length} old AIOS file(s) are no longer used.` : `${list.length} old AIOS file(s) from the 0.9 update are still here and no longer used.`,
    `Copies of all of them are in ${C.st.backup}/.`];
  list.forEach((e, i) => {
    const w = where(e);
    let s = `  ${i + 1}. ${e.path} — ${WHAT(e.path)}.`;
    if (e.changed_by_client) s += w.length ? ` YOU CHANGED IT: your lines were moved to ${w.join(" and ")}.` : " YOU CHANGED IT: nothing in it needed moving.";
    else if (w.length) s += ` Your lines were moved to ${w.join(" and ")}.`;
    out.push(s);
  });
  out.push("Delete them? Answer: yes (all) / no (keep all) / only some (name them).");
  out.push("Then run: node system/update.mjs --apply --delete-old=all   (or =none, or =CLAUDE.md,GEMINI.md)");
  return out;
}

// ---------- deletions after the answer (4.7) ----------
function pruneEmpty(C, rel) {
  let d = dirname(C.abs(rel));
  while (d.startsWith(C.root) && d !== C.root) {
    const left = isDir(d) ? readdirSync(d) : null;
    if (!left) break;
    if (left.some((n) => n !== ".DS_Store")) break;
    try { for (const n of left) rmSync(join(d, n), { force: true }); rmdirSync(d); } catch { break; }
    d = dirname(d);
  }
}
function processDeletions(C, spec) {
  const st = C.st;
  const asked = st.deletions.filter((e) => e.answer === "asked");
  const s = String(spec).trim();
  const names = s === "all" ? null : s === "none" ? [] : s.split(",").map((x) => x.trim().replace(/\\/g, "/").replace(/\/+$/, "")).filter(Boolean);
  const named = (e) => names === null || names.includes(e.path) || names.includes(dirname(e.path));
  if (names) for (const n of names) if (!st.deletions.some((e) => e.path === n || dirname(e.path) === n)) C.lines.push(`Not in the list of old files, left as it is: ${n}`);
  if (!asked.length) { C.lines.push("No old file is waiting for an answer. Nothing was deleted."); return; }
  let del = 0, kept = 0;
  for (const e of asked) {
    if (!named(e)) { e.answer = "no"; kept++; continue; }
    const p = C.abs(e.path), s2 = lst(p);
    if (!s2) { e.answer = "gone"; continue; }
    const cur = readFileSync(p);
    if (sha(cur) !== e.sha_at_ask) { e.answer = "changed-after-ask"; C.lines.push(`${e.path} was changed after the list was shown, so it was NOT deleted. It will be asked about again at the next "update aios".`); continue; }
    if (!e.backup || !isFile(C.abs(e.backup)) || sha(readFileSync(C.abs(e.backup))) !== e.sha_at_ask) { e.answer = "no"; C.lines.push(`${e.path} was NOT deleted: its backup copy is missing.`); continue; }
    const op = { id: `O${st.ops.length + 1}`, key: `delete-old:${e.path}:${st.ops.length}`, step: "delete-old", path: e.path, action: "delete", sha_before: e.sha_at_ask, sha_after: null,
      backup: e.backup, source: e.path, reason: "the user said yes to deleting an old file", done: false };
    if (!allowed(e.path, "delete")) throw new Error(`migrate-0.9: refused to delete ${e.path}`);
    st.ops.push(op); saveState(C);
    rmSync(p, { force: true });
    if (e.path.startsWith("system/agents/")) pruneEmpty(C, e.path);
    op.done = true; op.at = nowIso(); e.answer = "yes"; e.done_at = nowIso(); saveState(C); del++;
  }
  C.lines.push(`Deleted ${del} old file(s)${kept ? `; kept ${kept}` : ""}. Copies stay in ${st.backup}/.`);
}

// ---------- lock ----------
function alive(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function takeLock(C) {
  const l = C.st.lock;
  if (l && l.pid !== process.pid && alive(l.pid) && Date.now() - Date.parse(l.at) < LOCK_MS) return false;
  C.st.lock = { pid: process.pid, at: nowIso() };
  return true;
}
function cleanTmp(C) {
  const paths = new Set([STATE_REL, ...C.st.ops.map((o) => o.path)]);
  for (const rel of paths) { const t = C.abs(rel) + TMP; if (there(t)) { rmSync(t, { force: true }); log(C, `removed a leftover ${rel}${TMP}`); } }
}
function stopAfter(id) {
  const s = process.env.AIOS_MIGRATE_STOP_AFTER;
  if (s && (s === id || id.startsWith(s + "-"))) { process.stderr.write(`[test] AIOS_MIGRATE_STOP_AFTER=${s}: stopped after ${id}\n`); process.exit(75); }
}

// ---------- preview ----------
function preview(C, businesses) {
  const r = collect(C, businesses);
  C.st = { backup: ".aios-backup/<time>-migrate-0.9", additions: r.additions };
  const L = ["AIOS: one more step moves your settings to the new layout (0.9). Preview — nothing was written:"];
  const soul = there(C.abs("SOUL.md"));
  L.push(soul ? "  ~ SOUL.md — yours stays as it was; a block is added at its end (how to talk to you, your own rules)"
    : "  + SOUL.md — new: how to talk to you (from user/user.md) and your own rules");
  L.push("  ~ user/user.md — How to respond to me, your name and language move to SOUL.md");
  L.push("  ~ user/CONTEXT.md — the new map of user/");
  for (const b of businesses) {
    L.push(`  ~ business/${b.slug}/CONTEXT.md — the new business map${C.st.additions.some((a) => a.target === `business/${b.slug}/core/business.md`) ? "; what only this business has goes to its core/business.md" : ""}`);
    if (b.offers !== "skip") L.push(`  ${b.offers === "replace" ? "~" : "+"} business/${b.slug}/offers/CONTEXT.md — the offers map`);
    for (const [f, how] of Object.entries(b.subs || {})) if (how !== "skip") L.push(`  ${how === "replace" ? "~" : "+"} business/${b.slug}/${f}/CONTEXT.md — the map of ${f}/${how === "replace" ? "; what only this business had there goes to " + f + "/" + f + ".md" : ""}`);
  }
  if (r.additions.length) L.push(`  ${r.additions.length} piece(s) of your own text move: ${[...new Set(r.additions.map((a) => a.target))].join(", ")}`);
  L.push("Every changed file is copied to .aios-backup/ first. Old files are deleted only after you say yes.");
  L.push("(Preview only — nothing was written. Re-run with --apply.)");
  return L;
}

// ---------- restore (4.9) ----------
function restore(C, apply) {
  const st = loadState(C);
  if (st?.lock && st.lock.pid !== process.pid && alive(st.lock.pid) && Date.now() - Date.parse(st.lock.at) < LOCK_MS)
    return { needed: true, status: "busy", lines: ["An AIOS update is already running. Wait for it to end, then try again."], pendingDeletions: [] };
  const prev = st?.prev_backup ? [...(st.prev_backup_extra || []), st.prev_backup] : findPrev(C);
  if (!prev) return { needed: false, status: "refused", lines: ["Cannot restore 0.8.3: no backup of the old system files was found in .aios-backup/. Nothing was changed."], pendingDeletions: [] };
  const mf09 = readMf(C.abs("system/managed-files.json")) || { managed: [] };
  const mf08 = prevMf(C, prev);
  if (!mf08) return { needed: false, status: "refused", lines: ["Cannot restore 0.8.3: the old system/managed-files.json is not in the backup. Nothing was changed."], pendingDeletions: [] };
  const plan = [], keep = [];
  // 1. the move, backwards
  for (const op of [...(st?.ops || [])].reverse()) {
    if (op.action === "backup") continue;
    const p = C.abs(op.path), cur = readBuf(p), curSha = cur ? sha(cur) : null;
    const did = op.done || (op.sha_after !== null && curSha === op.sha_after) || (op.action === "delete" && !cur);
    if (!did) continue;
    if (op.action === "create") {
      if (curSha === op.sha_after) plan.push({ kind: "delete", rel: op.path, dirs: op.created_dirs || [], why: "made by the 0.9 move" });
      else if (cur) keep.push(`${op.path} — created by the update, then changed by you: left as it is`);
      continue;
    }
    const b = readBuf(C.abs(op.backup));
    if (!b) { keep.push(`${op.path} — its backup copy is missing: left as it is`); continue; }
    if (curSha !== sha(b)) plan.push({ kind: "put", rel: op.path, from: op.backup, save: curSha !== op.sha_after && cur !== null });
  }
  // 2. the 0.8.3 kernel
  const DENY = ["user/", "business/", "areas/", "_inbox/"];
  const p08 = new Set((mf08.managed || []).map((e) => e.path));
  const sha09 = new Map((mf09.managed || []).map((e) => [e.path, e.sha256]));
  const LAST = ["system/update.mjs", "system/managed-files.json"];
  const kernel = [...new Set([...p08, ...sha09.keys()])].filter((r) => !DENY.some((d) => r.startsWith(d)) && !LAST.includes(r)).sort();
  for (const rel of kernel) {
    const f = prevLookup(C, prev, rel), cur = readBuf(C.abs(rel));
    if (f) { if (!cur || sha(cur) !== sha(f.buf)) plan.push({ kind: "put", rel, from: f.rel, save: !!cur && sha(cur) !== sha09.get(rel) }); continue; }
    if (p08.has(rel) || !cur) continue;
    if (sha(cur) === sha09.get(rel)) plan.push({ kind: "delete", rel, prune: true, why: "a 0.9 system file" });
    else keep.push(`${rel} — a 0.9 file you changed: left as it is`);
  }
  // 3. last: the updater and the version marker
  for (const rel of LAST) { const f = prevLookup(C, prev, rel); if (f && sha(readBuf(C.abs(rel)) || "") !== sha(f.buf)) plan.push({ kind: "put", rel, from: f.rel }); }

  const L = [apply ? "Restoring AIOS 0.8.3:" : "Restore AIOS 0.8.3 — plan (nothing was written):"];
  for (const x of plan) L.push(x.kind === "put" ? `  ← ${x.rel}  (from ${x.from})` : `  - ${x.rel}  (${x.why}, removed)`);
  for (const k of keep) L.push(`  = ${k}`);
  if (!apply) { L.push("Run with --restore --apply to do it. Backups stay in .aios-backup/."); return { needed: false, status: st?.status || "none", lines: L, pendingDeletions: [] }; }

  if (st) { C.st = st; C.st.lock = { pid: process.pid, at: nowIso() }; saveState(C); }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const saveDir = `.aios-backup/${stamp}-restore`;
  for (const x of plan) {
    const p = C.abs(x.rel);
    if (x.kind === "put") {
      if (x.save && isFile(p)) { const d = C.abs(`${saveDir}/${x.rel}`); mkdirSync(dirname(d), { recursive: true }); copyFileSync(p, d); }
      writeAtomic(p, readFileSync(C.abs(x.from)));
    } else {
      rmSync(p, { force: true });
      for (const d of x.dirs || []) { const a = C.abs(d); if (isDir(a) && !readdirSync(a).some((n) => n !== ".DS_Store")) { for (const n of readdirSync(a)) rmSync(join(a, n), { force: true }); rmdirSync(a); } }
      if (x.prune) pruneEmpty(C, x.rel);
    }
  }
  if (st) {
    st.status = "restored"; st.restored_at = nowIso(); st.lock = null;
    st.log.push(`${nowIso()} restored 0.8.3: ${plan.length} file(s)`);
    writeAtomic(C.abs(`system/.aios-migration.restored-${stamp}.json`), Buffer.from(JSON.stringify(st, null, 2) + "\n"));
    rmSync(C.abs(STATE_REL), { force: true });
  }
  L.push(`Done: AIOS 0.8.3 is back. ${plan.length} file(s) restored or removed. Backups stay in .aios-backup/.`);
  return { needed: false, status: "restored", lines: L, pendingDeletions: [] };
}

// ---------- main ----------
export async function run({ root = process.cwd(), apply = false, deleteOld = null, restore: doRestore = false, check = false } = {}) {
  const C = ctx(root);
  if (doRestore) return restore(C, apply);
  const pending = () => (C.st?.deletions || []).filter((e) => e.answer === "asked").map((e) => ({ path: e.path, changed_by_client: !!e.changed_by_client, moved_to: e.moved_to || [] }));
  const result = (status, needed) => ({ needed, status, lines: [...C.lines, ...C.notes], pendingDeletions: pending() });

  let st = loadState(C);
  if (st && (st.status === "not-needed" || st.status === "restored")) return result(st.status, false);
  if (!st) {
    const s = signs(C);
    if (!s.length) {
      if (apply) { C.st = { schema: 1, migration: "0.8-to-0.9", module_version: MODULE_VERSION, status: "not-needed", checked_at: nowIso(), log: [] }; saveState(C); }
      return result("not-needed", false);
    }
  }
  if (check) { if (!st || st.status === "running") C.lines.push(NOT_FINISHED); return result(st ? st.status : "pending", !st || st.status === "running"); }

  // finished: only the old files are left to ask about
  if (st && st.status === "done") {
    C.st = st; C.base = loadBase(C);
    const shown = () => st.deletions.filter((e) => ["asked", "no", "deferred", "changed-after-ask"].includes(e.answer) && isFile(C.abs(e.path)));
    if (!apply) { C.lines.push(...deletionText(C, shown(), false)); return result("done", false); }
    if (!takeLock(C)) return result("busy", false);
    for (const e of st.deletions) if (["asked", "no", "deferred", "changed-after-ask"].includes(e.answer) && !there(C.abs(e.path))) e.answer = "gone";
    if (deleteOld !== null && deleteOld !== undefined && deleteOld !== false) processDeletions(C, deleteOld);
    else {
      for (const e of st.deletions) if (e.answer === "asked") { e.answer = "deferred"; log(C, `${e.path}: no answer → deferred`); }
      const list = shown();
      for (const e of list) markAsked(C, e);
      C.lines.push(...deletionText(C, list, false));
    }
    st.lock = null; saveState(C);
    return result("done", false);
  }

  // the move itself
  const T = readTemplates(C);
  C.base = loadBase(C);
  if (T.error || !C.base) {
    C.lines.push(`The move to the new layout is not finished: a template could not be read (${T.error || BASE_REL}). Nothing in your data was changed. Say "update aios" again; if this repeats, tell support.`);
    return result("blocked", true);
  }
  C.tpl = T.tpl;
  C.prev = st?.prev_backup ? [...(st.prev_backup_extra || []), st.prev_backup] : findPrev(C);
  const businesses = st?.businesses || scanBusinesses(C);
  // iCloud: a file that is not on this computer stops everything
  const need = ["user/user.md", "user/CONTEXT.md", "SOUL.md", ".gitignore", ...deleteList(C),
    ...businesses.filter((b) => !b.evicted).flatMap((b) => [`business/${b.slug}/CONTEXT.md`, `business/${b.slug}/offers/CONTEXT.md`,
      ...Object.keys(b.subs || {}).flatMap((f) => [`business/${b.slug}/${f}/CONTEXT.md`, `business/${b.slug}/${f}/${f}.md`])])];
  const ev = [...businesses.filter((b) => b.evicted).map((b) => `business/${b.slug}/core/business.md`), ...need.filter((r) => C.evicted(r))];
  if (ev.length) {
    C.lines.push(`The move to the new layout is waiting: ${ev.length} file(s) are in iCloud and not on this computer (${ev.join(", ")}). Open the AIOS folder so the files download, then say "update aios". Nothing was changed.`);
    return result(st ? st.status : "pending", true);
  }
  C.origRel = (rel) => (C.st?.backup && isFile(C.abs(`${C.st.backup}/${rel}`)) ? `${C.st.backup}/${rel}` : rel);
  C.readOrig = (rel) => readBuf(C.abs(C.origRel(rel)));
  if (!apply) { C.lines.push(...preview(C, businesses)); return { ...result(st ? st.status : "pending", true), pendingDeletions: [] }; }

  // apply
  if (!st) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const mf08 = prevMf(C, C.prev);
    st = { schema: 1, migration: "0.8-to-0.9", module_version: MODULE_VERSION, status: "running", from_version: mf08?.aios_version || null,
      started_at: nowIso(), finished_at: null, lock: null, prev_backup: C.prev ? C.prev[C.prev.length - 1] : null,
      prev_backup_extra: C.prev ? C.prev.slice(0, -1) : [], backup: `.aios-backup/${stamp}-migrate-0.9`,
      businesses, steps: STEPS.map((id) => ({ id, status: "todo" })), additions: [], person: null, ops: [], deletions: [], log: [] };
  }
  C.st = st; C.ran = [];
  if (!takeLock(C)) return result("busy", true);
  cleanTmp(C);
  saveState(C);
  const fns = { "S1-backup": S1, "S2-collect": S2, "S3-soul": S3, "S4-user": S4, "S5-user-map": S5, "S6-business": S6, "S7-gitignore": S7, "S8-deletions": S8 };
  for (const step of st.steps) {
    if (step.status === "done") continue;
    fns[step.id](C);
    step.status = "done"; step.at = nowIso();
    if (step.id === "S8-deletions") { st.status = "done"; st.finished_at = nowIso(); }
    saveState(C);
    stopAfter(step.id);
  }
  // report
  const moved = st.additions.length;
  C.lines.push("AIOS moved your settings to the new layout (0.9).");
  for (const op of C.ran) C.lines.push(`  ${op.action === "create" ? "+" : "~"} ${op.path} — ${op.reason}`);
  if (moved) C.lines.push(`  ${moved} piece(s) of your own text were moved; each sits under "${HEADING}" with a note where it came from.`);
  if (deleteOld !== null && deleteOld !== undefined && deleteOld !== false) C.lines.push("The answer about old files was not used: the list is shown just now. Ask the user first.");
  C.lines.push("", ...deletionText(C, st.deletions.filter((e) => e.answer === "asked"), true));
  st.lock = null; saveState(C);
  return result("done", false);
}
