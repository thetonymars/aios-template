# How this system is built

Read this file before structural work: create, move, rename or delete a folder or a map; name a file; write a fact or a number. Do not read it at session start.

## The method

The folders are the architecture (ICM — Interpretable Context Methodology).

- **One folder, one job.** Its `CONTEXT.md` (its map) says what lives there and where a new thing goes.
- **One fact, one home.** Every other file points to that home. It never copies the fact.
- **A map routes.** It sends the reader to a file by category. It never repeats what another map says.
- **Links go one way.** A map points down to what it routes to. A file does not point back up to the map.
- **Load on demand.** Open a file when the task needs it, not in advance.
- **A folder gets a map** when it holds more than about eight items or has rules of its own.
- **No empty folder in advance.** Create a folder together with its first file. Two exceptions: a skill that creates its folders and their maps at once, and the `offers` folder with its map in each business — leave them.

## Records

The folder's map says where a fact goes. This section says how you write it. The rules are the same in every folder.

- **A number carries its date and its source.** Example: `- **Average check:** 15 000 RUB · as of 2026-10-09 · from: owner`. Sources: `owner` (the person said it), `document`, `integration`, `web`, `estimate` (an agent calculated it).
- **A file with its own format keeps that format.** Example: an offer file keeps the fields that `business/<slug>/offers/CONTEXT.md` gives.
- **Write what is not known. Never guess it and never leave it blank.**
  - `unknown` — ask the person, or find it out.
  - `unknown · asked <date>` — the person was asked on that date and does not know.
  - `n/a` — the field does not apply here.
- **One home per fact.** Example: a price lives in the offer file; a core number of a business lives in `business/<slug>/core/numbers.md`.
- **A plan carries its dates.** The plan of a business for a period (for example, 90 days) is the section `## Plan` of `business/<slug>/core/goals.md`. It starts with `**Period:** <start date> → <end date>`.
  - After the end date, the plan is not in force. Say so once. Do not act on it.
  - Keep an ended plan exactly as it is. Do not edit, annotate or move it. Do not start a new period. This stays true when the person says something that changes one of its items.
  - When the person gives a new plan, first move the old plan whole into `business/<slug>/plans/plan-<start YYMMDD>-<end YYMMDD>.md`. Example: a plan for 2026-07-01 → 2026-09-28 goes to the file `plan-260701-260928.md`. Then put the new plan in `## Plan`.
  - Do not read the `plans` folder in advance. Read it at the next planning, to see what was already tried.
- **A new record file** starts with `type` and `last_updated` in its frontmatter. It holds only what is known. A map (`CONTEXT.md`) has no frontmatter.
- **A new folder** is created together with its first file. Never edit a system map to add it: a map routes by category, and the update replaces it.
- **A folder that no map names:** never create one. If one is already there, keep it where it is. Ask the person what it holds. In a business, record it in `business/<slug>/core/business.md` › Own to this business.
- **A block `## Moved here by the 0.9 update — check`** is part of the record and is in force. Change, move or delete its lines only with the person's yes.

## Naming

**Folders**
- Use lowercase letters, with a hyphen between words: `projects`, `market-research`.
- `_inbox` is the only folder with a prefix: the `_` keeps it at the top. Exception: the stage folders in `projects/` (`1-active` … `9-archive`).
- A project folder takes the name that `projects/CONTEXT.md` gives.

**Files**
- Use lowercase letters, with a hyphen between words. Exception: a folder whose map gives its own naming.
- A draft or a deliverable: `<what>-<status>.<ext>`. Status: `draft-v01`, `draft-v02`, `final`.
- A record of one thing (a segment, a competitor, a product, an offer) has a stable name, without a status or a date.
- A dated report ends with `-<YYMMDD>`.
- Use UPPERCASE only for system files: `AGENTS.md`, `SOUL.md`, `CONTEXT.md`, `SKILL.md`, `AGENT.md`, `VOICE.md`, `SETUP.md`, and the project files that the project skill names.
- Never name a file `claude.md`, `agents.md` or `gemini.md` in any letter case. On a disk that ignores letter case, the AI app loads it as instructions. Name a report from a model `report-<model>.md`.
- A file that other files link by its short name (`[[name]]`) has a name that is unique in this whole folder.
- On macOS, a change of letter case only (`Notes.md` → `notes.md`) takes two steps: first a temporary name, then the new name.

## Moves

A move, a rename or a deletion is not finished until the maps are updated.

- **Update every map in the same step.** "I will fix the map later" means the map is already wrong.
- **These maps always follow a move:**
  - the `CONTEXT.md` of the folder that held the thing, and of the folder that holds it now;
  - the row of the Task router in `AGENTS.md`, if a row names the thing;
  - `projects/_index.md`, if the thing belongs to a project.
- **Find every pointer.** Search the whole folder for the old name and the old path.
- **Live pointers versus history.** Fix a live pointer: a line that someone follows to do work. Do not change history: logs, journals, decisions, reports, archived projects. A rewrite of history makes the record false. If history and the present disagree, add a note to the live map, not to the history.
- **One map per thing.** If you find a second copy of the same map, delete the copy and point to the original. Two copies always drift apart.
- **Check before you say "done".** Make sure each path you changed exists. If `system/scripts/check-maps.py` exists, run it from the root as its own header says. Fix every line it prints.
