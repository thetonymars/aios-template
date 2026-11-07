#!/usr/bin/env python3
"""Check that the maps of an AIOS folder point at places that exist.

Run it from the AIOS root (the folder that holds AGENTS.md):
  macOS, Linux:  python3 -I system/scripts/check-maps.py .
  Windows:       py -3 -I system\\scripts\\check-maps.py .
Options: --no-drive (do not check the cloud drive named in the settings).

It only reads. Exit code: 0 = nothing broken, 1 = something broken, 2 = bad call.

Dependencies
  Python 3.8 or newer, nothing else (only the standard library).
  Check:   python3 --version   (Windows: py -3 --version)
  Install: macOS   - the installer from https://www.python.org/downloads/ ,
                     or `xcode-select --install` (gives python3).
           Windows - the installer from https://www.python.org/downloads/ ;
                     tick "Add python.exe to PATH". Or: winget install Python.Python.3.12
  No Python and the person does not want to install it: the check is not done.
  Say so in one line. Then check the moved paths by hand: search the folder for
  the old name and fix each live pointer (system/architecture.md › Moves).

Settings (optional): system/scripts/check-maps.local.json in the AIOS root.
  No file = the general check: no exceptions, no cloud drive, no path aliases.
  Keys (all optional):
    "ignore":    [{"map": "<map, relative path>", "path": "<pointer as written>",
                   "why": "<reason>"}]  pointers that are right as they are;
    "drive":     {"prefix": "drive:/", "root": "~/path/to/the/drive"} a cloud drive
                  that notes name by a short prefix; its root CONTEXT.md is checked too;
    "aliases":   {"$CODE": "code"}  a short form -> a folder in the AIOS root;
    "own_repos": ["code"]  folders whose subfolders are separate code repos with
                  their own maps: not checked, not searched;
    "root_files": ["README.md"]  more files allowed in the root.

Maps checked:
  - AGENTS.md and SOUL.md in the root;
  - every CONTEXT.md, except inside one skill (system/skills/<skill>/), one project
    (projects/<stage>/<project>/) or one repo of "own_repos": they have their own maps;
  - every file the Task router in AGENTS.md names (its "Open first" column);
  - the drive's CONTEXT.md, if the settings name a drive and --no-drive is not given.

Skipped: .git, .obsidian, .trash, .claude, node_modules, .venv, __pycache__, the
update backups (.aios-backup/) and every folder whose name starts with ".aios-";
old files that the 0.9 update still waits to delete (system/.aios-migration*.json,
"deletions" not done).

What counts as broken:
  - a path in a map that resolves nowhere;
  - a pointer "file › Section" whose section text appears nowhere in that file;
  - a folder in the root that the folder tree in AGENTS.md does not name, a folder
    the tree names that does not exist, a loose file in the root.

A path is tried next to the map and in each folder above it up to the root, in the
folder of a path named earlier on the same line, from the drive root for the drive
prefix, from home for ~/, in the alias folder for an alias; a relative path that is
still not found is accepted if some place in the folder ends with it. Not checked:
paths with placeholders (<slug>, [NNNN], YYMMDD, *, X, ...), bare file names
without a slash, words like n/a, paths that start with "/", other short forms
("name:/..."), paths the line says are gone ("no longer exists", "moved from",
"NOT"), the rows under "No folder yet" or "Where a new fact goes", a missing place in a table with a column
"Goes to" (a new fact goes there; the place may not exist yet), a missing path
that the root .gitignore names (it stays on one machine), and the pointers in
"ignore".
"""
import json
import os
import re
import sys

ROOT_FILES = {"AGENTS.md", "SOUL.md"}
SETTINGS = os.path.join("system", "scripts", "check-maps.local.json")
CODE = re.compile(r"`([^`\n]+)`")
MDLINK = re.compile(r"\]\(([^)\s]+)\)")
WIKI = re.compile(r"\[\[([^\]|#]+)")
SECTION = re.compile(r"^\s*›\s*(?:[«\"“]([^»\"”]+)[»\"”]|([^;,()|—`\n]+))")
PLACEHOLDER = re.compile(r"[<>\[\]{}*…^]|\.\.\.|YYMMDD|YYYY|NNNN|XXXX|^https?:|^mailto:"
                         r"|(^|/)(x|X|file|filename|name|foo)(\.\w+)?/?$")
SHORT_FORM = re.compile(r"^[A-Za-z][A-Za-z0-9-]*:/(?!/)")
NEGATION_BEFORE = ("not ", "moved from", "used to", "formerly", "instead of", "never ")
NEGATION_AFTER = ("no longer", "does not exist", "doesn't exist", "is gone", "removed",
                  "deleted", "left the vault", "was replaced", "were replaced", "used to",
                  "had moved", "once it", "once they")
HISTORY_LINE = ("used to", "drifted", "formerly")
REMOTE_LINE = ("github", "(private)", "(public)", "remote", " repo")
DOMAIN = re.compile(r"^[a-z0-9-]+(\.[a-z0-9-]+)+/", re.I)
UNPLANNED = re.compile(r"no folder yet|немає папки|where a new fact goes", re.I)
# A table whose header has a column "Goes to" says where a NEW fact will go: its places
# may not exist yet, so a missing one there is not reported.
PLANNED_HEADER = re.compile(r"^\|.*\b(goes to|куди)\b", re.I)
ABBREVIATION = re.compile(r"^[A-Za-z]/[A-Za-z]$")  # n/a, w/o: words, not paths
SKIP_DIRS = {".git", ".obsidian", ".trash", ".claude", "node_modules", ".venv", "__pycache__",
             ".aios-backup"}


def skip_dir(name):
    return name in SKIP_DIRS or name.startswith(".aios-")


def exists(p):
    if os.path.exists(p):
        return True
    d, b = os.path.split(p.rstrip("/\\"))
    return os.path.exists(os.path.join(d, "." + b + ".icloud"))


def read(p):
    try:
        with open(p, encoding="utf-8-sig") as f:
            return f.read()
    except (OSError, UnicodeDecodeError):
        return None


def strip_icloud(name):
    if name.endswith(".icloud") and name.startswith("."):
        return name[1:-len(".icloud")]
    return name


class Vault:
    def __init__(self, root, use_drive, settings_path=None):
        self.root = root
        self.agents = read(os.path.join(root, "AGENTS.md")) or ""
        self.top = {e for e in os.listdir(root) if os.path.isdir(os.path.join(root, e))}
        self.settings, self.settings_error = self.load_settings(settings_path)
        s = self.settings
        self.ignore = set()
        for item in s.get("ignore", []):
            if isinstance(item, dict) and item.get("map") and item.get("path"):
                self.ignore.add((item["map"].strip().replace("\\", "/"), item["path"].strip()))
        self.aliases = {k: v for k, v in (s.get("aliases") or {}).items() if k and v}
        self.own_repos = [r.strip("/\\") for r in s.get("own_repos", []) if r]
        self.extra_root_files = set(s.get("root_files", []))
        self.drive_prefix, self.drive = None, None
        drive = s.get("drive") or {}
        if drive.get("prefix") and drive.get("root"):
            self.drive_prefix = drive["prefix"]
            d = os.path.expanduser(drive["root"])
            if use_drive and os.path.isdir(d):
                self.drive = d
        self.leftovers = self.load_leftovers()
        self.private = self.load_private()
        self._suffixes = None
        self._names = None

    def load_settings(self, path):
        path = path or os.path.join(self.root, SETTINGS)
        if not os.path.isfile(path):
            return {}, None
        text = read(path)
        try:
            data = json.loads(text or "")
            if not isinstance(data, dict):
                raise ValueError("the file must hold one JSON object")
            return data, None
        except ValueError as e:
            return {}, f"{os.path.relpath(path, self.root)} — not valid JSON ({e})"

    def load_leftovers(self):
        """Old files the 0.9 update still waits to delete: never checked as maps."""
        out = set()
        sysdir = os.path.join(self.root, "system")
        if not os.path.isdir(sysdir):
            return out
        for f in os.listdir(sysdir):
            if not (f.startswith(".aios-migration") and f.endswith(".json")):
                continue
            try:
                data = json.loads(read(os.path.join(sysdir, f)) or "{}")
            except ValueError:
                continue
            for d in data.get("deletions", []) if isinstance(data, dict) else []:
                if isinstance(d, dict) and d.get("path") and not d.get("done_at"):
                    out.add(os.path.normpath(d["path"]))
        return out

    def load_private(self):
        """Plain paths that the root .gitignore names: they stay on one machine and may be absent."""
        out = []
        for line in (read(os.path.join(self.root, ".gitignore")) or "").splitlines():
            line = line.strip()
            if not line or line.startswith(("#", "!")) or any(c in line for c in "*?["):
                continue
            out.append(line.lstrip("/").rstrip("/"))
        return [p for p in out if p]

    def is_private(self, s):
        s = s.strip().rstrip("/")
        return any(s == p or s.startswith(p + "/") for p in self.private)

    def is_leftover(self, rel):
        return os.path.normpath(rel) in self.leftovers

    def in_own_repo(self, parts):
        rel = "/".join(parts)
        return any(rel.startswith(r + "/") for r in self.own_repos)

    def walk(self):
        for dp, dns, fns in os.walk(self.root):
            dns[:] = sorted(d for d in dns if not skip_dir(d))
            yield dp, dns, fns

    def suffixes(self):
        if self._suffixes is None:
            self._suffixes = set()
            for dp, dns, fns in self.walk():
                rel = os.path.relpath(dp, self.root)
                parts = [] if rel == "." else rel.split(os.sep)
                if self.in_own_repo(parts):
                    dns[:] = []
                    continue
                for name in dns + fns:
                    p = parts + [strip_icloud(name)]
                    for i in range(len(p)):
                        self._suffixes.add("/".join(p[i:]))
        return self._suffixes

    def note_names(self):
        if self._names is None:
            self._names = set()
            for dp, dns, fns in self.walk():
                for f in fns:
                    rel = os.path.relpath(os.path.join(dp, f), self.root).replace(os.sep, "/")
                    for n in (f, os.path.splitext(f)[0], os.path.splitext(rel)[0]):
                        self._names.add(n.lower())
        return self._names

    def router_targets(self):
        out, on = [], False
        for line in self.agents.splitlines():
            if line.startswith("## "):
                on = line.strip().lower() == "## task router"
                continue
            if on and line.startswith("|") and not set(line.strip()) <= set("|- "):
                cells = line.split("|")
                if len(cells) > 2:
                    out += [s for s in CODE.findall(cells[2]) if "/" in s]
        return out

    def maps(self):
        out = [os.path.join(self.root, f) for f in sorted(ROOT_FILES)]
        for dp, dns, fns in self.walk():
            rel = os.path.relpath(dp, self.root)
            parts = [] if rel == "." else rel.split(os.sep)
            if self.in_own_repo(parts) or \
               (parts[:2] == ["system", "skills"] and len(parts) >= 3) or \
               (parts[:1] == ["projects"] and len(parts) >= 3):
                dns[:] = []
                continue
            if "CONTEXT.md" in fns and not self.is_leftover(os.path.join(rel, "CONTEXT.md")):
                out.append(os.path.join(dp, "CONTEXT.md"))
        for t in self.router_targets():
            p = os.path.normpath(os.path.join(self.root, t))
            if p.startswith(self.root + os.sep) and os.path.isfile(p) and p not in out \
                    and not self.is_leftover(os.path.relpath(p, self.root)):
                out.append(p)
        return out

    def resolve(self, span, here, bases, base_root):
        """Return (path or None, reason or None)."""
        s = span.lstrip().rstrip(".,;:")  # a trailing space can be part of a real folder name
        want_dir = s.endswith("/")
        alias = next((a for a in self.aliases if s.startswith(a)), None)
        if self.drive_prefix and s.startswith(self.drive_prefix):
            if not self.drive:
                return None, "skip"
            cands = [os.path.join(self.drive, s[len(self.drive_prefix):])]
        elif SHORT_FORM.match(s):
            return None, "skip"
        elif s.startswith("~/"):
            cands = [os.path.expanduser(s)]
        elif alias:
            cands = [os.path.join(self.root, self.aliases[alias], s[len(alias):].lstrip("/"))]
        else:
            cands, d = [], here
            while True:
                cands.append(os.path.join(d, s))
                if os.path.normpath(d) == os.path.normpath(base_root) or len(d) <= len(base_root):
                    break
                d = os.path.dirname(d)
            cands += [os.path.join(b, s) for b in bases]
            cands += [os.path.join(self.root, s)] + ([os.path.join(self.drive, s)] if self.drive else [])
        for c in cands:
            c = os.path.normpath(c)
            if exists(c):
                if want_dir and os.path.isfile(c):
                    return c, "is a file, not a folder"
                return c, None
        relative = not (s.startswith(("~/", "../", "./")) or alias or SHORT_FORM.match(s)) \
            and s.split("/")[0] not in self.top
        if relative and s.strip().rstrip("/") in self.suffixes():
            return None, None
        return None, "no such file or folder"


def is_path(s, line, v):
    s = s.strip()
    low = line.lower()
    if DOMAIN.match(s) or (s.count("/") == 1 and not s.endswith("/") and any(w in low for w in REMOTE_LINE)):
        return False  # a web address or an owner/repo name, not a place on disk
    if not s or s.startswith("/") or PLACEHOLDER.search(s) or ABBREVIATION.match(s):
        return False
    if s.startswith("~/") or SHORT_FORM.match(s):
        return True
    if any(s.startswith(a) for a in v.aliases):
        return "/" in s and " " not in s
    if " " in s or "/" not in s or s.startswith(("-", "=", "@", "$")) or "://" in s:
        return False
    return True


def negated(line, start, end):
    before, after = line[max(0, start - 25):start].lower(), line[end:end + 45].lower()
    return any(w in before for w in NEGATION_BEFORE) or any(w in after for w in NEGATION_AFTER)


def norm(x):
    return re.sub(r"\s+", " ", re.sub(r"[`*_«»\"“”#|:]", "", x)).strip().lower()


def section_ok(target, name):
    if os.path.isdir(target):
        return True
    text = read(target)
    if text is None:
        return True
    want = norm(name)[:40]
    for line in text.splitlines():
        st = line.lstrip()
        if st.startswith("#"):
            head = norm(st)
        elif st.startswith(("**", "| **", "|**", "- **", "* **")):
            head = norm(st.split("**")[1]) if st.count("**") >= 2 else ""
        else:
            continue
        if head and (head.startswith(want) or want.startswith(head)):
            return True
    return False


# A pointer under a condition "`<path>` exists" is checked only when that path exists: one core, the
# same AGENTS.md everywhere, switches its client-only parts on by a file (D48). The condition holds for its
# line; a section that opens with "Only when `<path>` exists" holds it for the whole section.
COND = re.compile(r"`([^`]+)`\s+exists")
COND_NOT = re.compile(r"`([^`]+)`\s+does not exist")
GATE = re.compile(r"^Only when `([^`]+)` exists")


def cond_off(v, line, base_root):
    if COND_NOT.search(line):
        return True   # a rule for the case without that path: nothing on the line is a live pointer
    for p in COND.findall(line):
        if not os.path.exists(os.path.join(base_root, p.rstrip("/"))):
            return True
    return False


def check_map(v, path, label, base_root):
    text = read(path)
    if text is None:
        return [], 0
    here = os.path.dirname(path)
    bad, n, fence, unplanned, planned, gated = [], 0, False, False, False, False
    for i, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith("```"):
            fence = not fence
            continue
        if fence:
            continue
        if line.startswith("#"):
            unplanned = False
            gated = False
        g = GATE.match(line)
        if g and not os.path.exists(os.path.join(base_root, g.group(1).rstrip("/"))):
            gated = True
        if gated or cond_off(v, line, base_root):
            continue
        if UNPLANNED.search(line):
            unplanned = True
            continue
        if not line.lstrip().startswith("|"):
            planned = False
        elif PLANNED_HEADER.search(line):
            planned = True
        if unplanned or any(w in line.lower() for w in HISTORY_LINE):
            continue
        found = [(m.group(1), m.start(), m.end()) for m in CODE.finditer(line)]
        found += [(m.group(1), m.start(), m.end()) for m in MDLINK.finditer(line)]
        found.sort(key=lambda x: x[1])
        bases = []
        for span, start, end in found:
            if not is_path(span, line, v) or negated(line, start, end):
                continue
            n += 1
            target, why = v.resolve(span, here, bases, base_root)
            if why == "skip":
                continue
            if target:
                bases.append(target if os.path.isdir(target) else os.path.dirname(target))
            if why == "no such file or folder" and (planned or v.is_private(span)):
                continue
            if why:
                if (label, span) not in v.ignore:
                    bad.append((i, span, why))
                continue
            m = SECTION.match(line[end:])
            if target and m:
                name = (m.group(1) or m.group(2)).strip().rstrip(".")
                if name and not section_ok(target, name) and (label, span) not in v.ignore:
                    bad.append((i, f"{span} › {name}", "no such section in that file"))
        prose = CODE.sub("", line)
        for name in WIKI.findall(prose):
            name = name.strip()
            if PLACEHOLDER.search(name):
                continue
            n += 1
            if name.lower() not in v.note_names() and (label, f"[[{name}]]") not in v.ignore:
                bad.append((i, f"[[{name}]]", "no note with that name"))
    return bad, n


def check_root(v):
    m = re.search(r"^## Folder structure\s*```(.*?)```", v.agents, re.S | re.I | re.M)
    if not m:
        return [(0, "AGENTS.md › Folder structure", "no folder tree found")]
    tree = m.group(1)
    top = set(re.findall(r"^[├└]──\s*([^\s/]+)/", tree, re.M))
    named_files = set(re.findall(r"^[├└]──\s*([^\s/]+\.[A-Za-z0-9]+)\s", tree, re.M))
    allowed = ROOT_FILES | named_files | v.extra_root_files
    bad = []
    for e in sorted(os.listdir(v.root)):
        p = os.path.join(v.root, e)
        if e.startswith(".") or v.is_leftover(e):
            continue
        if os.path.isdir(p) and e not in top and os.path.isfile(os.path.join(p, "CONTEXT.md")):
            continue   # the tree says: a folder it does not name is the person's own; its own map says what it is
        if os.path.isdir(p) and e not in top:
            bad.append((0, e + "/", "folder in the root that the tree in AGENTS.md does not name"))
        elif os.path.isfile(p) and e not in allowed:
            bad.append((0, e, "loose file in the root"))
    for t in sorted(top - v.top):
        bad.append((0, t + "/", "the tree in AGENTS.md names it, but it does not exist"))
    return bad


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass
    argv = sys.argv[1:]
    settings = None
    if "--settings" in argv:
        k = argv.index("--settings")
        settings = argv[k + 1] if k + 1 < len(argv) else ""
        del argv[k:k + 2]
    args = [a for a in argv if not a.startswith("--")]
    if len(args) != 1 or not os.path.isfile(os.path.join(args[0], "AGENTS.md")):
        print("Usage: python3 -I system/scripts/check-maps.py <AIOS root> [--no-drive]\n"
              "Run it from the folder that holds AGENTS.md, with \".\" as the root.", file=sys.stderr)
        sys.exit(2)
    v = Vault(os.path.abspath(args[0]), "--no-drive" not in argv, settings)

    report, total = [], 0
    if v.settings_error:
        report.append(("(settings)", [(0, v.settings_error, "fix the file; it was not used")]))
    root_bad = check_root(v)
    if root_bad:
        report.append(("(root)", root_bad))
    maps = v.maps()
    for mp in maps:
        label = os.path.relpath(mp, v.root).replace(os.sep, "/")
        bad, n = check_map(v, mp, label, v.root)
        total += n
        if bad:
            report.append((label, bad))
    if v.drive and os.path.isfile(os.path.join(v.drive, "CONTEXT.md")):
        label = v.drive_prefix + "CONTEXT.md"
        bad, n = check_map(v, os.path.join(v.drive, "CONTEXT.md"), label, v.drive)
        maps.append(v.drive)
        total += n
        if bad:
            report.append((label, bad))

    broken = 0
    for label, bad in report:
        for line, what, why in bad:
            broken += 1
            print(f"{label}:{line} · {what} — {why}" if line else f"{label} · {what} — {why}")
    note = " (cloud drive not checked)" if v.drive_prefix and not v.drive else ""
    print(f"\n{len(maps)} maps, {total} pointers checked{note}: "
          + ("nothing broken." if not broken else f"{broken} broken."))
    sys.exit(1 if broken else 0)


if __name__ == "__main__":
    main()
