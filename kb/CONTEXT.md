# kb — Knowledge layer

Accumulated thinking, notes, and archive. The body of long-term knowledge.

## How to use it

- **Recall on demand — search, don't browse.** This folder can grow huge. Never
  filesystem-walk it or pre-load it into context; query it (search/index) and pull only
  what's relevant.
- It is logically part of the system but lifecycle-cold: written rarely, read on demand.
  Hot/active capture is `_inbox/` — not here.
- Heavy/binary/external knowledge (cloud storage, other vaults, repos) stays **external,
  referenced only** — do not copy it in.

## Obsidian conventions (apply to all notes here)

- Use `[[wikilinks]]` for internal references (not markdown links)
- Use `> [!type]` callouts for structured info
- YAML frontmatter (`---` delimited) for properties
- No `tags:` in frontmatter — use inline `#tags`
- Use `![[embeds]]` for cross-note references
