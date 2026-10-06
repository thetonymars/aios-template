# Offers

Every business keeps its offers in `business/<slug>/offers/` — one file per offer. When a
piece of content (an article, a post, a video, an email, a page) should lead a person to the
next step with the business — subscribe, apply, buy — the link is taken from there instead of
asking again or guessing.

An **offer** is one thing a person is asked to do at one link: buy, apply, or leave contact
details in exchange for something. A lead magnet is an offer too — a free one, paid for with
contact details instead of money. A **product** is what gets delivered; it stays in
`products/`. One product can sit behind several offers.

## The file

`business/<slug>/offers/<short-name>.md` — lowercase Latin letters, digits and hyphens, for
example `free-guide.md`. Create the `offers/` folder together with the first offer. Never put
the status in the name.

```markdown
---
status: live
offer_type: lead-magnet
url: https://example.com/free-guide
price: free
last_updated: 2026-01-31
---

# Free guide: 10 ways to find your first clients

**What the person gets:** a 12-page PDF with ten client-finding methods and a checklist.
**Who it is for:** coaches who have no steady flow of clients yet.
**At the link:** they enter an email and the guide is sent to them.
```

| Field | Value |
|---|---|
| `status` | `live` — send people there. `off` — do not (not launched yet, paused, closed); say why in the body. |
| `offer_type` | one of the six types below |
| `url` | the ONE public link a person is sent to: the page where this offer starts. Empty while the offer has no link — such an offer stays `off`. |
| `price` | what the person pays, with the currency (`49 USD`, `20 USD / month`); `free`; or `on request` when the price is not public |
| `last_updated` | the day these facts were last checked |

The heading is the name of the offer in the words a customer sees. The body is three short
lines — what the person gets, who it is for, what happens at the link — in the language the
business sells in. Add a line of notes below them only when needed (why the offer is `off`, a
restriction on the link). Nothing else goes here: the full description, bonuses, guarantee
and proof stay on the sales page or in the product file — link to them if useful.

## Offer types

| `offer_type` | What it is |
|---|---|
| `lead-magnet` | free; the person gives contact details, not money |
| `attraction` | a paid, low-priced first purchase that turns a stranger into a customer |
| `core` | the main offer of the business |
| `upsell` | what is offered next, right after a purchase |
| `downsell` | what is offered after a "no" |
| `continuity` | a recurring payment: a subscription, a membership |

One type per offer, by its role: anything free is a `lead-magnet`, and the main offer is
`core` even when it is a subscription.

## Picking an offer

When a task or a skill needs to know where to send a person and was not given an offer:

1. Read the offer files in `business/<slug>/offers/` and keep only `status: live`. An offer
   file that breaks the format above (an unknown `status`, `live` with no `url`) → skip it and
   tell the user.
2. Choose by who will see the link:
   - does not know the business yet → `lead-magnet`; failing that `attraction`; failing that
     `core`
   - knows the business but has not bought (subscribers, followers, someone weighing a
     purchase) → `core`, or `attraction` when a smaller first step fits better
   - has just bought → `upsell`
   - has just said no → `downsell`
   - is already a customer → `continuity`
3. Several fit → take the one whose heading and body are closest to the topic at hand. Still
   a tie → show the user the candidates and ask.
4. Nothing fits, or the folder is empty or missing → say so and ask the user where to send
   people, then offer to save the answer as an offer file.

Take the link from `url` as written (adding tracking parameters by the user's own rule is
fine). Never invent a link, and never pick an offer that is not `live`: if the user names one
that is `off`, say so and do as they decide.

## Recording an offer

When the user asks to record an offer — or agrees when you suggest it — write the file above,
or update the file that offer already has. Ask for whatever is missing before you write; never
guess a link or a price. This records an offer that exists; it does not design one.
