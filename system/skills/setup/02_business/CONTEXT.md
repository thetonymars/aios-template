# Stage 02 — Business (both modes)

Capture one business → `areas/business/<slug>/business.md`. ~4 min, warm + direct, one
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
- A real business already exists at `areas/business/<slug>/` with a filled `business.md` →
  default to asking for a different name. Overwrite ONLY on explicit confirm, and
  tell them plainly: "This will overwrite only this business's description. Everything else in that folder stays as it was. Sure?"
- A stray `areas/business/<slug>/` with missing or bracket-full `business.md` = an incomplete
  prior run → complete it in place.

**Reserve the name only. Do NOT create `areas/business/<slug>/` here** — that happens at the
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

Maps to: `[CLOUD_STORAGE]`. Deliver in the user's language. Yes → record what they say. No / skip → set to `—`. Setup moves nothing — it only records the path. Each business has its OWN storage, so this lives in THIS business's file.

---

### Q10 — Catch-all (anything else important about this business)

> What else do you want me to always remember about this business?
>
> Anything about it I didn't ask, but that matters for the work. Or "nothing".

Maps to: `[EXTRA_BUSINESS]`. Deliver in the user's language.

- If they share something: store raw text (trim to ~5 lines max — keep most important if longer).
- If they skip: store as `"(empty — add via setup later if you want)"` *rendered in the user's language*.

Never block.

---

## Write step — create the folder NOW, then write

Only here does `areas/business/<slug>/` come into existence. Create `areas/business/<slug>/`, then
write `business.md`. Before this point nothing on disk was touched — an abandoned
interview leaves no folder.

### `areas/business/<slug>/business.md` from this template (fill every `[UPPERCASE_TOKEN]`)

```
---
type: business
business_slug: [SLUG]
last_updated: [DATE]
---

# [BUSINESS_NAME]

> One business. AI loads this on demand when a request names it.

## Niche

[NICHE]

## What we sell

[WHAT]

## How we sell

[HOW]

## Who we sell to

[WHO]

## Cloud storage

[CLOUD_STORAGE]

## More about this business

[EXTRA_BUSINESS]
```

`business.md` is the single entry file for this business — no separate CONTEXT.md
(subfolders like `brand/`, `avatars/`, `competitors/` are self-evident and created on
demand by other skills: `brand-architect` for `brand/`, `avatar-passport` for `avatars/`).

## Done criteria

- `areas/business/<slug>/business.md` exists.
- `grep '\[' areas/business/<slug>/business.md` returns 0.
- `[DATE]` → today (YYYY-MM-DD).
- `[WHAT]` / `[HOW]` / `[WHO]` each ≥ one substantive sentence (not single word).
- Move on, in the user's language: "Got it — '{display name}' is noted. Last thing — a quick review."
