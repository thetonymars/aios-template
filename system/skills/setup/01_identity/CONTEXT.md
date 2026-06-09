# Stage 01 — Operator (first-run only)

Capture the **global operator as a person** — the minimum context AI needs for
personalization. ~3 min, warm + direct, one question at a time. Target:
`areas/user/user.md` (fill its `[UPPERCASE_TOKEN]` placeholders in place).

**Match the user's language from Step 0 onwards.** All example phrases in this
interview MUST be in that language — never mix English examples into a Ukrainian
or Russian flow. The interview text below is in Ukrainian as the canonical
reference; translate it for Russian or English flows.

---

### Step 0 — Language (check first, ask only if not set by install)

**First, check `areas/user/user.md`.** If its `[LANGUAGE]` field is already filled
(i.e., it does NOT contain the literal token `[LANGUAGE]`) — the installer set
it during Step 0 of install. Use that value, switch all dialogue to that
language, and proceed directly to Q1. Do NOT show the language picker again.

**Only if `[LANGUAGE]` is still the literal placeholder token** — the install
did not set it (e.g., the user installed via an older install.md, or skipped
the language step). Then send this exact message:

```
🇺🇦 Українська · 🇷🇺 Русский · 🇬🇧 English

Якою мовою? / На каком языке? / Which language?
```

After the user replies (e.g., "українська" / "ua" / "1" / "ukrainian" / etc.):
- Store the choice as `[LANGUAGE]`.
- Switch all subsequent dialogue to that language.
- Do NOT confirm the choice with a long message — just proceed to Q1 in the new language.

---

### Q1 — Address (name)

> Як до тебе звертатись? Ім'я, псевдонім, як комфортно — як ти хочеш, щоб я тебе називав.

Maps to: `[DISPLAY_NAME]`.

If the user types a long answer (e.g., starts their life story) — capture the name only, then move on with "Записав. Далі по черзі."

---

### Q2 — What you do professionally

> Чим ти займаєшся професійно? Одне речення про дві речі:
>
> 1. **Твоя професія / роль** — як би ти представився на конференції
> 2. **Для кого** ти це робиш
>
> Приклади (як виглядає відповідь):
> • «маркетер, будую офери і воронки для онлайн-шкіл»
> • «розробник, пишу інструменти для соло-творців»
> • «коуч, працюю з жінками 45+»

Maps to: `[ROLE_SENTENCE]`.

**Probe rule:** if the answer is ≤4 words OR abstract ("я в маркетингу", "tech stuff", "я допомагаю людям") — ask ONE follow-up: "А конкретніше — для кого ти це робиш, і що саме виходить на виході?" Then accept.

---

### Q3 — How to respond to you (3 micro-fields, ONE coherent ask)

> Як мені відповідати тобі? Три швидкі речі — однією відповіддю:
>
> 1. **Тон** — формальний / прямий / теплий / технічний / якийсь свій?
> 2. **Довжина** — коротко за замовчуванням, чи розгорнуто?
> 3. **Що тебе бісить в AI-відповідях** — 1-2 речі, від яких ти точно не хочеш бачити. Приклади: «не починай зі "Звісно!"», «без вибачень», «не пиши тире (—)», «без emoji», «не вдавай ентузіазм».

Maps to: `[TONE]`, `[LENGTH]`, `[BUGS_LIST]`.

This LOOKS like 3 questions but is ONE coherent ask about response style. The user answers all three in one short message naturally. Do NOT split into 3 separate turns.

If they answer only 1-2 parts: ask for the missing piece in one short follow-up.

---

### Q4 — Catch-all (anything else important about you)

> Що ще ти хочеш, щоб я завжди пам'ятав про тебе?
>
> Будь-що, чого я не запитав, але тобі здається важливим. Або «нічого» / «достатньо».

Maps to: `[EXTRA_USER]`.

- If they share something: store the raw text (trim to ~5 lines max — if longer, keep the most important parts and tell the user "трохи зберіг, найголовніше").
- If they skip ("нічого", "пас", "skip", "достатньо", "—"): store as `"(пусто — додаси через setup, якщо захочеш)"`.

Never block on this. The whole point is to give the user a chance to add what we missed.

---

## Write step

Replace every `[UPPERCASE_TOKEN]` in `areas/user/user.md` with the captured value. `[DATE]` = today (YYYY-MM-DD).

## Done criteria

- Every `[BRACKET]` in `areas/user/user.md` replaced (including `[EXTRA_USER]` — may hold the "пусто" string, but not `[EXTRA_USER]` literally).
- `grep '\[' areas/user/user.md` returns 0.
- `[ROLE_SENTENCE]` ≥ 6 words (not "я в маркетингу").
- `[BUGS_LIST]` ≥ 1 concrete item OR explicit "нічого не бісить" (which is fine).
- Move on naturally: "Записав. Тепер кілька питань про твій бізнес."
