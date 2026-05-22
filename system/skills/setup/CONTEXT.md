# Setup — mode detection + stage router

## Step 1: detect mode (do this first, before any interview)

1. Read `user/user.md`. "Unfilled" = it still contains any `[UPPERCASE_TOKEN]` placeholder (e.g. `[DISPLAY_NAME]`).
2. List `business/` subfolders containing a `business.md` with no `[UPPERCASE_TOKEN]` left → count of real businesses (a bracket-full `business.md` = an incomplete prior run, not a business).

| Signal | Mode |
|---|---|
| user.md unfilled (has `[UPPERCASE_TOKEN]`) | **first-run** |
| user.md filled, user said "setup"/"start" | **add-business** (confirm: "Operator already set. Add a new business, or redo operator?") |
| user.md filled, user said "add business"/"новий бізнес" | **add-business** |
| user.md unfilled BUT user said "add business" | tell user: operator must be set up first — run first-run |
| user asks to "redo operator" | re-run Stage 01 only, with explicit confirm before overwrite |

**Never silently overwrite a filled `user.md` or an existing `business/<slug>/business.md`.**

## Step 2: run stages

| Mode | Flow |
|---|---|
| first-run | language-pick → 01_identity → 02_business → 03_review |
| add-business | 02_business → 03_review (skip 01) |

1. (First-run only) Show the multi-lingual language picker — see `01_identity/CONTEXT.md` Step 0. After the user picks, all subsequent dialogue is in that language.
2. Read `01_identity/CONTEXT.md` (first-run only) → conversational interview → write `user/user.md`
3. Read `02_business/CONTEXT.md` → reserve slug → interview → **only then** create `business/<slug>/` and write `business.md` (folder is NOT created before the interview — an interrupted run must leave no half-folder)
4. Read `03_review/CONTEXT.md` → friendly recap → corrections → closing message

## Rules

- **Match the user's language.** From the language picker on, every word the user sees is in that language. Examples in interview prompts must be localized too — never mix English example phrases into a Ukrainian or Russian interview.
- **One focused question per turn.** Never bundle multiple unrelated data-asks ("Tell me your name + email + languages" is FORBIDDEN). The only exceptions are the two "coherent micro-ask" blocks: turn 3 (tone + length + bugs) and turn 8 (what + how + who) — those are designed as one cohesive topic.
- **Probe shallow answers.** If a field reads as vague / one-word / abstract, ask one specific follow-up before moving on. Never accept "I do marketing" — ask "for whom, doing what specifically?"
- **No technical leakage.** The user must NEVER see file paths, placeholder tokens, or system labels (no "slug", "frontmatter", "tier"). The word "folder" is OK; "slug" is not.
- **Catch-all at the end of each stage.** After the structured questions in Stage 01 and Stage 02, ask "What else do you want me to always remember about you / this business?" — captures anything we didn't think to ask.
- **Setup is not state-tracked.** If interrupted, re-running re-detects mode. The business folder is created only at the write step — an interrupted run leaves no half-folder. A stray `business/<slug>/` with a bracket-full or missing `business.md` = an incomplete prior run; offer to complete it in place.
- **Edit semantics:** replace `[UPPERCASE_TOKEN]` placeholders in-place; keep structure/headings; only the values change.
- After a successful first-run or add-business, ensure `system/skills/skills.md` lists `setup` (it ships listed; if missing, add it).
