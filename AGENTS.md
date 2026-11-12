---
aios_version: 0.9.2
last_updated: 2026-11-11
---

# AIOS — your master file

## Start

- Read `SOUL.md` before your first reply, even to a greeting, unless your app already loaded it. It says who you are here and how you talk to this person.
- Load nothing else in advance. For a task, open the file of its row in the Task router first.
- `SOUL.md` is missing and `system/update.mjs` exists → an update is not finished. End your first reply with: "The AIOS update is not finished yet — say “update aios”." Say it in the person's language. Never create `SOUL.md` by hand; meanwhile take how to talk from `user/user.md`.
- `SOUL.md` is missing and `system/update.mjs` does not exist → tell the person that `SOUL.md` is missing.
- `[UPPERCASE_TOKEN]` placeholders in `SOUL.md` or `user/user.md` mean AIOS is not set up yet. Then never invent the person or a business. A task needs the missing answers → offer the `setup` skill (when `system/skills/setup/` exists) or ask the person. Write each answer into its placeholder line.

@SOUL.md

### Silent checks

Run both checks only when `system/update.mjs` exists, in your first turn, next to the work on the first message. Put your answer first. A check that needs the person adds one sentence at the end of that answer, in the person's language. Say nothing about checks that pass.

**Update check.** Run `node system/update.mjs --check`.
- An update is available → tell the person once to say "update aios".
- It says "not finished" → add the update sentence: "The AIOS update is not finished yet — say “update aios”."
- No answer from the server → run it once more with network access, if your app allows. No shell → skip. Never apply an update on your own.

**Connection check.** Call the tool whose name ends in `list_skills` (apps add a prefix to the name).
- It is slow or fails once → normal after a restart. Try once more later in the session.
- It fails twice, or no such tool exists → add the connection sentence: "Add the AIOS connector in your app's settings — `https://skills.yellows.one/mcp` — and sign in with your email."
- The person says that skills are missing → run this check now. The app cannot use MCP → skip.

## What this is

AIOS is a folder: the person's context, their businesses, their work and the system files. This file is its map and its rules. An update replaces this file, so the person's own rules live in `SOUL.md`.

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
└── system/            ← skills/ · agents/ · voices/ · scripts/ · architecture.md · external.md
    └── .secrets/      ←   all API keys: one .env.<service> per provider
```

- A folder that this tree does not name is the person's own. Open its `CONTEXT.md`: it says what the folder holds.
- Heavy files, code and other apps stay outside AIOS. Only refer to them.

## Task router

- Find the row for the task. Open the file of the row before you do anything there.
- Several rows fit → open the place first: a business, the person, a project. Then open `system/architecture.md` for how to write.
- A greeting needs no row. A general question that needs no file of this folder needs no row.

| Your task | Open first |
| --- | --- |
| Any project work — new, status, move, archive; find a past project by its `PNNNN` code | `projects/CONTEXT.md`; the registry of all projects → `projects/_index.md` |
| A fact of a business — look it up or save it, its own tools and rules, how a recurring job is done | `business/<slug>/CONTEXT.md` — which business → "Businesses" below |
| The live offer; where to send a person; record or change an offer | `business/<slug>/offers/CONTEXT.md` |
| A personal fact — look it up or save it | `user/CONTEXT.md` |
| Who the person is and what they do; what to focus on, priorities, what to do next | `user/user.md`. The plan of a business → `business/<slug>/core/goals.md` |
| The person wants answers in a new way from now on | `SOUL.md` › The person you work with: show the new line, save it after their yes (through the `setup` skill when it exists). A change for one text only → just do it |
| A text for an audience: a post, an email, a page, a script | `system/voices/CONTEXT.md` — whose voice; then `business/<slug>/core/business.md` › Rules for agents. A link → the offers row above |
| A person — add or look up a contact, a client, a partner | `people/CONTEXT.md` |
| A dated note — today, this week, a month, a year | `calendar/CONTEXT.md` |
| Past notes, thinking, the archive | `knowledge/CONTEXT.md` |
| A file, a folder, an app or a server outside AIOS: a drive, a cloud folder, a program, a bot, recordings of calls | `system/external.md` — answer from it, not from memory |
| Create a new skill | `system/skills/CONTEXT.md` |
| Run a skill; "what skills do I have?" | `system/skills/skills.md` |
| Set up AIOS; add a business; change the answers about the person. Only when `system/skills/setup/` exists | the `setup` skill — `system/skills/setup/SKILL.md` |
| Structural work: create, move, rename or delete a folder or a map. Name a file. Write a fact or a number | `system/architecture.md` |
| Update AIOS ("update aios"). Only when `system/update.mjs` exists | "Updating AIOS" below |
| An API key | "API keys" below |
| The neuro-curator. Only when `system/agents/curator/` exists | `system/agents/curator/AGENT.md` |
| A bare idea, a loose note or a link. No row above fits | a file in `_inbox/` |

## Rules

- **"Remember this" means this folder.** Write it into a file here, by the Task router. Never use the memory of your app. Other apps and other computers read this folder, not that memory.
- **Stay in this folder.** Read, list and search only inside this folder. Go to another place only when the task or `system/external.md` names it. Parent folders and the rest of the computer are off limits.
- **The root is never a destination.** Name the target folder. Nothing fits → `_inbox/`.
- **Follow the maps.** Take the row of the Task router, open the map (`CONTEXT.md`) of that folder when it has one, then the file it names. Search the whole folder only when the maps give no answer. An archived project or an old note is history: the file that a map names wins over it.
- **Maps belong to the system.** An update replaces every `CONTEXT.md` that the system ships. Never add the person's facts to a map.
- **Several files at once.** Before you delete, move or rename several files or folders of the person (a folder counts with its content), show the list and wait for their yes. One file that they named, or files that you made in this task, need no list.
- **A move ends with the maps.** A move, a rename or a deletion is finished only by `system/architecture.md` › Moves.
- **Plain words.** Write your replies by ASD-STE100 (Simplified Technical English), in the person's language.
- **`SOUL.md` and this file.** On how you talk, `SOUL.md` wins. On files, keys, deletion and safety, this file wins.
- A block "Moved here by the 0.9 update — check" is in force. Change it only with the person's yes.
- **Obsidian notes.** Never use tags: no `tags:` in the frontmatter, no inline `#tag`. Use wiki links in the short form `[[filename]]`; `[[folder/filename]]` only when two notes share a name. Embed an image as `![[image.png]]`, never by an absolute path; Obsidian files pasted images into the folder `attachments` in `system`.

## Businesses

- A business is a folder `business/<slug>/` with `business/<slug>/core/business.md`. List `business/` to see them.
- The request names a business → use it. Exactly one exists → use it, and name it the first time a reply relies on it. Several exist and the request does not say which → ask "Which business: <list>?". Save nothing for a business until they answer.
- No business exists, or its `business/<slug>/core/business.md` still has `[UPPERCASE_TOKEN]` placeholders → offer the `setup` skill (when `system/skills/setup/` exists), or ask the person. Never invent a business.

## Skills

- Before a task, look in `system/skills/skills.md` for a skill that does the job. Run it when the task is its job.
- "What skills do I have?", where skills live and the AIOS catalog → `system/skills/CONTEXT.md`.
- A skill of the AIOS catalog lives only on the server. Never fake it from memory. A locked skill → tell the person about the offer to unlock it.

## API keys

- API keys live only in `system/.secrets/`: one file `.env.<service>` per provider, with `KEY=value` lines. Read them from there yourself. Never write a key anywhere else. Show key names, never values.
- Never ask the person to paste a key into the chat: the chat history keeps it. To add a key, create the file with an empty line (`GROQ_API_KEY=`) and open it for them in a plain text editor (`open -e <path>` on macOS, `notepad <path>` on Windows; the file is hidden). Ask them to paste the key after `=`, save and close. Then check that it is there, without showing it.
- The person pasted a key into the chat anyway → save it to its file. Tell them that the key is now in the chat history.
- An app keeps a key in its own connection settings → the key stays there.

## Updating AIOS

Only when `system/update.mjs` exists. When the person asks ("update aios", in any language):
1. Run `node system/update.mjs`. It is a preview and writes nothing. Tell the person what will change, in plain words.
2. On their yes, run `node system/update.mjs --apply`, then `node system/update.mjs --check`. "Not finished" → run both again, up to three more times. Still not finished → tell the person, and stop.
3. The update lists old files that it no longer uses → show the list. Ask: delete all, keep all, or only some? Run `--apply --delete-old=all`, `--delete-old=none` or `--delete-old=<file>,<file>`, then `--check`. No answer → do nothing; the next update asks again.

- Never update, delete or move system files by hand. Always use the script.
- Something broke after an update → `node system/update.mjs --restore` shows how to go back. `--restore --apply` goes back.
