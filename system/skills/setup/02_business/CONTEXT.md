# Stage 02 — Business (both modes)

Capture one business → `areas/business/<slug>/business.md`. ~4 min, warm + direct, one
question at a time. **Match the user's language.** Never show file paths or
placeholder tokens to the user. Never use the word "slug" with the user — say "папка".

The interview text below is in Ukrainian as the canonical reference; translate it
for Russian or English flows. All example phrases must be in the user's language.

---

### Q5 — Business name (just the name)

> Як називається твій бізнес — повна назва, як її бачить клієнт?

Maps to: `[BUSINESS_NAME]`.

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

> Як назвати папку твого бізнесу в системі? Одне-два слова англійською або транслітом, без пробілів.
>
> Приклади:
> • `nail-salon`
> • `journaling-app`
> • `coaching`
>
> З назви автоматично пропоную: `<derived-slug>` — підходить, чи інакше?

Maps to: `[SLUG]`.

Validate the chosen value against `^[a-z][a-z0-9-]*$`:
- Doesn't match → silently propose another normalized candidate and ask "тоді буде `<candidate>` — підходить?"
- Equals `user` → reject ("`user` зарезервоване — кинь інший варіант"), ask again.
- A real business already exists at `areas/business/<slug>/` with a filled `business.md` →
  default to asking for a different name. Overwrite ONLY on explicit confirm, and
  tell them plainly: "Це перепише тільки опис цього бізнесу. Все інше у цій папці лишиться як було. Точно?"
- A stray `areas/business/<slug>/` with missing or bracket-full `business.md` = an incomplete
  prior run → complete it in place.

**Reserve the name only. Do NOT create `areas/business/<slug>/` here** — that happens at the
write step below, so an abandoned interview leaves no folder.

---

### Q7 — Niche

> В якій ніші цей бізнес працює? Одне-два слова.
>
> Приклади:
> • копірайтинг для онлайн-шкіл
> • приватний журналінг
> • коучинг жінок 45+

Maps to: `[NICHE]`.

**Probe rule:** if the answer is ≤2 words AND extremely generic ("бізнес", "маркетинг", "tech") — ask "А конкретніше — для якої аудиторії чи в якому сегменті?" Then accept.

---

### Q8 — What + How + Who (Jay Abraham Q15, adapted) — ONE coherent ask

> Тепер коротко про сам бізнес — щоб AI розумів суть. Три речі однією відповіддю:
>
> 1. **Що** ти продаєш — конкретний продукт / пакет / робота (не «послуги» взагалі)
> 2. **Як** ти продаєш — *як клієнт до тебе доходить і яким способом ти продаєш*. Приклади:
>    • контент в Instagram → DM → діагностичний дзвінок → пакет
>    • реклама на Facebook → лендінг → вебінар → курс
>    • холодна розсилка → відповідь → дзвінок
>    • сарафанне радіо + презентації
> 3. **Кому** ти продаєш — конкретний сегмент в межах ніші. Не «всі», не «бізнеси». Хто саме платить — 1-2 речення про реального клієнта.

Maps to: `[WHAT]`, `[HOW]`, `[WHO]`.

**Probe rules:**
- If `[WHO]` is "всі" / "малий бізнес" / "люди" / similar non-segment — ask: "А конкретніше — хто саме у цій ніші платить тобі? Опиши реального клієнта."
- If `[HOW]` is just a delivery model ("підписка", "курс") and doesn't describe how the customer ACTUALLY gets to the purchase — ask: "А як саме клієнт доходить до покупки — звідки вони беруться, що з ними відбувається до продажу?"
- If `[WHAT]` is "послуги" / "консультації" without specifics — ask: "Що саме у цьому пакеті — конкретніше?"

---

### Q9 — Cloud storage (optional, one quick ask)

> Тримаєш файли цього бізнесу в хмарі (Google Drive, Dropbox, тощо)? Якщо так — кинь шлях/назву теки. Якщо ні — пропусти.

Maps to: `[CLOUD_STORAGE]`. Yes → record what they say. No / skip → set to `—`. Setup moves nothing — it only records the path. Each business has its OWN storage, so this lives in THIS business's file.

---

### Q10 — Catch-all (anything else important about this business)

> Що ще ти хочеш, щоб я завжди пам'ятав про цей бізнес?
>
> Що завгодно про нього, чого я не запитав, але важливо для роботи. Або «нічого».

Maps to: `[EXTRA_BUSINESS]`.

- If they share something: store raw text (trim to ~5 lines max — keep most important if longer).
- If they skip: store as `"(пусто — додаси через setup, якщо захочеш)"`.

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
- Move on: "Записав про '{display name}'. Останнє — короткий перегляд."
