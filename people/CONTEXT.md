# People

People and relationships: **one note per real person, all in this folder, no subfolders.** What someone is to the person you work with (a client, a friend, a lead) is a FIELD, not a folder. A customer or competitor avatar is not a person: it lives in a business folder. The update replaces this map, so keep no notes in it.

## The note

File: `people/Name Surname.md`, in proper case. Notes here may also carry the role after a dash (`Priya Nair - Paid Media Manager.md`): follow the pattern of the notes already here. When the role in a file name changes, rename the file and change the `role` field.

Frontmatter (no tags — query by these fields):

```
---
type: person
relation:    # what they are to the person — friend, family, client, lead, partner, mentor, colleague
role:        # what they do — e.g. designer, developer, founder
company:     # optional
location:    # optional
status:      # optional — active, dormant, prospect
---
```

`relation` and `role` can hold more than one value (`client, friend`). A lead who becomes a client is an edit of the field, not a move.

Body: only `## Role` is required — one line: what they do and how they relate to the person. Add sections as the relationship grows: `## Context` (how you met, what they own), `## Contacts`, `## What they care about`, `## Communication notes` (how to talk to them or about them), `## Active links` (projects, notes, related people).

## Finding people

Don't browse — **query** by `relation`, `role`, `company`, `location` ("who among my people is a designer?", "which of my clients are in Lisbon?"). An `_index.md` here is a directory generated from the fields: never edit it by hand.
