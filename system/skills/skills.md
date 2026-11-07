# Skills catalog

**The catalog of this installation:** your own skills are listed in `system/skills/_index.md`, one row per skill. After a real run of a new skill, add its row there by hand. How to create a skill → `system/skills/CONTEXT.md`.

This file says where each kind of skill lives, the header format of a skill, and how to present the list. Read it when you list, look up or describe skills.

## setup — local, ships with AIOS

- **setup** — conversational AIOS onboarding. Two auto-detected modes: first-run
  (the person → `SOUL.md` and `user/user.md`; the first business → `business/<slug>/core/` and its maps) and
  add-business. One focused question per turn. Triggers: 'setup', 'set up
  aios', 'onboarding', 'add business' (or the same in any language).
  **Entry:** read `system/skills/setup/SKILL.md`, then
  `system/skills/setup/CONTEXT.md` for mode detection.

`setup` works before the skills server is connected. It has no row in `_index.md`.

## Your own skills — local

Skills the person created live at `system/skills/<slug>/`. They travel with the folder,
so they work in every AI app. **The folders are the source of truth.** Their
descriptions are kept in `system/skills/_index.md`: one row per skill
(`slug · category · agent · description`; the `agent` cell may stay empty). That file
belongs to the person: no update touches it.

To answer "what skills do I have", **ALWAYS list the `system/skills/` folder first**, then
take the descriptions from `_index.md`. Never report "none" from an empty or old index
without checking the folders. When you create or change a skill, add or fix its row. A
folder has no row, or a row points to a folder that is gone → read the header of that
`SKILL.md` and fix the row. The file is missing → create it with a
`# My skills — index` heading and that four-column table.

## AIOS catalog — remote, over MCP

The catalog of AIOS skills streams from the AIOS skills server. Find skills with
`list_skills`, enter one with `start_skill(slug)`, load its files with
`read_skill_file(skill, path)`. Its content lives only on the server: never look
for a local folder for it. Tools missing → `AGENTS.md` › Connecting the skills server.

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
- Never use the `aios-` prefix in a slug: it is kept for the skills of the AIOS catalog.
- Body under 500 lines; put detail into a `references` folder, loaded on demand.

## Categories (small, grows from use)

`marketing · sales · content · research · assistant`. Classify by the **PRIMARY JOB**,
never by the format (a script, an email, a sequence, a page can be in any category):

- converts **to a purchase** (has a buy or a call to purchase) → `sales`
- attracts or captures a lead (opt-ins, lead magnets, webinar registration, traffic,
  ads, positioning) → `marketing`
- informs, entertains or nurtures with NO purchase ask → `content`
- market, competitor or audience analysis → `research`
- operations, admin, personal productivity → `assistant`

"Convert" with no explicit call to purchase → `marketing`. A closing or conversion
email sequence gets an explicit `sales` category; do not rely on inference.

**Presenting the list:** group by these categories (what the skill is FOR — how the
person thinks), NOT by where it lives. Where it lives is a tag in brackets after each
skill, never a group: `(premium)` / `(free)` = AIOS catalog · `(yours)` = made by the
person · `(your AI app)` = the app's own. Same slug in two places → show both, told
apart by the tag. No file paths, no talk of local and remote.
