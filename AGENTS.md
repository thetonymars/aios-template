---
aios_version: 0.8.2
last_updated: 2026-10-12
---

# AIOS

Instructions and routing only. The user's context lives in `user/user.md`, each business's in
`business/<slug>/`; a skill loads the rest of what it needs when it runs.

## Session Start

1. Read `user/user.md` before any other work or output. **If it does not exist but
   `areas/user/user.md` does**, this install is mid-migration: read that path, look for
   businesses in `areas/business/` instead of `business/`, and tell the user once, in their
   language, that finishing the update takes one more "update aios".
   Never treat this as "no user file".
2. If exactly one business exists (see "## Businesses"), read the three files in its `core/`
   (`business.md`, `numbers.md`, `goals.md`). More than one → load none until a request names one.
3. Read `CONTEXT.md` in the root — the router: which file owns each task. Open the file a row
   names before doing anything there. **If it does not exist**, the update is unfinished: tell
   the user once, in their language, to say "update aios", and never create this file or a
   map (a `CONTEXT.md` in `user/` or in a business) yourself. Until then save business facts
   in the business's `business.md` and the folders already there, personal facts in
   `user/user.md`; before a text for an audience read `system/voices/CONTEXT.md`, before a
   link in a call to action read `system/offers.md`.
4. **Answer the user's first message first.** Only then, in the same turn, run the checks
   below — they must never delay that answer. They are silent: if something needs the user,
   add ONE short line after your answer; if nothing does, end the turn without another message
   (if your app must close the turn with a message, repeat your answer unchanged — never a
   report on the checks).

   **Leftovers (one-time, installs before 0.7.25):** if `LICENSE`, `README.md` or `.gitignore`
   sits at the AIOS root AND is the shipped copy (`LICENSE` starts `Copyright (c) 2026 Taras
   Sulyk`; `README.md` starts `# AIOS — the installed folder`; `.gitignore` contains
   `.aios-license`), delete it and mention it in that one line. Any other content is the user's
   own file — leave it and say nothing.

   **Update check:** run `node system/update.mjs --check`. It prints one line:
   - an update is available → tell the user ONCE, in plain words, to say "update aios";
   - up to date → say nothing;
   - it could not reach the update server, or it printed nothing → that is NOT "up to date":
     this app is probably running commands without network access. Run the check once more
     with network access if the app lets you ask for it, and act on that result; otherwise say
     nothing for now.
   Never tell the user AIOS is up to date unless the check printed that. No shell → skip. Never
   auto-apply.

   **Connection check:** call any tool whose name ENDS in `list_skills` — clients prefix the
   name, so match on the ending, and actually call it: an absent name proves nothing.
   - Returns skills → say NOTHING. Not "connected", not a count.
   - Slow, times out or errors ONCE → not a broken connection; the first call after a restart
     often waits for the server to wake. Carry on and try once more later in the session.
     **Only a second failure counts.**
   - Failed twice, or no such tool after you tried → do not announce a fault and do not narrate
     the diagnosis. Go to "## Connecting the skills server" and fix what you can yourself,
     silently. Speak only when staying silent would leave the user stuck — for example a
     permission to approve, an app to restart, a change outside the AIOS folder, or a case whose
     only remedy is theirs (no licence, contact support). Then it is ONE sentence in their
     language, leading with what they do. No status strings, no file paths, no version numbers.
   - They already declined this server (`claude mcp get aios` prints `✘ Rejected`) → say nothing
     and do not re-ask. Raise it only if they ask why skills are missing.
   - No shell, no network, no MCP in this client, or the tool list is unavailable → skip
     silently, like the update check.

While `user/user.md` still has `[UPPERCASE_TOKEN]` placeholders, AIOS is not set up yet: never
invent the user's identity or a business — when a task needs them, suggest the `setup` skill.

## Layers — where things go

Before working inside a folder, open its `CONTEXT.md` (`_inbox/` has none — it is a drop box). Placing something new: it runs the OS →
`system/`; how someone writes → `system/voices/`; a person → `people/`; a fact about the user →
`user/`, about one business → `business/<slug>/`; bounded work → `projects/`; a dated log →
`calendar/`; notes or archive → `knowledge/`; a bare idea, or anything you are unsure about →
`_inbox/`.

**"Remember this" means this folder.** When the user asks you to remember something —
"remember", "запомни", in any language — write it into this folder: a fact about the user →
`user/` (show them the record first — "## Records"), anything else → by the list above and
the folder's map. Never the AI app's own memory instead: other AI apps and other computers
read this folder, not that memory.

**The root is never a destination.** It holds `AGENTS.md`, `CONTEXT.md`, the folders below and
the install's own files (`CLAUDE.md`, `GEMINI.md`, `.mcp.json`, `.aios-license`,
`.aios-backup/`) — nothing else. Never let the current directory pick where a file goes: name
the folder, and when nothing fits use `_inbox/`.

| Folder | What |
|--------|------|
| `CONTEXT.md` | the router: which file owns each task |
| `_inbox/` | unsorted capture — when unsure where something goes |
| `user/` | the user: one person. `user.md` is read at session start; where every other personal fact goes → its `CONTEXT.md` |
| `business/<slug>/` | one business: `core/` is read at session start; every other folder and where a new fact goes → its `CONTEXT.md` |
| `projects/` | bounded work, by stage: `1-active/ 2-next/ 3-someday/ 9-archive/` |
| `calendar/` | daily, weekly, monthly, yearly notes |
| `knowledge/` | notes and archive, recalled on demand — search, don't browse |
| `people/` | one note per person |
| `system/` | skills, agents, `voices/` (how each person writes), the update and connect scripts |

Heavy files, code and other apps stay outside AIOS and are only referenced.

## Businesses

A business = a subfolder of `business/` holding a `core/business.md` with no `[UPPERCASE_TOKEN]`
placeholders (placeholders left = an unfinished `setup`: tell the user to finish it). An older
install may still keep `business.md` in the folder's root instead: read it as the `core/` file
and keep writing to it until an update moves it — never create `core/` or a map by hand.
Never guess:
- None exists → tell the user to run the `setup` skill — unless `areas/business/` still exists:
  then the update is unfinished; tell them to say "update aios" and never run `setup`.
- The request names one → use it.
- Exactly one → use it, and name it the first time a reply relies on it.
- More than one, none named → ask "Which business: <list>?".

## Skills

Skills run **only when asked** — "run/use skill X", "use a skill for this", or the same in any
language. Never start one on task keywords. The one exception is `setup`: "set up AIOS" or "add
a business" means run it.

1. **`setup`** — local, `system/skills/setup/`. Works before the skills server is connected.
2. **The user's own skills** — local, `system/skills/<slug>/`. The folder is the source of
   truth; `system/skills/_index.md` is only a descriptions cache. Create new skills here, never
   in the AI app's own skills folder.
3. **AIOS catalog** — remote, over MCP: `list_skills`, `start_skill(slug)`,
   `read_skill_file(skill, path)`. Content lives only on the server. A locked skill → relay the
   upsell; never fake a catalog skill from memory.

**Two AIOS servers at once** — an older folder still carries its own server config, and the
user has also added the AIOS connector in their app, so two sets of tools end in `list_skills`
(for example `mcp__aios__list_skills` and `mcp__claude_ai_AIOS__list_skills`). It is ONE
catalog: list it once, never twice. Use the server that opens more (a skill locked in one and
open in the other → the open one) and stay with it for the session. It is not a fault: say
nothing about it and remove nothing on your own. Only if the user asks to keep one connection:
the one to remove is the folder's own (`.mcp.json` and `.aios-license` in the AIOS root), after
their yes; the folder then works through the connector.

**"What skills do I have?"** — you run the discovery and present it as "Presenting the list" in
`system/skills/skills.md` says. Same slug in two sources (local and catalog) → show both, told apart by the tag.
Never pass this AI app's own tools off as AIOS skills. No file paths, no local/remote talk.

## Agents

An agent is a specialist persona at `system/agents/<role>/AGENT.md` (list the folder to see
them). Use one only when asked ("use the marketer"): read its `AGENT.md` and stay in the persona
until the user drops it. Its skills = catalog rows marked `agent: <role>` + local skills with
`agent: <role>` in their frontmatter. An agent without skills still works on its expertise. Not
sure which → the `ceo`.

## API keys

Every API key lives in `system/.secrets/`, one file per provider named `.env.<service>`, with
`KEY=value` lines. Read keys from there yourself. Never ask the user to paste a key into the
chat and never write one anywhere else: create the file with an empty line named after the
service (`GROQ_API_KEY=`), then open it for the user yourself in a plain text editor (`open -e
<path>` on macOS, `notepad <path>` on Windows) — the file is hidden, they will not find it on
their own. Ask them to paste the key right after `=`, save, and close the window. When they say
it is done, check that the key is there, without showing it. A key the user has already
pasted: save it to that file and say it is now in the chat history. Show key names, never
values. Create the folder together with the first key. A key that an AI app keeps in its own
connection settings (`.mcp.json` and the like) stays there.

## Connecting the skills server

You reach this from the Session Start check or a user complaint.

- Clients prefix the tool names (`mcp__aios__list_skills` and the like). **Match on the ENDING,
  never the exact string — and call it before you tell the user anything is unavailable.** A
  first-call permission prompt is not a failure.
- **This is yours to diagnose, not the user's.** Tell them what to do in ONE sentence, in their
  language, in ordinary words, leading with the action. Say what you changed whenever it
  matters, and ALWAYS ask before changing anything outside the AIOS folder.
- **First: are BOTH `.mcp.json` and `.aios-license` missing from the AIOS root?** Then this is
  a connector install (0.8.2 and later): the skills reach this folder only through the AIOS
  connector the user adds in their AI app — there is no key and no config file to find. Follow
  `system/CONTEXT.md` → "Connecting the skills server" › case 1 and stop there. Never invent a
  token.
- Otherwise open `system/CONTEXT.md` → "Connecting the skills server" and follow its cases in
  order, stopping at the first match. Never loop, and never rewrite config on a guess.

## Updating AIOS

When the user asks ("update aios", in any language):
1. Run `node system/update.mjs` — a preview that writes nothing — and show its plain summary.
2. On their yes, run `node system/update.mjs --apply`.
3. **Then ALWAYS run `node system/update.mjs --check` and act on it.** Never report the update
   as finished from the apply output alone: an update that replaces `update.mjs` itself can
   leave a step pending. Repeat apply → check until it says up to date (a couple of rounds at
   most), then tell the user what actually changed.

If a round will MOVE folders, say which before applying, that their content is unchanged, and
that a copy goes to `.aios-backup/`. Never update kernel files by hand — always the script.

## Records — facts about the user and a business

Where a fact goes is said by the folder's map (`user/CONTEXT.md`, `business/<slug>/CONTEXT.md`).
How it is written is the same everywhere:

- **A number carries its date and source**, for example `- **Margin:** 40% · as of 2026-10-09 ·
  from: owner`. Sources: `owner` (the user said it), `document`, `integration`, `web`,
  `estimate` (an agent worked it out). An offer file keeps the format of `system/offers.md`.
- **Not known is written, never guessed and never left blank:** `unknown` — ask or find out;
  `unknown · asked <date>` — the user was asked on that date and does not know; `n/a` — does
  not apply here.
- **One home per fact.** Every other file points to it and never copies it: a price lives in
  the offer file, a number of the core in `core/numbers.md`.
- **A plan carries its dates.** The plan of a business for a period (a 90-day plan) is the
  section `## Plan` of `core/goals.md` and opens with `**Period:** <start date> → <end date>`.
  After the end date it is not in force: say so once and do not act on it. Leave an ended plan
  exactly as it is — do not edit it, annotate it, move it or start a new period — until the user
  gives a new plan, even when they say something that changes one of its items. Only then the
  old one moves whole, first, into
  `plans/plan-<start YYMMDD>-<end YYMMDD>.md` in the business folder (a plan for
  2026-07-01 → 2026-09-28 becomes `plans/plan-260701-260928.md`), and the new one takes its
  place in `## Plan`. `plans/` is not read at session start; the next planning reads it to see
  what was already tried.
- **Names:** the file of one thing (a segment, a competitor, a product) has a stable name
  without a date; a dated report ends with `-<YYMMDD>`.
- **A new record file** starts with `type` and `last_updated` in its frontmatter and holds
  only what is known. A map (`CONTEXT.md`) has no frontmatter.
- **A folder from a map's "No folder yet" table** is created together with its first file,
  never empty in advance. Then add the folder as a row to the map's "What lives here" table
  and delete from "No folder yet" the rows whose "Goes to" starts with that folder.
- **A folder no table of the map names:** never create one. One that is already there stays
  where it is: ask the user what it is and add it to the map (in a business — under "Own to
  this business"). Never move it out on your own.
- **Moved or renamed a folder or a file inside `user/` or a business folder:** in the same
  step change every row that points at the old place — in that folder's map
  (`user/CONTEXT.md`, `business/<slug>/CONTEXT.md`) and in the root `CONTEXT.md` — to the
  new one. A move is not finished while a row still points at the old place.
- **Before you delete, move or rename several of the user's files or folders at once** —
  anywhere in AIOS ("tidy up", "clean up", "sort this out"): show the list of what will
  change and wait for their yes. This rule is not about one file or folder the user named
  themselves, or about files you made yourself in this task.

Personal facts (`user/`) have four rules more:

- The user writes anywhere there. A skill or an agent writes only **what the user said
  themselves in this conversation**: show them the record first, save after their yes. Nobody
  writes conclusions about the user.
- Private by default. Only `user.md` is read at session start; any other file is opened when
  the task needs it. `user.md` (name, role) may be used in a text for an audience; nothing
  from the other files goes into business or public text unless the user says so for that
  text.
- Numbers of documents and cards are never stored: write where the thing is kept and until
  when it is valid.
- The user does not want to answer → write `unknown · declined <date>`, and do not ask again.

## Naming

Folders and files: lowercase, hyphens — unless the folder's `CONTEXT.md` sets its own naming
(`people/`, `calendar/`). Exceptions: `_inbox`, the stage folders `1-active/
2-next/ 3-someday/ 9-archive/`, and project folders `prj-p[NNNN]-[name]-[YYMMDD]` (full rules:
`projects/CONTEXT.md`). Business slug: lowercase,
hyphenated, unique, never `user`. Deliverable status: `draft-v1`, `draft-v2`, `final`. UPPERCASE
only for system files (AGENTS.md, CLAUDE.md, GEMINI.md, CONTEXT.md, SKILL.md, AGENT.md, VOICE.md,
PROJECT.md, SPRINT.md).
