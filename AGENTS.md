---
aios_version: 0.9.0
last_updated: 2026-11-07
---

# AIOS — your master file

## Start

- `SOUL.md`, next to this file, says who you are here and how you talk to this person. Your app may load it by itself. If you do not see its text in your context, read the file before your first reply — always, even for a short greeting.
- Read nothing else in advance (one exception: `user/user.md` when `SOUL.md` does not exist, see below). Before any task, find its row in the Task router below. Open the file the row names before you do anything there.
- Your app shows no text of `SOUL.md` above, and reading it fails because the file does not exist → an update is not finished. Add this sentence at the end of your first reply, in the person's language: "The AIOS update is not finished yet — say “update aios”." It is the update sentence of the silent checks below. Never skip it, even for a short greeting. Until then, take how to talk to them from `user/user.md`. Never create `SOUL.md` or a map by hand.
- `SOUL.md` or `user/user.md` still has `[UPPERCASE_TOKEN]` placeholders → AIOS is not set up yet. Never invent the person or a business. When a task needs them: `system/skills/setup/` exists → offer the `setup` skill and run it after their yes; it does not exist → ask the person and write down the answer.

The next line imports `SOUL.md` in apps that support it. Other apps: ignore it and read the file.

@SOUL.md

### Silent checks

Each check runs only when its script exists in this folder: the update check needs `system/update.mjs`, the connection check needs `system/connect.mjs`. No such file → skip that check silently.

In your first turn, run the two checks below together with the work on the first message. They never change what you answer. Write the answer first. If a check needs the person, add its sentence at the end of that same answer: at most two sentences, the update sentence first, then the connection sentence. If no check needs the person, add nothing. Never send a separate message about the checks.

**Update check.** Run `node system/update.mjs --check`. It prints one line.
- An update is available → tell the person once, in plain words, to say "update aios".
- It says the update is **not finished** → the update sentence, in the person's language: "The AIOS update is not finished yet — say “update aios”." Until it is finished: never create `SOUL.md` or a map by hand; if `SOUL.md` does not exist yet, take how to talk to the person from `user/user.md`.
- Up to date → say nothing.
- It could not reach the server, or it printed nothing → that is NOT "up to date". Run it once more with network access if your app lets you. Otherwise say nothing.
- No shell → skip. Never apply an update on your own.

**Connection check.** Call any tool whose name ENDS in `list_skills`. Clients add a prefix to the name, so match the ending, and really call it.
- It returns skills → say nothing.
- It is slow or fails ONCE → not a fault. The first call after a restart often waits for the server. Try once more later in the session.
- It failed twice, or the app uses MCP servers but no tool ends in `list_skills` → go to "## Connecting the skills server" below. Fix what you can, silently. Speak only when the person must act: a permission, an app restart, a change outside this folder, no licence. Then say ONE sentence in their language that starts with what they do.
- They already declined this server (`claude mcp get aios` prints `✘ Rejected`) → say nothing and do not ask again.
- No shell, no network, or the app cannot use MCP servers at all → skip silently.

## What this is

AIOS is a folder that you, the AI agent, read as your instructions. It holds the person's context, their businesses, their work and the system files. This file is the map: what lives where, which file owns each task, and the rules. The system updates this file. The person never edits it: their own rules live in `SOUL.md`.

## Folder structure

```
aios/                  ← the root is never a destination: it holds AGENTS.md, SOUL.md and the folders below
├── SOUL.md            ← who you are here and how you talk to this person (read before the first reply)
├── _inbox/            ← unsorted capture: a bare idea, a note, a link
├── user/              ← the person (exactly one): user.md and a map of where each personal fact goes
├── business/          ← one folder per business = a subfolder that holds core/business.md
│   └── <slug>/        ←   core/ (what the business is, its numbers, its goals) · where each fact goes → its CONTEXT.md
├── projects/          ← bounded work: 1-active/ 2-next/ 3-someday/ 9-archive/
├── calendar/          ← dated logs: daily, weekly, monthly, yearly
├── people/            ← one note per person
├── knowledge/         ← notes and archive — search, do not browse
└── system/            ← skills/ · agents/ · voices/ · scripts/ · architecture.md
    └── .secrets/      ←   all API keys: one .env.<service> per provider
```

Heavy files, code and other apps stay outside AIOS. Only refer to them. A folder or a file that this tree does not name is the person's own: its own `CONTEXT.md` or `user/user.md` › Own tools and places says what it is.

## Task router

Find the row for the task. Open the file it names before you do anything there. A greeting, or a general question that needs no file of this folder, needs no row. Something to save and no row fits → a file in `_inbox/`.

| Your task | Open first |
| --- | --- |
| Any project work — new, status, move, archive | `projects/CONTEXT.md` |
| Find a past project and its files | `projects/_index.md` — search by the `PNNNN` code |
| A business — look up or save a fact (brand, avatars, competitors, market, products, numbers, sales, customers, team); the business's own tools, routes and rules | `business/<slug>/CONTEXT.md` — which business → "## Businesses" |
| Which offer is live; where to send a person; record or change an offer | `business/<slug>/offers/CONTEXT.md` |
| What you know about the person — who they are, what they do | `user/user.md` |
| The person — save or look up a personal fact (health, money, family, home, travel, learning) | `user/CONTEXT.md` |
| The person's own tools and places — a drive or a folder outside this one, code repos, servers, mailboxes, accounts, apps, their own routes for such tasks | `user/user.md` › Own tools and places |
| What to focus on, priorities, what to do next | `user/user.md` — who they are and what they aim at; the plan of the business → `business/<slug>/core/goals.md` |
| The person asks you to answer differently from now on — shorter, longer, another tone, another language, another name ("write shorter", "be less formal") | `SOUL.md` › The person you work with — show the new line, save after their yes (`system/skills/setup/` exists → through the `setup` skill). A change for one text only → just do it |
| A text for an audience — a post, an article, an email, a sales page, a script; rewrite a text in a voice | `system/voices/CONTEXT.md` — whose voice; then the business's rules for texts: `business/<slug>/core/business.md` › Rules for agents; a link or a call to action in the text → the offers row above |
| A person — add or look up a contact, a client, a partner | `people/CONTEXT.md` |
| A dated note — today, this week, a month, a year | `calendar/CONTEXT.md` |
| Recall past notes, thinking, the archive | `knowledge/CONTEXT.md` |
| Create a new skill | `system/skills/CONTEXT.md` |
| Run a skill; "what skills do I have?" | `system/skills/skills.md` |
| Set up AIOS; add a business; change the answers about the person (when `system/skills/setup/` exists) | the `setup` skill — `system/skills/setup/SKILL.md` |
| Structural work — create, move, rename or delete a folder or a map; name a file; write a fact or a number | `system/architecture.md` |
| Update AIOS ("update aios"; when `system/update.mjs` exists) | "## Updating AIOS" below |
| An API key | "## API keys" below |
| The neuro-curator (when `system/agents/curator/` exists) | `system/agents/curator/AGENT.md` |
| A bare idea, a loose note or a link — no row above fits | a file in `_inbox/` |

## Rules

- **"Remember this" means this folder.** Write it into a file here, by the Task router. Never use your app's own memory: other apps and other computers read this folder, not that memory.
- **Stay in this folder.** Read, list and search only inside this folder, unless the task, a row of the Task router or `user/user.md` › Own tools and places names another place. Parent folders and the rest of the computer are off limits.
- **The root is never a destination.** Name the target folder. Never let the current directory pick it. Nothing fits → `_inbox/`.
- **Open the map first.** Start with the file the Task router names. Before you work further inside a folder, open its `CONTEXT.md` (`_inbox/` has none).
- **Maps belong to the system.** Every `CONTEXT.md` that the system ships is replaced by an update. Do not add the person's own facts to a map: a fact about a business goes to its `business/<slug>/core/business.md`, a fact about the person goes to `user/`.
- **Several files at once.** Before you delete, move or rename several of the person's files or folders, show the list and wait for their yes. This rule is not about one file the person named, or about files you made in this task.
- **A move is not finished until the maps are updated.** Fix every row that points at the old place in the same step → `system/architecture.md` › Moves. Then run `python3 -I system/scripts/check-maps.py .` from the root and fix every line it prints.
- **Plain words.** In your own replies to the person, write in plain words: one idea in a sentence, at most 20 words, one word keeps one meaning.
- **A block "Moved here by the 0.9 update — check"** in `SOUL.md`, `user/user.md` or `business/<slug>/core/business.md` is in force. Do not change it without the person.

## Businesses

A business is a subfolder of `business/` that holds `business/<slug>/core/business.md` without `[UPPERCASE_TOKEN]` placeholders. Placeholders left → setup is not finished: offer to finish it with the `setup` skill, and run it after their yes. To see which businesses exist, list `business/` — allowed at any time. Never guess the business:
- None exists → offer the `setup` skill and run it after their yes.
- The request names one → use it.
- Exactly one exists → use it, and name it the first time a reply relies on it.
- More than one, and the request does not say which → ask "Which business: <list>?". Save nothing about a business until they answer.

## Skills

Run a skill when the task is the job of that skill. Where skills live, the catalog of this folder and how to present the list → `system/skills/CONTEXT.md`. The sources:
1. **This folder's skills** — local, `system/skills/<slug>/`, listed in `system/skills/skills.md`. `setup` is one of them when `system/skills/setup/` exists; it works before the skills server is connected.
2. **The AIOS catalog** — only when `system/connect.mjs` exists: remote, over MCP: `list_skills`, `start_skill(slug)`, `read_skill_file(skill, path)`. The content lives only on the server. A locked skill → relay the offer to unlock it. Never fake a catalog skill from memory.

**Two AIOS servers at once** — two tools end in `list_skills` (for example `mcp__aios__list_skills` and `mcp__claude_ai_AIOS__list_skills`). It is ONE catalog. You may call both tools to compare them, but show the person one list. Use the server that opens more skills and stay with it for the session. Say nothing about it and remove nothing. Only when the person asks to keep one connection: remove the folder's own: the `aios` entry in `.mcp.json` (other entries stay) and `.aios-license`, after their yes.

"What skills do I have?" → present the list as `system/skills/CONTEXT.md` says. Never pass your app's own tools off as AIOS skills.

## API keys

Every API key lives in `system/.secrets/`, one file per provider: `.env.<service>`, with `KEY=value` lines. Read keys from there yourself. Never ask the person to paste a key into the chat. Never write a key anywhere else.
- To add a key: create the file with an empty line named after the key (`GROQ_API_KEY=`). Open it for the person yourself in a plain text editor (`open -e <path>` on macOS, `notepad <path>` on Windows): the file is hidden. Ask them to paste the key right after `=`, save, and close the window. Then check that the key is there, without showing it.
- A key the person already pasted into the chat: save it to that file, and tell them it is now in the chat history.
- Show key names, never values. A key that an app keeps in its own connection settings (`.mcp.json` and the like) stays there.

## Updating AIOS

Only when `system/update.mjs` exists; otherwise this folder is not updated by a script, and "update aios" has nothing to run. When the person asks ("update aios", in any language):
1. Run `node system/update.mjs`. It is a preview and writes nothing. Show its summary in plain words.
2. On their yes, run `node system/update.mjs --apply`.
3. Then ALWAYS run `node system/update.mjs --check` and act on it. If it says the update is not finished, run `--apply` and `--check` again, up to three more times. Never delete or move a file by hand during an update.
4. The update may print a list of old files it no longer uses. Show the list in plain words and ask: delete all, keep all, or only some? Then run `node system/update.mjs --apply --delete-old=all`, `--delete-old=none`, or `--delete-old=<file>,<file>`. No answer → do nothing; the next update asks again.
5. Tell the person what changed, in plain words.

Never update system files by hand — always the script. Something broke after an update → `node system/update.mjs --restore` shows how to go back; `--restore --apply` goes back.

## Connecting the skills server

Only when `system/connect.mjs` exists. You come here from the connection check, or when the person says skills are missing.
- Clients add a prefix to tool names. Match the ENDING, and call the tool before you say anything is unavailable. A first-call permission prompt is not a failure.
- Fix it yourself. Look only in this folder and in your app's own connection settings; never read other folders on this computer. Only when the person must act, tell them what to do in ONE sentence, in their language, in ordinary words. Ask before you change anything outside this folder.
- Are BOTH `.mcp.json` and `.aios-license` missing from the root? Then the skills reach this folder only through the AIOS connector in the person's app. Follow case 1 in `system/connect.md` and stop there. Never invent a token.
- Otherwise follow `system/connect.md`, case by case, and stop at the first match. Never loop. Never rewrite a config on a guess.
