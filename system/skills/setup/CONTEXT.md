# Setup — mode detection + stage router

## Step 1: detect mode (do this first, before any interview)

1. Read `SOUL.md` and `user/user.md`. "Person unfilled" = `SOUL.md` is missing, or either file still contains any `[UPPERCASE_TOKEN]` placeholder (e.g. `[DISPLAY_NAME]`).
2. List `business/` subfolders containing a `core/business.md` with no `[UPPERCASE_TOKEN]` left → count of real businesses (a bracket-full `core/business.md` = an incomplete prior run, not a business). A subfolder that keeps a filled `business.md` in its root (the older layout) is a real business too: count it, and never overwrite or "complete" it.

| Signal | Mode |
|---|---|
| person unfilled | **first-run** |
| person filled, user said "setup"/"start" | ask: "You are already set up. Add a new business, or change what I know about you and how I talk to you?" → **add-business** or **change-person** |
| person filled, user said "add business"/"new business" (or the equivalent in any language) | **add-business** |
| person unfilled BUT user said "add business" | tell user: the person must be set up first — run first-run |
| person filled, user asks to change how you talk to them, or to redo the interview about them | **change-person** |

**Never silently overwrite a filled value in `SOUL.md` or `user/user.md`, or an existing `business/<slug>/core/business.md`.** Change-person changes only the values the user gives in that run (rules: `01_identity/CONTEXT.md` › Change-person mode).

## Step 2: run stages

| Mode | Flow |
|---|---|
| first-run | language-pick → 01_identity → 02_business → 03_review |
| add-business | 02_business → 03_review (skip 01) |
| change-person | 01_identity (change-person mode) → 03_review (YOU block only) |

1. (First-run only) Show the multi-lingual language picker — see `01_identity/CONTEXT.md` Step 0. After the user picks, all subsequent dialogue is in that language.
2. Read `01_identity/CONTEXT.md` (first-run and change-person) → conversational interview → write `SOUL.md` › `## The person you work with` and `user/user.md`
3. Read `02_business/CONTEXT.md` → reserve slug → interview → **only then** create `business/<slug>/` and write its files (folder is NOT created before the interview — an interrupted run must leave no half-folder)
4. Read `03_review/CONTEXT.md` → friendly recap → corrections → closing message

## Rules

- **Match the user's language.** From the language picker on, every word the user sees is in that language. The interview scripts in the stage files are written in English as the canonical reference — render them, including every example phrase, in the user's language at runtime. Never show raw English scripts to a non-English user.
- **One focused question per turn.** Never bundle multiple unrelated data-asks ("Tell me your name + email + languages" is FORBIDDEN). The only exceptions are the two "coherent micro-ask" blocks: Q3 of Stage 01 (tone + length + bugs) and the what + how + who question of Stage 02 — those are designed as one cohesive topic.
- **Probe shallow answers.** If a field reads as vague / one-word / abstract, ask one specific follow-up before moving on. Never accept "I do marketing" — ask "for whom, doing what specifically?"
- **No technical leakage.** The user must NEVER see file paths, placeholder tokens, or system labels (no "slug", "frontmatter", "tier"). The word "folder" is OK; "slug" is not.
- **Catch-all at the end of each stage.** After the structured questions in Stage 01 and Stage 02, ask "What else do you want me to always remember about you / this business?" — captures anything we didn't think to ask.
- **Setup is not state-tracked.** If interrupted, re-running re-detects mode. The business folder is created only at the write step — an interrupted run leaves no half-folder. A stray `business/<slug>/` with a bracket-full or missing `core/business.md` (and no `business.md` in its root) = an incomplete prior run; offer to complete it in place.
- **Edit semantics:** replace `[UPPERCASE_TOKEN]` placeholders in place; keep structure and headings; only the values change. `SOUL.md` › `## Who you are` is never changed by setup.
- The text of every file setup creates is in `system/skills/setup/templates/` or in the stage file that names it. Copy it exactly; never write a file from memory.
- After a successful first-run or add-business, ensure `system/skills/skills.md` lists `setup` (it ships listed; if missing, run `system/scripts/build-skills-catalog.py`, never edit the catalog by hand).
