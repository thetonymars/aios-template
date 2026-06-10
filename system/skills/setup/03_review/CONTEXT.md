# Stage 03 — Review (friendly recap)

Show the user what was captured, accept corrections, finalize. **Mode-aware.**

**Rules (do NOT violate):**
- **Zero file paths** shown to the user. Never `areas/user/user.md`, `areas/business/<slug>/business.md`, or any path.
- **Zero technical labels.** Don't say "slug", "frontmatter", "placeholder", "field".
- **Match the user's language.** The templates below are written in English as the canonical reference — render everything the user sees in their chosen language at runtime.
- Reads as a friend summarizing back what they heard — NOT a tool printing fields.
- **CRITICAL formatting rule:** the recap goes in ONE code block; the follow-up question + CTA go OUTSIDE the code block (otherwise they visually blur together). See exact template below.

## Process

1. Read the files written this run silently. The user does not see the read.
2. Display the recap in a code block, then the question/CTA OUTSIDE it.

### Exact format (first-run mode)

The output is TWO parts:

**Part 1 — code block (the recap):**

````
Done — here's what I now know about you:

YOU
• {DISPLAY_NAME}, we talk in {LANGUAGE}
• {ROLE_SENTENCE}
• Tone/length: {TONE} · {LENGTH}
• Pet peeves: {BUGS_LIST}
• More about you: {EXTRA_USER or "—"}

YOUR BUSINESS: {BUSINESS_NAME}
• Niche: {NICHE}
• What you sell: {WHAT}
• How you sell: {HOW}
• Who you sell to: {WHO}
• Cloud storage: {CLOUD_STORAGE or "—"}
• More about the business: {EXTRA_BUSINESS or "—"}
````

**Part 2 — plain text below (the CTA):**

```
*All correct, or should I fix something?*
*Tell me what to change — or just say "ok", "done", "good".*
```

### Add-business mode

Show only the BUSINESS block in the code block (the operator block was already confirmed earlier). Same CTA underneath.

### On a correction

If the user says something like "no, the tone isn't right", "rewrite what I sell", "change the niche to…" (in any language):
- Edit the relevant file silently (user does not see paths or edit operations).
- Re-display the recap (same shape, updated values). Code block + CTA outside.
- Loop until the user confirms (e.g. "ok", "done", "good", "yes" — in any language).

### On confirm — closing message (plain text, OUTSIDE any code block)

For first-run:

```
✓ Done.

From here on — just talk to me. Name a business and I'll pick up its context. Or tell me what needs doing (write an email, a series of posts, rework a post…) — I'll bring in the right skill.

Want to add another business someday — say "new business" and we'll run a short onboarding.
```

For add-business:

```
✓ '{BUSINESS_NAME}' added. You can now call it by name — and I'll pick up its context.
```

## Done criteria

- Recap shown in a code block; CTA shown OUTSIDE that code block; no visual blur.
- No file paths, placeholder tokens, or system labels anywhere in the user-facing output.
- User confirmed (e.g. "ok", "done", "good", "yes" — in any language).
- Closing message printed in plain text below the recap (not inside a code block).
- `system/skills/skills.md` lists `setup` (ships listed — verify, don't duplicate).
