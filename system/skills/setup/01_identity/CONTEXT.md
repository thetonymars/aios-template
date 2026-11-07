# Stage 01 — The person (first-run and change-person)

Capture the **person** — the minimum context AI needs for personalization. ~3 min, warm + direct, one question at a time. Two targets:

- `SOUL.md` › `## The person you work with` — how to talk to the person (name, language, tone, length, what bugs them, technical level, voice input, more rules). The agent reads it at the start of every session.
- `user/user.md` — who the person is (role, more about them). The agent reads it only when a task needs it.

Never write into `SOUL.md` › `## Who you are`. It is the same for every person.

**Match the user's language from Step 0 onwards.** The interview script below is written in English as the canonical reference — render every script block, including all example phrases, in the user's chosen language at runtime. Never show raw English scripts to a non-English user.

---

### Step 0 — Language (check first, ask only if not set)

**First, check `SOUL.md`.** If its `**Language:**` line does NOT contain the literal token `[LANGUAGE]`, the language is already set. Use that value, switch all dialogue to that language, and go to Q1. Do NOT show the language picker again.

**Only if `[LANGUAGE]` is still the literal token**, send this exact message (this block is intentionally multilingual — it is shown BEFORE the language is known; do not translate or alter it):

```
🇺🇦 Українська · 🇷🇺 Русский · 🇬🇧 English

Якою мовою? / На каком языке? / Which language?
```

After the user replies (e.g., "english" / "ua" / "1" / the language's name written in any language / etc.):
- Store the choice as `[LANGUAGE]`.
- Switch all subsequent dialogue to that language.
- Do NOT confirm the choice with a long message — just go to Q1 in the new language.

---

### Q1 — Address (name)

> What should I call you? A name, a nickname, whatever feels right — however you want me to address you.

Maps to: `[DISPLAY_NAME]` in `SOUL.md`. Deliver in the user's language.

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

Maps to: `[ROLE_SENTENCE]` in `user/user.md`. Deliver in the user's language.

**Probe rule:** if the answer is ≤4 words OR abstract (e.g. "I'm in marketing", "tech stuff", "I help people" — in any language) — ask ONE follow-up: "More specifically — who do you do this for, and what exactly comes out the other end?" Then accept.

---

### Q3 — How to respond to you (3 micro-fields, ONE coherent ask)

> How should I respond to you? Three quick things — in one answer:
>
> 1. **Tone** — formal / direct / warm / technical / something of your own?
> 2. **Length** — short by default, or detailed?
> 3. **What annoys you in AI answers** — 1-2 things you definitely don't want to see. Examples: "don't open with 'Sure!'", "no apologizing", "no em dashes (—)", "no emoji", "don't fake enthusiasm".

Maps to: `[TONE]`, `[LENGTH]`, `[BUGS_LIST]` in `SOUL.md`. Deliver in the user's language.

This LOOKS like 3 questions but is ONE coherent ask about response style. The user answers all three in one short message naturally. Do NOT split into 3 separate turns.

If they answer only 1-2 parts: ask for the missing piece in one short follow-up.

---

### Q4 — Technical level

> How technical are you? Pick one:
>
> 1. Not technical — explain in plain words, no commands, no jargon
> 2. A little — simple terms are fine, explain the rest
> 3. Technical — commands and terms are fine

Maps to: `[TECH_LEVEL]` in `SOUL.md`. Write the full rule, not the number. Example value: "not technical — explain in plain words; no commands, no jargon unless I ask for them". Deliver in the user's language.

---

### Q5 — Voice input

> Do you often dictate your messages to me by voice?

Maps to: `[VOICE_INPUT]` in `SOUL.md`. Deliver in the user's language.

- Yes → write: "yes — my messages can have wrong words and no structure; work out what I mean before you answer".
- No → write: "no".

---

### Q6 — Catch-all (anything else important about you)

> What else do you want me to always remember about you?
>
> Anything I didn't ask about, but that feels important to you. Or "nothing" / "that's enough".

Sort the answer into two values:
- A rule about how to reply or how to work with the person ("never use emoji", "always ask before you send an email") → `[EXTRA_RULES]` in `SOUL.md`.
- A fact about the person ("I have two kids", "I work at night") → `[EXTRA_USER]` in `user/user.md`.

- Trim each value to ~5 lines max. If longer, keep the most important parts and tell the user something like "trimmed it a little, kept the essentials".
- A value with nothing in it (e.g. the user said "nothing", "pass", "skip", "that's enough", "—" — in any language, or the answer has no rule or no fact): store `"(empty — add via setup later if you want)"` *rendered in the user's language*.

Never block on this. The whole point is to give the user a chance to add what we missed.

---

## Write step (first-run)

1. `SOUL.md` is missing → copy `system/skills/setup/templates/soul.md` to `SOUL.md` byte for byte first.
2. Replace each `[UPPERCASE_TOKEN]` in `SOUL.md` and in `user/user.md` with the captured value. `[DATE]` = today (YYYY-MM-DD).
3. Write only into a token. A line without a token already holds a value: never change it in first-run.
   One exception: a line whose value is exactly `unknown` (an update wrote it) is asked like a token.

## Change-person mode (repeat interview)

The repeat interview is the way to change `SOUL.md` › `## The person you work with` and `user/user.md` (the person does not edit the files by hand). Use it when the person asks to change how you talk to them, or to redo the interview.

1. Show the current values in the Stage 03 recap format (the YOU block only).
2. Ask: "What do you want to change?" Ask only the questions for the parts the person names. The person says "everything" → ask Q1–Q6 again.
3. For each answer the person gives, change only the value of its line. The value is the text after `**Field:** `, or the text under the `## What I do` or `## More about me` heading.
4. Change nothing else:
   - a question that was not asked, or skipped, → its line stays as it is;
   - never change `## Who you are`, other headings, lines without a field, or blocks such as `## Moved here by the 0.9 update — check`;
   - never reorder or reformat lines.
5. A field line is missing → add it as the last line of `## The person you work with`. The section is missing → add it with only the changed lines, above any `## Moved here by the 0.9 update — check` block, else at the end of the file.
6. Q6 in this mode adds to the value; it replaces the value only when the person says so.
7. Update `last_updated` in `user/user.md` only when a value in it changed.

## Done criteria

- Every `[UPPERCASE_TOKEN]` in `SOUL.md` and `user/user.md` replaced (`[EXTRA_RULES]` and `[EXTRA_USER]` may hold the "(empty — …)" string, but not the token literally).
- `grep '\[' SOUL.md user/user.md` returns 0.
- `SOUL.md` › `## Who you are` is byte for byte the same as before the stage.
- `[ROLE_SENTENCE]` ≥ 6 words (not "I'm in marketing").
- `[BUGS_LIST]` ≥ 1 concrete item OR an explicit "nothing annoys me" (which is fine).
- First-run: move on naturally, in the user's language: "Got it. Now a few questions about your business."
- **First-run: before the first business question, read `system/skills/setup/02_business/CONTEXT.md`** — the questions and the templates of the business files are only there. **Change-person:** go to Stage 03 (YOU block only) — no business stage.
