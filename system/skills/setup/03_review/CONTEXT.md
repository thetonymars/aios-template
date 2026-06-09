# Stage 03 — Review (friendly recap)

Show the user what was captured, accept corrections, finalize. **Mode-aware.**

**Rules (do NOT violate):**
- **Zero file paths** shown to the user. Never `areas/user/user.md`, `areas/business/<slug>/business.md`, or any path.
- **Zero technical labels.** Don't say "slug", "frontmatter", "placeholder", "field".
- **Match the user's language.**
- Reads as a friend summarizing back what they heard — NOT a tool printing fields.
- **CRITICAL formatting rule:** the recap goes in ONE code block; the follow-up question + CTA go OUTSIDE the code block (otherwise they visually blur together). See exact template below.

## Process

1. Read the files written this run silently. The user does not see the read.
2. Display the recap in a code block, then the question/CTA OUTSIDE it.

### Exact format (first-run mode)

The output is TWO parts:

**Part 1 — code block (the recap):**

````
Готово, ось що я тепер про тебе знаю:

ТИ
• {DISPLAY_NAME}, спілкуємось {LANGUAGE}
• {ROLE_SENTENCE}
• Тон/довжина: {TONE} · {LENGTH}
• Що бісить: {BUGS_LIST}
• Ще про тебе: {EXTRA_USER або "—"}

ТВІЙ БІЗНЕС: {BUSINESS_NAME}
• Ніша: {NICHE}
• Що продаєш: {WHAT}
• Як продаєш: {HOW}
• Кому продаєш: {WHO}
• Хмарне сховище: {CLOUD_STORAGE або "—"}
• Ще про бізнес: {EXTRA_BUSINESS або "—"}
````

**Part 2 — plain text below (the CTA):**

```
*Все так, чи щось поправити?*
*Скажи що змінити — або просто «ok», «готово», «добре».*
```

### Add-business mode

Show only the BUSINESS block in the code block (the operator block was already confirmed earlier). Same CTA underneath.

### On a correction

If the user says "ні, тон не такий", "перепиши що продаєш", "замінити нішу на…":
- Edit the relevant file silently (user does not see paths or edit operations).
- Re-display the recap (same shape, updated values). Code block + CTA outside.
- Loop until the user says "ok"/"done"/"готово"/"добре"/"да"/"так"/"yes".

### On confirm — closing message (plain text, OUTSIDE any code block)

For first-run:

```
✓ Готово.

Що далі — просто говори зі мною. Назви бізнес — підхоплю його контекст. Або скажи що треба зробити (написати лист, серію постів, переробити пост…) — підкличу потрібний скіл.

Захочеш додати ще один бізнес — скажи «новий бізнес», пройдемо короткий онбординг.
```

For add-business:

```
✓ '{BUSINESS_NAME}' додано. Тепер можеш назвати його ім'ям — і я підхоплю його контекст.
```

## Done criteria

- Recap shown in a code block; CTA shown OUTSIDE that code block; no visual blur.
- No file paths, placeholder tokens, or system labels anywhere in the user-facing output.
- User confirmed (any of: ok / done / готово / добре / да / так / yes).
- Closing message printed in plain text below the recap (not inside a code block).
- `system/skills/skills.md` lists `setup` (ships listed — verify, don't duplicate).
