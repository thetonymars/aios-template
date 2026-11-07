# Offers — map

Where to send a person. One file per offer: `<short-name>.md`, in lowercase Latin letters, digits and hyphens. This map is not an offer. The update replaces it, so keep no notes in it. This business's own rules for its offers → `../core/business.md` › Rules for agents.

## The offer file

The frontmatter has five fields:
- `status` — `draft`: not launched yet. `live`: send people there. `off`: paused, it will come back; the body says why. `archived`: no longer used. A `live` offer always has a `url`.
- `offer_type` — one type per offer, by its role:
  - `lead-magnet` — free; the person gives contact details, not money
  - `attraction` — a paid, low-priced first purchase
  - `core` — the main offer of the business, also when it is a subscription
  - `upsell` — offered right after a purchase
  - `downsell` — offered after a "no"
  - `continuity` — a recurring payment: a subscription, a membership
- `url` — the one public link where the offer starts. Empty while there is no link.
- `price` — with the currency (`49 USD`, `20 USD / month`), `free`, or `on request`.
- `last_updated` — the day these facts were last checked.

The heading is the name a customer sees. Then three lines: what the person gets, who it is for, what happens at the link. The full design of the offer goes below them. Not known → `unknown`.

## Picking an offer for a text

1. Keep only `live` offers. A file that breaks the format → skip it and tell the person.
2. Right after a purchase → only `upsell`. Right after a "no" → only `downsell`. At any other moment → neither of the two.
3. Leave out an offer the person already accepted or just refused.
4. Several left → take the one closest to the topic of the text. Not clear → show the candidates and ask.
5. None left → say so, and ask where to send people.

Take the link from `url` as written. Never invent a link or a price.

## Recording an offer

Ask for what is missing before you write. An offer that is not launched yet is a `draft`. Never delete an offer file: set `status: archived`.
