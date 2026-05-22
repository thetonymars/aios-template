# Skills catalog

Routing (see AGENTS.md "## Skills" — dual-routing rule):

## Local (shipped in this folder)

- **setup** — conversational AIOS onboarding. Two auto-detected modes:
  first-run (operator → `user/user.md` + first business →
  `business/<slug>/business.md`) and add-business. One focused question per turn —
  no mega-asks. Captures only the 20% of info that drives 80% of personalization
  quality. Triggers: 'setup', 'set up aios', 'onboarding', 'add business',
  'налаштувати aios', 'додай бізнес', 'добавить бизнес'. **Entry:** read
  `system/skills/setup/SKILL.md`, then `system/skills/setup/CONTEXT.md` for mode
  detection.

`setup` is the ONLY local skill — it bootstraps the system before the skills
server is trusted.

## Remote (served by the AIOS skills server over MCP)

Every other skill is delivered remotely. There are no other folders under
`system/skills/`. To use any non-setup skill:

1. Call the `list_skills` MCP tool to see what is available.
2. Call `start_skill` with argument `slug` to enter it (returns its SKILL.md + CONTEXT.md).
3. Call `read_skill_file(skill, path)` to lazy-load further files on demand.

If `list_skills` / `start_skill` tools are not present, the skills server is not
connected — tell the user to run the AIOS installer. Do not improvise.
