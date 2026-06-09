---
aios_version: 0.6.0
last_updated: 2026-06-09
---

# This is your master file — you MUST follow every instruction in this file

The global AIOS kernel: instructions + routing only. **No business data** — each
business's data lives in `areas/business/<slug>/`.

## Session Start

MANDATORY: your VERY FIRST tool call in every new session MUST be: read
`areas/user/user.md`. No text output before that read completes.

**Update check (best-effort, right after that read):** run `node system/update.mjs --check`.
If it reports an update is available, tell the user ONCE, in plain language (e.g. "Доступне
оновлення AIOS — скажи «онови aios», щоб оновити"). If it says up to date, say nothing. If it
errors, there's no shell, or no network — skip silently. Never block the session, never
auto-apply (applying always waits for the user — see "## Updating AIOS").

**First-run note (no hard gate):** new users are told during onboarding to run
the `setup` skill on first install, so don't block them. Just proceed normally —
with ONE guardrail: if `areas/user/user.md` still has `[UPPERCASE_TOKEN]` placeholders
(not set up yet), **never fabricate the operator's identity or a business**; if a
task genuinely needs that context and it's missing, ask the user or suggest they
run `setup`. (Answer skills questions per "## Skills" — never pass this client's own
tools off as AIOS skills.)

Otherwise this read loads the operator (one global person). Do **NOT** auto-load any
business file — business context is loaded only when a request names a business
(see Active Business).

## Terms

- **_inbox/** — capture: unsorted intake, not yet classified. Anything here is "mine, incoming".
- **system/** — what the OS runs on: skills, agents. Machine-consumed, not notes.
- **areas/** — curated context about the operator and their businesses. A container only (no file of its own) — its how-to lives in the subfolders.
- **areas/user/** — the single global operator (the person). Never a business.
- **areas/business/** — one folder per business: `areas/business/<slug>/business.md` (config) + on-demand `brand/ avatars/ competitors/ market/ products/ oracle/`.
- **projects/** — bounded work, start/end or recurring. Business-agnostic.
- **calendar/** — time-stamped notes: `daily/ weekly/ monthly/ yearly/` (see `calendar/CONTEXT.md`).
- **knowledge/** — accumulated thinking/notes, recalled on demand (see `knowledge/CONTEXT.md`).
- **network/** — people & relationships, one note per person (see `network/CONTEXT.md`).
- **CONTEXT.md** — "read me first" router inside any subfolder.

## Layers (the placement rule)

Given any item, ask in order:
1. Does the OS execute it / need it to run? → **system/**
2. A person / relationship (contact, lead, partner)? → **network/**
3. Small, curated, always-relevant fact?
   - About the **operator as a person**? → **areas/user/**
   - About a **specific business**? → **areas/business/&lt;slug&gt;/** (the named one — ask if ambiguous)
4. Bounded deliverable work (start/end or recurring)? → **projects/**
5. Time-stamped log (today / this week)? → **calendar/**
6. Accumulated thinking/notes/archive, recalled on demand? → **knowledge/**
7. Not yet sorted? → **_inbox/**, then re-apply 1–6
8. Heavy/binary/external (cloud, repos, other vaults)? → stays **external, referenced only**

## Structure

```
aios/                       ← whole root = your AIOS folder
├── _inbox/
├── system/                 skills/ · agents/
├── areas/
│   ├── user/               user.md (the operator — one person)
│   └── business/           <business-slug>/ (one folder per business)
├── projects/               1-active/ · 2-next/ · 3-someday/ · 9-archive/
├── calendar/               daily/ · weekly/ · monthly/ · yearly/
├── knowledge/              notes/
└── network/
```

A business folder is created by the `setup` skill, never by hand-editing this file.

## Active Business

AIOS runs MANY businesses. Business context is **never guessed**. This is the single
source of the rule — other files point here, they do not restate it.

- A **business** = any direct subfolder of `areas/business/` containing a `business.md` with
  no unfilled `[UPPERCASE_TOKEN]` placeholders. A `business.md` that still has
  placeholders = an incomplete `setup` → treat as not-a-business; tell the user to
  finish/re-run `setup`, do not load it.
- Resolution, in order:
  0. **No business exists** (fresh vault) → do not invent one; tell the user to run the `setup` skill.
  1. The request **names** a business → use `areas/business/<that-slug>/`.
  2. Exactly **one** business exists, request unnamed → use it, and **state which one** in your first reply.
  3. **More than one**, request unnamed → **STOP and ASK** "Which business: &lt;list&gt;?". Never guess.
- No active-business state file. The business is whatever the current request names.

## Task Router

| Your task | Go here | Also |
|-----------|---------|------|
| Quick capture / "note this" | _inbox/ | — |
| New project / save an idea / archive a project | projects/CONTEXT.md | — |
| Personal context (who am I) | areas/user/user.md | — |
| Business config / brand / avatars / market | areas/business/&lt;slug&gt;/business.md | which business? ask if &gt;1 |
| List businesses | browse `areas/business/` subfolders (each = one business) | — |
| Update brand / voice / positioning | areas/business/&lt;slug&gt;/brand/ | brand-architect skill if installed |
| Time-stamped log / journal / review | calendar/CONTEXT.md | daily · weekly · monthly · yearly |
| A person / contact / lead | network/CONTEXT.md | one note per person |
| Recall past notes / thinking / archive | knowledge/CONTEXT.md | search, don't browse |
| Write content (email / post / copy) | the relevant project (`projects/1-active/...`) | areas/business/&lt;slug&gt;/brand/voice.md |
| Add or run a skill | system/skills/skills.md | — |
| Set up AIOS / add a business | run the `setup` skill | — |

## Skills

> Skills run **only on explicit invocation**. Never auto-activate on task
> keywords. Explicit = "run/use skill X", "use a skill for this", «запусти
> скілл», «використай скілл», «использовать скилл».

**Skills come from THREE sources — know where each lives:**

1. **`setup` — LOCAL bootstrap** at `system/skills/setup/`. On a setup request read
   `system/skills/setup/SKILL.md` then its `CONTEXT.md`. It ships in the folder
   because it runs before the skills server is trusted.
2. **Your own skills — LOCAL** at `system/skills/<slug>/` — user-created, travel with
   the vault (work in every AI client). **Discover by LISTING the `system/skills/`
   directory** (the source of truth for what exists); `system/skills/skills.md` is
   only a descriptions cache. Take each folder's description from the index; if a
   folder is missing from the index (or the index names one that's gone), read its
   `SKILL.md` frontmatter and refresh the index. **Never report "no local skills"
   from the index alone — always check the folder first** (the index can be stale,
   e.g. a skill created in another session).
3. **AIOS catalog — REMOTE** over MCP (the curated/paid catalog): discover with
   `list_skills`, enter with `start_skill(slug)` (returns SKILL.md + CONTEXT.md),
   lazy-load with `read_skill_file(skill, path)`. Tools absent → server not
   connected, see **## Connecting the skills server**. Catalog skill CONTENT lives
   only on the server — never look for a `system/skills/<catalog-slug>/` folder.

**Creating a skill:** author it under `system/skills/<slug>/` in THIS vault —
NEVER the client's own skill directory (`~/.claude/skills/` etc.), or it would work
in only one client. Format + how to index it = `system/skills/skills.md`.

**"What skills do I have?"** (plain language — you run the discovery, never make the
user type a command). Present skills **grouped by WHAT THEY'RE FOR** — the job they do
(`marketing · sales · content · research · assistant` — classification rule in
`system/skills/skills.md`), because that is how the user thinks ("what would I use it
for?"). **Do NOT group by where a skill lives** (local vs remote — the user does not
care). Within each category, one line per skill: **name — (short access tag) — what it
does.** The tag in parens is the access/source, secondary info:
- **(premium)** / **(free)** — the AIOS catalog (tier from `list_skills`)
- **(yours)** — a skill the user made
- **(your AI app)** — the client's own skill (e.g. superpowers), shown but never
  presented AS an AIOS skill

On a slug clash, show both, told apart by the tag — never let one silently shadow the
other. Keep it simple — no file paths, no "local/remote" plumbing talk.

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
   - If `.aios-license` is missing, the install is incomplete — tell the user to get
     their key from the funnel (tonymars.me/aios) and reinstall; don't invent a token.
     (`setup` does NOT set the license.)
   - If you have NO shell access (a GUI-only app like Claude Desktop), you can't
     run the script: tell the user to add the server in the app's Settings — name
     `aios`, url `https://aios-skills.vercel.app/mcp`, header `Authorization` =
     `Bearer ` followed by the value in `.aios-license`.

Keep what you tell the user simple, but never hide what you're doing — it's fine to
say "I'm connecting the AIOS skills server." Until it's connected, only `setup` and
your own local `system/skills/` skills are available (catalog-vs-native rules: see
"## Skills").

## Updating AIOS

When the user asks to update AIOS ("онови AIOS" / "update aios" / "обнови aios"):

1. Run `node system/update.mjs` (a preview — writes nothing) and show the user
   its plain summary: which system files will refresh, what (if anything) they
   edited, and the reminder that their data is untouched.
2. On the user's confirmation, run `node system/update.mjs --apply`.

The script refreshes ONLY the kernel files in `system/managed-files.json`,
backs up everything it changes to `.aios-backup/`, and never touches user data
(`areas/`, `projects/`, `calendar/`, `knowledge/`, `network/`, `_inbox/`). Skills
themselves stream live from the server and need no update. Do NOT update files by
hand — always use the script.

## Memory

No automatic session memory. Durable layers:
- **areas/user/user.md** — the operator. Loaded every session.
- **areas/business/&lt;slug&gt;/** — a business's context. Loaded on demand, only for the named business.
- **knowledge/** — notes/archive, recalled on demand (search). Heavy/external stays referenced.

## Storage

- Vault-internal: operator → `areas/user/`, businesses → `areas/business/<slug>/`, knowledge → `knowledge/`, skills → `system/skills/`.
- External/cloud (if any) is **per business** → recorded in that business's `business.md`, not here.
- MCP servers and code repos live **outside** the vault, in the AI client's own config / your filesystem — referenced, never stored here.

## Naming Conventions

**Folders:** lowercase, hyphen-separated, no numeric prefixes. One pinned folder:
`_inbox` (leading `_` sorts it top in Obsidian). **Business slug:** lowercase,
hyphenated, unique under `areas/business/`, never `user`. Projects:
`prj-p[NNNN]-[name]-[YYMMDD]`, location = status — full rules in `projects/CONTEXT.md`.

**Files:** lowercase, hyphens; deliverable status `draft-v1|draft-v2|final`;
UPPERCASE only for system files (AGENTS.md, CLAUDE.md, GEMINI.md, CONTEXT.md, SKILL.md).
