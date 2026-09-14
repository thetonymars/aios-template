---
aios_version: 0.7.28
last_updated: 2026-09-14
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
2. If exactly one business exists (see "## Businesses"), read its `business.md` too. More than
   one → load none until a request names one.
3. **Answer the user's first message first.** Only then, in the same turn, run the checks
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

Before working inside a folder, open its `CONTEXT.md`. Placing something new: it runs the OS →
`system/`; a person → `people/`; a fact about the user → `user/`, about one business →
`business/<slug>/`; bounded work → `projects/`; a dated log → `calendar/`; notes or archive →
`knowledge/`; unsure → `_inbox/`.

| Folder | What |
|--------|------|
| `_inbox/` | unsorted capture — when unsure where something goes |
| `user/user.md` | the user: one person |
| `business/<slug>/` | one business: `business.md` + `brand/` (voice), `avatars/`, `competitors/`, `products/` |
| `projects/` | bounded work, by stage: `1-active/ 2-next/ 3-someday/ 9-archive/` |
| `calendar/` | daily, weekly, monthly, yearly notes |
| `knowledge/` | notes and archive, recalled on demand — search, don't browse |
| `people/` | one note per person |
| `system/` | skills, agents, the update and connect scripts |

Heavy files, code and other apps stay outside AIOS and are only referenced.

## Businesses

A business = a subfolder of `business/` whose `business.md` has no `[UPPERCASE_TOKEN]`
placeholders (placeholders left = an unfinished `setup`: tell the user to finish it). Never guess:
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
   truth; `system/skills/skills.md` is only a descriptions cache. Create new skills here, never
   in the AI app's own skills folder.
3. **AIOS catalog** — remote, over MCP: `list_skills`, `start_skill(slug)`,
   `read_skill_file(skill, path)`. Content lives only on the server. A locked skill → relay the
   upsell; never fake a catalog skill from memory.

**"What skills do I have?"** — you run the discovery and present it as "Presenting the list" in
`system/skills/skills.md` says. Same slug in two sources → show both, told apart by the tag.
Never pass this AI app's own tools off as AIOS skills. No file paths, no local/remote talk.

## Agents

An agent is a specialist persona at `system/agents/<role>/AGENT.md` (list the folder to see
them). Use one only when asked ("use the marketer"): read its `AGENT.md` and stay in the persona
until the user drops it. Its skills = catalog rows marked `agent: <role>` + local skills with
`agent: <role>` in their frontmatter. An agent without skills still works on its expertise. Not
sure which → the `ceo`.

## Connecting the skills server

You reach this from the Session Start check or a user complaint.

- Clients prefix the tool names (`mcp__aios__list_skills` and the like). **Match on the ENDING,
  never the exact string — and call it before you tell the user anything is unavailable.** A
  first-call permission prompt is not a failure.
- **This is yours to diagnose, not the user's.** Tell them what to do in ONE sentence, in their
  language, in ordinary words, leading with the action. Say what you changed whenever it
  matters, and ALWAYS ask before changing anything outside the AIOS folder.
- **First: is `.aios-license` missing from the AIOS root?** Then the install never finished:
  tell them to get their personal install command at `yellows.one/aios`. Never invent a token.
  Stop there.
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

## Naming

Folders and files: lowercase, hyphens. Exceptions: `_inbox`, the stage folders `1-active/
2-next/ 3-someday/ 9-archive/`, and project folders `prj-p[NNNN]-[name]-[YYMMDD]` (full rules:
`projects/CONTEXT.md`). Business slug: lowercase,
hyphenated, unique, never `user`. Deliverable status: `draft-v1`, `draft-v2`, `final`. UPPERCASE
only for system files (AGENTS.md, CLAUDE.md, GEMINI.md, CONTEXT.md, SKILL.md).
