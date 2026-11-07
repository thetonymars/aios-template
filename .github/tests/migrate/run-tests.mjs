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
  for (const n of ["soul.md", "user-map.md", "business-map.md", "offers-map.md"]) files.set(`system/skills/setup/templates/${n}`, real(`system/skills/setup/templates/${n}`));
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
  // next "update aios" shows it again, with the new text, then yes deletes it
  const again = cli(dir, ["--apply"]);
  st = state(dir);
  const e = st.deletions.find((x) => x.path === "CLAUDE.md");
  ok(e.answer === "asked" && /CLAUDE\.md/.test(again.out) && e.sha_at_ask === sha(readFileSync(join(dir, "CLAUDE.md"))), "changed: asked again with the new text");
  cli(dir, ["--apply", "--delete-old=all"]);
  ok(!existsSync(join(dir, "CLAUDE.md")) && readFileSync(join(dir, state(dir).deletions.find((x) => x.path === "CLAUDE.md").backup), "utf8").includes("Ще одне правило."), "changed: deleted after the second yes; backup has the new text");
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

// fixtures untouched
for (const fx of FIXTURES) { const S = sums(fx), now = walk(join(FX, fx)); for (const [p, h] of S) ok(now.get(p) === h, `fixture ${fx} changed: ${p}`); }

console.log(`\n${fails ? "FAILED" : "ALL PASSED"}: ${passes} checks passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
