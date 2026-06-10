---
name: setup
description: |
  Conversational AIOS onboarding. Two modes, auto-detected. FIRST-RUN: captures the
  global operator (one person) → areas/user/user.md, then the first business →
  areas/business/<slug>/business.md. ADD-BUSINESS: onboards another business into a new
  areas/business/<slug>/ (operator already done). ~5-7 min, conversational, one focused
  question at a time. Captures only the essentials needed for AI personalization:
  for the operator — name, role, how-to-respond rules; for the business — name,
  niche, and the Jay-Abraham what/how/who triple. Voice, customer profiles, brand
  voice are owned by OTHER skills (brand-architect, avatar-passport) — setup
  deliberately does NOT capture them.

  Triggers: 'setup', 'set up aios', 'initialize aios', 'onboarding', 'install aios',
  'fill template', 'add business', 'new business', 'onboard business'
  (or the equivalent in any language).

  Use when a freshly copied AIOS needs its operator + first business, or when the
  operator wants to add another business to an existing AIOS.
mode: multi
version: 4.3.0
author: aios-core
category: aios-system
requires: []
---

# Setup

Conversational onboarding that creates the file structure + the minimum context AI
needs for personalization. AIOS is multi-business: ONE global operator (`areas/user/`) runs
N businesses (`areas/business/<slug>/`). Setup is the only supported way to onboard either.

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
- **Setup is a thin layer.** It captures essentials only. Voice samples, customer
  profiles (avatars), and brand voice are owned by OTHER skills (`brand-architect`,
  `avatar-passport`). Setup does NOT duplicate their work.
- **Catch-all at the end of each stage.** After the structured questions, always ask
  "What else do you want me to always remember about you / this business?" — this is
  where the user adds anything we didn't think to ask.

## Modes (auto-detected — see CONTEXT.md)

- **first-run** — `areas/user/user.md` still has unfilled `[UPPERCASE_TOKEN]` placeholders.
  Run Stage 01 (operator) → Stage 02 (first business) → Stage 03 (review).
- **add-business** — operator already filled (or user explicitly says "add business").
  Skip Stage 01; Stage 02 creates a NEW `areas/business/<slug>/`; Stage 03 reviews only it.

Never silently overwrite a filled operator or an existing `areas/business/<slug>/business.md`.

## Stages

1. **01_identity** (first-run only, ~3 min) → `areas/user/user.md` — 4 turns (name, role, how-to-respond, catch-all). Preceded by a one-shot language pick if not yet set.
2. **02_business** (both modes, ~4 min) → `areas/business/<slug>/business.md` — 6 turns (name, folder, niche, what+how+who, cloud storage [optional], catch-all).
3. **03_review** (~1 min) → friendly recap, corrections, closing.

## What setup does NOT do

- **Voice work** (voice sample, brand voice, voice strategy) — `brand-architect` owns
  `areas/user/voice.md` and `areas/business/<slug>/brand/voice.md`.
- **Customer profiles / avatars / ICP deep-dive** — `avatar-passport` owns
  `areas/business/<slug>/avatars/`.
- **Brand work** (positioning, story, voice strategy) — `brand-architect` owns
  `areas/business/<slug>/brand/`.
- **Deeper operator/business profile** (MBTI, CliftonStrengths, pricing tiers, team
  breakdown, market sizing, methodologies, competitor analysis) — a future
  `deep-profiler` skill (or domain skills) will own these. Setup does not.
- **Dynamic state** (current focus, this quarter's goal, blockers) — track in `projects/`.
- **Cloud/storage restructuring** — setup only ASKS (optionally) whether a business uses cloud storage and records the path in its `business.md`. It moves/syncs nothing.

Routing between stages: see `CONTEXT.md`.
