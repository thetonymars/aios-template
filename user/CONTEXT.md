# User — the person

The map of the personal folder: what lives where, and where a new fact about the user goes. Facts about a business are not here — they live under `business/<slug>/`.

The rules for writing here (what an agent may save, what is private, how a folder is added) are not in this file: read `AGENTS.md` › Records before you write.

## What lives here

| File | What | A new fact goes to |
|---|---|---|
| `user.md` | session start: who the user is, what they do, how to respond to them. Read in every session, so it stays short: one line per topic at most, the detail goes to the files below | a change to any of these |

No folder yet:

| A new fact about | Goes to |
|---|---|
| biography, expertise, results of personality or strengths assessments | `profile/story.md`; a full assessment report → `profile/<name>.md` |
| health now: conditions, limits, allergies, medication, food and training routine | `health/health.md`; a dated record (a test, a doctor's conclusion) → `health/<what>-<YYMMDD>.md` |
| family and close ones — only what is shared: anniversaries, traditions, plans | `relationships/relationships.md`. A fact about the other person (their birthday, diet, job) → their note in `people/` |
| personal money: income, spending, capital, debts, taxes and deadlines, goals | `money/money.md` |
| career, education, working routine | `work/work.md` |
| what the user is learning and wants to learn | `growth/growth.md` |
| hobbies and tastes | `leisure/interests.md`; how they travel → `leisure/travel.md` |
| housing, car, devices | `home/household.md`; the list of documents with expiry dates → `home/documents.md` |
| beliefs and faith, and what follows from them for an agent | `spirit/spirit.md` |

## What does NOT live here

- Facts about a business (brand, products, customers, numbers) → `business/<slug>/`
- Facts about another person (a spouse, a doctor, a friend) → their note in `people/`
- Raw material (diaries, chat exports, long dictation) → `knowledge/`; only selected facts come here
- Project work → `projects/`
