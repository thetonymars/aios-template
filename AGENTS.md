---
aios_version: 0.9.0
last_updated: 2026-11-07
---

# AIOS — your master file

## Start

- `SOUL.md` is next to this file. It says who you are here and how you talk to this person.
- Your app may load `SOUL.md` by itself. You do not see its text? Read the file before your first reply.
- Do this always, even for a short greeting. The result tells you if an update is finished.
- Read nothing else in advance. Before a task, find its row in the Task router below. Open the file of that row first.
- `SOUL.md` does not exist, and `system/update.mjs` does not exist → tell the person that `SOUL.md` is missing. Never create it by hand.
- `SOUL.md` does not exist, and `system/update.mjs` exists → an update is not finished. Add the update sentence at the end of your first reply. The update sentence is under "Silent checks".
- Until the update is finished, take how to talk to the person from `user/user.md`. Never create `SOUL.md` or a map by hand.
- No filled `SOUL.md` and no filled `user/user.md` → answer plainly, in the language of the message.
- AIOS is not set up yet when `SOUL.md` or `user/user.md` has `[UPPERCASE_TOKEN]` placeholders.
- AIOS is not set up → never invent the person or a business.
- A task needs the missing answers and `system/skills/setup/` exists → offer the `setup` skill. Run it after their yes.
- A task needs the missing answers and `system/skills/setup/` does not exist → ask the person.
- Write each answer into its placeholder line, in the file that has it. A file is missing → keep the answer in this chat only.

The next line imports `SOUL.md` in apps that support it. Other apps ignore it and read the file.

@SOUL.md

### Silent checks

- The update check runs only when `system/update.mjs` exists.
- The connection check runs only when `system/connect.mjs` exists.
- A check without its script → skip it silently.
- Run the checks in your first turn, together with the work on the first message.
- The checks never change your answer. Put your answer first in the text.
- A check needs the person → add its sentence at the end of that answer.
- Two checks need the person → add the update sentence first, then the connection sentence.
- No check needs the person → add nothing.
- Never send a separate message about the checks.

**Update check.** Run `node system/update.mjs --check`. It prints one line.
- An update is available → tell the person once to say "update aios".
- The line says "not finished" → add the update sentence: "The AIOS update is not finished yet — say “update aios”." Say it in the person's language.
- Up to date → say nothing.
- No connection to the server, or no line → that is not "up to date". Run the check once more with network access, if your app allows it.
- No shell → skip the check. Never apply an update on your own.

**Connection check.** Call any tool whose name ends in `list_skills`. Apps add a prefix to the name. Match the ending, and really call the tool.
- It returns skills → say nothing.
- It is slow or fails once → this is not a fault. The first call after a restart often waits for the server. Try once more later in the session.
- It fails twice → go to "Connecting the skills server" below.
- The app uses MCP servers, but no tool ends in `list_skills` → go to "Connecting the skills server" below.
- A fix takes long → answer first, then fix after the answer, in the same turn.
- Fix the fault silently, as "Connecting the skills server" allows. Speak only when the person must act: a permission, an app restart, a change outside this folder, a licence.
- Then say one sentence in their language. Start it with what they do.
- `claude mcp get aios` prints `✘ Rejected` → the person declined this server. Say nothing, and do not ask again.
- No shell, no network, or the app cannot use MCP servers → skip the check silently.

## What this is

AIOS is a folder. You, the AI agent, read it as your instructions. It holds the person's context, their businesses, their work and the system files. This file is the map: what lives where, which file owns each task, and the rules. The system updates this file. The person never edits it. Their own rules live in `SOUL.md`.

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
- A folder inside a mapped folder works the same way. Its own `CONTEXT.md` routes inside it.
- Heavy files, code and other apps stay outside AIOS. Only refer to them.
- Places outside AIOS → `system/external.md`. It names each place and its map.

## Task router

- Find the row for the task. Open the file of the row before you do anything there.
- Several rows fit → open the place first: a business, the person, a project. Then open `system/architecture.md` for how to write.
- A greeting needs no row. A general question that needs no file of this folder needs no row.
- You must save something, and no row fits → write a file in `_inbox/`.

| Your task | Open first |
| --- | --- |
| Any project work — new, status, move, archive | `projects/CONTEXT.md` |
| Find a past project and its files | `projects/_index.md` — search by the `PNNNN` code |
| A fact of a business — look it up or save it. Its brand, avatars, competitors, market, products, numbers, sales, customers, team. Its own tools and rules. How a recurring job is done: record, cut, publish | `business/<slug>/CONTEXT.md` — which business → "Businesses" below |
| The live offer; where to send a person; record or change an offer | `business/<slug>/offers/CONTEXT.md` |
| What you know about the person: who they are, what they do | `user/user.md` |
| A personal fact — look it up or save it. Health, money, family, home, travel, learning | `user/CONTEXT.md` |
| What to focus on; priorities; what to do next | `user/user.md` — who they are and their aims. The plan of a business → `business/<slug>/core/goals.md` |
| The person wants answers in a new way from now on. Shorter, longer, another tone, another language, another name | `SOUL.md` › The person you work with. Show the new line; save it after their yes. `system/skills/setup/` exists → change it through the `setup` skill. A change for one text only → just do it |
| A text for an audience: a post, an article, an email, a sales page, a script. A text in a voice | `system/voices/CONTEXT.md` — whose voice. Then the rules of the business for texts: `business/<slug>/core/business.md` › Rules for agents. A link or a call to action → the offers row above |
| A person — add or look up a contact, a client, a partner | `people/CONTEXT.md` |
| A dated note — today, this week, a month, a year | `calendar/CONTEXT.md` |
| Past notes, thinking, the archive | `knowledge/CONTEXT.md` |
| A file or a folder outside AIOS. A drive, a cloud folder, an app, a program, a plugin. A bot or a server outside. Recordings of calls | `system/external.md` — answer from it, not from memory |
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
- **The root is never a destination.** Name the target folder. Never let the current directory choose it. Nothing fits → `_inbox/`.
- **Follow the maps.** Take the row of the Task router. Open the map of that row, then the file that the map names.
- **Search last.** Search the whole folder only when the maps give no answer.
- **History never wins.** An archived project or an old note is history. The file that a map names wins over it.
- **Open the map first.** Before you work further inside a folder, open its `CONTEXT.md`. `_inbox/` has no map.
- **Maps belong to the system.** An update replaces every `CONTEXT.md` that the system ships. Never add the person's facts to a map.
- **Where a fact goes.** A fact of a business → the file that `business/<slug>/CONTEXT.md` names. A fact of the person → the file that `user/CONTEXT.md` names.
- **Several files at once.** You delete, move or rename several files or folders of the person? Show the list first, and wait for their yes.
- A folder with its content counts as several files. This rule is not for one file that the person named. It is not for files that you made in this task.
- **A move ends with the maps.** In the same step, fix every row that points at the old place → `system/architecture.md` › Moves.
- After a move, run `python3 -I system/scripts/check-maps.py .` from the root. Fix every line that it prints.
- **Plain words.** Write your own replies by the rules of ASD-STE100 (Simplified Technical English). Use them in the language of the person.
- Use one idea in a sentence and at most 20 words. Give one word one meaning. Use the imperative for instructions.
- **`SOUL.md` and this file.** On how you talk, `SOUL.md` › The person you work with wins. Tone, length and language are examples.
- On files, keys, deletion and safety, this file wins.
- **A block "Moved here by the 0.9 update — check"** is in force. It can be in `SOUL.md`, `user/user.md` or `business/<slug>/core/business.md`. Never change it without the person.
- In `SOUL.md`, such a block counts as part of «The person you work with».
- **Obsidian notes.** Never use tags: no `tags:` in the frontmatter and no inline `#tag`.
- Use a wiki link `[[filename]]` in the short form. Use `[[folder/filename]]` only when two notes have the same name.
- Images: the person pastes them in Obsidian, and Obsidian files them into the folder `attachments` in `system`. Embed an image as `![[image.png]]`. Never use an absolute path.

## Businesses

- A business is a subfolder of `business/` with the file `business/<slug>/core/business.md`.
- That file still has `[UPPERCASE_TOKEN]` placeholders → setup is not finished. Offer the `setup` skill, and run it after their yes.
- `system/skills/setup/` does not exist → ask the person for the missing answers. Write them into that file.
- To see the businesses, list `business/`. You may do this at any time.
- Never guess the business.
- No business exists → offer the `setup` skill. Run it after their yes. Without `setup`, ask the person, and create the folder by `system/architecture.md`.
- The request names a business → use it.
- Exactly one business exists → use it. Name it the first time a reply relies on it.
- Several businesses exist, and the request does not say which → ask: "Which business: <list>?". Save nothing for a business until they answer.

## Skills

- Open the row of the Task router first. Then look in `system/skills/skills.md` for a skill that does the job.
- Run a skill when the task is the job of that skill.
- Where skills live, the catalog of this folder, and how to show the list → `system/skills/CONTEXT.md`.
- **The skills of this folder** live in `system/skills/<slug>/`. `system/skills/skills.md` lists them.
- `setup` is one of them when `system/skills/setup/` exists. It works before the skills server is connected.
- **The AIOS catalog** exists only when `system/connect.mjs` exists. It is remote, over MCP: `list_skills`, `start_skill(slug)`, `read_skill_file(skill, path)`.
- The content of a catalog skill lives only on the server. Never fake a catalog skill from memory.
- A locked skill → tell the person about the offer to unlock it.
- **Two AIOS servers at once.** Two tools end in `list_skills`, for example `mcp__aios__list_skills` and `mcp__claude_ai_AIOS__list_skills`.
- It is one catalog. You may call both tools to compare them. Show the person one list.
- Use the server that opens more skills. Stay with it for the session. Say nothing about it, and remove nothing.
- The person asks to keep one connection → remove the one of this folder, after their yes.
- That is the `aios` entry in `.mcp.json` and the file `.aios-license`. Other entries of `.mcp.json` stay.
- "What skills do I have?" → show the list as `system/skills/CONTEXT.md` says.

## API keys

- Every API key lives in `system/.secrets/`. There is one file per provider, `.env.<service>`, with `KEY=value` lines.
- Read keys from there yourself. Never ask the person to paste a key into the chat. Never write a key anywhere else.
- To add a key, create the file with an empty line for the key: `GROQ_API_KEY=`.
- Open the file for the person in a plain text editor: `open -e <path>` on macOS, `notepad <path>` on Windows. The file is hidden.
- Ask them to paste the key after `=`, save the file, and close the window. Then check that the key is there, without showing it.
- The person pasted a key into the chat → save it to that file. Tell them that the key is now in the chat history.
- Show key names, never values.
- An app keeps a key in its own connection settings, such as `.mcp.json` → the key stays there.

## Updating AIOS

Only when `system/update.mjs` exists. Without it, nothing updates this folder by a script.

When the person asks ("update aios", in any language):
1. Run `node system/update.mjs`. It is a preview, and it writes nothing. Show its summary in plain words.
2. On their yes, run `node system/update.mjs --apply`.
3. Then always run `node system/update.mjs --check`, and act on its line.
4. It says "not finished" → run `--apply` and `--check` again, up to three more times. Still not finished → tell the person, and stop.
5. Never delete or move a file by hand during an update.
6. The update can list old files that it no longer uses. Show the list in plain words.
7. Ask: delete all, keep all, or delete only some? Then run the matching command:
   - all → `node system/update.mjs --apply --delete-old=all`;
   - none → `node system/update.mjs --apply --delete-old=none`;
   - some → `node system/update.mjs --apply --delete-old=<file>,<file>`.
8. No answer → do nothing. The next update asks again. After a `--delete-old` command, run `--check` once more.
9. Tell the person what changed, in plain words.

- Never update system files by hand. Always use the script.
- Something broke after an update → `node system/update.mjs --restore` shows how to go back. `--restore --apply` goes back.

## Connecting the skills server

Only when `system/connect.mjs` exists. You come here from the connection check, or when the person says that skills are missing.

- First: `claude mcp get aios` prints `✘ Rejected` → the person declined this server. Stop, and say nothing.

- Apps add a prefix to tool names. Match the ending.
- Call the tool before you say that something is unavailable. A permission prompt at the first call is not a failure.
- Fix the fault yourself. Look only in this folder and in the connection settings of your app. Never read other folders of this computer.
- Only when the person must act, tell them what to do. Use one sentence, in their language, in ordinary words.
- Ask before you change anything outside this folder.
- `.mcp.json` and `.aios-license` are both missing from the root? Then the skills come only through the AIOS connector of the app.
- In that case, follow case 1 in `system/connect.md`, and stop there. Never invent a token.
- Otherwise follow `system/connect.md` case by case. Stop at the first case that matches.
- Never loop. Never rewrite a config on a guess.
