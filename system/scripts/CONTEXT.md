# Scripts

Small programs that agents run. No AI inside: a script does one mechanical check or job the same way every time, so the result does not depend on an agent's memory.

| Script | What it does | When to run it |
|---|---|---|
| `build-skills-catalog.py` | Builds `system/skills/skills.md` from the header of each skill's `SKILL.md` (or `CONTEXT.md` of a bundle): one line per skill, the asleep ones apart. The header is the one source of truth; the catalog is never edited by hand. **Writes `skills.md`.** `--check` only reads and says whether the catalog is up to date. A skill file that iCloud has not downloaded stops it before anything is written. Tests: `tests/test_build_skills_catalog.py` — run after any change to the script; each fixed fault gets a test. | After a skill is added, removed, switched off or its header changed: `python3 -I system/scripts/build-skills-catalog.py .` from the root of this folder. |
| `check-maps.py` | Reads every map of this folder and of the outside folders that its settings name; prints each pointer that leads nowhere, each «file › section» whose section is gone, and any mismatch between the folder tree in `AGENTS.md` and the root. Reads only; under two seconds. The code is the same in every AIOS; what belongs to this folder only (the pointers that are right as they are, outside folders, code repos) is in its settings, `check-maps.local.json`, next to it, when that file exists. Skips the update backups and old files that an update still waits to delete. Needs Python 3.8 or newer; how to install it and what to do without it — the header of the script. | After any move, rename or deletion: `python3 -I system/scripts/check-maps.py .` from the root; fix every line it prints. A pointer that is right as it is but still printed goes into `ignore` of `check-maps.local.json`, with the reason. No `python3` on the machine → say so in one line, then search for the old name by hand. |

## Rules

- Run from the root of this folder with `python3 -I` (on Windows `python -I`); a script takes the root as its argument and finds everything else through the maps — no machine paths inside.
- Added, changed what it does, or removed a script → update its row in the table above in the same step.
- A script that changes files says so in its row; by default a script here only reads.
- A folder here that the table does not name is the person's own tool. Its own `CONTEXT.md` says what it is.
