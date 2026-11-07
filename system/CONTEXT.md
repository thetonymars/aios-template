# System

What AIOS runs on. Agents read these files as instructions, not as notes. The update replaces this map, so keep no notes in it.

| Folder or file | What |
|---|---|
| `skills/` | skills: one folder per skill, with `SKILL.md`. Create a skill or add it to the catalog → `skills/CONTEXT.md` |
| `voices/` | how each person or character writes: one folder per voice → `voices/CONTEXT.md` |
| `agents/` | agents that work on their own: one folder per agent, with `AGENT.md` |
| .secrets/ (hidden) | API keys: one `.env.<service>` per provider, created with the first key → `AGENTS.md` › API keys |
| `architecture.md` | how this system is built: the method, records, naming, moves. Read it before structural work |

A folder or a file here that the table does not name belongs to this installation. A folder of that kind has its own `CONTEXT.md`: open it before you work there. A script that has no map is run by AIOS itself: never edit it by hand.

## MCP servers

An MCP server is registered in the AI app's own settings, not in this folder. One exception: `.mcp.json` in the AIOS root, which Claude Code reads there. A folder here may hold the code of a server; its `CONTEXT.md` says how the server is registered.
