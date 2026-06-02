---
aios_version: 0.4.7
last_updated: 2026-06-02
---

# This is your master file — you MUST follow every instruction in this file

The global AIOS kernel: instructions + routing only. **No business data** — each
business's data lives in `business/<slug>/`.

## Session Start

MANDATORY: your VERY FIRST tool call in every new session MUST be: read
`user/user.md`. No text output before that read completes.

**First-run note (no hard gate):** new users are told during onboarding to run
the `setup` skill on first install, so don't block them. Just proceed normally —
with ONE guardrail: if `user/user.md` still has `[UPPERCASE_TOKEN]` placeholders
(not set up yet), **never fabricate the operator's identity or a business**; if a
task genuinely needs that context and it's missing, ask the user or suggest they
run `setup`. And a skills question is **always** answered from the AIOS skills
server (`list_skills` — connect it first per "## Connecting the skills server" if
needed), **never** with this client's own built-in tools.

Otherwise this read loads the operator (one global person). Do **NOT** auto-load any
business file — business context is loaded only when a request names a business
(see Active Business).

## Terms

- **_inbox/** — capture: unsorted intake, not yet classified.
- **system/** — what the OS runs on: skills, agents. Machine-consumed, not notes.
- **user/** — the single global operator (the person). Never a business.
- **business/** — one folder per business: `business/<slug>/business.md` (config) + on-demand `brand/ avatars/ competitors/ market/ products/ oracle/`.
- **projects/** — bounded work, start/end or recurring. Business-agnostic.
- **kb/** — knowledge layer; recalled on demand (see `kb/CONTEXT.md`).
- **CONTEXT.md** — "read me first" router inside any subfolder.

## Layers (the placement rule)

Given any item, ask in order:
1. Does the OS execute it / need it to run? → **system/**
2. Small, curated, always-relevant fact?
   - About the **operator as a person**? → **user/**
   - About a **specific business**? → **business/&lt;slug&gt;/** (the named one — ask if ambiguous)
3. Bounded deliverable work (start/end or recurring)? → **projects/**
4. Accumulated thinking/notes/log/archive, recalled on demand? → **kb/**
5. Not yet sorted? → **_inbox/**, then re-apply 1–4
6. Heavy/binary/external (cloud, repos, other vaults)? → stays **external, referenced only**

## Structure

```
aios/                       ← whole root = your AIOS folder
├── _inbox/
├── system/                 skills/ · agents/
├── user/                   user.md (the operator — one person)
├── business/               <business-slug>/ (one folder per business)
├── projects/               1-active/ · 2-next/ · 3-someday/ · 9-archive/
└── kb/
```

A business folder is created by the `setup` skill, never by hand-editing this file.

## Active Business

AIOS runs MANY businesses. Business context is **never guessed**. This is the single
source of the rule — other files point here, they do not restate it.

- A **business** = any direct subfolder of `business/` containing a `business.md` with
  no unfilled `[UPPERCASE_TOKEN]` placeholders. A `business.md` that still has
  placeholders = an incomplete `setup` → treat as not-a-business; tell the user to
  finish/re-run `setup`, do not load it.
- Resolution, in order:
  0. **No business exists** (fresh vault) → do not invent one; tell the user to run the `setup` skill.
  1. The request **names** a business → use `business/<that-slug>/`.
  2. Exactly **one** business exists, request unnamed → use it, and **state which one** in your first reply.
  3. **More than one**, request unnamed → **STOP and ASK** "Which business: &lt;list&gt;?". Never guess.
- No active-business state file. The business is whatever the current request names.

## Task Router

| Your task | Go here | Also |
|-----------|---------|------|
| Quick capture / "note this" | _inbox/ | — |
| New project / save an idea / archive a project | projects/CONTEXT.md | — |
| Personal context (who am I) | user/user.md | — |
| Business config / brand / avatars / market | business/&lt;slug&gt;/business.md | which business? ask if &gt;1 |
| List businesses | browse `business/` subfolders (each = one business) | — |
| Update brand / voice / positioning | business/&lt;slug&gt;/brand/ | brand-architect skill if installed |
| Recall past notes / thinking / archive | kb/CONTEXT.md | search, don't browse |
| Write content (email / post / copy) | the relevant project (`projects/1-active/...`) | business/&lt;slug&gt;/brand/voice.md |
| Add or run a skill | system/skills/skills.md | — |
| Set up AIOS / add a business | run the `setup` skill | — |

## Skills

> Skills run **only on explicit invocation**. Never auto-activate on task
> keywords. Explicit = "run/use skill X", "use a skill for this", «запусти
> скілл», «використай скілл», «использовать скилл».

**Dual-routing rule (this is the single statement — obey exactly):**

1. **`setup` is LOCAL.** It lives at `system/skills/setup/`. On a setup
   request, read `system/skills/setup/SKILL.md` then its `CONTEXT.md`. It is
   the only skill shipped in this folder (it bootstraps the system before the
   skills server is trusted).
2. **Every other skill is REMOTE**, served by the connected AIOS skills server
   over MCP. There is NO `system/skills/<other>/` folder — never look for one.
   To use a non-setup skill:
   - discover with the `list_skills` MCP tool,
   - enter with `start_skill` (argument `slug`) — returns SKILL.md + CONTEXT.md,
   - lazy-load further files with `read_skill_file(skill, path)`.
   If those MCP tools are absent, the server is not connected — follow
   **## Connecting the skills server** below to connect it. Do not improvise a
   skill, and never present this client's own tools/plugins as AIOS skills.

`system/skills/skills.md` is the catalog/lookup the kernel reads first.

## Connecting the skills server

All non-`setup` skills stream from the AIOS skills server over MCP. If the
`list_skills` / `start_skill` / `read_skill_file` tools are NOT in your session,
the server is not connected yet — connect it (don't tell the user "no skills",
don't substitute anything else):

1. **Already configured but tools still missing?** If an `aios` MCP server is
   already in this client's config, it just needs loading: ask the user to
   approve it (if prompted) and restart the client once. If after one restart the
   tools are STILL absent, STOP and tell the user the server isn't responding (try
   later / contact support) — do not loop.

2. **Otherwise run the connect script** from the AIOS root (the folder with this
   `AGENTS.md`): `node system/connect.mjs`. It reads `.aios-license` and writes
   the correct MCP config for whichever client(s) you're in — you don't need to
   know any per-client format. Then ask the user to restart the client.
   - If `.aios-license` is missing, the install is incomplete — tell the user to
     re-run the installer / `setup`; don't invent a token.
   - If you have NO shell access (a GUI-only app like Claude Desktop), you can't
     run the script: tell the user to add the server in the app's Settings — name
     `aios`, url `https://aios-skills.vercel.app/mcp`, header `Authorization` =
     `Bearer ` followed by the value in `.aios-license`.

Keep what you tell the user simple, but never hide what you're doing — it's fine
to say "I'm connecting the AIOS skills server." Until connected, the ONLY
available skill is local `setup`. **Never** present this client's own
tools/plugins/skills as AIOS skills, and **never** search the filesystem for
skill content — non-setup skills live only on the server.

## Updating AIOS

When the user asks to update AIOS ("онови AIOS" / "update aios" / "обнови aios"):

1. Run `node system/update.mjs` (a preview — writes nothing) and show the user
   its plain summary: which system files will refresh, what (if anything) they
   edited, and the reminder that their data is untouched.
2. On the user's confirmation, run `node system/update.mjs --apply`.

The script refreshes ONLY the kernel files in `system/managed-files.json`,
backs up everything it changes to `.aios-backup/`, and never touches user data
(`user/`, `business/`, `projects/`, `kb/`, `_inbox/`). Skills themselves stream
live from the server and need no update. Do NOT update files by hand — always
use the script.

## Memory

No automatic session memory. Durable layers:
- **user/user.md** — the operator. Loaded every session.
- **business/&lt;slug&gt;/** — a business's context. Loaded on demand, only for the named business.
- **kb/** — notes/archive, recalled on demand (search). Heavy/external stays referenced.

## Storage

- Vault-internal: operator → `user/`, businesses → `business/<slug>/`, knowledge → `kb/`, skills → `system/skills/`.
- External/cloud (if any) is **per business** → recorded in that business's `business.md`, not here.
- MCP servers and code repos live **outside** the vault, in the AI client's own config / your filesystem — referenced, never stored here.

## Naming Conventions

**Folders:** lowercase, hyphen-separated, no numeric prefixes. One pinned folder:
`_inbox` (leading `_` sorts it top in Obsidian). **Business slug:** lowercase,
hyphenated, unique under `business/`, never `user`. Projects:
`prj-p[NNNN]-[name]-[YYMMDD]`, location = status — full rules in `projects/CONTEXT.md`.

**Files:** lowercase, hyphens; deliverable status `draft-v1|draft-v2|final`;
UPPERCASE only for system files (AGENTS.md, CLAUDE.md, GEMINI.md, CONTEXT.md, SKILL.md).
