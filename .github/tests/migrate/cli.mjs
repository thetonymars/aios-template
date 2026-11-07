// Test runner: calls the migration module of one run copy the way update.mjs does.
//   node cli.mjs <root> [--apply] [--restore] [--check] [--delete-old=<x>]
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
const root = resolve(process.argv[2]);
const a = process.argv.slice(3);
const del = a.find((x) => x.startsWith("--delete-old="));
const m = await import(pathToFileURL(join(root, "system", "migrate-0.9.mjs")).href);
const r = await m.run({ root, apply: a.includes("--apply"), restore: a.includes("--restore"), check: a.includes("--check"), deleteOld: del ? del.slice(13) : null });
for (const l of r.lines) console.log(l);
console.log(`#status=${r.status} needed=${r.needed} pending=${r.pendingDeletions.length}`);
