# Projects

One-off work with a defined start and end. Each project lives in its own folder.

## Naming Convention

```
Active:    prj-p[NNNN]-[name]-[YYMMDD]
Archived:  prj-p[NNNN]-[name]-[YYMMDD]-[YYMMDD]
```

- `prj-` prefix (required)
- `p[NNNN]` — sequential 4-digit code from `p0001`. To pick next: take the highest number used in `_index.md` or in any `projects/` subfolder, whichever is higher, and increment by 1 — a code is never reused, even when its folder is gone.
- `[name]` — short, kebab-case, descriptive
- `[YYMMDD]` — creation date. Add completion date as a second `-YYMMDD` when moving to `9-archive/`.

## Lifecycle (Location = Status)

```
projects/
├── 1-active/      ← working on RIGHT NOW
├── 2-next/        ← committed, not started
├── 3-someday/     ← projects with no commitment yet (a bare idea is not a project — it goes to `_inbox/`)
└── 9-archive/     ← finished, out of sight
```

Move the folder between phases to change status. No metadata files for state.
When a project finishes — move directly to `9-archive/` (add completion date). No intermediate "done" stage.

## Registry

`_index.md` in this folder lists every project ever done — active, archived, all of them. It is
how a project is found when there are hundreds. One table, one row per project:

```
| Code | Name | Files |
|---|---|---|
| P0001 | site-redesign | here |
| P0002 | product-video | here · Dropbox, folder Video-2026 |
```

- `here` = everything is in `projects/`; the folder is found by its code. Never write the stage
  or the folder path in the row — the folder moves between stages, the row does not change.
- New project → add its row in the same step as creating the folder.
- Heavy files kept outside (a cloud drive, another disk) → add where, after `here ·`.
- A project archived or moved → the row stays as it is. Renamed → fix the name. A row is never
  deleted.
- The file is missing → create it with the table above as its only content plus a `# Projects —
  registry` heading, and add a row for every project folder that exists.

## Rules

- **Location IS status.** Don't track project state in frontmatter.
- Each project gets its own folder with a main file inside: `PROJECT.md` at the project root,
  `CONTEXT.md` in every subfolder, `SPRINT.md` in each sprint folder (what this is, what good
  looks like, what to avoid).
