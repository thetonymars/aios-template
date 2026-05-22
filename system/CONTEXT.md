# System

What the OS runs on. Machine-consumed — not read as notes.

| Folder | What |
|--------|------|
| skills/ | repeatable AI workflows. Each = folder with SKILL.md. Catalog in `skills.md`. |
| agents/ | autonomous / long-running services. |

The explicit-invocation rule for skills is stated once, in root `AGENTS.md` → Skills.

## MCPs are external

MCPs register in the AI client's own config (`~/.claude/...`), **not** in the vault.
Skills call them; the vault does not hold MCP code.
