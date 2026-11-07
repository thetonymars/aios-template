---
name: setup
description: |
  Conversational AIOS onboarding. Three modes, auto-detected. FIRST-RUN: captures the
  person (one user) → SOUL.md (how to talk to them) and user/user.md (who they are),
  then the first business → business/<slug>/core/ (business.md, numbers.md, goals.md)
  and its maps. ADD-BUSINESS: onboards another business into a new business/<slug>/
  (person already done). CHANGE-PERSON: a repeat interview that changes only the
  answers the user gives — the way to change SOUL.md. ~5-7 min, conversational, one
  focused question at a time. Captures only the essentials needed for AI
  personalization: for the person — name, language, role, how-to-respond rules,
  technical level, voice input; for the business — name, niche, and the Jay-Abraham
  what/how/who triple. Customer profiles and the brand
  voice are owned by OTHER skills (avatar-passport, brand-architect); how a person
  writes is kept in system/voices/ — setup deliberately does NOT capture them.

  Triggers: 'setup', 'set up aios', 'initialize aios', 'onboarding', 'install aios',
  'fill template', 'add business', 'new business', 'onboard business',
  'change how you talk to me', 'redo my profile' (or the equivalent in any language).

  Use when a freshly copied AIOS needs its person + first business, when the user
  wants to add another business, or when the user wants to change how the agent
  talks to them.
mode: multi
version: 5.1.0
author: aios-core
category: aios-system
requires: []
---

# Setup

Conversational onboarding that creates the file structure + the minimum context AI
needs for personalization. AIOS is multi-business: ONE person (`SOUL.md` and `user/`)
runs N businesses (`business/<slug>/`). Setup is the only supported way to onboard either.
A repeat interview is the way to change `SOUL.md` › `## The person you work with`.

**Start with `system/skills/setup/CONTEXT.md`** — it detects the mode and routes the stages.

**Every stage is run from its own file, never from this page.** Before the first question
of a stage, read that stage's file: `system/skills/setup/01_identity/CONTEXT.md`,
`system/skills/setup/02_business/CONTEXT.md`, `system/skills/setup/03_review/CONTEXT.md`.
The wording of the questions is only there. The exact text of every file setup writes is
in `system/skills/setup/templates/` or in the stage file that names it:
a business written from memory comes out in the wrong shape, and the rest of AIOS cannot
read it.

**Design principles (do NOT violate):**
- **One focused, crystal-clear question per turn.** Never multi-asks-in-one. The
  only exception: Stage 01 Q3 (how-to-respond) and the Stage 02 Jay-Abraham what+how+who question —
  these are designed as ONE coherent topic with sub-fields, not bundles.
- **Everything the user sees is rendered in their chosen language at runtime.** The
  scripts in this skill are written in English as the canonical reference; deliver
  them — including every example phrase — naturally translated into the user's
  language. Never show raw English scripts to a non-English user.
- **Probe shallow answers.** If a field reads as vague or one-word, ask one specific
  follow-up before moving on.
- **No technical leakage to the user.** Never show file paths, placeholder tokens, or
  system labels ("slug", "frontmatter", "tier"). Speak as a friend writing things down.
- **Setup is a thin layer.** It captures essentials only. Customer profiles (avatars)
  and the brand voice are owned by OTHER skills (`avatar-passport`, `brand-architect`);
  how a person writes is kept in `system/voices/`. Setup does NOT duplicate that work.
- **Catch-all at the end of each stage.** After the structured questions, always ask
  "What else do you want me to always remember about you / this business?" — this is
  where the user adds anything we didn't think to ask.

## Modes (auto-detected — see `system/skills/setup/CONTEXT.md`)

- **first-run** — `SOUL.md` is missing, or `SOUL.md` or `user/user.md` still has
  unfilled `[UPPERCASE_TOKEN]` placeholders. Run Stage 01 (person) → Stage 02 (first
  business) → Stage 03 (review).
- **add-business** — person already filled (or user explicitly says "add business").
  Skip Stage 01; Stage 02 creates a NEW `business/<slug>/`; Stage 03 reviews only it.
- **change-person** — person already filled, and the user wants to change how the agent
  talks to them or what it knows about them. Stage 01 asks only about the parts the user
  names and changes only those values; Stage 03 shows only the person.

Never silently overwrite a filled value in `SOUL.md` or `user/user.md`, or an existing
`business/<slug>/core/business.md`. Setup never changes `SOUL.md` › `## Who you are`.

## Stages

1. **01_identity** (first-run and change-person, ~3 min) → `SOUL.md` › `## The person you work with` (name, language, tone, length, what bugs the user, technical level, voice input, more rules) and `user/user.md` (role, more about the user) — 6 turns (name, role, how-to-respond, technical level, voice input, catch-all). Preceded by a one-shot language pick if not yet set. `SOUL.md` is created from `system/skills/setup/templates/soul.md` when it is missing.
2. **02_business** (first-run and add-business, ~4 min) → `business/<slug>/core/business.md`, `business/<slug>/core/numbers.md`, `business/<slug>/core/goals.md` and the business maps — 6 turns (name, folder, niche, what+how+who, cloud storage [optional], catch-all). `system/skills/setup/02_business/CONTEXT.md` says which templates to copy, headings and all (on a confirmed overwrite of an existing business — only `business/<slug>/core/business.md`).
3. **03_review** (~1 min) → friendly recap, corrections, closing.

## What setup does NOT do

- **Voice work** — how a person writes: one folder per voice in `system/voices/`, see its
  `CONTEXT.md`. The brand voice is brand work — see below.
- **Customer profiles / avatars / ICP deep-dive** — `avatar-passport` owns
  `business/<slug>/avatars/`.
- **Brand work** (positioning, story, brand voice) — `brand-architect` owns
  `business/<slug>/brand/`.
- **Deeper person/business profile** (MBTI, CliftonStrengths, pricing tiers, team
  breakdown, market sizing, methodologies, competitor analysis) — a future
  `deep-profiler` skill (or domain skills) will own these. Setup does not.
- **Numbers and goals** — setup creates `business/<slug>/core/numbers.md` and `business/<slug>/core/goals.md` with every line `unknown`; it does not ask for them. A later conversation or skill fills them.
- **Cloud/storage restructuring** — setup only ASKS (optionally) whether a business uses cloud storage and records the path in `business/<slug>/core/business.md`. It moves/syncs nothing.

Routing between stages: see `system/skills/setup/CONTEXT.md` — read it first.
