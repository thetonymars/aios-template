# AIOS — the installed folder

This repository is the **folder template** that AIOS customers install on their own
machine. It is plain text: a folder skeleton, markdown instructions for the AI assistant
that runs inside it, and one optional setup script.

Nothing here is a program. There is no build, no dependency, no runtime.

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
[`system/connect.mjs`](system/connect.mjs). It is about 200 lines, makes no network
calls, starts no child processes, uses no `eval`, and writes exactly one MCP server
entry into the AI client's own config file, keeping a backup.

## Versioning

`aios_version` in `AGENTS.md` frontmatter is the kernel version; releases are git tags
(`v0.7.9` and up). Installs pin a tag. Existing installs update through
`system/update.mjs`, which only refreshes the files listed in
`system/managed-files.json` and never touches the operator's own data.

## Contact

[yellows.one](https://yellows.one) · [@aitonymarsbot](https://t.me/aitonymarsbot)
