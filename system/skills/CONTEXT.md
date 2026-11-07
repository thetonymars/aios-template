# Skills

A skill is a repeatable way to do one job. Each skill of this folder is a folder here, with `SKILL.md` in its root (a bundle may have `CONTEXT.md` instead). The folder is the source of truth. The update replaces this map, so keep no notes in it.

Run a skill when the task is the job of that skill.

## The catalog of this folder

`skills.md`, next to this map, lists the skills of this folder: one line per skill, built from the header of each skill's `SKILL.md`. It is data of this folder, never edited by hand: `system/scripts/build-skills-catalog.py` builds it (how to run it → `system/scripts/CONTEXT.md`).
- After a skill is added, removed, switched off or its header changed → run the script.
- No Python on this computer → list `system/skills/` and read the header of each `SKILL.md` yourself; say in one line that the catalog is not rebuilt.
- Personal settings of skills (accounts, preferences) → `skill-settings.md`, next to this map: a `## <skill>` section per skill. A skill never holds personal data itself. Keys → `AGENTS.md` › API keys.
- An older install may still have `_index.md` here: a list of its own skills by hand. The catalog replaces it; the folders stay the source of truth.

## Where skills live

1. **This folder's skills** — local, `system/skills/<slug>/`. They travel with the folder, so they work in every AI app. `setup` is one of them when `system/skills/setup/` exists: it works before the skills server is connected.
2. **The AIOS catalog** — only when `system/connect.mjs` exists: remote, over MCP. Find skills with `list_skills`, enter one with `start_skill(slug)`, load its files with `read_skill_file(skill, path)`. Its content lives only on the server: never look for a local folder for it. Tools missing → `AGENTS.md` › Connecting the skills server.

To answer "what skills do I have": **list the `system/skills/` folder first**, then take the descriptions from `skills.md`; add the AIOS catalog when it exists. Never report "none" from an empty or old catalog without checking the folders.

## Create a new skill

1. **Where.** Create the folder `system/skills/<slug>/`. `<slug>` is lowercase Latin letters, digits and hyphens. It is also the `name` in the header of `SKILL.md`. Never create a skill in the AI app's own skills folder: other apps and other computers read only this folder. Never start a slug with `aios-`: that prefix belongs to the skills of the AIOS catalog.
2. **Build.** Run the skill that builds skills, when this folder or the AIOS catalog has one. It builds the stages, the map and the header. It does not choose the place and does not add the skill to the catalog: steps 1 and 4 do that.
3. **Test.** Run the new skill once on a real task. Fix what failed.
4. **Add it to the catalog.** Only after a real run: run `system/scripts/build-skills-catalog.py`.

## The header of a skill

`system/skills/<slug>/SKILL.md` is a valid Agent Skill, so it also works in apps that read skills natively:

```yaml
---
name: my-skill            # lowercase-hyphens, == folder name, ≤64, no "claude"/"anthropic"
description: <3rd person — what it does + when to use + keywords; the person's language is fine>
metadata:
  category: marketing     # optional; one of the categories below; omit → inferred
---
```

- `description` is the ONLY routing signal: put the keywords in it. No `triggers` array.
- Optional fields the catalog reads: `summary` (the catalog line, when the cut description reads badly), `asleep` (a reason: the skill is switched off and not offered).
- Body under 500 lines; put detail into a `references` folder, loaded on demand.

## Categories and presenting the list

`marketing · sales · content · research · assistant`. Classify by the **PRIMARY JOB**, never by the format (a script, an email, a sequence, a page can be in any category):
- converts **to a purchase** (has a buy or a call to purchase) → `sales`
- attracts or captures a lead (opt-ins, lead magnets, webinar registration, traffic, ads, positioning) → `marketing`
- informs, entertains or nurtures with NO purchase ask → `content`
- market, competitor or audience analysis → `research`
- operations, admin, personal productivity → `assistant`

"Convert" with no explicit call to purchase → `marketing`. A closing or conversion email sequence gets an explicit `sales` category; do not rely on inference.

**Presenting the list:** group by these categories (what the skill is FOR — how the person thinks), NOT by where it lives. Where it lives is a tag in brackets after each skill, never a group: `(premium)` / `(free)` = AIOS catalog · `(yours)` = a skill of this folder · `(your AI app)` = the app's own. Same slug in two places → show both, told apart by the tag. No file paths, no talk of local and remote. Never pass your app's own tools off as skills of this folder.
