# System

What the OS runs on. Machine-consumed — not read as notes.

| Folder | What |
|--------|------|
| skills/ | repeatable AI workflows. Each = folder with SKILL.md. Catalog in `skills.md`. |
| agents/ | specialist personas (`<role>/AGENT.md`) that own skills — see `AGENTS.md` → Agents. |

The explicit-invocation rule for skills is stated once, in `AGENTS.md` → Skills.

## MCPs are external

MCPs register in the AI client's own config, **not** in the vault — with one exception: the
AIOS skills server's `.mcp.json` at the AIOS root, which the install writes and Claude Code
reads there.

## Connecting the skills server

Opened from `AGENTS.md` → "Connecting the skills server": after the Session Start check failed twice
(or found no tool after calling), or when the user says skills are missing.

All non-`setup` skills stream from the AIOS skills server over MCP (the three tools named in `AGENTS.md` → Skills).

> [!important] **Most clients NAMESPACE those tools, and this section is about the ones
> that are genuinely missing — not the ones you failed to recognise.** In Claude Code and
> Codex they appear as `mcp__aios__list_skills`, `mcp__aios__start_skill`,
> `mcp__aios__read_skill_file`; in Codex's code mode they are callable inside `exec` as
> `await tools.mcp__aios__list_skills({})`. Other clients use other prefixes.
> **Match on the ENDING, never on the exact string** — any available tool whose name ends
> in `list_skills` is the one. And before you tell the user anything is unavailable,
> **call it**: a call that returns skills settles the question, an absent tool does not.
> On the first call some clients ask the user to approve the MCP tool — that is their
> permission prompt, not a failure.

If, after looking by ending AND trying the call, those three tools really are not in your
session, the server is not connected yet.

**This is yours to diagnose — not the user's.** They are not developers. Work out which
case below you are in, then tell them what to do in ONE sentence, in their own language,
**in ordinary words**: lead with the action they have to take, not with the machinery
behind it. *"The AIOS skills aren't switched on yet — your app will ask your permission,
say yes and restart it"* does the job; a status string and a file path do not. The most
they should ever have to do is approve a permission and restart their app.

**Plain is not the same as hidden.** Say what you changed whenever it matters, always if
they ask, and ALWAYS before you change anything outside the AIOS folder — that one is
theirs to decide, not a detail to spare them.

**Check these in order and stop at the first one that matches.**

### 1. Is `.aios-license` missing from the AIOS root?

Then the install never finished, and nothing below can help. Tell the user to get their
personal install command at `yellows.one/aios`. Never invent a token. (`setup` does NOT
set the license.) Stop here.

### 2. Are you Claude Code?

The install writes the server config to **`.mcp.json` at the AIOS root** (beside
`AGENTS.md`). Claude Code reads that file only when the AIOS folder is the folder the app was
opened in, and it asks the user to approve the server once. Run `claude mcp get aios`
and match what it PRINTS — the exit code is 0 either way and tells you nothing. (No
`claude` command available? Go to 3.)

- **`⏸ Pending approval`** — everything is in place; the user simply has not said yes
  yet. Ask them to restart the app and say yes when it asks.
- **`✘ Rejected`** — **reached from the silent Session Start check → stop here and say nothing.**
  Only when the user asks why skills are missing: the permission was declined earlier and the app remembers it, so it
  will never ask again on its own. **Ask before you clear that.** It is a decision they
  recorded, and undoing it silently is not yours to do: say that they turned this down
  once and that you can make the app ask again, and get a yes. Then run
  `claude mcp reset-project-choices` and ask them to restart. It affects THIS folder
  only, but it re-asks about every server the folder configures — so if the app asks
  about more than one, that is expected, not a fault.
- **`✔ Connected`** — the config is right and the server answers; this session simply
  started before the approval landed. Ask for one restart and nothing else. **Do not
  repair a config that is already working.** Still no tools after that restart → go to 4.
- **`Scope: User config`** (whatever the status says) — an older install, wired up by
  `connect.mjs` before `.mcp.json` existed. Same treatment: one restart, no repairs, and
  **do not run `connect.mjs` again**. Still nothing → go to 4.
- **`No MCP server found`** — Claude Code sees no `aios` server here. Before you conclude
  anything, open `.mcp.json` at the AIOS root and check it yourself. It must exist, be
  valid JSON, have an `aios` entry, and its `Authorization` header must end in the real
  device id — **if the header still holds a `PASTE_…` placeholder, the install was left
  half-done**.
  - File missing, unparseable, no `aios` entry, or a placeholder still in it → the
    config is not usable, but you can repair it right here and nothing outside the folder
    has to change. Rewrite `.mcp.json` yourself: the key is the one line in
    `.aios-license`, and the device id is a sha256 of the home path, platform, CPU model
    and total memory joined with `|`, cut to 12 hex characters and uppercased. It has to
    be that formula — any other one yields an id the server does not recognise — but you
    do not have to use this exact command to get it:

    ```
    node -e "const{createHash}=require('crypto'),os=require('os');console.log(createHash('sha256').update([os.homedir(),os.platform(),os.cpus()[0]?.model??'',String(os.totalmem())].join('|')).digest('hex').slice(0,12).toUpperCase())"
    ```

    The header is `Bearer <key>.<id>`. Then ask for one restart. Only if that is
    impossible, go to 3.
  - File present and correct → the app was not opened in the AIOS folder, so it cannot
    see the file. Ask the user to close the app and open it again inside the AIOS folder,
    and tell them you'll be waiting there.

### 3. Any other client

**Ask the user first, and get a yes.** This path changes files OUTSIDE the AIOS folder:
`node system/connect.mjs` adds the AIOS entry to the settings of **every AI app it finds
on this machine**, not only the one you are in, and the OpenCode entry it writes fetches
an npm package (`mcp-remote`) every time that app starts. Say both in plain words before
you run it. It keeps a `.bak-aios` copy of each file the first time it touches one — not
on later runs — and leaves their other MCP servers alone. But it is their machine, so it
is their call.

With a yes: run it from the AIOS root (the folder with `AGENTS.md`). It reads
`.aios-license` and writes the correct config for whichever clients are installed — you
do not need to know any per-client format. Tell them what it reported writing, then ask
them to restart the app.

- The script reports which clients it wrote and which it skipped. **If it skipped
  yours**, or you have no shell at all (a GUI-only app such as Claude Desktop), you
  cannot configure it for them: give them the three values to add a connector in the
  app's own settings — name `aios`, url `https://aios-skills.vercel.app/mcp`, header
  `Authorization` = `Bearer ` followed by the value in `.aios-license`. Show them those
  three values in full: here the machinery IS the instruction, because they have to type
  it. **Note this header carries no device id** — unlike every config written for them,
  a hand-typed connector sits outside the one-machine cap. That is deliberate, not an
  omission you should correct.

- **Prefer a config the app reads from inside the AIOS folder if it has one**, for the
  same reason Claude Code does: the user approves it and nothing global is touched. If
  you are not sure your app supports that, say so rather than assuming either way.

### 4. Still nothing after ONE restart

Stop. Tell the user plainly that the skills server is not answering and that they should
contact support. Do not loop, do not try a third approach, and do not start rewriting
config — a wrong repair costs more than the wait.
