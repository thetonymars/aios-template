# Skills

A skill is a repeatable way to do one job. Each skill of this installation is a folder here, with `SKILL.md` in its root. The folder is the source of truth. The update replaces this map, so keep no notes in it.

Run a skill when the task is the job of that skill. Which skills exist, and how to present the list → `skills.md`, next to this map.

## Create a new skill

1. **Where.** Create the folder `system/skills/<slug>/`. `<slug>` is lowercase Latin letters, digits and hyphens. It is also the `name` in the header of `SKILL.md`. Never create a skill in the AI app's own skills folder: other apps and other computers read only this folder. Never start a slug with `aios-`: that prefix belongs to the skills of the AIOS catalog.
2. **Build.** Run the skill that builds skills; it is in the lists that `AGENTS.md` › Skills names. It builds the stages, the map and the header. It does not choose the place and does not add the skill to the catalog: steps 1 and 3 do that.
3. **Test.** Run the new skill once on a real task. Fix what failed.
4. **Add it to the catalog.** Only after a real run. How this installation keeps its catalog → the top of `skills.md`.

Personal data (accounts, names, keys) never goes into a skill. Keys → `AGENTS.md` › API keys.
