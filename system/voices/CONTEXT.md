# Voices

A **voice** is how one particular person or character writes — their own recognisable
style. It is about written text, not a sound recording. Voices live here, in
`system/voices/` — one folder per voice. A voice belongs to a person, not to one business:
the same voice can write for any of them. When a text is written for people outside the
business (an article, a post, a video script, an email, a page), how it should sound is
read from a voice folder instead of being asked again or guessed.

There can be several voices: the user writing as themselves, another person on the team,
an invented author. A brand is not a voice: positioning, story and brand voice stay in
`business/<slug>/brand/`.

This file is the same in every AIOS and is replaced on update — keep no notes in it. The
list of voices is the list of folders next to it.

## A voice folder

`system/voices/<name>/` — the speaker's name in lowercase Latin letters, digits and
hyphens, for example `anna`; a name in another alphabet is spelled in Latin letters. That
name is how a skill refers to the voice; the user may name it in their own words ("my
voice", "as Anna").

A voice folder is laid out like a skill folder, but it is not a skill: it needs no
frontmatter and is not listed among the skills. Its main file is `VOICE.md`; a small voice
is that one file. A big voice adds files next to it — a fuller style guide, the rules for
one kind of text (`post.md`, `email.md`), longer examples — and its `VOICE.md` says which
of them to read for which task.

```markdown
# Anna

## Who speaks
Anna, the founder of the school, a real person. Writes as "I". Tells her own stories and
her students' results. Signs with her first name.

## How they write
- Calm and patient, like a teacher with a beginner.
- Explains every term the first time it appears.
- One worked example per idea.

## Never
- "It's easy"
- "Obviously"
- Promises of a result by a date.
```

- **The heading** is the speaker's name, as they write it.
- **Who speaks** — who this is: a real person and their role, or an invented author (the
  file says so plainly). Which person they write in ("I", "we") and how they sign. Whose
  stories and results they tell; for an invented author, also what they may say about
  themselves. Every `VOICE.md` has this part.
- **How they write** — tone, sentence style, their own words, how they address the reader,
  the usual shape of a text. Short rules, each with an example where it helps.
- **Never** — what this voice does not use. An exact phrase or word goes in quotation
  marks so that a text can be searched for it; a move that cannot be searched for is
  described in plain words.

Start a new voice from these three parts: keep the three headings as they are, write what
is under them in the language the voice writes in, and leave **Never** empty rather than
guess it. A voice brought in from somewhere else keeps its own layout and needs only
**Who speaks**.

## Writing in a voice

When a task or a skill writes a text for people outside the business, or rewrites one in a
voice:

1. Find the voice. One was named (by the user, or by the skill that is running) → take it.
   Nobody named one → there is one voice folder: take it; there are several: ask which.
2. Read its `VOICE.md` whole, then the files it sends you to for this task, and write as
   that speaker.
3. A voice changes how a thing is said, never what is true. What a text says about the
   speaker, the business and its customers comes from the user, the material you were
   given, and the user's and the business's own files. Never invent a biography,
   experience, results or quotes; an invented author has no past of their own. Other
   people's words — a quote, a testimonial, a review — stay exactly as they were written.
4. The voice that was named has no folder → say so and name the voices that exist.
5. No voice folder exists yet → nothing changes: write as you would without this file.

## Saving a voice

When the user asks to save or describe a voice — or agrees when you suggest it — create its
folder here and write `VOICE.md`, or update the one that voice already has. Take the style
from that person's real texts or from what the user tells you; for an invented author that
is a name, a role and a manner — never a past. Write down what you know and ask for the
rest; never guess.
