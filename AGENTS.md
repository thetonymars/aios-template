---
aios_version: 4.4.3
last_updated: 2026-06-01
---

# This is your master file — you MUST follow every instruction in this file

The global AIOS kernel: instructions + routing only. **No business data** — each
business's data lives in `business/<slug>/`.

## Session Start

MANDATORY: your VERY FIRST tool call in every new session MUST be: read
`user/user.md`. No text output before that read completes.

**First-run branch:** if `user/user.md` still contains any unfilled
`[UPPERCASE_TOKEN]` placeholder (e.g. `[FULL_NAME]`, `[BACKGROUND]`), OR no business
exists yet, the system is not set up — the only valid response is to tell the user
to run the `setup` skill. Do not improvise identity or business data.

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

1. **Already configured?** First check whether an MCP server named `aios` already
   exists in this client's config. If it does, do NOT add a second one — the
   issue is approval or restart, not registration: ask the user to approve the
   `aios` server if prompted, and to restart the client once. If after one
   restart `list_skills` is STILL absent and `aios` is already configured, STOP
   and tell the user the skills server isn't responding (try again later /
   contact support). Do not loop or re-register.

2. **Get the token.** Read it from `.aios-license` at the AIOS root (the folder
   containing this `AGENTS.md`) — a single line. If that file is missing, the
   install is incomplete: tell the user to re-run the installer / `setup`. Do not
   invent a token.

3. **Register the server** with these values — name `aios`, transport HTTP
   (streamable), url `https://aios-skills.vercel.app/mcp`, header
   `x-tony-license: <token>`. Method, in order of preference:
   - **Portable:** if this client reads a project-scoped `.mcp.json`, write it at
     the AIOS root:
     `{"mcpServers":{"aios":{"type":"http","url":"https://aios-skills.vercel.app/mcp","headers":{"x-tony-license":"<token>"}}}}`
   - else use this client's own MCP-add CLI or settings (use what you know about
     your client);
   - else hand the user the steps (see "Telling the user").

4. **Restart.** Ask the user to restart the client — most load MCP servers only
   at start. After restart, `list_skills` should be present.

**Telling the user:** keep spoken updates simple, but **never hide a
security-relevant action** — if asked (or before doing it) it's fine to say
plainly "I'm adding the AIOS skills server to your client and saving your license
in the aios folder." Non-technical ≠ concealed. If you must hand off the manual
steps, you MAY show the url and the `x-tony-license` value (the user needs them) —
show only those.

Until connected, the ONLY available skill is local `setup`. **Never** present
this client's own tools/plugins/skills as AIOS skills, and **never** search the
filesystem for skill content — non-setup skills live only on the server.

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
