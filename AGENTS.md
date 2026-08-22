---
aios_version: 0.7.16
last_updated: 2026-08-22
---

# This is your master file — you MUST follow every instruction in this file

The global AIOS kernel: instructions + routing only. **No business data** — each
business's data lives in `business/<slug>/`.

## Session Start

MANDATORY: your VERY FIRST tool call in every new session MUST be: read
`user/user.md`. No text output before that read completes.

**If `user/user.md` does not exist but `areas/user/user.md` does**, this install is
mid-migration: the kernel was updated but the folders have not moved yet. Read the
`areas/` path for now, and tell the user once, in their language, that finishing the
update takes one more "update aios". Never treat this as "no operator file".

**Update check (best-effort, right after that read):** run `node system/update.mjs --check`.
If it reports an update is available, tell the user ONCE, in plain language, in the user's
language (e.g. "An AIOS update is available — say 'update aios' to apply it"). If it says up
to date, say nothing. If it
errors, there's no shell, or no network — skip silently. Never block the session, never
auto-apply (applying always waits for the user — see "## Updating AIOS").

**First-run note (no hard gate):** new users are told during onboarding to run
the `setup` skill on first install, so don't block them. Just proceed normally —
with ONE guardrail: if `user/user.md` still has `[UPPERCASE_TOKEN]` placeholders
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
- **user/** — the single global operator (the person). Never a business.
- **business/** — one folder per business: `business/<slug>/business.md` (config) + on-demand `brand/ avatars/ competitors/ market/ products/ oracle/`.
- **projects/** — bounded work, start/end or recurring. Business-agnostic.
- **calendar/** — time-stamped notes: `daily/ weekly/ monthly/ yearly/` (see `calendar/CONTEXT.md`).
- **knowledge/** — accumulated thinking/notes, recalled on demand (see `knowledge/CONTEXT.md`).
- **people/** — people & relationships, one note per person (see `people/CONTEXT.md`).
- **CONTEXT.md** — "read me first" router inside any subfolder.

## Layers (the placement rule)

Given any item, ask in order:
1. Does the OS execute it / need it to run? → **system/**
2. A person / relationship (contact, lead, partner)? → **people/**
3. Small, curated, always-relevant fact?
   - About the **operator as a person**? → **user/**
   - About a **specific business**? → **business/&lt;slug&gt;/** (the named one — ask if ambiguous)
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
├── user/                   user.md (the operator — one person)
├── business/               <business-slug>/ (one folder per business)
├── projects/               1-active/ · 2-next/ · 3-someday/ · 9-archive/
├── calendar/               daily/ · weekly/ · monthly/ · yearly/
├── knowledge/              notes/
└── people/
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
| Time-stamped log / journal / review | calendar/CONTEXT.md | daily · weekly · monthly · yearly |
| A person / contact / lead | people/CONTEXT.md | one note per person |
| Recall past notes / thinking / archive | knowledge/CONTEXT.md | search, don't browse |
| Write content (email / post / copy) | the relevant project (`projects/1-active/...`) | business/&lt;slug&gt;/brand/voice.md |
| Add or run a skill | system/skills/skills.md | — |
| Set up AIOS / add a business | run the `setup` skill | — |

## Skills

> Skills run **only on explicit invocation**. Never auto-activate on task
> keywords. Explicit = "run/use skill X", "use a skill for this" — or the
> equivalent in any language the user speaks.

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
in only one client. Format + how to index it = `system/skills/skills.md`. To give
the skill to an agent ("teach" it), set `agent: <role>` in the skill's frontmatter
`metadata` — see "## Agents". The free `aios-skill-creator` catalog skill guides
the whole flow.

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

## Agents

> Agents run **only on explicit invocation** — same rule as skills.

An **agent** is a specialist persona that owns a set of skills — e.g. a marketer, a
researcher. The persona lives **locally** at `system/agents/<role>/AGENT.md`; its
skills come from TWO places:

1. **AIOS catalog (remote, gated by license):** each `list_skills` row carries its
   owner (`agent: <role>`, role = the agent's folder name) — decided on the server,
   so an agent's catalog set can grow without any local file changing.
2. **Skills the operator taught it (local):** any skill under `system/skills/<slug>/`
   whose SKILL.md frontmatter `metadata` has `agent: <role>` belongs to that agent.

- **Discover:** list the `system/agents/` directory — each subfolder with an
  `AGENT.md` is an agent. (The folder is the source of truth.)
- **Activate** (e.g. "use the marketer" — in any language): read that
  `system/agents/<role>/AGENT.md` and adopt the persona for the task. The persona's
  skills are its marked `list_skills` rows + its marked local skills — when a
  sub-task matches one, start it (catalog → `start_skill(<slug>)`; local → read its
  SKILL.md) and follow the skill's process. Stay in the persona until the user
  drops it.
- **An agent with NO skills yet still works** — it answers with its expertise and
  judgment, and the user can **teach it**: create a local skill and set
  `agent: <role>` in its frontmatter `metadata` (the free `aios-skill-creator`
  catalog skill walks through this). Never fake a CATALOG skill from memory.
- **Not sure which agent?** Activate the `ceo` — it's the team's router: it takes
  strategy/priority questions itself and hands everything else to the right
  specialist.
- **Gated skills:** catalog skills are license-gated — if `start_skill` returns a
  lock/upsell, that skill isn't in the user's plan; relay the upsell, don't
  fake the skill from memory. Tools absent → server not connected (see below).
- The persona file is the agent; don't look for a `skills/` folder under an agent —
  there isn't one (catalog skills are remote; taught skills live in
  `system/skills/`).

## Connecting the skills server

All non-`setup` skills stream from the AIOS skills server over MCP. If the
`list_skills` / `start_skill` / `read_skill_file` tools are NOT in your session, the
server is not connected yet.

**This is yours to diagnose — not the user's.** They are not developers. Work out which
case below you are in, then tell them what to do in ONE sentence, in their own language,
**in ordinary words**: lead with the action they have to take, not with the machinery
behind it. *"The AIOS skills aren't switched on yet — your app will ask your permission,
say yes and restart it"* does the job; a status string and a file path do not. The most
they should ever have to do is approve a permission and restart their app.

**Plain is not the same as hidden.** Say what you changed whenever it matters, always if
they ask, and ALWAYS before you change anything outside the AIOS folder — that one is
theirs to decide, not a detail to spare them.

**Check these in order and stop at the first one that matches.**

### 1. Is `.aios-license` missing from the AIOS root?

Then the install never finished, and nothing below can help. Tell the user to get their
personal install command at `yellows.one/aios`. Never invent a token. (`setup` does NOT
set the license.) Stop here.

### 2. Are you Claude Code?

The install writes the server config to **`.mcp.json` at the AIOS root** (beside this
file). Claude Code reads that file only when the AIOS folder is the folder the app was
opened in, and it asks the user to approve the server once. Run `claude mcp get aios`
and match what it PRINTS — the exit code is 0 either way and tells you nothing. (No
`claude` command available? Go to 3.)

- **`⏸ Pending approval`** — everything is in place; the user simply has not said yes
  yet. Ask them to restart the app and say yes when it asks.
- **`✘ Rejected`** — the permission was declined earlier and the app remembers it, so it
  will never ask again on its own. **Ask before you clear that.** It is a decision they
  recorded, and undoing it silently is not yours to do: say that they turned this down
  once and that you can make the app ask again, and get a yes. Then run
  `claude mcp reset-project-choices` and ask them to restart. It affects THIS folder
  only, but it re-asks about every server the folder configures — so if the app asks
  about more than one, that is expected, not a fault.
- **`✔ Connected`** — the config is right and the server answers; this session simply
  started before the approval landed. Ask for one restart and nothing else. **Do not
  repair a config that is already working.** Still no tools after that restart → go to 4.
- **`Scope: User config`** (whatever the status says) — an older install, wired up by
  `connect.mjs` before `.mcp.json` existed. Same treatment: one restart, no repairs, and
  **do not run `connect.mjs` again**. Still nothing → go to 4.
- **`No MCP server found`** — Claude Code sees no `aios` server here. Before you conclude
  anything, open `.mcp.json` at the AIOS root and check it yourself. It must exist, be
  valid JSON, have an `aios` entry, and its `Authorization` header must end in the real
  device id — **if the header still holds a `PASTE_…` placeholder, the install was left
  half-done**.
  - File missing, unparseable, no `aios` entry, or a placeholder still in it → the
    config is not usable, but you can repair it right here and nothing outside the folder
    has to change. Rewrite `.mcp.json` yourself: the key is the one line in
    `.aios-license`, and the device id is a sha256 of the home path, platform, CPU model
    and total memory joined with `|`, cut to 12 hex characters and uppercased. It has to
    be that formula — any other one yields an id the server does not recognise — but you
    do not have to use this exact command to get it:

    ```
    node -e "const{createHash}=require('crypto'),os=require('os');console.log(createHash('sha256').update([os.homedir(),os.platform(),os.cpus()[0]?.model??'',String(os.totalmem())].join('|')).digest('hex').slice(0,12).toUpperCase())"
    ```

    The header is `Bearer <key>.<id>`. Then ask for one restart. Only if that is
    impossible, go to 3.
  - File present and correct → the app was not opened in the AIOS folder, so it cannot
    see the file. Ask the user to close the app and open it again inside the AIOS folder,
    and tell them you'll be waiting there.

### 3. Any other client

**Ask the user first, and get a yes.** This path changes files OUTSIDE the AIOS folder:
`node system/connect.mjs` adds the AIOS entry to the settings of **every AI app it finds
on this machine**, not only the one you are in, and the OpenCode entry it writes fetches
an npm package (`mcp-remote`) every time that app starts. Say both in plain words before
you run it. It keeps a `.bak-aios` copy of each file the first time it touches one — not
on later runs — and leaves their other MCP servers alone. But it is their machine, so it
is their call.

With a yes: run it from the AIOS root (the folder with this `AGENTS.md`). It reads
`.aios-license` and writes the correct config for whichever clients are installed — you
do not need to know any per-client format. Tell them what it reported writing, then ask
them to restart the app.

- The script reports which clients it wrote and which it skipped. **If it skipped
  yours**, or you have no shell at all (a GUI-only app such as Claude Desktop), you
  cannot configure it for them: give them the three values to add a connector in the
  app's own settings — name `aios`, url `https://aios-skills.vercel.app/mcp`, header
  `Authorization` = `Bearer ` followed by the value in `.aios-license`. Show them those
  three values in full: here the machinery IS the instruction, because they have to type
  it. **Note this header carries no device id** — unlike every config written for them,
  a hand-typed connector sits outside the one-machine cap. That is deliberate, not an
  omission you should correct.

- **Prefer a config the app reads from inside the AIOS folder if it has one**, for the
  same reason Claude Code does: the user approves it and nothing global is touched. If
  you are not sure your app supports that, say so rather than assuming either way.

### 4. Still nothing after ONE restart

Stop. Tell the user plainly that the skills server is not answering and that they should
contact support. Do not loop, do not try a third approach, and do not start rewriting
config — a wrong repair costs more than the wait.

Until it is connected, only `setup` and the user's own `system/skills/` skills are
available (catalog-vs-native rules: see "## Skills").

## Updating AIOS

When the user asks to update AIOS ("update aios" — or the equivalent in any language):

1. Run `node system/update.mjs` (a preview — writes nothing) and show the user
   its plain summary: which system files will refresh, what (if anything) they
   edited, and the reminder that their data is untouched.
2. On the user's confirmation, run `node system/update.mjs --apply`.
3. **Then ALWAYS run `node system/update.mjs --check` and act on what it says.**
   Never report the update as finished on the strength of the apply output alone:
   an update that replaces `update.mjs` itself cannot run the new version's work in
   the same pass, so "Done — updated N files" can be true while a step is still
   pending. Repeat apply → check until `--check` reports up to date (at most a
   couple of rounds), then tell the user what actually changed.
   - When a round announces folders that will be MOVED, say so in plain language
     before applying: which folders, that the content is not changed, and that a
     copy goes to `.aios-backup/`.

The script writes only kernel files — those listed in `system/managed-files.json`, plus
any NEW ones the incoming release adds, which is how a new kernel file ever reaches an
existing install — and backs up everything it changes to `.aios-backup/`. A hard
tripwire refuses any path under `user/`, `business/`, `areas/` or `_inbox/` whatever a
manifest claims. `people/`, `projects/`, `calendar/` and `knowledge/` are not on that
list, deliberately: each ships its own managed `CONTEXT.md` router, so the script does
write there — that one file, never the notes beside it, and never without naming it in
the preview first. Skills stream live from the server and need no update. Do NOT update
files by hand — always use the script.

## Memory

No automatic session memory. Durable layers:
- **user/user.md** — the operator. Loaded every session.
- **business/&lt;slug&gt;/** — a business's context. Loaded on demand, only for the named business.
- **knowledge/** — notes/archive, recalled on demand (search). Heavy/external stays referenced.

## Storage

- Vault-internal: operator → `user/`, businesses → `business/<slug>/`, knowledge → `knowledge/`, skills → `system/skills/`.
- External/cloud (if any) is **per business** → recorded in that business's `business.md`, not here.
- MCP servers and code repos live **outside** the vault, in the AI client's own config /
  your filesystem — referenced, never stored here. **One exception:** the AIOS skills
  server's own `.mcp.json` sits at the AIOS root, because that is where the install put
  it and where Claude Code looks for it (see "## Connecting the skills server").

## Naming Conventions

**Folders:** lowercase, hyphen-separated, no numeric prefixes. One pinned folder:
`_inbox` (leading `_` sorts it top in Obsidian). **Business slug:** lowercase,
hyphenated, unique under `business/`, never `user`. Projects:
`prj-p[NNNN]-[name]-[YYMMDD]`, location = status — full rules in `projects/CONTEXT.md`.

**Files:** lowercase, hyphens; deliverable status `draft-v1|draft-v2|final`;
UPPERCASE only for system files (AGENTS.md, CLAUDE.md, GEMINI.md, CONTEXT.md, SKILL.md).
