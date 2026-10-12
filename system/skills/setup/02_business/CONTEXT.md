# Stage 02 — Business (both modes)

Capture one business → `business/<slug>/core/` (three files) and the map `business/<slug>/CONTEXT.md`. ~4 min, warm + direct, one
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

Maps to: `[CLOUD_STORAGE]`. Deliver in the user's language. Yes → record what they say. No / skip → the Sources table gets the row `_(none yet)_`. Setup moves nothing — it only records the path. Each business has its OWN storage, so this lives in THIS business's map.

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

Only here does `business/<slug>/` come into existence. Create `business/<slug>/` and
`business/<slug>/core/`, then write the four files below. Before this point nothing on disk was
touched — an abandoned interview leaves no folder.

**On a confirmed overwrite of an existing business** rewrite only `core/business.md`. Write
`core/numbers.md`, `core/goals.md` and the map only if they do not exist — never replace them.

Fill every `[UPPERCASE_TOKEN]`. Section headings stay in English; values are in the user's
language. A line the interview did not cover stays `unknown` — never guess it and never leave
it blank (`AGENTS.md` › Records).

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
```

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

### 4. `business/<slug>/CONTEXT.md` — the map

`[CLOUD_ROW]` = `| Cloud storage | the business's files | [CLOUD_STORAGE] |` when the user gave
one, otherwise `| _(none yet)_ | | |`.

```
# [BUSINESS_NAME] — business map

The map of this business folder: what lives where, and where a new fact goes. Only `core/` is read at session start; everything else is opened when the task needs it. This map is the only file in the folder's root.

The rules for writing here (how a record is written, how a folder is added, what to do with a folder no table names) are not in this file: read `AGENTS.md` › Records before you write.

## What lives here

| Folder | What | A new fact goes to |
|---|---|---|
| `core/` | session start, read whole | what, to whom and how we sell, the model, the team in one line, the market and the country's law in one line → `business.md` · a rule every agent must follow in this business → `business.md` › `## Rules for agents` · revenue, average check, margin, cost of acquisition as one average, LTV → `numbers.md` · goal, main constraint, the one priority, "not now", the plan for the current period with its dates → `goals.md` |

No folder yet:

| A new fact about | Goes to |
|---|---|
| the brand: identity, positioning, story, strategy, brand voice (how a person writes is not here — voices live in `system/voices/`) | `brand/<what>.md`; colours, logo, fonts → `brand/visual.md` |
| an audience segment | `avatars/<segment>.md` |
| a competitor | `competitors/<name>.md` |
| the market: the picture as it is now; what to keep an eye on; a dated study | `market/market.md`; `market/watchlist.md`; `market/<what>-<YYMMDD>.md` |
| a product: what the customer gets, the mechanism, unit cost. Not the price and not the terms of sale (guarantee, bonuses, deadline) — they live in the offer | `products/<product>.md` |
| where to send a person: an offer or a lead magnet (status, type, link, price, and its full design) | `offers/<short-name>.md` — format and picking rules: `system/offers.md` |
| channels: the list of channels; short links | `channels/channels.md`; `channels/links.md` |
| rows that a collector or an integration gathers (statistics, payments) | `data/` — nothing by hand |
| content — marketing materials: a sales page, a promo article (advertorial), an email, a post, an article | `content/<type>/<name>.md` — one folder per type: `sales-pages/`, `promo-articles/`, `emails/`, `posts/`, `articles/`. The channel a piece is for (a site, a mailing list, a social network) goes in its frontmatter as `channel:`, never into a folder name |
| an earlier plan, after the user has given a new one in its place | `plans/plan-<start YYMMDD>-<end YYMMDD>.md` — never read at session start (`AGENTS.md` › Records) |
| how a sale goes and how long it takes, what a good lead looks like, the sales method, payment terms | `sales/sales.md` |
| what customers keep asking, and the answers | `sales/faq.md` |
| the customer base as it is today: how many, which segment brings what money, where the list lives | `customers/customers.md` |
| proof to show a buyer: years on the market, customers served, results in numbers, cases and testimonials | `proof/proof.md` |
| margin by product, cost of acquisition by channel, spending, budgets and limits | `finance/economics.md`; a period report → `finance/report-<YYYY-MM>.md` |
| team, contractors, partners: who answers for what | `operations/team.md` (the person as a person → a note in `people/`) |
| criteria for decisions, and longer rules that only some jobs need (the short ones every agent must follow are in `core/business.md`) | `operations/rules.md` |
| the legal entity in detail: its form, tax regime, details for contracts and invoices | `operations/legal.md` |
| how a recurring job is done | `operations/processes/<name>.md` |

## Own to this business

Folders no other business would have.

| Folder | What |
|---|---|
| _(none yet)_ | |

## Sources

What exists outside this folder and how to reach it: cloud storage, a CRM, a payment system, channels.

| Source | What it holds | How to reach it |
|---|---|---|
[CLOUD_ROW]
```

## Done criteria

- `business/<slug>/core/business.md`, `core/numbers.md`, `core/goals.md` and `business/<slug>/CONTEXT.md` exist; nothing else was created in the folder. On an overwrite only `core/business.md` changed.
- No `[UPPERCASE_TOKEN]` is left in any of the four.
- `[DATE]` → today (YYYY-MM-DD).
- `[WHAT]` / `[HOW]` / `[WHO]` each ≥ one substantive sentence (not single word).
- Move on, in the user's language: "Got it — '{display name}' is noted. Last thing — a quick review."
- **Then read `system/skills/setup/03_review/CONTEXT.md`** before showing the recap.
