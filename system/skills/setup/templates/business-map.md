# Business — map

The map of one business folder: where a new fact about this business goes. It is the same in every business and in every AIOS. The update replaces it, so keep no notes in it.

## Before you work here

- Before any work for this business, open `core/business.md`. It holds what the business is, its rules for agents, its own folders and its sources.
- Open `core/numbers.md` and `core/goals.md` when the task needs numbers, goals or the current plan.
- `core/business.md` › Own to this business may name its own folder for a kind of fact. Then that folder wins over the row below.
- A folder here with its own `CONTEXT.md` routes inside itself. Open that map before you work in the folder.

## Where a new fact goes

| A new fact about | Goes to |
|---|---|
| what, to whom and how the business sells; the model; the team in one line; the market and the country's law in one line | `core/business.md` |
| a rule every agent must follow in this business | `core/business.md` › Rules for agents |
| cloud storage, sources outside this folder (a CRM, a payment system, channel statistics), the own folders of this business, its own rules | `core/business.md` — sections Sources, Own to this business, Rules for agents, and a block "Moved here by the 0.9 update — check" if there is one |
| revenue, average check, margin, cost of acquisition as one average, LTV | `core/numbers.md` |
| goal, main constraint, the one priority, "not now", the plan for the current period with its dates | `core/goals.md` |
| an earlier plan, after a new one took its place | `plans/plan-<start YYMMDD>-<end YYMMDD>.md` — never read in advance |
| the brand: identity, positioning, story, strategy, brand voice; a dated audit of the brand | `brand/<what>.md`; colours, logo, fonts → `brand/visual.md`; an audit → `brand/<what>-<YYMMDD>.md`. How a person writes is not here → `system/voices/` |
| an audience segment | `avatars/<segment>.md` |
| a competitor | `competitors/<name>.md` |
| the market: the picture now; what to keep an eye on; a dated study | `market/market.md`; `market/watchlist.md`; `market/<what>-<YYMMDD>.md`. A business that studies one market per product keeps them in `markets/<market>/` instead — the layout → `markets/CONTEXT.md` |
| a product: what the customer gets, the mechanism, unit cost. Not the price and not the terms of sale: they live in the offer | `products/<product>/product.md` — the layout → `products/CONTEXT.md` |
| where to send a person: an offer or a lead magnet | `offers/<short-name>.md` — the rules → `offers/CONTEXT.md` |
| channels; short links | `channels/channels.md`; `channels/links.md` |
| rows that a collector skill or an integration gathers (statistics, payments) | `data/` — nothing by hand |
| content: a sales page, a promo article, an email, a post, an article | `content/<type>/<name>.md` — one folder per type: `sales-pages/`, `promo-articles/`, `emails/`, `posts/`, `articles/`. The channel goes in the frontmatter as `channel:`, never into a folder name |
| how a sale goes, what a good lead looks like, the sales method, payment terms | `sales/sales.md` |
| what customers keep asking, and the answers | `sales/faq.md` |
| the customer base today: how many, which segment brings what money, where the list lives | `customers/customers.md` |
| proof for a buyer: years on the market, customers served, results in numbers, cases and testimonials | `proof/proof.md` |
| margin by product, cost of acquisition by channel, spending, budgets and limits | `finance/economics.md`; a period report → `finance/report-<YYYY-MM>.md` |
| team, contractors, partners: who answers for what | `operations/team.md`; the person as a person → a note in `people/` |
| criteria for decisions; longer rules that only some jobs need | `operations/rules.md` |
| the legal entity: its form, tax regime, details for contracts and invoices | `operations/legal.md` |
| how a recurring job is done | `operations/processes/<name>.md` |

## Folders

- A folder is created together with its first file, never empty in advance. `offers/` comes with its map from the start.
- These folders have a system map of their own: offers, products, markets, channels, data, brand. Such a map routes by kind and never lists the folder's content: the list and this business's own rules for the folder live in a file of the folder itself (`products.md`, `markets.md`, `data.md` …). The map comes together with the folder's first file: copy `system/skills/setup/templates/<folder>-map.md` to `<folder>/CONTEXT.md` when that file exists.
- A folder that neither this table nor `core/business.md` › Own to this business names: ask the person what it holds. Then record it in Own to this business. Never move it on your own.
- How a record is written (date and source on a number, `unknown`, one home per fact) → `system/architecture.md` › Records.
