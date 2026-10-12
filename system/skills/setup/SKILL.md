---
name: setup
description: |
  Conversational AIOS onboarding. Two modes, auto-detected. FIRST-RUN: captures the
  global operator (one person) → user/user.md, then the first business →
  business/<slug>/core/ (business.md, numbers.md, goals.md) and its map CONTEXT.md. ADD-BUSINESS: onboards another business into a new
  business/<slug>/ (operator already done). ~5-7 min, conversational, one focused
  question at a time. Captures only the essentials needed for AI personalization:
  for the operator — name, role, how-to-respond rules; for the business — name,
  niche, and the Jay-Abraham what/how/who triple. Customer profiles and the brand
  voice are owned by OTHER skills (avatar-passport, brand-architect); how a person
  writes is kept in system/voices/ — setup deliberately does NOT capture them.

  Triggers: 'setup', 'set up aios', 'initialize aios', 'onboarding', 'install aios',
  'fill template', 'add business', 'new business', 'onboard business'
  (or the equivalent in any language).

  Use when a freshly copied AIOS needs its operator + first business, or when the
  operator wants to add another business to an existing AIOS.
mode: multi
version: 5.0.0
author: aios-core
category: aios-system
requires: []
---

# Setup

Conversational onboarding that creates the file structure + the minimum context AI
needs for personalization. AIOS is multi-business: ONE global operator (`user/`) runs
N businesses (`business/<slug>/`). Setup is the only supported way to onboard either.

**Start with `system/skills/setup/CONTEXT.md`** — it detects the mode and routes the stages.

**Every stage is run from its own file, never from this page.** Before the first question
of a stage, read that stage's file: `system/skills/setup/01_identity/CONTEXT.md`,
`system/skills/setup/02_business/CONTEXT.md`, `system/skills/setup/03_review/CONTEXT.md`.
The wording of the questions and the exact text of every file setup writes are only there:
a business written from memory comes out in the wrong shape, and the rest of AIOS cannot
read it.

**Design principles (do NOT violate):**
- **One focused, crystal-clear question per turn.** Never multi-asks-in-one. The
  only exception: turn 3 (how-to-respond) and turn 8 (Jay-Abraham what+how+who) —
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

- **first-run** — `user/user.md` still has unfilled `[UPPERCASE_TOKEN]` placeholders.
  Run Stage 01 (operator) → Stage 02 (first business) → Stage 03 (review).
- **add-business** — operator already filled (or user explicitly says "add business").
  Skip Stage 01; Stage 02 creates a NEW `business/<slug>/`; Stage 03 reviews only it.

Never silently overwrite a filled operator or an existing `business/<slug>/core/business.md`.

## Stages

1. **01_identity** (first-run only, ~3 min) → `user/user.md` — 4 turns (name, role, how-to-respond, catch-all). Preceded by a one-shot language pick if not yet set.
2. **02_business** (both modes, ~4 min) → `business/<slug>/core/business.md`, `numbers.md`, `goals.md` and the map `business/<slug>/CONTEXT.md` — 6 turns (name, folder, niche, what+how+who, cloud storage [optional], catch-all). The four files are copied from the templates in `system/skills/setup/02_business/CONTEXT.md`, headings and all (on a confirmed overwrite of an existing business — only `core/business.md`).
3. **03_review** (~1 min) → friendly recap, corrections, closing.

## What setup does NOT do

- **Voice work** — how a person writes: one folder per voice in `system/voices/`, see its
  `CONTEXT.md`. The brand voice is brand work — see below.
- **Customer profiles / avatars / ICP deep-dive** — `avatar-passport` owns
  `business/<slug>/avatars/`.
- **Brand work** (positioning, story, brand voice) — `brand-architect` owns
  `business/<slug>/brand/`.
- **Deeper operator/business profile** (MBTI, CliftonStrengths, pricing tiers, team
  breakdown, market sizing, methodologies, competitor analysis) — a future
  `deep-profiler` skill (or domain skills) will own these. Setup does not.
- **Numbers and goals** — setup creates `core/numbers.md` and `core/goals.md` with every line `unknown`; it does not ask for them. A later conversation or skill fills them.
- **Cloud/storage restructuring** — setup only ASKS (optionally) whether a business uses cloud storage and records the path in the business map (`CONTEXT.md` › Sources). It moves/syncs nothing.

Routing between stages: see `system/skills/setup/CONTEXT.md` — read it first.
