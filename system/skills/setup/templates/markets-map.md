# Markets

Everything about the markets this business sells into. One folder per market. A market = everyone who buys and everyone who sells one thing.

The list of this business's markets (which folder, which market, for which product) and its own rules for markets → `markets.md` in this folder. Read it first.

## Naming

- **Market folder:** what is sold, in English, lowercase, hyphens, no date, 2–3 words: «заработок на ИИ» → `ai-earnings`, «создание офферов» → `offer-creation`.
- **Every file in a market folder ends with `--<market folder>`** (then the date, for a study), so its name is unique in this whole folder and a `[[link]]` by name never hits two files.
- **A segment's or a competitor's file name** is the one its list gives — the column «Файл» of the list of segments or of the competitor list — never made up. A segment without a name there yet: the skill making its passport writes one there first, before the first file of the passport is saved (Latin letters, lowercase, hyphens, transliterated from the segment's main name and cut to its first 2–4 meaningful words), then names the file by it.

## Inside every market folder

| What | File |
|---|---|
| the dossier — the main file; only one, the current study | `dossier--<market>-<YYMMDD>.md` |
| its appendices folder, the dossier's name without `.md` | `dossier--<market>-<YYMMDD>/` |
| · the list of segments | `dossier--<market>-<YYMMDD>/segments--<market>-<YYMMDD>.md` |
| · the list of solutions — the ways the market gets the result (when the dossier has over ~10) | `dossier--<market>-<YYMMDD>/solutions--<market>-<YYMMDD>.md` |
| · the competitor list | `dossier--<market>-<YYMMDD>/competitors--<market>-<YYMMDD>.md` |
| · the reports the dossier was merged from | `dossier--<market>-<YYMMDD>/reports/report-<tool>-<mode>.<ext>` — the skill's own: `report-skill.md`; others: tool `claude`, `gemini`, `chatgpt`, `perplexity` …, mode `deep-research` |
| the passport of one segment | `avatars/<segment>--<market>.md`; when it is saved, the list of segments gets its name in «Файл» and `[[<segment>--<market>]]` in «Паспорт» |
| · the reports one passport was merged from | `avatars/<segment>--<market>/reports/report-<tool>-<mode>.<ext>` — as in the dossier's reports; link them by path, never by a bare `[[name]]` |
| the profile of one competitor | `competitors/<name>--<market>.md` |

A folder inside a market — avatars, competitors — is created with its first file, never empty in advance.

## Rules

- A new market → a new folder and a row in `markets.md`, in the same step. Which product it is for is said by the owner; not known → ask, never guess.
- A new study of the same market: the old dossier and its appendices folder move together to the archive that `markets.md` names (none named → ask), and the new dossier takes their place. Passports and competitor profiles stay and are updated in place. Then fix every live link to the old dossier's name in the same step (`system/architecture.md` › Moves).
