# Skills catalog & authoring

Routing lives in AGENTS.md "## Skills" (three sources). This file is the **on-demand
detail** — where the local-skill index lives, the authoring format, and the category rules. It is
NOT pre-loaded every session; read it when you create, list, or look up a skill.

## setup — local bootstrap

- **setup** — conversational AIOS onboarding. Two auto-detected modes: first-run
  (operator → `user/user.md` + first business → `business/<slug>/core/` and its map) and
  add-business. One focused question per turn — no mega-asks. Captures only the 20%
  of info that drives 80% of personalization quality. Triggers: 'setup', 'set up
  aios', 'onboarding', 'add business' (or the equivalent in any language).
  **Entry:** read `system/skills/setup/SKILL.md`, then
  `system/skills/setup/CONTEXT.md` for mode detection.

`setup` bootstraps the system before the skills server is trusted.

## Your own skills — local index

Skills the user created live at `system/skills/<slug>/`. They travel with the vault,
so they work in every AI client. **The folders are the source of truth.** Their
descriptions are cached in `system/skills/_index.md` — one row per local skill
(`slug · category · agent · description`; no agent → leave the cell empty). `setup` ships with
AIOS and has no row. That file is the user's own: no update touches it.

To answer "what skills do I have", **ALWAYS list the `system/skills/` directory first**, then
use `_index.md` for the descriptions — never report "none" from an empty or stale index
without checking the folders. Keep it current: when you create or edit a local skill,
add/update its row; if a folder is missing there (or a row points to a folder that's gone),
read the `SKILL.md` frontmatter and fix the row. The file is missing → create it with a
`# My skills — index` heading and that four-column table.

## AIOS catalog — remote (over MCP)

The curated/paid catalog streams from the AIOS skills server. Discover with
`list_skills`; enter with `start_skill(slug)`; lazy-load with
`read_skill_file(skill, path)`. Catalog content lives only on the server — never look
for a local folder for it. Tools missing → see AGENTS.md
"## Connecting the skills server".

## Authoring a local skill

`system/skills/<slug>/SKILL.md` — a valid Agent Skill (works in native clients too):

```yaml
---
name: my-skill            # lowercase-hyphens, == folder name, ≤64, no "claude"/"anthropic"
description: <3rd person — what it does + when to use + keywords; user's language ok>
metadata:
  category: marketing     # optional; one of the taxonomy below; omit → inferred
  agent: marketer         # optional; "teaches" this skill to that agent (role =
                          # a folder name under system/agents/ — see AGENTS.md "## Agents")
---
```

- `description` is the ONLY routing signal — no `triggers` array; put keywords in it.
- `agent` makes the skill part of that agent's toolkit — the persona claims every
  local skill whose `metadata.agent` names its role. No agent file is ever edited.
- Don't use the `aios-` slug prefix — it's reserved for official catalog skills.
- Body < 500 lines; push detail into `references/` (loaded on demand).
- After creating/editing, update its row in `system/skills/_index.md`.

## Categories (starter taxonomy — small, grows from use)

`marketing · sales · content · research · assistant`. Classify by **PRIMARY JOB**,
never by format noun (script, email, sequence, page span categories):

- convert **to a purchase** (has a buy / CTA-to-purchase) → `sales`
- attract or capture a lead (opt-ins, lead magnets, webinar registration, traffic,
  ads, positioning) → `marketing`
- inform / entertain / nurture with NO purchase ask → `content`
- market / competitor / audience analysis → `research`
- ops / admin / personal-productivity utilities → `assistant`

Bare "convert" with no explicit buy-CTA → **fail closed to `marketing`**. Give
closing/conversion email sequences an explicit `sales` tag rather than relying on
inference.

**Presenting the list:** group by these categories (what the skill is FOR — how the
user thinks), NOT by where it lives. Source/access is a per-skill tag in parens, never
a group: `(premium)` / `(free)` = catalog · `(yours)` = user-made · `(your AI app)` =
client-native. The taxonomy grows from real use (e.g. add `copywriting` if it earns a
group).
