"""Stress tests for system/scripts/build-skills-catalog.py.

Run from the root of the AIOS folder:  python3 -I system/scripts/tests/test_build_skills_catalog.py
Builds throwaway folders in a temp folder; touches the real folder only to read it.
Each fixed fault gets a test here.
"""
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "..", "build-skills-catalog.py")
VAULT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
spec = importlib.util.spec_from_file_location("catalog", SCRIPT)
cat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cat)

# A parser that reads catalog lines the way a dashboard may read them (one line per skill).
JARVIS_LINE = re.compile(r"^- \*\*(.+?)\*\*(?:\s*\(.*?\))?:\s*(.+)$")

FAILS = []


def check(name, cond, detail=""):
    print(("ok   " if cond else "FAIL ") + name + (f" — {detail}" if detail and not cond else ""))
    if not cond:
        FAILS.append(name)


def skill(root, slug, body, fname="SKILL.md", raw=None):
    d = os.path.join(root, "system", "skills", slug)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, fname), "wb") as f:
        f.write(raw if raw is not None else body.encode("utf-8"))
    return d


def fm(desc_line, extra=""):
    return f"---\nname: X\n{desc_line}\n{extra}---\n# body\n"


def line_of(text, slug):
    for ln in text.split("\n"):
        if ln.startswith(f"- **{slug}**"):
            return ln
    return None


def main():
    # A Windows console is often cp1252: a path or a word in Cyrillic would stop the script.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    tmp = tempfile.mkdtemp(prefix="skills-stress-")
    try:
        v = os.path.join(tmp, "vault")
        os.makedirs(os.path.join(v, "system", "skills"))
        S = lambda *a, **k: skill(v, *a, **k)
        S("apostrophe", "---\nname: apostrophe\ndescription: \"Plan the week. Triggers: 'план на п'ятницю', 'сплануй тиждень', 'don't forget'.\"\n---\n")
        S("block-lit", "---\nname: block-lit\ndescription: |\n  First line of a literal block.\n\n  Second paragraph. Triggers: \"зроби блок\".\nversion: 1.0\n---\n")
        S("block-fold", "---\nname: block-fold\ndescription: >-\n  Folded block that goes on\n  across lines.\nmode: single\n---\n")
        S("plain-multi", "---\nname: plain-multi\ndescription: Plain scalar that\n  continues on the next line.\n---\n")
        S("crlf", "---\r\nname: crlf\r\ndescription: \"Windows line endings skill.\"\r\n---\r\n")
        S("bom", "", raw="﻿---\nname: bom\ndescription: \"File starts with a BOM.\"\n---\n".encode("utf-8"))
        S("nofm", "# No header here\n")
        S("empty-desc", "---\nname: empty-desc\ndescription: \"\"\n---\n")
        S("escaped", "---\nname: escaped\ndescription: \"Say \\\"hello\\\" to the user. Triggers: \\\"привіт\\\".\"\n---\n")
        S("single-q", "---\nname: single-q\ndescription: 'It''s single-quoted.'\n---\n")
        S("long", "---\nname: long\ndescription: \"" + " ".join(["word"] * 60) + "\"\n---\n")
        S("usewhen", "---\nname: usewhen\ndescription: \"Use when the user says hand off. Then more.\"\n---\n")
        S("mismatch", "---\nname: other-name\ndescription: \"Name differs from folder.\"\n---\n")
        S("sleepy", "---\nname: sleepy\ndescription: \"Sleeps.\"\nasleep: \"since 2026-01-01 — test\"\n---\n")
        S("summ", "---\nname: summ\ndescription: \"Bad cut here is long enough: details.\"\nsummary: \"Good summary line\"\n---\n")
        S("stars", "---\nname: stars\ndescription: \"Has **bold**, a | pipe and `code`.\"\n---\n")
        S("bundlectx", "---\nname: bundlectx\ndescription: \"Bundle with CONTEXT only.\"\ntype: skill-bundle\n---\n", fname="CONTEXT.md")
        S("nested", "---\nname: nested\ndescription: \"Has sub-skills.\"\n---\n")
        skill(v, "nested/sub", "---\nname: sub\ndescription: \"sub\"\n---\n")
        S("nodemods", "---\nname: nodemods\ndescription: \"Has node_modules inside.\"\n---\n")
        skill(v, "nodemods/node_modules/pkg", "---\nname: x\ndescription: \"x\"\n---\n")
        S("backup", "---\nname: backup\ndescription: \"Has an old copy in a hidden folder.\"\n---\n")
        skill(v, "backup/.backup/old", "---\nname: old\ndescription: \"old\"\n---\n")
        S("latin1", "", raw="---\nname: latin1\ndescription: \"Café in latin-1.\"\n---\n".encode("latin-1"))
        S(".hidden", "---\nname: hidden\ndescription: \"hidden\"\n---\n")
        S("_private", "---\nname: p\ndescription: \"p\"\n---\n")
        os.makedirs(os.path.join(v, "system", "skills", "nofile"))
        open(os.path.join(v, "system", "skills", "skill-settings.md"), "w").write("x")

        text, n_awake, n_asleep = cat.build(v)
        L = lambda s: line_of(text, s)

        check("apostrophe inside a trigger keeps the phrase", L("apostrophe") and "«план на п'ятницю»" in L("apostrophe") and "«сплануй тиждень»" in L("apostrophe"), L("apostrophe"))
        check("English trigger is not listed", L("apostrophe") and "don't" not in L("apostrophe"))
        check("literal block description is read", L("block-lit") and "First line of a literal block." in L("block-lit") and "«зроби блок»" in L("block-lit"), L("block-lit"))
        check("folded block description is read", L("block-fold") and "Folded block that goes on across lines." in L("block-fold"), L("block-fold"))
        check("plain value over two lines is read", L("plain-multi") and "continues on the next line" in L("plain-multi"), L("plain-multi"))
        check("Windows line endings", L("crlf") and "Windows line endings skill." in L("crlf"), L("crlf"))
        check("BOM at the file start", L("bom") is not None, L("bom"))
        check("no header → left out", L("nofm") is None)
        check("empty description → left out", L("empty-desc") is None)
        check("escaped quotes", L("escaped") and 'Say "hello" to the user.' in L("escaped") and "«привіт»" in L("escaped"), L("escaped"))
        check("single quotes with ''", L("single-q") and "It's single-quoted." in L("single-q"), L("single-q"))
        check("very long sentence is cut to 30 words", L("long") and L("long").endswith("…") and len(L("long").split(": ", 1)[1].split()) <= 31, L("long"))
        check("«Use when» description keeps its first sentence", L("usewhen") and "Use when the user says hand off." in L("usewhen"), L("usewhen"))
        check("name differs from folder is marked", L("mismatch") and "name inside: `other-name`" in L("mismatch"), L("mismatch"))
        check("asleep skill is not offered", L("sleepy") is not None and L("sleepy").startswith("- **sleepy** — asleep") and "## Asleep" in text and text.index("- **sleepy**") > text.index("## Asleep"))
        check("summary wins over the cut description", L("summ") and L("summ").endswith("Good summary line"), L("summ"))
        check("bundle with CONTEXT.md only", L("bundlectx") and "(bundle)" in L("bundlectx"), L("bundlectx"))
        check("sub-skill folder marks a bundle", L("nested") and "(bundle)" in L("nested"), L("nested"))
        check("node_modules does not make a bundle", L("nodemods") and "(bundle)" not in L("nodemods"), L("nodemods"))
        check("a backup in a hidden folder does not make a bundle", L("backup") and "(bundle)" not in L("backup"), L("backup"))
        check("not UTF-8 → no crash, still listed", L("latin1") is not None, L("latin1"))
        check("hidden and _private folders skipped", L(".hidden") is None and L("_private") is None and "**p**" not in text)
        check("folder with no file → left out", L("nofile") is None)
        check("counts", n_asleep == 1 and n_awake == sum(1 for ln in text.split("\n") if JARVIS_LINE.match(ln)), f"{n_awake=} {n_asleep=}")
        slugs = [m.group(1) for m in map(JARVIS_LINE.match, text.split("\n")) if m]
        check("alphabetical order", slugs == sorted(slugs), slugs)
        check("every awake line is read by the line parser", len(slugs) == n_awake)
        check("no line breaks inside a catalog line", all("\n" not in (L(s) or "") for s in slugs))
        check("same input → same output", cat.build(v)[0] == text)

        # write, check, change, check
        target = os.path.join(v, "system", "skills", "skills.md")
        run = lambda *a: subprocess.run([sys.executable, "-I", SCRIPT, v, *a], capture_output=True, text=True)
        r = run()
        check("write exits 0", r.returncode == 0, r.stderr)
        check("no temp file left", not [f for f in os.listdir(os.path.dirname(target)) if f.endswith(".tmp")])
        check("--check after write → up to date", run("--check").returncode == 0)
        skill(v, "crlf", "---\nname: crlf\ndescription: \"Changed.\"\n---\n")
        check("--check after a header change → out of date", run("--check").returncode == 1)
        before = open(target).read()
        check("--stdout writes nothing", run("--stdout").returncode == 0 and open(target).read() == before)

        # iCloud: a skill file not downloaded yet stops the run, nothing written
        ev = skill(v, "evicted", "", fname=".SKILL.md.icloud", raw=b"x")
        which = cat.shutil.which
        cat.shutil.which = lambda _name: None
        try:
            cat.build(v, wait=0)
            stopped = False
        except cat.NotDownloaded:
            stopped = True
        finally:
            cat.shutil.which = which
        check("iCloud placeholder stops the build", stopped)
        r = subprocess.run([sys.executable, "-I", SCRIPT, v], capture_output=True, text=True,
                           env={**os.environ, "PATH": "/nonexistent"})
        check("iCloud placeholder → exit 2, catalog untouched", r.returncode == 2 and open(target).read() == before, r.stderr)
        shutil.rmtree(ev)

        # empty skills folder
        e = os.path.join(tmp, "empty")
        os.makedirs(os.path.join(e, "system", "skills"))
        t2, a2, s2 = cat.build(e)
        check("empty skills folder → header only", a2 == 0 and s2 == 0 and t2 == cat.HEADER)
        check("wrong vault path → clear error", subprocess.run([sys.executable, "-I", SCRIPT, os.path.join(tmp, "nope")], capture_output=True, text=True).returncode != 0)

        # the real folder, read only
        t0 = time.time()
        real, ra, rs = cat.build(VAULT)
        dt = time.time() - t0
        sk = os.path.join(VAULT, "system", "skills")
        with_header = []
        for s in sorted(os.listdir(sk)):
            d = os.path.join(sk, s)
            if not os.path.isdir(d) or s.startswith((".", "_")):
                continue
            entry = next((os.path.join(d, f) for f in cat.ENTRY_FILES if os.path.isfile(os.path.join(d, f))), None)
            if entry and cat.clean(cat.frontmatter(cat.read_text(entry)).get("description")):
                with_header.append(s)
        listed = re.findall(r"^- \*\*([^*]+)\*\*", real, re.M)
        check("real folder: every skill with a header is in the catalog", sorted(listed) == with_header, set(with_header) ^ set(listed))
        check("real folder: skills.md is up to date", open(os.path.join(sk, "skills.md"), encoding="utf-8").read() == real)
        check("real folder: build under 5 s", dt < 5, f"{dt:.1f}s")
        long_lines = [ln[:60] for ln in real.split("\n") if ln.startswith("- **") and len(ln.split()) > 60]
        check("real folder: no catalog line over 60 words", not long_lines, long_lines)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print()
    print(f"{'ALL PASSED' if not FAILS else str(len(FAILS)) + ' FAILED: ' + ', '.join(FAILS)}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
