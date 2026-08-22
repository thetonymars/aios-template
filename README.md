# AIOS — the installed folder

This repository is the **folder template** that AIOS customers install on their own
machine. Almost all of it is plain text: a folder skeleton, markdown instructions for the
AI assistant that runs inside it, and a conversational setup skill.

There is no build step and no dependency — but do not read that as "nothing here runs".
Two Node scripts ship with it and both do real work: `system/connect.mjs` registers the
skills server in your AI apps' own settings, and `system/update.mjs` fetches a manifest
from `aios-skills.vercel.app` and can overwrite the kernel files it lists. And the
markdown is not inert either: `AGENTS.md` is instructions an AI assistant reads and acts
on. That is the product — read it before you trust it.

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
AGENTS.md              the kernel: instructions + routing the AI reads first
CLAUDE.md / GEMINI.md  pointers to AGENTS.md for those clients
system/                connect.mjs (registers the skills server), update.mjs, the setup skill
user/ business/        where the operator's own context lives (empty on install)
projects/ calendar/    the working folders, each with its own CONTEXT.md router
knowledge/ people/
```

## What is NOT in this repository

The **skills** — the paid part. They are never downloaded; they stream per call from
`aios-skills.vercel.app` and are gated by the buyer's licence. This repo is the free,
public half: the folder they live in.

## Installing

Customers get a personal install link after purchase, which carries their licence key.
There is no anonymous install — a key is issued to a confirmed email address.

If you want to look at what an install does without buying anything, read
[`system/connect.mjs`](system/connect.mjs) — 209 lines, importing nothing but node's own
`fs`/`path`/`os`/`crypto`. It makes no network call, starts no child process and uses no
`eval`. What it does do: it adds an `aios` MCP entry to the settings of **every** AI app
it finds on the machine — Claude Code, Codex, OpenCode, Antigravity — not just the one
that ran it, keeps a `.bak-aios` copy of each file the first time it touches it, and
leaves every other MCP server in those files alone. For OpenCode it configures a bridge
that runs `npx mcp-remote` at that app's startup, which does fetch a package.

Claude Code does not need it: the install writes a project-scoped `.mcp.json` inside the
AIOS folder and Claude Code asks you to approve the server yourself.

## Versioning

`aios_version` in `AGENTS.md` frontmatter is the kernel version; releases are git tags.
**The live release line is `v0.7.x`, and the newest release is the current one.**

⚠️ This repository also carries four `v4.x` tags from before a numbering reset in June
2026. They sort higher than `v0.7.x` but are **older and unsupported** — a plain tag list
shows `v4.4.3` first, which is misleading. Go by the GitHub release, not by tag order.

Installs pin a tag. Existing installs update through `system/update.mjs`, which fetches
its manifest from `aios-skills.vercel.app/template` and refreshes only the files listed
in `system/managed-files.json`, backing up every one it changes. It never edits the
operator's own notes. It can, in one declared case, MOVE them: an install predating the
0.7 layout has its `areas/user`, `areas/business` and `network` folders relocated to the
root, contents untouched and copied to `.aios-backup/` first. Nothing is applied without
`--apply`.

## Contact

[yellows.one](https://yellows.one) · [@aitonymarsbot](https://t.me/aitonymarsbot)
