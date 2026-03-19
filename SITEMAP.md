# SITEMAP.md — Holy Chip Website
**Domain:** holy-chip.com
**Last Updated:** March 19, 2026

---

## Pages

| Page | URL | Description |
|---|---|---|
| **Homepage** | `/` | Floating chip character animations, typewriter tagline ("AI made by a Human"), random story finder with terminal scanner animation. Story queue managed via localStorage (no repeats until all shown). |
| **Store** | `/store.html` | Main e-commerce interface. Select one of 12 Chip characters → browse mugs & t-shirts → add to cart. Fixed cart button with item counter. Mug: $18.90 / T-Shirts: $25.00. |
| **Stories** | `/stories.html` | Grid of all HC### comic stories (auto-discovers HC001–HC200). Click any card → fullscreen reader with prev/next navigation, keyboard arrows, and swipe support. |
| **Builder** | `/builder.html` | Story submission system. Track A: open submission (name, title, 3 dialog panels, email). Track B: NFT holder submission (wallet-gated, 20% royalty on first sale). |
| **Checkout** | `/checkout.html` | Stripe checkout — collects shipping address, calculates live shipping via Printify API, processes payment. |
| **Success** | `/success.html` | Post-purchase confirmation. Shows order ID, clears localStorage cart, links back to store. |
| **NFTs** | `/nfts.html` | Placeholder — coming soon. Planned Magic Eden integration for Holy Chip NFT gallery. |
| **History** | `/history/` | Editorial/about page with banner image, character portrait, narrative text, and image gallery with lightbox. |

---

## Backend — Netlify Functions

| Function | Trigger | What it does |
|---|---|---|
| **checkout.js** | POST from checkout.html | Fetches Printify variant IDs, calculates shipping cost, creates Stripe checkout session |
| **stripe-webhook.js** | Stripe `payment_intent.succeeded` event | Receives cart metadata from Stripe, builds Printify order, submits for fulfillment |
| **submit-story.js** | POST from builder.html | Validates submission, saves to Supabase, sends confirmation emails via SendGrid |

---

## Key Integrations

| Service | Role |
|---|---|
| **Stripe** | Payment processing (2.9% + $0.30/transaction) |
| **Printify** | Print-on-demand fulfillment — Duplium (mugs) + SwiftPOD (t-shirts) |
| **Supabase** | Story submissions database |
| **SendGrid** | Transactional emails (story submission confirmations) |
| **GitHub Pages** | Static site hosting |
| **Netlify** | Serverless functions ($19/month) |

---

## Shared Assets

- `/assets/style.css` — Global styles (Press Start 2P font for headings/nav)
- `/assets/nav.js` — Navigation bar injected on all pages
- `/assets/brand.png` — Holy Chip logo
- `/assets/cart-icon.png` — Cart button icon
- `/characters/*.png` — 12 Chip character images
- `/stories/HC###.png` — Comic story images
- `/stories/HC###.pre.png` — Pre-story panel images

---

## Product Catalog

| Type | Provider | Blueprint | Price | CA Shipping |
|---|---|---|---|---|
| Mug 11oz | Duplium (ORCA Coating®) | 1301 | $18.90 | $7.99 |
| Fitted T-Shirt | SwiftPOD | — | $25.00 | ~$9.39 |
| Cotton Ringer T-Shirt | SwiftPOD | — | $25.00 | ~$9.39 |

12 characters available: Chip_0, Chip_1, Chip_100, Chip_101, Chip_110, Chip_111, Chip_1000, Chip_1001, Chip_1010, Chip_1011, Chip_1100, Chip_1101, Chip_10000, Chip_10001, Chip_10010, Chip_10011, Chip_10100, Chip_10101, Chip_10111, Chip_1111
