# Products

What the buyer gets — one folder per product. A product is what is delivered. An offer (`../offers/`) is where a person is sent and on what terms: a price, a guarantee, bonuses or a deadline never live here.

The list of this business's products, their status and its own rules for products → `products.md` in this folder. Read it first.

## How a product is laid out

- **One folder per thing that can be given on its own** — a module of a programme or a bonus too — straight in `products/`. What cannot be given on its own is a line in its product's file.
- Inside: `product.md` — everything about the product, every fact with its source, gaps marked `unknown`; the folder `source` — copies and transcripts of the materials, an interview, a merge table; later `sales-copy.md` — the sales text another skill writes from `product.md`.
- Heavy files (videos, audio) stay outside this folder; `product.md` names where they are.
- A skill that unpacks a product (takes it out of its box: what the buyer does not see until they buy) makes and updates `product.md`. Packaging it for the buyer (a sales text, an offer) is other skills' work.

## Naming

- Folder: lowercase, hyphens, Latin letters (transliterated from the product's name), no number in front, no product code. A code, if one is needed, goes into the frontmatter of `product.md` as `id:`.
- A part of a bigger product carries the bigger one's name in front, with two hyphens between: `program--module-one`.

## Rules

- A new product → a new folder and a row in `products.md`, in the same step.
- A file in the old layout (one file per product, from before this map) is a source for unpacking, not a product file. `products.md` lists such files and says where each goes once its product is unpacked.
