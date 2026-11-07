# User — map

The map of the personal folder: where a fact about the person goes. It is the same in every AIOS. The update replaces it, so keep no notes in it.

Nothing here is read in advance. Open `user.md` or a sphere file only when the task needs it.

## Where a new fact goes

| A new fact about | Goes to |
|---|---|
| who the person is: name, role, what they do, how they think, values, current focus; a one-line summary of each sphere below | `user.md` — the detail goes to the sphere file |
| how you talk to the person: language, form of address, tone, length | not here: `SOUL.md` › The person you work with |
| biography, expertise, proof of the author | `profile/story.md` |
| the results of a personality or strengths assessment | `profile/<name>.md`, one file per assessment |
| anti-goals, role models, looks for images | `profile/taste.md` |
| health now: body measurements, conditions, limits, allergies, medication, food and training routine | `health/health.md`; a new measurement → a new dated row there, old rows stay |
| a dated health record: a test, a doctor's conclusion | `health/<what>-<YYMMDD>.md`, or the PDF itself under that name |
| family and close ones — only what is shared: dates, traditions, plans | `relationships/relationships.md` |
| personal money: income, spending, capital, debts, taxes and deadlines, goals | `money/money.md`; the table of assets → `money/assets.md` |
| career, education, working routine | `work/work.md` |
| what the person is learning and wants to learn | `growth/growth.md` |
| hobbies and tastes | `leisure/interests.md`; how they travel → `leisure/travel.md` |
| housing, car, devices | `home/household.md`; documents with expiry dates → `home/documents.md` |
| beliefs and faith, and what follows from them for an agent | `spirit/spirit.md`. A food or drink rule kept because of belief goes here; kept because of health → `health/health.md`; reason not said → ask |
| rows by day that a collector skill gathers (a bank, a watch) | `data/` — only collector skills write there |

A folder is created together with its first file, never empty in advance. A folder or a file here that the table does not name: its own first lines or its own `CONTEXT.md` say what it holds.

## What does NOT live here

- A fact about a business (brand, products, customers, numbers) → `business/<slug>/`.
- A fact about another person (a spouse, a doctor, a friend) → their note in `people/`.
- Raw material (diaries, chat exports, long dictation) → where `AGENTS.md` sends a new note. Only selected facts come here.
- Project work → `projects/`.

## Write rules

- The person writes anywhere here. A skill or an agent writes only **what the person said in this conversation**. Show them the record first, and save after their yes, marked `from: owner`. Nobody writes conclusions about the person.
- Private by default. Nothing from here goes into a business text or a public text, unless the person gives it for that text.
- Never store the numbers of documents and cards. Write where the thing is kept and until when it is valid.
- The person does not want to answer → write `unknown · declined <date>`, and do not ask again.
- How a record is written (date and source on a number, `unknown`, one home per fact) → `system/architecture.md` › Records.
