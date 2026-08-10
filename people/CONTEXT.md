# People

People & relationships. **One note per person, all in this folder — no sub-folders.**
What someone is to you (a lead, a friend) is a FIELD, not a folder: sub-folders force
one label per person and hide everyone from a single query.

## Person note

File: `people/Name Surname.md`

Frontmatter (no tags — query by these fields):

```
---
type: person
relation:    # what they are to you — friend, family, client, lead, partner, mentor, colleague
role:        # what they do — e.g. designer, developer, founder
company:     # optional
location:    # optional
---
```

Both `relation` and `role` can hold more than one value (`client, friend`) — people
rarely fit one box, and a person who moves from lead to client is an edit, not a move.

Body: how you met · contacts · notes.

## Finding people

Don't browse — **query**. Ask by `relation` / `role` / `company` / `location`
(e.g. "who among my people is a designer?", "which of my clients are in Lisbon?").
