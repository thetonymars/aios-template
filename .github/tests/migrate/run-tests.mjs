// Tests of system/migrate-0.9.mjs on copies of fixtures/{a,b,c1,c2}.
//   node ~/aios-p0140-work/tests/migrate/run-tests.mjs
// Each case: copy the fixture into runs/v-migrate/<case>/, imitate run 1 (the old 0.8.3 updater
// writing a 0.9 kernel, with its backup .aios-backup/<time>/ as update.mjs 0.8.3 :488–497 makes it),
// then call the module through cli.mjs (a child process, as update.mjs would).
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, lstatSync, existsSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";

const W = process.env.AIOS_WORK || join(homedir(), "aios-p0140-work");
const T = join(W, "aios-template"), FX = join(W, "fixtures"), RUNS = join(W, "runs", "v-migrate");
const CLI = process.env.AIOS_MIGRATE_CLI || join(W, "tests", "migrate", "cli.mjs");
const FIXTURES = ["a", "b", "c1", "c2"];
const STEPS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
const RUN1 = "2026-11-10T09-10-44-120Z";
const sha = (b) => createHash("sha256").update(b).digest("hex");
const PERSONAS = ["assistant", "ceo", "finance", "it", "legal", "marketer", "pm", "product", "researcher", "sales"];
const REMOVED = ["CLAUDE.md", "GEMINI.md", "system/offers.md", ...PERSONAS.map((p) => `system/agents/${p}/AGENT.md`)];
const DEL = [...REMOVED, "CONTEXT.md"];

let fails = 0, passes = 0;
const ok = (cond, msg) => { if (cond) passes++; else { fails++; console.log(`  FAIL: ${msg}`); } };

function walk(root, rel = "", out = new Map()) {
  for (const n of readdirSync(join(root, rel))) {
    const r = rel ? `${rel}/${n}` : n, s = lstatSync(join(root, r));
    if (s.isDirectory()) walk(root, r, out); else out.set(r, sha(readFileSync(join(root, r))));
  }
  return out;
}
const sums = (fx) => new Map(readFileSync(join(FX, `${fx}.SHA256SUMS`), "utf8").trim().split("\n").map((l) => { const [h, ...p] = l.split(/\s+/); return [p.join(" ").replace(/^\.\//, ""), h]; }));
const isState = (r) => r === "system/.aios-migration.json" || /^system\/\.aios-migration\.restored-.*\.json$/.test(r);
const isBackup = (r) => r.startsWith(".aios-backup/");

// The 0.9 kernel used in these tests: the real new files from T, the rest as in 0.8.3.
function kernel09() {
  const files = new Map();
  const real = (rel) => readFileSync(join(T, rel));
  files.set("AGENTS.md", existsSync(join(T, "AGENTS.md")) ? real("AGENTS.md") : Buffer.from("# AIOS 0.9 (test stub)\n"));
  files.set("system/update.mjs", Buffer.concat([real("system/update.mjs"), Buffer.from("\n// 0.9 test marker\n")]));
  files.set("system/migrate-0.9.mjs", real("system/migrate-0.9.mjs"));
  files.set("system/migrate-0.9-base.json", real("system/migrate-0.9-base.json"));
  for (const n of ["soul.md", "user-map.md", "business-map.md", "offers-map.md", "products-map.md", "markets-map.md", "channels-map.md", "data-map.md", "brand-map.md"]) files.set(`system/skills/setup/templates/${n}`, real(`system/skills/setup/templates/${n}`));
  files.set("system/architecture.md", Buffer.from("# Architecture (test stub)\n"));
  return files;
}
function setup(fx, name) {
  const dir = join(RUNS, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dirname(dir), { recursive: true });
  cpSync(join(FX, fx), dir, { recursive: true });
  // run 1 — what update.mjs 0.8.3 does with a 0.9 manifest
  const mf08 = JSON.parse(readFileSync(join(dir, "system/managed-files.json"), "utf8"));
  const k = kernel09();
  const managed = mf08.managed.map((e) => e.path).filter((p) => !REMOVED.includes(p));
  for (const p of k.keys()) if (!managed.includes(p)) managed.push(p);
  const content = (p) => k.get(p) || readFileSync(join(dir, p));
  const mf09 = { aios_version: "0.9.0", managed: managed.map((p) => ({ path: p, sha256: sha(content(p)) })) };
  const bk = join(dir, ".aios-backup", RUN1);
  for (const p of managed) {
    const abs = join(dir, p), next = content(p);
    if (existsSync(abs)) { if (sha(readFileSync(abs)) === sha(next)) continue; mkdirSync(dirname(join(bk, p)), { recursive: true }); copyFileSync(abs, join(bk, p)); }
    mkdirSync(dirname(abs), { recursive: true }); writeFileSync(abs, next);
  }
  mkdirSync(join(bk, "system"), { recursive: true });
  copyFileSync(join(dir, "system/managed-files.json"), join(bk, "system/managed-files.json"));
  writeFileSync(join(dir, "system/managed-files.json"), JSON.stringify(mf09, null, 2) + "\n");
  return { dir, kernel: new Set(managed.concat(["system/managed-files.json"])) };
}
function cli(dir, args = [], env = {}) {
  const r = spawnSync(process.execPath, [CLI, dir, ...args], { encoding: "utf8", env: { ...process.env, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const state = (dir) => JSON.parse(readFileSync(join(dir, "system/.aios-migration.json"), "utf8"));
// backup stamps differ between runs: compare with them replaced
function normTree(dir) {
  const st = JSON.parse(readFileSync(join(dir, "system/.aios-migration.json"), "utf8"));
  const stamp = st.backup.split("/")[1];
  const out = new Map();
  for (const [r] of walk(dir)) {
    if (isState(r)) continue;
    const text = readFileSync(join(dir, r)).toString("utf8").split(stamp).join("<B>");
    out.set(r.split(stamp).join("<B>"), sha(text));
  }
  return out;
}
const diffMaps = (a, b) => [...new Set([...a.keys(), ...b.keys()])].filter((k) => a.get(k) !== b.get(k));
const norm = (l) => l.replace(/\r$/, "").replace(/\s+$/, "");

console.log("== base and templates present:", existsSync(join(T, "system/migrate-0.9-base.json")), existsSync(join(T, "system/skills/setup/templates/soul.md")));
rmSync(RUNS, { recursive: true, force: true });

const reference = {};
for (const fx of FIXTURES) {
  console.log(`\n== ${fx}`);
  // sanity: run 1 imitation leaves user data byte for byte
  const { dir, kernel } = setup(fx, `${fx}-main`);
  const S = sums(fx), snap1 = walk(dir);
  for (const [p, h] of S) if (!kernel.has(p)) ok(snap1.get(p) === h, `${fx}: run 1 changed ${p}`);

  // preview writes nothing
  const pv = cli(dir);
  ok(pv.code === 0 && /Preview only/.test(pv.out), `${fx}: preview`);
  ok(diffMaps(snap1, walk(dir)).length === 0, `${fx}: preview wrote something`);
  ok(/not finished/.test(cli(dir, ["--check"]).out), `${fx}: --check says not finished`);

  // (1) apply: every change is an op; all else byte for byte
  const r = cli(dir, ["--apply"]);
  ok(r.code === 0, `${fx}: apply exit ${r.code} ${r.err}`);
  console.log(r.out.split("\n").map((l) => "  | " + l).join("\n"));
  const st = state(dir), snap2 = walk(dir);
  ok(st.status === "done", `${fx}: status done`);
  const changed = diffMaps(snap1, snap2).filter((p) => !isBackup(p) && !isState(p));
  for (const p of changed) {
    const op = st.ops.find((o) => o.path === p && o.action !== "backup" && o.done);
    ok(op && op.source && op.reason && op.path, `${fx}: change of ${p} has no op with source/target/reason`);
  }
  for (const [p, h] of S) if (!kernel.has(p) && !changed.includes(p)) ok(snap2.get(p) === h, `${fx}: ${p} changed without an op`);
  ok(!/not finished/.test(cli(dir, ["--check"]).out), `${fx}: --check quiet after done`);
  console.log(`  ops: ${st.ops.filter((o) => o.action !== "backup").map((o) => `${o.action} ${o.path}`).join("; ")}`);
  console.log(`  additions: ${st.additions.map((a) => `${a.id} ${a.source}→${a.target} (${a.kind})`).join("; ") || "none"}`);

  // (2) no duplicate fact
  const dupCheck = (label, skipDel) => {
    const live = [...walk(dir).keys()].filter((p) => !isBackup(p) && !isState(p) && p.endsWith(".md") && !(skipDel && DEL.includes(p)));
    const texts = new Map(live.map((p) => [p, readFileSync(join(dir, p), "utf8").split("\n").map(norm)]));
    const lines = [...st.additions.flatMap((a) => a.text.replace(/^#{1,3}(?=\s)/gm, "####").split("\n")), ...st.person.respondLines, ...st.person.identityLines].map(norm).filter((l) => l.trim());
    for (const l of lines) {
      const where = live.filter((p) => texts.get(p).includes(l));
      ok(where.length === 1, `${fx} ${label}: "${l}" lives in ${where.length} files: ${where.join(", ")}`);
    }
  };
  dupCheck("before deletion", true);

  // (3) a second run changes nothing
  const before = walk(dir);
  cli(dir, ["--apply"]);
  ok(diffMaps(before, walk(dir)).filter((p) => !isState(p)).length === 0, `${fx}: second run changed files`);
  reference[fx] = normTree(dir);

  // per-fixture meaning
  const rd = (p) => readFileSync(join(dir, p), "utf8");
  const user = rd("user/user.md"), soul = rd("SOUL.md");
  ok(!/How to respond to me/.test(user) && !/\*\*Address me as:\*\*/.test(user), `${fx}: user.md still has moved lines`);
  ok(!/\[[A-Z][A-Z_]+\]/.test(soul), `${fx}: SOUL.md has a token left`);
  ok(existsSync(join(dir, ".gitignore")) && rd(".gitignore").includes("system/.secrets/"), `${fx}: .gitignore`);
  if (fx === "a") {
    const core = rd("business/kavarnia-zerno/core/business.md");
    ok(core.includes("## Sources\n\n| Source | What it holds | How to reach it |\n|---|---|---|\n| _(none yet)_ | | |\n") &&
      core.includes("## Own to this business\n\n| Folder | What |\n|---|---|\n| _(none yet)_ | |\n") && !core.includes("Moved here"), "a: core gets empty Sources and Own, no block");
  }
  if (fx === "b") {
    const yc = rd("business/yoga-studio-prana/core/business.md");
    ok(/## Sources\n\n\| Source[^\n]*\n\|---\|---\|---\|\n\| Cloud storage \| the business's files \| Google Drive › Мій диск › Прана \|\n\| CRM \| клієнти й абонементи \| KeyCRM, акаунт студії \|\n/.test(yc), "b: yoga Sources section");
    ok(/## Own to this business\n\n\| Folder \| What \|\n\|---\|---\|\n\| `retreaty\/` \|/.test(yc) && !yc.includes("Moved here"), "b: yoga Own section, no block");
    const yoga = rd("business/yoga-studio-prana/core/business.md"), foto = rd("business/foto-kurs/core/business.md");
    ok(yoga.includes("Google Drive") && yoga.includes("KeyCRM") && yoga.includes("retreaty") && !yoga.includes("Dropbox") && !yoga.includes("vorkshopy"), "b: yoga block");
    ok(foto.includes("Dropbox") && foto.includes("vorkshopy") && !foto.includes("Google Drive"), "b: foto block");
    ok(rd("business/foto-kurs/CONTEXT.md") === rd("business/yoga-studio-prana/CONTEXT.md"), "b: maps equal");
    ok(existsSync(join(dir, "business/foto-kurs/offers/CONTEXT.md")) && existsSync(join(dir, "business/yoga-studio-prana/offers/CONTEXT.md")), "b: offers maps");
  }
  if (fx === "c1" || fx === "c2") {
    const core = rd("business/pekarnia-khlib/core/business.md");
    ok(soul.includes("## Мої правила") && soul.includes("Фото пекарні — лише в iCloud") && soul.includes("Мої рецепти для дому") && soul.includes("Не використовуй емодзі"), `${fx}: SOUL has person rules`);
    ok(core.includes("Ціни пекарні") && core.includes("Постачальники пекарні") && core.includes("retsepty/") && core.includes("iCloud Drive › Пекарня"), `${fx}: core has business lines`);
    ok(!soul.includes("Ціни пекарні"), `${fx}: business rule not in SOUL`);
    ok(user.includes("`sport/`") && !user.includes("`health/`"), `${fx}: sport row moved to user.md, health row not`);
  }
  if (fx === "c2") {
    ok(soul.startsWith("# Мій SOUL\n\n- Пиши детально, з прикладами.") && soul.includes("If anything below contradicts the text above, the text above wins.") && soul.includes("- **Length:** коротко"), "c2: SOUL kept + block");
    ok(rd("business/pekarnia-khlib/core/business.md").includes("Підписку пропонуй першою.") && !rd("business/pekarnia-khlib/offers/CONTEXT.md").includes("Мої офери"), "c2: self-made offers map moved");
  }

  cpSync(dir, join(RUNS, `${fx}-view`), { recursive: true });   // a migrated copy to look at by eye
  // (6) restore after the move → 0.8.3 byte for byte
  const rp = cli(dir, ["--restore"]);
  ok(/plan/.test(rp.out), `${fx}: restore preview`);
  const rr = cli(dir, ["--restore", "--apply"]);
  ok(rr.code === 0 && /0\.8\.3 is back/.test(rr.out), `${fx}: restore apply: ${rr.out}${rr.err}`);
  const back = walk(dir);
  for (const [p, h] of S) ok(back.get(p) === h, `${fx}: after restore ${p} differs`);
  for (const p of back.keys()) if (!S.has(p) && !isBackup(p) && !isState(p)) ok(false, `${fx}: after restore extra file ${p}`);
}

// (4) a stop after each step, then a new run → the same as without a stop
console.log("\n== (4) interruption");
for (const fx of FIXTURES) for (const s of STEPS) {
  const { dir } = setup(fx, `${fx}-stop-${s}`);
  const r1 = cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: s });
  ok(r1.code === 75, `${fx} ${s}: expected exit 75, got ${r1.code} ${r1.err}`);
  ok(/not finished/.test(cli(dir, ["--check"]).out) || s === "S8", `${fx} ${s}: --check after a stop`);
  const r2 = cli(dir, ["--apply"]);
  ok(r2.code === 0 && state(dir).status === "done", `${fx} ${s}: rerun`);
  const d = diffMaps(reference[fx], normTree(dir));
  ok(d.length === 0, `${fx} ${s}: differs from the run without a stop: ${d.join(", ")}`);
  rmSync(dir, { recursive: true, force: true });
}
console.log(`  ${FIXTURES.length * STEPS.length} cases`);

// a stale .tmp and a lock of a dead process are cleared
{
  const { dir } = setup("c1", "c1-tmp");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  writeFileSync(join(dir, "user/user.md.aios-migrate.tmp"), "half");
  ok(state(dir).lock && state(dir).lock.pid, "lock left by the stopped process");
  cli(dir, ["--apply"]);
  ok(!existsSync(join(dir, "user/user.md.aios-migrate.tmp")) && state(dir).status === "done", "tmp removed, finished");
}

// (5) deletions
console.log("\n== (5) deletions");
const delCase = (name, answer, check) => {
  const { dir } = setup("c1", `c1-del-${name}`);
  cli(dir, ["--apply"]);
  const r = cli(dir, ["--apply", `--delete-old=${answer}`]);
  check(dir, state(dir), r.out);
  return dir;
};
const dAll = delCase("all", "all", (dir, st) => {
  for (const p of DEL) ok(!existsSync(join(dir, p)), `all: ${p} still there`);
  ok(PERSONAS.every((p) => !existsSync(join(dir, "system/agents", p))) && existsSync(join(dir, "system/agents/curator/AGENT.md")), "all: persona folders removed, curator kept");
  ok(st.deletions.every((e) => e.answer === "yes"), "all: answers yes");
  ok(st.ops.filter((o) => o.action === "delete").length === DEL.length, "all: delete ops");
});
{ // (2) after deletion: every moved line lives in exactly one file
  const st = state(dAll);
  const live = [...walk(dAll).keys()].filter((p) => !isBackup(p) && !isState(p) && p.endsWith(".md"));
  const texts = new Map(live.map((p) => [p, readFileSync(join(dAll, p), "utf8").split("\n").map(norm)]));
  for (const l of st.additions.flatMap((a) => a.text.replace(/^#{1,3}(?=\s)/gm, "####").split("\n")).map(norm).filter((x) => x.trim()))
    ok(live.filter((p) => texts.get(p).includes(l)).length === 1, `after delete all: "${l}" not in exactly one file`);
  // restore after deletions too
  const rr = cli(dAll, ["--restore", "--apply"]);
  const back = walk(dAll), S = sums("c1");
  for (const [p, h] of S) ok(back.get(p) === h, `restore after delete-all: ${p}`);
  for (const p of back.keys()) if (!S.has(p) && !isBackup(p) && !isState(p)) ok(false, `restore after delete-all: extra ${p}`);
}
delCase("none", "none", (dir, st) => {
  for (const p of DEL) ok(existsSync(join(dir, p)), `none: ${p} gone`);
  ok(st.deletions.every((e) => e.answer === "no"), "none: answers no");
});
delCase("some", "CLAUDE.md,GEMINI.md", (dir, st) => {
  ok(!existsSync(join(dir, "CLAUDE.md")) && !existsSync(join(dir, "GEMINI.md")) && existsSync(join(dir, "CONTEXT.md")) && existsSync(join(dir, "system/offers.md")), "some: only named deleted");
  ok(st.deletions.filter((e) => e.answer === "yes").length === 2 && st.deletions.filter((e) => e.answer === "no").length === DEL.length - 2, "some: answers");
});
{
  const { dir } = setup("c1", "c1-del-changed");
  cli(dir, ["--apply"]);
  writeFileSync(join(dir, "CLAUDE.md"), readFileSync(join(dir, "CLAUDE.md"), "utf8") + "Ще одне правило.\n");
  const r = cli(dir, ["--apply", "--delete-old=all"]);
  let st = state(dir);
  ok(existsSync(join(dir, "CLAUDE.md")) && st.deletions.find((e) => e.path === "CLAUDE.md").answer === "changed-after-ask", "changed: kept, changed-after-ask");
  ok(!existsSync(join(dir, "GEMINI.md")), "changed: the others deleted");
  ok(/changed after the list was shown/.test(r.out), "changed: said so");
  // R12 (Codex 8): next "update aios" never offers it again — its new lines were not moved
  const again = cli(dir, ["--apply"]);
  st = state(dir);
  const e = st.deletions.find((x) => x.path === "CLAUDE.md");
  ok(e.answer === "kept-changed" && /stays/.test(again.out) && !/\d+\. CLAUDE\.md/.test(again.out), "R12 changed after ask: kept for good, not listed again");
  cli(dir, ["--apply", "--delete-old=all"]);
  ok(existsSync(join(dir, "CLAUDE.md")) && readFileSync(join(dir, "CLAUDE.md"), "utf8").includes("Ще одне правило."), "R12 changed after ask: a second yes does not delete it");
}
{
  const { dir } = setup("c1", "c1-del-deferred");
  cli(dir, ["--apply"]);
  cli(dir, ["--apply"]);   // no answer came; a new "update aios"
  const st = state(dir);
  ok(st.log.some((l) => /no answer → deferred/.test(l)) && st.deletions.every((e) => e.answer === "asked"), "deferred: logged, asked again");
  ok(!/old AIOS file/.test(cli(dir, ["--check"]).out), "deferred: --check does not mention deletions");
}

// restore with only run 1 (no state yet), and without any backup
console.log("\n== restore edge cases, templates missing, not-needed");
{
  const { dir } = setup("b", "b-restore-run1-only");
  const r = cli(dir, ["--restore", "--apply"]);
  const back = walk(dir), S = sums("b");
  for (const [p, h] of S) ok(back.get(p) === h, `restore run1-only: ${p}`);
  for (const p of back.keys()) if (!S.has(p) && !isBackup(p) && !isState(p)) ok(false, `restore run1-only: extra ${p}`);
  rmSync(join(dir, ".aios-backup"), { recursive: true, force: true });
}
{
  const { dir } = setup("a", "a-no-backup");
  rmSync(join(dir, ".aios-backup"), { recursive: true, force: true });
  const before = walk(dir);
  const r = cli(dir, ["--restore", "--apply"]);
  ok(/Cannot restore/.test(r.out) && diffMaps(before, walk(dir)).length === 0, "restore without backup refuses");
}
{
  const { dir } = setup("c1", "c1-no-template");
  rmSync(join(dir, "system/skills/setup/templates/business-map.md"));
  const before = walk(dir);
  const r = cli(dir, ["--apply"]);
  ok(/not finished: a template could not be read/.test(r.out) && diffMaps(before, walk(dir)).length === 0, "missing template: nothing changed");
  writeFileSync(join(dir, "system/skills/setup/templates/business-map.md"), "  \n");
  ok(/could not be read/.test(cli(dir, ["--apply"]).out), "empty template: blocked");
}
{
  const dir = join(RUNS, "fresh-0.9");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, "system"), { recursive: true });
  mkdirSync(join(dir, "user"), { recursive: true });
  copyFileSync(join(T, "system/migrate-0.9.mjs"), join(dir, "system/migrate-0.9.mjs"));
  writeFileSync(join(dir, "system/managed-files.json"), JSON.stringify({ aios_version: "0.9.0", managed: [] }));
  writeFileSync(join(dir, "user/user.md"), "# X\n\n## Identity\n");
  const r = cli(dir, ["--apply"]);
  ok(/status=not-needed/.test(r.out) && state(dir).status === "not-needed", "fresh 0.9: not-needed");
  copyFileSync(join(T, "system/.aios-migration.json"), join(dir, "system/.aios-migration.json"));
  ok(/status=not-needed/.test(cli(dir, ["--check"]).out), "shipped state file: not-needed");
}
{ // lock held by a live process
  const { dir } = setup("a", "a-lock");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S2" });
  const st = state(dir); st.lock = { pid: process.pid, at: new Date().toISOString() };
  writeFileSync(join(dir, "system/.aios-migration.json"), JSON.stringify(st));
  ok(/status=busy/.test(cli(dir, ["--apply"]).out), "lock of a live process refuses");
}

{ // Windows files: CRLF and BOM are kept, own lines are still found
  const { dir } = setup("c1", "c1-crlf");
  const crlf = (p, bom) => { const t = readFileSync(join(dir, p), "utf8").replace(/\r?\n/g, "\r\n"); writeFileSync(join(dir, p), (bom ? "\uFEFF" : "") + t); };
  crlf("user/user.md", true); crlf("business/pekarnia-khlib/core/business.md", false); crlf("CONTEXT.md", false);
  crlf(`.aios-backup/${RUN1}/AGENTS.md`, true);
  cli(dir, ["--apply"]);
  const u = readFileSync(join(dir, "user/user.md"), "utf8"), c = readFileSync(join(dir, "business/pekarnia-khlib/core/business.md"), "utf8");
  ok(u.startsWith("\uFEFF") && !/[^\r]\n/.test(u) && !u.includes("How to respond"), "crlf: user.md keeps BOM and CRLF");
  ok(!/[^\r]\n/.test(c) && c.includes("Ціни пекарні"), "crlf: core keeps CRLF, rule moved");
  ok(state(dir).additions.length === 11, `crlf: same pieces found (${state(dir).additions.length})`);
}

{ // core/business.md already in the new format: rows go into its tables, no duplicate
  const { dir } = setup("b", "b-core-new-format");
  const p = join(dir, "business/yoga-studio-prana/core/business.md");
  writeFileSync(p, readFileSync(p, "utf8").replace("## Rules for agents", "## Sources\n\n| Source | What it holds | How to reach it |\n|---|---|---|\n| Cloud storage | the business's files | Google Drive › Мій диск › Прана |\n\n## Own to this business\n\nNone written yet.\n\n## Rules for agents"));
  cli(dir, ["--apply"]);
  const c = readFileSync(p, "utf8");
  ok(c.split("Google Drive › Мій диск › Прана").length === 2 && c.includes("| Cloud storage | the business's files | Google Drive › Мій диск › Прана |\n| CRM |"), "new format: Sources row added once");
  ok(c.includes("## Own to this business\n\n| Folder | What |\n|---|---|\n| `retreaty/` |") && !c.includes("None written yet.\n\n## Rules") && c.split("## Sources").length === 2, "new format: Own table replaces None written yet, no second section");
  ok(state(dir).ops.find((o) => o.path === "business/yoga-studio-prana/core/business.md" && o.action !== "backup").action === "edit", "new format: op is edit");
  cli(dir, ["--restore", "--apply"]);
  ok(readFileSync(p, "utf8").includes("None written yet.\n\n## Rules"), "new format: restore puts the text back");
}

// ===== findings of the code review (output/kod-reviu-zvedennia.md) =====
console.log("\n== code review findings");
const rd = (dir, p) => readFileSync(join(dir, p), "utf8");
const OUT = join(RUNS, "outside");
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const { symlinkSync, renameSync } = await import("node:fs");

{ // R1: a write that is refused stops the dependent steps; status stays running; a rerun finishes
  const { dir } = setup("c1", "r1-soul-link");
  writeFileSync(join(OUT, "soul-target.md"), "# outside\n");
  symlinkSync(join(OUT, "soul-target.md"), join(dir, "SOUL.md"));
  const userBefore = rd(dir, "user/user.md");
  const r = cli(dir, ["--apply"]);
  ok(/status=blocked/.test(r.out) && /NOT finished/.test(r.out), "R1 soul link: blocked, said so");
  ok(rd(dir, "user/user.md") === userBefore, "R1 soul link: user.md untouched (S4 did not run)");
  ok(state(dir).status === "running" && state(dir).halted && /not finished/i.test(cli(dir, ["--check"]).out), "R1 soul link: running, --check not finished");
  ok(rd(dir, "user/CONTEXT.md").includes("sport/") && readFileSync(join(OUT, "soul-target.md"), "utf8") === "# outside\n", "R1 soul link: user map and the outside file untouched");
  rmSync(join(dir, "SOUL.md"));
  const r2 = cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").includes("Не використовуй емодзі") && !rd(dir, "user/user.md").includes("How to respond"), "R1 soul link: after the fix the rerun finishes");
}
{ // R1b: the folder's own file is a link → its map is not replaced
  const { dir } = setup("c2", "r1b-data-link");
  writeFileSync(join(OUT, "products-target.md"), "# outside products\n");
  symlinkSync(join(OUT, "products-target.md"), join(dir, "business/pekarnia-khlib/products/products.md"));
  const mapBefore = rd(dir, "business/pekarnia-khlib/products/CONTEXT.md");
  cli(dir, ["--apply"]);
  ok(rd(dir, "business/pekarnia-khlib/products/CONTEXT.md") === mapBefore && state(dir).status === "running", "R1b data link: products map kept, not done");
  ok(readFileSync(join(OUT, "products-target.md"), "utf8") === "# outside products\n", "R1b data link: the outside file untouched");
}
{ // R2 (Claude 1 Б): user.md changed between two runs → the new text is used, nothing lost
  const { dir } = setup("c1", "r2-user-changed");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S2" });
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("## How to respond to me\n", "## How to respond to me\n\n- Нове правило між запусками.\n"));
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").includes("Нове правило між запусками.") && !rd(dir, "user/user.md").includes("Нове правило"), "R2 user.md changed between runs: the new rule moved to SOUL.md");
}
{ // R3 (DeepSeek 1, Claude 1 В): core/business.md changed between runs → kept, and the map's own lines moved too
  const { dir } = setup("c1", "r3-core-changed");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S5" });
  const p = "business/pekarnia-khlib/core/business.md";
  writeFileSync(join(dir, p), rd(dir, p) + "\n- **Нова примітка:** між запусками\n");
  cli(dir, ["--apply"]);
  const core = rd(dir, p);
  ok(state(dir).status === "done" && core.includes("Нова примітка") && core.includes("Постачальники пекарні") && core.includes("iCloud Drive › Пекарня"), "R3 core changed between runs: client line kept, map lines moved");
  ok(readdirSync(join(dir, state(dir).backup)).some((n) => n.startsWith("earlier-")), "R3 core changed between runs: the older copy kept in earlier-*");
}
{ // R4 (Codex 2): SOUL.md created between two runs → not overwritten, the block is added at its end
  const { dir } = setup("a", "r4-soul-appeared");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S2" });
  writeFileSync(join(dir, "SOUL.md"), "# Мій SOUL\n\nKEEP_THIS\n");
  cli(dir, ["--apply"]);
  const s = rd(dir, "SOUL.md");
  ok(state(dir).status === "done" && s.startsWith("# Мій SOUL\n\nKEEP_THIS") && s.includes("Moved here by the 0.9 update"), "R4 SOUL appeared between runs: kept, block added");
}
{ // R5 (Claude 2, Codex 3, DeepSeek 2): no user.md → it is made with the own lines of the old user map
  const { dir } = setup("c1", "r5-no-user-md");
  rmSync(join(dir, "user/user.md"));
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && existsSync(join(dir, "user/user.md")) && rd(dir, "user/user.md").includes("`sport/`"), "R5 no user.md: created with the sport/ row");
}
{ // R6 (Claude 3): --restore keeps what the customer wrote after the update; the 0.8.3 text goes beside
  const { dir } = setup("a", "r6-restore-keeps");
  cli(dir, ["--apply"]);
  const p = "business/kavarnia-zerno/core/business.md";
  writeFileSync(join(dir, p), rd(dir, p) + "\n- **Факт після оновлення:** так\n");
  const r = cli(dir, ["--restore", "--apply"]);
  ok(rd(dir, p).includes("Факт після оновлення") && /you changed it after the update/.test(r.out), "R6 restore: the newer client text kept, said so");
  ok(sha(readFileSync(join(dir, "business/kavarnia-zerno/core/business.0.8.3.md"))) === sums("a").get(p), "R6 restore: the 0.8.3 text is beside it");
}
{ // R7 (Claude 4, Codex 10): a file that is not UTF-8 is never rewritten
  const { dir } = setup("c1", "r7-cp1251");
  const p = "business/pekarnia-khlib/core/business.md";
  const cp = Buffer.from([0x23, 0x20, 0xcf, 0xe5, 0xea, 0xe0, 0xf0, 0xed, 0xff, 0x0a]);   // "# Пекарня" in cp1251
  writeFileSync(join(dir, p), cp);
  const mapBefore = rd(dir, "business/pekarnia-khlib/CONTEXT.md");
  const r = cli(dir, ["--apply"]);
  ok(/UTF-8/.test(r.out) && readFileSync(join(dir, p)).equals(cp) && rd(dir, "business/pekarnia-khlib/CONTEXT.md") === mapBefore, "R7 cp1251 core: not rewritten, map kept, said so");
  const { dir: d2 } = setup("a", "r7-utf16");
  writeFileSync(join(d2, "user/user.md"), Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from("# X\n", "utf16le")]));
  const u = readFileSync(join(d2, "user/user.md"));
  const r2 = cli(d2, ["--apply"]);
  ok(/UTF-8/.test(r2.out) && readFileSync(join(d2, "user/user.md")).equals(u) && !existsSync(join(d2, "SOUL.md")), "R7 utf-16 user.md: nothing written");
}
{ // R8 (Claude 5, Codex 12): [CTA] in the customer's text stays as it is
  const { dir } = setup("a", "r8-brackets");
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("**Tone:** дружній, без офіціозу", "**Tone:** дружній; блоки [CTA] і [TODO] лиши як є"));
  cli(dir, ["--apply"]);
  ok(rd(dir, "SOUL.md").includes("блоки [CTA] і [TODO] лиши як є"), "R8 brackets: kept in SOUL.md");
}
{ // R9 (Claude 10, Codex 4, DeepSeek 8): a folder that is a link to another place is never written through
  const { dir } = setup("c1", "r9-user-link");
  const ext = join(OUT, "user-outside");
  renameSync(join(dir, "user"), ext); symlinkSync(ext, join(dir, "user"));
  const before = readFileSync(join(ext, "user.md"));
  const r = cli(dir, ["--apply"]);
  ok(/link to another place|outside the AIOS folder/.test(r.out) && readFileSync(join(ext, "user.md")).equals(before) && state(dir).status === "running", "R9 user/ is a link: nothing outside changed, stopped");
  const { dir: d2 } = setup("c1", "r9-agents-link");
  cli(d2, ["--apply"]);
  const ext2 = join(OUT, "agents-outside");
  renameSync(join(d2, "system/agents"), ext2); symlinkSync(ext2, join(d2, "system/agents"));
  cli(d2, ["--apply", "--delete-old=all"]);
  ok(existsSync(join(ext2, "marketer/AGENT.md")), "R9 system/agents is a link: --delete-old does not delete outside");
}
{ // R10 (Codex 7, DeepSeek 7): a damaged record of the move cannot make --restore write outside
  const { dir } = setup("a", "r10-restore-path");
  cli(dir, ["--apply"]);
  const st = state(dir);
  st.ops.push({ id: "Ox", key: "x", step: "S6-business", path: "../outside-restore.md", action: "replace", sha_before: "0", sha_after: "1", backup: st.ops.find((o) => o.backup && o.action !== "backup").backup, done: true });
  writeFileSync(join(dir, "system/.aios-migration.json"), JSON.stringify(st));
  const r = cli(dir, ["--restore", "--apply"]);
  ok(/not allowed/.test(r.out) && !existsSync(join(RUNS, "outside-restore.md")) && existsSync(join(dir, "SOUL.md")), "R10 restore: damaged record refused, nothing changed");
}
{ // R11 (DeepSeek 4): no record after the move → --restore refuses instead of a half restore
  const { dir } = setup("a", "r11-restore-no-state");
  cli(dir, ["--apply"]);
  rmSync(join(dir, "system/.aios-migration.json"));
  const before = walk(dir);
  const r = cli(dir, ["--restore", "--apply"]);
  ok(/record .* is missing/.test(r.out) && diffMaps(before, walk(dir)).length === 0, "R11 restore without the record: refused, nothing changed");
}
{ // R13 (DeepSeek 9): the own lines of How to respond to me are not added twice to an existing SOUL.md
  const { dir } = setup("c2", "r13-dup");
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("## How to respond to me\n", "## How to respond to me\n\nОдне власне правило без поля.\n"));
  cli(dir, ["--apply"]);
  ok(rd(dir, "SOUL.md").split("Одне власне правило без поля.").length === 2, "R13 existing SOUL: own respond line once");
}
{ // R14 (DeepSeek 10): the record is lost after a finished move → recovered, nothing duplicated
  const { dir } = setup("a", "r14-lost-state");
  cli(dir, ["--apply"]);
  rmSync(join(dir, "system/.aios-migration.json"));
  const before = walk(dir);
  const r = cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && state(dir).recovered && diffMaps(before, walk(dir)).filter((p) => !isState(p)).length === 0, "R14 lost record, finished move: recovered, no file changed");
  const { dir: d2 } = setup("c1", "r14-lost-state-unsure");
  cli(d2, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  rmSync(join(d2, "system/.aios-migration.json"));
  const b2 = walk(d2);
  const r2 = cli(d2, ["--apply"]);
  ok(/record of the 0.9 move .* is missing/.test(r2.out) && diffMaps(b2, walk(d2)).length === 0, "R14 lost record, unfinished move: stopped, nothing changed");
  const { dir: d3 } = setup("c1", "r14-lost-state-s5");
  cli(d3, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S5" });
  rmSync(join(d3, "system/.aios-migration.json"));
  ok(/record of the 0.9 move .* is missing/.test(cli(d3, ["--apply"]).out), "R14 lost record after S5 (user map new, business maps old): not taken for finished");
}
{ // R15 (Claude 8): the run-1 backup is in iCloud, not on this computer → the move waits
  const { dir } = setup("c1", "r15-icloud-prev");
  const a = join(dir, ".aios-backup", RUN1, "AGENTS.md");
  renameSync(a, join(dirname(a), ".AGENTS.md.icloud"));
  const before = walk(dir);
  const r = cli(dir, ["--apply"]);
  ok(/in iCloud and not on this computer/.test(r.out) && diffMaps(before, walk(dir)).length === 0, "R15 icloud run-1 backup: waits, nothing changed");
}
{ // R16 (Claude 17): How to respond to me ends at any heading of level 1 or 2
  const { dir } = setup("a", "r16-h1");
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("## More about me", "# Нотатки\n\nМої нотатки лишаються тут.\n\n## More about me"));
  cli(dir, ["--apply"]);
  ok(rd(dir, "user/user.md").includes("Мої нотатки лишаються тут.") && !rd(dir, "SOUL.md").includes("Мої нотатки"), "R16 H1 after the section: notes stay in user.md");
}
{ // R17 (DeepSeek 14): a short one-word business name does not pull a personal rule into that business
  const { dir } = setup("c1", "r17-short-name");
  const core = "business/pekarnia-khlib/core/business.md";
  writeFileSync(join(dir, core), rd(dir, core).replace("# Пекарня «Хліб»", "# Хліб"));
  const ag = join(dir, ".aios-backup", RUN1, "AGENTS.md");
  writeFileSync(ag, readFileSync(ag, "utf8") + "\n- Слово хліб пиши з малої.\n");
  cli(dir, ["--apply"]);
  ok(rd(dir, "SOUL.md").includes("Слово хліб пиши з малої.") && !rd(dir, core).includes("Слово хліб"), "R17 short name: the rule stays the person's");
}
{ // R18 (Claude 16): own skills → the report asks the agent to rebuild the catalog
  const { dir } = setup("c1", "r18-skills");
  mkdirSync(join(dir, "system/skills/my-skill"), { recursive: true });
  writeFileSync(join(dir, "system/skills/my-skill/SKILL.md"), "---\nname: my-skill\ndescription: test\n---\n");
  ok(/build-skills-catalog/.test(cli(dir, ["--apply"]).out), "R18 own skills: rebuild the catalog");
}
{ // R19 (Codex 9): --restore removes its own code last, so a cut-off restore can run again
  const { dir } = setup("a", "r19-restore-order");
  cli(dir, ["--apply"]);
  const plan = cli(dir, ["--restore"]).out.split("\n").filter((l) => /^\s+[←\-+] /.test(l));
  const last = plan.slice(-4).join("\n");
  ok(/system\/update\.mjs/.test(plan[plan.length - 1]) && /managed-files\.json/.test(plan[plan.length - 2]) && /migrate-0\.9/.test(plan[plan.length - 3] + plan[plan.length - 4]), "R19/RR7 restore: the move's code, then the version marker, then the updater last");
}
{ // R20 (Claude 9, DeepSeek 12): setup asks a line whose value is unknown, and an overwrite keeps the business's own sections
  const id = readFileSync(join(T, "system/skills/setup/01_identity/CONTEXT.md"), "utf8"), bz = readFileSync(join(T, "system/skills/setup/02_business/CONTEXT.md"), "utf8");
  ok(/value is exactly `unknown`/.test(id) && /put the copied sections back/.test(bz), "R20 setup texts: unknown is asked; overwrite keeps Sources, Own, Rules");
}

// ===== the second review (handoff/rereview-codex.md) =====
console.log("\n== second review");
{ // RR1a: a rule added to CLAUDE.md after SOUL.md was written is moved too, before CLAUDE.md is offered for deletion
  const { dir } = setup("c1", "rr1a-late-claude");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "Нове правило між запусками.\n");
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").includes("Нове правило між запусками.") && /added during the update/.test(rd(dir, "SOUL.md")), "RR1a: the late rule is in SOUL.md");
  cli(dir, ["--apply", "--delete-old=all"]);
  ok(!existsSync(join(dir, "CLAUDE.md")) && rd(dir, "SOUL.md").includes("Нове правило між запусками."), "RR1a: after yes the rule still lives in SOUL.md");
}
{ // RR1b: an own row added to user/CONTEXT.md after user.md was written is moved before the map is replaced
  const { dir } = setup("c1", "rr1b-late-user-map");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S4" });
  writeFileSync(join(dir, "user/CONTEXT.md"), rd(dir, "user/CONTEXT.md").replace("| `sport/` |", "| `garden/` | мій город | `garden/plan.md` |\n| `sport/` |"));
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "user/user.md").includes("`garden/`") && !rd(dir, "user/CONTEXT.md").includes("garden"), "RR1b: the late row is in user.md");
}
{ // RR5: How to respond to me changed after SOUL.md was written → the new line goes to SOUL.md; no endless stop
  const { dir } = setup("c1", "rr5-respond-late");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("## How to respond to me\n", "## How to respond to me\n\n- Без смайликів у відповідях.\n"));
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").includes("Без смайликів у відповідях.") && !rd(dir, "user/user.md").includes("How to respond"), "RR5: the changed rule moved, the move finished");
}
{ // RR2: the 0.8.3 text next to a changed file never overwrites a file of the customer with that name
  const { dir } = setup("a", "rr2-beside-free-name");
  cli(dir, ["--apply"]);
  const p = "business/kavarnia-zerno/core/business.md";
  writeFileSync(join(dir, p), rd(dir, p) + "\n- **Факт:** після оновлення\n");
  writeFileSync(join(dir, "business/kavarnia-zerno/core/business.0.8.3.md"), "МІЙ ВЛАСНИЙ ФАЙЛ\n");
  cli(dir, ["--restore", "--apply"]);
  ok(rd(dir, "business/kavarnia-zerno/core/business.0.8.3.md") === "МІЙ ВЛАСНИЙ ФАЙЛ\n" && sha(readFileSync(join(dir, "business/kavarnia-zerno/core/business.0.8.3-2.md"))) === sums("a").get(p), "RR2: own file kept, the 0.8.3 text under a free name");
}
{ // RR3: a deleted old file that the customer made again is not overwritten by --restore
  const { dir } = setup("a", "rr3-recreated");
  cli(dir, ["--apply"]); cli(dir, ["--apply", "--delete-old=all"]);
  writeFileSync(join(dir, "CLAUDE.md"), "НОВЕ ПРАВИЛО\n");
  cli(dir, ["--restore", "--apply"]);
  ok(rd(dir, "CLAUDE.md") === "НОВЕ ПРАВИЛО\n" && sha(readFileSync(join(dir, "CLAUDE.0.8.3.md"))) === sums("a").get("CLAUDE.md"), "RR3: the new CLAUDE.md kept, the old one beside");
}
{ // RR4: a record rebuilt after it was lost lists no changes → --restore refuses instead of a false success
  const { dir } = setup("a", "rr4-recovered-restore");
  cli(dir, ["--apply"]);
  rmSync(join(dir, "system/.aios-migration.json"));
  cli(dir, ["--apply"]);
  ok(state(dir).recovered, "RR4 setup: the record was rebuilt");
  const before = walk(dir);
  const r = cli(dir, ["--restore", "--apply"]);
  ok(/rebuilt after it was lost/.test(r.out) && diffMaps(before, walk(dir)).length === 0, "RR4: refused, nothing changed");
}

// ===== the second review, round 2 (handoff/rereview2-codex.md) =====
console.log("\n== second review, round 2");
{ // RR8: --restore after late additions → 0.8.3 again (SOUL.md gone, user.md back), no false "you changed it"
  const { dir } = setup("c1", "rr8-late-restore");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S4" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "Пізнє правило.\n");
  writeFileSync(join(dir, "user/CONTEXT.md"), rd(dir, "user/CONTEXT.md").replace("| `sport/` |", "| `garden/` | город | `garden/plan.md` |\n| `sport/` |"));
  cli(dir, ["--apply"]);
  const r = cli(dir, ["--restore", "--apply"]);
  ok(!existsSync(join(dir, "SOUL.md")) && rd(dir, "user/user.md").includes("How to respond to me") && !existsSync(join(dir, "user/user.0.8.3.md")) && !/you changed it/.test(r.out), "RR8: full 0.8.3 after late additions");
}
{ // RR10: a run cut off right after a late addition does not add it twice
  const { dir } = setup("c1", "rr10-late-cut");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S4" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "PARTIAL_MARKER\n");
  ok(cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "late" }).code === 75, "RR10 setup: stopped after the late addition");
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").split("PARTIAL_MARKER").length === 2, "RR10: the late line once");
}
{ // RR11: a new How to respond line after SOUL.md was written goes there once
  const { dir } = setup("a", "rr11-respond-once");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  writeFileSync(join(dir, "user/user.md"), rd(dir, "user/user.md").replace("## How to respond to me\n", "## How to respond to me\n\nLATE_RESPOND_ONCE\n"));
  cli(dir, ["--apply"]);
  ok(rd(dir, "SOUL.md").split("LATE_RESPOND_ONCE").length === 2, "RR11: once");
}
{ // RR12: a group that grew by one rule delivers only that rule
  const { dir } = setup("c1", "rr12-group");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S3" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "Ще одне правило в кінці.\n");
  cli(dir, ["--apply"]);
  const s = rd(dir, "SOUL.md");
  ok(s.split("Не використовуй емодзі.").length === 2 && s.includes("Ще одне правило в кінці."), "RR12: the old rule once, the new one added");
}

// ===== the second review, round 3 (handoff/rereview3-codex.md) =====
console.log("\n== second review, round 3");
{ // RR13: the same fact added later for another business still reaches that business
  const { dir } = setup("b", "rr13-same-fact");
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "\n## business/foto-kurs\n- **Місячний бюджет:** 12 345 грн.\n\n@AGENTS.md\n");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S6" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "\n## business/yoga-studio-prana\n- **Місячний бюджет:** 12 345 грн.\n");
  cli(dir, ["--apply"]); cli(dir, ["--apply", "--delete-old=all"]);
  ok(rd(dir, "business/foto-kurs/core/business.md").includes("Місячний бюджет") && rd(dir, "business/yoga-studio-prana/core/business.md").includes("Місячний бюджет") && !existsSync(join(dir, "CLAUDE.md")), "RR13: both businesses have the fact");
}
{ // RR14: a late addition cut off, then the source shifts (a blank line) or grows → each rule once
  const { dir } = setup("c1", "rr14-shift");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S4" });
  writeFileSync(join(dir, "CLAUDE.md"), rd(dir, "CLAUDE.md") + "LINE_SHIFT_MARKER\n");
  cli(dir, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "late" });
  writeFileSync(join(dir, "CLAUDE.md"), "\n" + rd(dir, "CLAUDE.md"));
  cli(dir, ["--apply"]);
  ok(state(dir).status === "done" && rd(dir, "SOUL.md").split("LINE_SHIFT_MARKER").length === 2, "RR14: shifted source, the late rule once");
  const { dir: d2 } = setup("c1", "rr14-grow");
  cli(d2, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "S4" });
  writeFileSync(join(d2, "CLAUDE.md"), rd(d2, "CLAUDE.md") + "FIRST_LATE\n");
  cli(d2, ["--apply"], { AIOS_MIGRATE_STOP_AFTER: "late" });
  writeFileSync(join(d2, "CLAUDE.md"), rd(d2, "CLAUDE.md") + "SECOND_LATE\n");
  cli(d2, ["--apply"]);
  const s = rd(d2, "SOUL.md");
  ok(s.split("FIRST_LATE").length === 2 && s.split("SECOND_LATE").length === 2, "RR14: grown source, each late rule once");
}

// fixtures untouched
for (const fx of FIXTURES) { const S = sums(fx), now = walk(join(FX, fx)); for (const [p, h] of S) ok(now.get(p) === h, `fixture ${fx} changed: ${p}`); }

console.log(`\n${fails ? "FAILED" : "ALL PASSED"}: ${passes} checks passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
