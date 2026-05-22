# Projects

One-off work with a defined start and end. Each project lives in its own folder.

## Naming Convention

```
Active:    prj-p[NNNN]-[name]-[YYMMDD]
Archived:  prj-p[NNNN]-[name]-[YYMMDD]-[YYMMDD]
```

- `prj-` prefix (required)
- `p[NNNN]` — sequential 4-digit code from `p0001`. To pick next: scan all `projects/` subfolders for the highest used number, increment by 1.
- `[name]` — short, kebab-case, descriptive
- `[YYMMDD]` — creation date. Add completion date as a second `-YYMMDD` when moving to `9-archive/`.

## Lifecycle (Location = Status)

```
projects/
├── 1-active/      ← working on RIGHT NOW
├── 2-next/        ← committed, not started
├── 3-someday/     ← ideas, no commitment yet
└── 9-archive/     ← finished, out of sight
```

Move the folder between phases to change status. No metadata files for state.
When a project finishes — move directly to `9-archive/` (add completion date). No intermediate "done" stage.

## Rules

- **Location IS status.** Don't track project state in frontmatter.
- Each project folder usually contains a CONTEXT.md (what + good + avoid) + working files.
