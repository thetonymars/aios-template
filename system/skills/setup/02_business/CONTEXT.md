# Stage 02 — Business (both modes)

Capture one business → `business/<slug>/core/` (three files) and its two maps: `business/<slug>/CONTEXT.md` and `business/<slug>/offers/CONTEXT.md`. ~4 min, warm + direct, one
question at a time. **Match the user's language.** Never show file paths or
placeholder tokens to the user. Never use the word "slug" with the user — say
"folder" (in the user's language).

The interview script below is written in English as the canonical reference —
render every script block, including all example phrases, in the user's chosen
language at runtime.

---

### Q5 — Business name (just the name)

> What's your business called — the full name, the way a customer sees it?

Maps to: `[BUSINESS_NAME]`. Deliver in the user's language.

---

### Q6 — Folder name in the system (auto-suggest from business name)

Derive a candidate slug from `[BUSINESS_NAME]`:
- a name not in Latin letters is first transliterated to Latin («Носки Премиум» → `noski premium`) — the folder name is always Latin
- lowercase
- spaces/underscores → `-`
- drop anything not `[a-z0-9-]`
- collapse repeated `-`
- trim leading/trailing `-`
- if empty after normalization, leave blank and ASK

Then:

> What should we call your business's folder in the system? One or two words in English (or transliterated), no spaces.
>
> Examples:
> • `nail-salon`
> • `journaling-app`
> • `coaching`
>
> From the name, I'd suggest: `<derived-slug>` — does that work, or something else?

Maps to: `[SLUG]`. Deliver in the user's language.

Validate the chosen value against `^[a-z][a-z0-9-]*$`:
- Doesn't match → silently propose another normalized candidate and ask "then it'll be `<candidate>` — does that work?"
- Equals `user` → reject ("`user` is reserved — give me another one"), ask again.
- A real business already exists at `business/<slug>/` (a filled `core/business.md`, or a filled
  `business.md` in the folder's root — the older layout) →
  default to asking for a different name. Overwrite ONLY on explicit confirm, and
  tell them plainly: "This will overwrite only this business's description. Everything else in that folder stays as it was. Sure?"
  A business in the older layout (`business.md` in the folder's root) is never overwritten
  here: tell them to say "update aios" first.
- A stray `business/<slug>/` with a missing or bracket-full `core/business.md` and no
  `business.md` in its root = an incomplete prior run → complete it in place.

**Reserve the name only. Do NOT create `business/<slug>/` here** — that happens at the
write step below, so an abandoned interview leaves no folder.

---

### Q7 — Niche

> What niche does this business work in? One or two words.
>
> Examples:
> • copywriting for online schools
> • private journaling
> • coaching for women 45+

Maps to: `[NICHE]`. Deliver in the user's language.

**Probe rule:** if the answer is ≤2 words AND extremely generic (e.g. "business", "marketing", "tech" — in any language) — ask "More specifically — for what audience, or in which segment?" Then accept.

---

### Q8 — What + How + Who (Jay Abraham Q15, adapted) — ONE coherent ask

> Now briefly about the business itself — so the AI gets the essence. Three things in one answer:
>
> 1. **What** you sell — a specific product / package / piece of work (not just "services")
> 2. **How** you sell — *how a customer reaches you and the way the sale happens*. Examples:
>    • Instagram content → DM → discovery call → package
>    • Facebook ads → landing page → webinar → course
>    • cold outreach → reply → call
>    • word of mouth + presentations
> 3. **Who** you sell to — a specific segment within the niche. Not "everyone", not "businesses". Who actually pays — 1-2 sentences about a real customer.

Maps to: `[WHAT]`, `[HOW]`, `[WHO]`. Deliver in the user's language.

**Probe rules:**
- If `[WHO]` is "everyone" / "small business" / "people" / a similar non-segment (in any language) — ask: "More specifically — who in this niche actually pays you? Describe a real customer."
- If `[HOW]` is just a delivery model ("subscription", "a course") and doesn't describe how the customer ACTUALLY gets to the purchase — ask: "How exactly does a customer get to the purchase — where do they come from, and what happens to them before the sale?"
- If `[WHAT]` is "services" / "consulting" without specifics (in any language) — ask: "What exactly is inside that package — be specific?"

---

### Q9 — Cloud storage (optional, one quick ask)

> Do you keep this business's files in the cloud (Google Drive, Dropbox, etc.)? If yes — drop me the path / folder name. If not — skip.

Maps to: `[CLOUD_STORAGE]`. Deliver in the user's language. Yes → record what they say. No / skip → no row. Setup moves nothing — it only records the path. Each business has its OWN storage, so this lives in THIS business's `core/business.md` › `## Sources`.

---

### Q10 — Catch-all (anything else important about this business)

> What else do you want me to always remember about this business?
>
> Anything about it I didn't ask, but that matters for the work. Or "nothing".

Maps to: `[EXTRA_BUSINESS]`. Deliver in the user's language.

- If they share something: store raw text (trim to ~5 lines max — keep most important if longer).
- If they skip: store as `Nothing added yet.` *rendered in the user's language*.

Never block.

---

## Write step — create the folder NOW, then write

Only here does `business/<slug>/` come into existence. Create `business/<slug>/`,
`business/<slug>/core/` and `business/<slug>/offers/`, then write the five files below. Before this point nothing on disk was
touched — an abandoned interview leaves no folder.

**On a confirmed overwrite of an existing business** rewrite only `core/business.md`, and keep
its `## Own to this business`, its `## Sources` rows, its `## Rules for agents` and any `## Moved here by the 0.9 update — check`
block exactly as they were. Never write the template's `None written yet.` or `[SOURCES]` over them: first copy those
sections out of the old file, then write the new answers, then put the copied sections back in their places. Write `core/numbers.md`, `core/goals.md` and the two maps only if they
do not exist — never replace them.

Fill every `[UPPERCASE_TOKEN]`. Section headings stay in English; values are in the user's
language. A line the interview did not cover stays `unknown` — never guess it and never leave
it blank (`system/architecture.md` › Records).

### 1. `business/<slug>/core/business.md`

```
---
type: business
business_slug: [SLUG]
last_updated: [DATE]
source: owner
---

# [BUSINESS_NAME]

## Niche

[NICHE]

## What we sell

[WHAT]

## How we sell

[HOW]

## Who we sell to

[WHO]

## Model

unknown

## Team

unknown

## Market and law

unknown

## Rules for agents

None written yet.

## More about this business

[EXTRA_BUSINESS]

## Own to this business

None written yet.

## Sources

[SOURCES]
```

`[SOURCES]` = this table when the user gave cloud storage in Q9:

```
| Source | What it holds | How to reach it |
|---|---|---|
| Cloud storage | the business's files | [CLOUD_STORAGE] |
```

No cloud storage → `[SOURCES]` = `None written yet.`

### 2. `business/<slug>/core/numbers.md`

```
---
type: numbers
last_updated: [DATE]
---

# Numbers

- **Revenue, 12 months:** unknown
- **Average check:** unknown
- **Margin:** unknown
- **Customer acquisition cost:** unknown
- **LTV:** unknown
- **Repeat purchases:** unknown
```

### 3. `business/<slug>/core/goals.md`

```
---
type: goals
last_updated: [DATE]
---

# Goals

## Goal

unknown

## Constraint

unknown

## Priority

unknown

## Not now

unknown

## Plan

unknown
```

### 4. `business/<slug>/CONTEXT.md` — the business map

Copy `system/skills/setup/templates/business-map.md` byte for byte. It has no tokens: it is the
same in every business.

### 5. `business/<slug>/offers/CONTEXT.md` — the offers map

Copy `system/skills/setup/templates/offers-map.md` byte for byte. It has no tokens either.

## Done criteria

- `business/<slug>/core/business.md`, `core/numbers.md`, `core/goals.md`, `business/<slug>/CONTEXT.md` and `business/<slug>/offers/CONTEXT.md` exist; nothing else was created in the folder. On an overwrite only `core/business.md` changed.
- Both maps are byte-identical to their files in `system/skills/setup/templates/`.
- No `[UPPERCASE_TOKEN]` is left in any of the five.
- `[DATE]` → today (YYYY-MM-DD).
- `[WHAT]` / `[HOW]` / `[WHO]` each ≥ one substantive sentence (not single word).
- Move on, in the user's language: "Got it — '{display name}' is noted. Last thing — a quick review."
- **Then read `system/skills/setup/03_review/CONTEXT.md`** before showing the recap.
