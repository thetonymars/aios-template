# Stage 01 — Operator (first-run only)

Capture the **global operator as a person** — the minimum context AI needs for
personalization. ~3 min, warm + direct, one question at a time. Target:
`user/user.md` (fill its `[UPPERCASE_TOKEN]` placeholders in place).

**Match the user's language from Step 0 onwards.** The interview script below is
written in English as the canonical reference — render every script block,
including all example phrases, in the user's chosen language at runtime. Never
show raw English scripts to a non-English user.

---

### Step 0 — Language (check first, ask only if not set by install)

**First, check `user/user.md`.** If its `[LANGUAGE]` field is already filled
(i.e., it does NOT contain the literal token `[LANGUAGE]`) — the installer set
it during Step 0 of install. Use that value, switch all dialogue to that
language, and proceed directly to Q1. Do NOT show the language picker again.

**Only if `[LANGUAGE]` is still the literal placeholder token** — the install
did not set it (e.g., the user installed via an older install.md, or skipped
the language step). Then send this exact message (this block is intentionally
multilingual — it is shown BEFORE the language is known; do not translate or
alter it):

```
🇺🇦 Українська · 🇷🇺 Русский · 🇬🇧 English

Якою мовою? / На каком языке? / Which language?
```

After the user replies (e.g., "english" / "ua" / "1" / the language's name written in any language / etc.):
- Store the choice as `[LANGUAGE]`.
- Switch all subsequent dialogue to that language.
- Do NOT confirm the choice with a long message — just proceed to Q1 in the new language.

---

### Q1 — Address (name)

> What should I call you? A name, a nickname, whatever feels right — however you want me to address you.

Maps to: `[DISPLAY_NAME]`. Deliver in the user's language.

If the user types a long answer (e.g., starts their life story) — capture the name only, then move on with "Got it. One thing at a time."

---

### Q2 — What you do professionally

> What do you do professionally? One sentence covering two things:
>
> 1. **Your profession / role** — how you'd introduce yourself at a conference
> 2. **Who** you do it for
>
> Examples (what an answer looks like):
> • "marketer, I build offers and funnels for online schools"
> • "developer, I write tools for solo creators"
> • "coach, I work with women 45+"

Maps to: `[ROLE_SENTENCE]`. Deliver in the user's language.

**Probe rule:** if the answer is ≤4 words OR abstract (e.g. "I'm in marketing", "tech stuff", "I help people" — in any language) — ask ONE follow-up: "More specifically — who do you do this for, and what exactly comes out the other end?" Then accept.

---

### Q3 — How to respond to you (3 micro-fields, ONE coherent ask)

> How should I respond to you? Three quick things — in one answer:
>
> 1. **Tone** — formal / direct / warm / technical / something of your own?
> 2. **Length** — short by default, or detailed?
> 3. **What annoys you in AI answers** — 1-2 things you definitely don't want to see. Examples: "don't open with 'Sure!'", "no apologizing", "no em dashes (—)", "no emoji", "don't fake enthusiasm".

Maps to: `[TONE]`, `[LENGTH]`, `[BUGS_LIST]`. Deliver in the user's language.

This LOOKS like 3 questions but is ONE coherent ask about response style. The user answers all three in one short message naturally. Do NOT split into 3 separate turns.

If they answer only 1-2 parts: ask for the missing piece in one short follow-up.

---

### Q4 — Catch-all (anything else important about you)

> What else do you want me to always remember about you?
>
> Anything I didn't ask about, but that feels important to you. Or "nothing" / "that's enough".

Maps to: `[EXTRA_USER]`. Deliver in the user's language.

- If they share something: store the raw text (trim to ~5 lines max — if longer, keep the most important parts and tell the user something like "trimmed it a little, kept the essentials").
- If they skip (e.g. "nothing", "pass", "skip", "that's enough", "—" — in any language): store as `"(empty — add via setup later if you want)"` *rendered in the user's language*.

Never block on this. The whole point is to give the user a chance to add what we missed.

---

## Write step

Replace every `[UPPERCASE_TOKEN]` in `user/user.md` with the captured value. `[DATE]` = today (YYYY-MM-DD).

## Done criteria

- Every `[BRACKET]` in `user/user.md` replaced (including `[EXTRA_USER]` — may hold the "(empty — …)" string, but not `[EXTRA_USER]` literally).
- `grep '\[' user/user.md` returns 0.
- `[ROLE_SENTENCE]` ≥ 6 words (not "I'm in marketing").
- `[BUGS_LIST]` ≥ 1 concrete item OR an explicit "nothing annoys me" (which is fine).
- Move on naturally, in the user's language: "Got it. Now a few questions about your business."
