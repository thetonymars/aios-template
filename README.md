# AIOS — the installed folder

This repository is the **folder template** that AIOS customers install on their own
machine. Almost all of it is plain text: a folder skeleton, markdown instructions for the
AI assistant that runs inside it, and a conversational setup skill.

There is no build step and no dependency — but do not read that as "nothing here runs".
Two Node scripts ship with it and both do real work: `system/connect.mjs` registers the
skills server in your AI apps' own settings, and `system/update.mjs` fetches a manifest
from `aios-skills.vercel.app` and can overwrite the kernel files it lists — and, in the
few declared cases under "Versioning" below, create or move files in your own folders.
And the markdown is not inert either: `AGENTS.md` is instructions an AI assistant reads
and acts on. That is the product — read it before you trust it.

**Made by Tony Mars — [yellows.one](https://yellows.one).**
Product page: **[yellows.one/aios-about](https://yellows.one/aios-about)**

## What AIOS is

An operating layer for a one-person business run with AI agents. The buyer gets a folder
on their computer that any AI coding client (Claude Code, Codex, OpenCode, Antigravity)
reads as its instructions: where things live, who the operator is, which business is
being worked on. On top of that sits a catalogue of skills — repeatable processes for
offers, positioning, market research, content — delivered over MCP from a licensed
server.

## What is in this repository

```
AGENTS.md              the kernel: what the folder is, its layout and its rules — the AI reads it first
CONTEXT.md             the router: which file owns each task. Yours after install — you add rows
CLAUDE.md / GEMINI.md  pointers to AGENTS.md for those clients
system/                connect.mjs (registers the skills server), update.mjs, the setup skill
user/ business/        where the operator's own context lives: user/ ships a blank user.md and
                       its map, business/ is empty until setup. Each gets a map — a CONTEXT.md
                       that says which file holds which kind of fact
projects/ calendar/    the working folders, each with its own CONTEXT.md
knowledge/ people/
_inbox/                unsorted capture
```

## What is NOT in this repository

The **skills** — the paid part. They are never downloaded; they stream per call from
`aios-skills.vercel.app` and are gated by the buyer's licence. This repo is the free,
public half: the folder they live in.

## Installing

Customers get a personal install link after purchase, which carries their licence key.
There is no anonymous install — a key is issued to a confirmed email address.

If you want to look at what an install does without buying anything, read
[`system/connect.mjs`](system/connect.mjs) — one short file, importing nothing but node's own
`fs`/`path`/`os`/`crypto`. It makes no network call, starts no child process and uses no
`eval`. What it does do: it adds an `aios` MCP entry to the settings of **every** AI app
it finds on the machine — Claude Code, Codex, OpenCode, Antigravity — not just the one
that ran it, keeps a `.bak-aios` copy of each file the first time it touches it, and
leaves every other MCP server in those files alone. For OpenCode it configures a bridge
that runs `npx mcp-remote` at that app's startup, which does fetch a package. Three more
things a careful reader will find: the entry carries your licence key joined with a device
id (a hash of the home path, platform, CPU model and memory size); a JSON settings file
is rewritten whole, so comments in it are lost (the `.bak-aios` copy made on the first run
keeps the ones that were there then); and it
removes one thing — an inert `aios` entry that its own older versions left in
`~/.claude/settings.json`.

Claude Code does not need it: the install writes a project-scoped `.mcp.json` inside the
AIOS folder and Claude Code asks you to approve the server yourself.

## Versioning

`aios_version` in `AGENTS.md` frontmatter is the kernel version; releases are git tags.
**The live release line is `v0.x`, and the newest release is the current one.**

⚠️ This repository also carries four `v4.x` tags from before a numbering reset in June
2026. They sort higher than `v0.x` but are **older and unsupported** — a plain tag list
shows `v4.4.3` first, which is misleading. Go by the GitHub release, not by tag order.

Installs pin a tag. Existing installs update through `system/update.mjs`, which fetches
its manifest from `aios-skills.vercel.app/template` and refreshes only kernel files — those listed
in `system/managed-files.json` plus any the incoming release adds — backing up every one
it changes. The script refuses any entry under `user/`, `business/`, `areas/` or `_inbox/`,
whatever a manifest asks for. Anywhere else it writes the paths a release lists as kernel
files; a file of yours sitting at such a path is shown in the preview as changed by you
and is backed up before it is overwritten. Nothing is applied without `--apply`.

No release lists the operator's own notes. What the script does beyond the kernel files
is fixed in the script itself — read it there, the paths are not taken from the manifest:

- **Folder moves.** An install predating the 0.7 layout has `areas/user` → `user`,
  `areas/business` → `business` and `network` → `people` moved file by file, after a full
  copy to `.aios-backup/`. Your files are not changed; an old system file of ours whose
  replacement is already in place is dropped, a file that would collide is left where it
  is and reported, and the emptied old folders are removed.
- **The 0.8 business layout.** A business that is still one file has that file moved,
  byte for byte, from `business/<name>/business.md` into `business/<name>/core/` (copy in
  the backup first), and gets the files it never had — `core/numbers.md`, `core/goals.md`
  and its map `CONTEXT.md` — created only where nothing is in the way. No existing file
  is overwritten; in this step the one thing removed is a second `business.md` that is
  byte-identical to the one already in `core/` (copy in the backup first).
- **Four files that are yours after install** — the root `CONTEXT.md`, `user/CONTEXT.md`,
  `projects/_index.md`, `system/skills/_index.md` — are created whenever one is missing
  (the registry with a row for each project folder you have) and never overwritten once
  they exist. The only change an update ever makes to one of them is the next point.
- **A shared route missing from your root `CONTEXT.md`** is added at the end of its
  table — or, if your file has no such table, as a new section at its end (copy in the
  backup first). No row of yours is changed or removed.

## Contact

[yellows.one](https://yellows.one) · [@aitonymarsbot](https://t.me/aitonymarsbot)
