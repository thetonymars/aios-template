// Tests of system/update.mjs (the real updater) for the findings of the code review.
//   node ~/aios-p0140-work/tests/updater/run-updater-tests.mjs
// A local manifest server gives the template branch as api/template.js does, with a chosen version and
// extra (hostile) managed paths. Copies live in runs/v-updater/.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync, symlinkSync, renameSync, copyFileSync, lstatSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";

const W = process.env.AIOS_WORK || join(homedir(), "aios-p0140-work");
const T = join(W, "aios-template"), FX = join(W, "fixtures"), RUNS = join(W, "runs", "v-updater");
const sha = (b) => createHash("sha256").update(b).digest("hex");
let passes = 0, fails = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log(`  FAIL: ${m}`); } };

// --- the manifest, as api/template.js builds it ---
const SKIP = new Set(["LICENSE", "README.md", ".gitattributes"]);
function walk(dir, files = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n), rel = relative(T, p);
    if (rel === ".git" || rel === ".github" || n === ".DS_Store") continue;
    if (statSync(p).isDirectory()) walk(p, files); else if (!SKIP.has(rel)) files.push({ path: rel, content: readFileSync(p, "utf8") });
  }
  return files;
}
function manifest(version, extra = {}) {
  const files = walk(T).map((f) => ({ ...f }));
  const ag = files.find((f) => f.path === "AGENTS.md"); ag.content = ag.content.replace(/aios_version: [0-9.]+/, `aios_version: ${version}`);
  const mf = files.find((f) => f.path === "system/managed-files.json"), mfj = JSON.parse(mf.content);
  mfj.aios_version = version;
  mfj.managed = mfj.managed.map((e) => e.path === "AGENTS.md" ? { path: e.path, sha256: sha(Buffer.from(ag.content)) } : e);
  for (const [p, c] of Object.entries(extra)) { mfj.managed.push({ path: p, sha256: sha(Buffer.from(c)) }); files.push({ path: p, content: c }); }
  mf.content = JSON.stringify(mfj, null, 2) + "\n";
  return { version, dirs: [], files };
}
let served = manifest("0.9.0");
const srv = createServer((req, res) => { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(served)); });
await new Promise((r) => srv.listen(0, "127.0.0.1", r));
const URL = `http://127.0.0.1:${srv.address().port}/template`;

function run(dir, args, env = {}) {
  return new Promise((res) => {
    const p = spawn(process.execPath, ["system/update.mjs", ...args], { cwd: dir, env: { ...process.env, AIOS_MANIFEST_URL: URL, ...env } });
    let out = ""; p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => res({ code, out }));
  });
}
function copy(fx, name) { const d = join(RUNS, name); rmSync(d, { recursive: true, force: true }); mkdirSync(RUNS, { recursive: true }); cpSync(join(FX, fx), d, { recursive: true }); return d; }
const state = (d) => JSON.parse(readFileSync(join(d, "system/.aios-migration.json"), "utf8"));
async function migrated(fx, name) {   // the real two runs: the old 0.8.3 updater, then the new one
  const d = copy(fx, name);
  served = manifest("0.9.0");
  await run(d, ["--apply"]); await run(d, ["--apply"]);
  return d;
}
const OUT = join(RUNS, "outside"); rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });

console.log("== updater: code review findings");
{ // U1 (Codex 5, DeepSeek 6): another form of a path does not slip past user/ and business/
  const d = await migrated("a", "u1-forms");
  ok(state(d).status === "done", "U1 setup: migrated");
  const before = readFileSync(join(d, "user/user.md"));
  served = manifest("0.9.1", { "./user/user.md": "HACKED\n", "USER/user.md": "HACKED\n", "user\\user.md": "HACKED\n", "business/./kavarnia-zerno/core/business.md": "HACKED\n" });
  const r = await run(d, ["--apply"]);
  ok(readFileSync(join(d, "user/user.md")).equals(before) && !readFileSync(join(d, "business/kavarnia-zerno/core/business.md"), "utf8").includes("HACKED"), "U1: user.md and core untouched");
  ok(/unsafe path/.test(r.out), "U1: the forms are reported as unsafe");
}
{ // U2 (Codex 6): a manifest cannot make SOUL.md (or another file of the person) managed
  const d = await migrated("a", "u2-soul");
  const before = readFileSync(join(d, "SOUL.md"));
  served = manifest("0.9.1", { "SOUL.md": "SERVER TEXT\n", "system/external.md": "SERVER TEXT\n" });
  const r = await run(d, ["--apply"]);
  ok(readFileSync(join(d, "SOUL.md")).equals(before) && !readFileSync(join(d, "system/external.md"), "utf8").includes("SERVER TEXT") && /never refreshed/.test(r.out), "U2: SOUL.md and external.md untouched");
}
{ // U3 (Codex 4, Claude 10, DeepSeek 8): a folder that is a link to another place is never written through
  const d = await migrated("a", "u3-people-link");
  const ext = join(OUT, "people");
  renameSync(join(d, "people"), ext); symlinkSync(ext, join(d, "people"));
  const before = readFileSync(join(ext, "CONTEXT.md"));
  const m = manifest("0.9.1"); m.files.find((f) => f.path === "people/CONTEXT.md").content += "\nchanged in 0.9.1\n";
  const mf = m.files.find((f) => f.path === "system/managed-files.json"), j = JSON.parse(mf.content);
  j.managed = j.managed.map((e) => e.path === "people/CONTEXT.md" ? { ...e, sha256: sha(Buffer.from(m.files.find((f) => f.path === "people/CONTEXT.md").content)) } : e); mf.content = JSON.stringify(j);
  served = m;
  const r = await run(d, ["--apply"]);
  ok(readFileSync(join(ext, "CONTEXT.md")).equals(before) && /link to another place|symlink/.test(r.out), "U3: the outside people/CONTEXT.md untouched");
}
{ // U4 (Claude 7, Codex 11, DeepSeek 5): a business in the old shape (business.md, no core/) gets the 0.9 layout too
  const d = copy("a", "u4-legacy-business");
  mkdirSync(join(d, "business/staryi"), { recursive: true });
  writeFileSync(join(d, "business/staryi/business.md"), "---\ntype: business\n---\n\n# Старий бізнес\n\n## Niche\n\nтест\n");
  served = manifest("0.9.0");
  await run(d, ["--apply"]); const r2 = await run(d, ["--apply"]); const r3 = await run(d, ["--apply"]);
  const map = join(d, "business/staryi/CONTEXT.md");
  ok(existsSync(join(d, "business/staryi/core/business.md")) && existsSync(join(d, "business/staryi/offers/CONTEXT.md")) &&
    existsSync(map) && readFileSync(map).equals(readFileSync(join(T, "system/skills/setup/templates/business-map.md"))), `U4: legacy business has core/, the 0.9 map and the offers map`);
  ok(state(d).status === "done", "U4: the move is done");
}
{ // U5 (Claude 13): run 1 was cut off, then the server went back to 0.8.3 → the move still finishes from the disk
  const d = copy("a", "u5-rollback");
  for (const rel of ["system/update.mjs", "system/migrate-0.9.mjs", "system/migrate-0.9-base.json", ...["soul", "user-map", "business-map", "offers-map"].map((n) => `system/skills/setup/templates/${n}.md`)]) {
    mkdirSync(dirname(join(d, rel)), { recursive: true }); copyFileSync(join(T, rel), join(d, rel));
  }
  const r = await run(d, ["--apply"], { AIOS_MANIFEST_URL: "http://127.0.0.1:1/none" });
  ok(existsSync(join(d, "system/.aios-migration.json")) && state(d).status === "done" && existsSync(join(d, "SOUL.md")), "U5: the move finished without the server");
}
{ // U6 (DeepSeek 13): the move ran at the end of this run → no false "NOT FINISHED YET"
  const d = copy("a", "u6-no-false-alarm");
  writeFileSync(join(d, "system/update.mjs"), readFileSync(join(T, "system/update.mjs"), "utf8") + "\n// an older 0.9 build\n");
  copyFileSync(join(T, "system/migrate-0.9.mjs"), join(d, "system/migrate-0.9.mjs"));
  served = manifest("0.9.0");
  const r = await run(d, ["--apply"]);
  ok(state(d).status === "done" && !/NOT FINISHED YET/.test(r.out), "U6: no NOT FINISHED YET after the move ran");
}
{ // U7 (Claude 15): an error in the move is one plain sentence, not a stack trace
  const d = await migrated("a", "u7-error");
  const st = state(d); st.status = "running"; st.steps = st.steps.map((s) => ({ ...s, status: "todo" }));
  writeFileSync(join(d, "system/.aios-migration.json"), "{ broken");
  const r = await run(d, ["--apply"]);
  ok(r.code === 1 && /stopped: .*damaged/.test(r.out) && !/\n\s+at /.test(r.out), "U7: plain sentence, exit 1");
}
{ // U8 (Claude 1 + update.mjs): --check says not finished while the move is stopped, and names why
  const d = copy("c1", "u8-halted-check");
  served = manifest("0.9.0");
  await run(d, ["--apply"]);
  writeFileSync(join(OUT, "soul.md"), "x\n"); symlinkSync(join(OUT, "soul.md"), join(d, "SOUL.md"));
  const r = await run(d, ["--apply"]);
  const c = await run(d, ["--check"]);
  ok(r.code === 1 && /NOT finished/.test(r.out) && /NOT finished/.test(c.out), "U8: stopped move: exit 1, --check not finished");
}

{ // U9: --restore after the real two runs puts back the 0.8.3 skills catalog (a system file in 0.8.3)
  const d = await migrated("c1", "u9-restore-skills");
  const r = await run(d, ["--restore", "--apply"]);
  ok(readFileSync(join(d, "system/skills/skills.md")).equals(readFileSync(join(FX, "c1", "system/skills/skills.md"))), "U9: skills.md is the 0.8.3 one again");
}

{ // U10 (Claude, Windows): PowerShell splits "--delete-old=a,b" into two arguments — both names still count
  const d = await migrated("c1", "u10-powershell");
  await run(d, ["--apply", "--delete-old=CLAUDE.md", "GEMINI.md"]);
  ok(!existsSync(join(d, "CLAUDE.md")) && !existsSync(join(d, "GEMINI.md")) && existsSync(join(d, "system/offers.md")), "U10: both named files deleted, the rest kept");
}

srv.close();
console.log(`\n${fails ? "FAILED" : "ALL PASSED"}: ${passes} checks passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
