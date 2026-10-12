# Router — which file owns each task

Read at every session start (`AGENTS.md` › Session Start). `AGENTS.md` says what this system is, its folders and its rules; this file says where to go. Open the file a row names before doing anything there. A task with no row is placed by `AGENTS.md` › Layers.

This file is yours: add a row for your own tools, drives and folders. An update only adds a shared row that is missing here; it never changes or removes a row.

## Task Router

| Your task | Go here | Before you get there |
| --- | --- | --- |
| An idea or a thought to come back to, a link or raw material to sort later — nothing decided yet | `_inbox/` | the one in the root — it has no map: save a plain file with a lowercase-hyphen name. Not a fact about the user or a business; it becomes a product, an offer or a project only when the user says so |
| Any project work (new / move / archive / status) | `projects/CONTEXT.md` | naming, stages and the registry rule are there |
| Find a project — every one ever done and where its files are | `projects/_index.md` | search by the `PNNNN` code |
| Anything about a business — look up or save a fact (brand, avatars, competitors, market, products, prices, numbers, sales, customers, team) | `business/<slug>/CONTEXT.md` | which business → `AGENTS.md` › Businesses; the map names the file for each kind of fact; how a record is written → `AGENTS.md` › Records |
| Anything about the user personally — look up or save a fact (health, money, family, home, travel, learning) | `user/CONTEXT.md` | private; save only what they said themselves, after showing them the record |
| Where to send a person — which offer or lead magnet to link in a call to action; record a new offer; change an offer (launched, paused, no longer used) | `system/offers.md` | offers live in `business/<slug>/offers/`; take a `status: live` one, never invent a link; `status` takes only the values that file names |
| Whose voice a text for an audience is written in (a post, an article, an email, a script); rewrite a text in a voice; save a new voice | `system/voices/CONTEXT.md` | one folder per voice — open its `VOICE.md`; not the brand voice (`business/<slug>/brand/`) and not audio |
| Recall past notes / thinking / archive | `knowledge/CONTEXT.md` | search, don't browse |
| Add, list or run a skill | `system/skills/skills.md` | skills run only when asked → `AGENTS.md` › Skills |
