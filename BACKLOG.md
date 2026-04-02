# BACKLOG.md - Holy Chip Future Tasks

_Things to build, improve, and explore._

---

## ✅ Recently Completed

- ✅ **Homepage Story Finder** (Mar 9, 2026)
  - Hero image pushed to top (no longer vertically centered)
  - Typewriter: "AI made by a human" then "we are 2 chips talking about our lives and our feelings" (bold, black, stays on screen)
  - Scanner animation after 2s delay: green terminal, progress bar, "STORY LOCATED"
  - Random story card appears (exact same style as stories.html: faded bg + pre.png overlay)
  - Click card → inline lightbox reader (full story image)
  - Close → scanner runs again, shows different story
  - localStorage queue: never repeats a story until all have been shown, then resets
  - Scanner hides once card is shown; reappears only during next search

- ✅ **History Page Fixed** (Mar 9, 2026)
  - history/index.html now shows only holychip14-3.png + holychip15-PT.png
  - stories.html reverted to correct auto-discovery (HC001–HC200)

- ✅ **Stories Page** (Mar 6, 2026)
  - Auto-discovers HC###.png + HC###.pre.png files from `stories/` folder (probes HC001–HC200)
  - Grid auto-builds on load — cards show faded main story behind, pre-story image centered on top
  - Cards are large (minmax 360px) for easy readability
  - Click any card → fullscreen reader showing only the main .png, fitted to viewport (no scroll)
  - Click anywhere or press Escape → back to grid
  - HC### label on each card

- ✅ **Homepage Redesign** (Mar 6, 2026)
  - Floating chip characters (all 20, 6 instances each, size 35–73px, grayscale)
  - Card with hero.jpg + typewriter tagline ("AI made by a Human")
  - No buttons on homepage — nav handles navigation

- ✅ **Removed Style 3 (Unisex) T-Shirt** (Mar 6, 2026)
  - Deleted all 12 Style 3 products from Printify
  - Removed from store.html product list
  - Removed all 12 Style 3 entries from product-data.json
  - Store now has 2 t-shirt styles: Fitted (Style 5) + Cotton Ringer

- ✅ **Fixed Variant Selection** (Feb 18, 2026)
  - All t-shirts now correctly use WHITE variants
  - Cotton Ringers use White/Black variant
  - Size selection properly mapped to Printify variants

- ✅ **Added Cotton Ringer T-Shirts** (Feb 18, 2026)
  - 3rd t-shirt style now available
  - 12 Cotton Ringer products created
  - Mockups downloaded and integrated

- ✅ **Manual Fulfillment Workflow** (Feb 18, 2026)
  - Created `fulfill-orders.js` script
  - Cart data stored in Stripe metadata
  - Draft order creation with manual approval

- ✅ **Documentation Overhaul** (Feb 18, 2026)
  - Created SCRIPTS.md
  - Updated ARCHITECTURE.md
  - Updated README.md
  - Synced all .md files to current system

---

## 🧪 Needs Testing

- [ ] **SGen — Test JSON import/load flow** (Mar 18, 2026)
  - Save a new story via the correct flow: fill form → generate → Save Story → Export JSON
  - Re-import that JSON file via "Import JSON" in the library
  - Click Load Story → verify all fields restore correctly (ID, title, year, dialogs, image, faces)

---

## 🔥 High Priority

### 🎯 Story Submission System — `/submit` (NFT-Gated)
> Full spec: `memory/holychip-submission.md`
> **Status: PLANNED — ready to build on Ricardo's go-ahead**

**What it is:** NFT holders submit comic scripts. Ricardo reviews, generates image, mints as NFT. Submitter gets 20% of first sale.

**Locked decisions:**
- Character 1 = submitter's own Holy Chip NFT from their wallet
- Character 2 = any Holy Chip NFT still unsold (in creator/treasury wallet — live list via Helius)
- Simplified form (no AI generation — dialogue fields only)
- Royalty: 20% first sale only, paid manually. Resales 100% to Ricardo
- Unlimited submissions per wallet
- Email from @holy-chip.com (SendGrid)

**Phase 1 — Core (build first):**
- [ ] Supabase project + `submissions` table (schema in spec)
- [ ] `verify-wallet.js` — Phantom/Backpack connect + Helius cNFT ownership check → JWT
- [ ] `get-wallet-nfts.js` — fetch submitter's Holy Chip NFTs via Helius
- [ ] `get-available-nfts.js` — fetch unsold Holy Chip NFTs (owned by creator wallet) via Helius
- [ ] `submit-story.js` — JWT auth → Supabase write → SendGrid emails
- [ ] `/submit.html` — wallet connect + 5-section form + submit button
- [ ] SendGrid: configure @holy-chip.com sender + 4 email templates

**Phase 2 — Status Notifications:**
- [ ] Supabase webhook → Netlify `update-submission.js` → email submitter on approval/rejection

**Phase 3 — Member Dashboard:**
- [ ] `/members.html` — wallet login → see all submissions + status

**Phase 4 — Admin UI:**
- [ ] `/admin.html` — password-protected submission review (if raw Supabase becomes clunky)

**Env vars needed in Netlify:**
`HELIUS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `SENDGRID_API_KEY`, `ADMIN_SECRET`, `CREATOR_WALLET`

---

### ✅ Email Notifications (Store) — DONE (Apr 1, 2026)
- [x] Buyer confirmation email after payment (via Resend, orders@holy-chip.com)
- [x] Printify shipping notification enabled (buyer gets tracking when order ships)
- [x] Admin notification on every checkout (success + failure alerts)
- [x] Alert emails on missing config, Printify failures, webhook crashes
- [x] Retry logic on Printify order creation failure
- [x] Stripe live webhook configured → holychip.netlify.app/.netlify/functions/stripe-webhook

### ✅ Stripe-Printify Pipeline Fix (Apr 1, 2026)
- [x] Live Stripe webhook was missing — created and connected
- [x] Missing Netlify env vars added: STRIPE_WEBHOOK_SECRET, PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID, RESEND_API_KEY
- [x] Manually created Printify order for pi_3TFIUuJZLzX0hJCS0SpdYMME ($63.78, 2x Ringer L)

### Order Tracking
- [ ] Build order tracking page
- [ ] Customer can view order status
- [ ] Integration with Printify tracking API
- [ ] Display shipping carrier and tracking number

### Admin Dashboard
- [ ] Simple admin panel for order management
- [ ] View all orders in one place
- [ ] One-click fulfillment from dashboard
- [ ] Order analytics and sales reports

---

## 💡 Medium Priority

### Product Expansion
- [ ] Add color options for mugs (currently only Black)
- [ ] Add 15oz mug size option
- [ ] Consider additional t-shirt styles if demand warrants
- [ ] Add new characters (Chip_10, Chip_11, etc.)

### UX Improvements
- [ ] Add product reviews/ratings
- [ ] Wishlist functionality
- [ ] Recently viewed products
- [ ] Recommended products based on selection

### Marketing Features
- [ ] Discount codes / coupon system
- [ ] Abandoned cart recovery emails
- [ ] Newsletter signup
- [ ] Social media share buttons

---

## 🔮 Future Ideas

### Customer Accounts
- [ ] User registration and login
- [ ] Order history page
- [ ] Save shipping addresses
- [ ] Reorder previous purchases

### Advanced Features
- [ ] Bundle deals (buy 3 get 10% off)
- [ ] Pre-orders for new characters
- [ ] Limited edition products
- [ ] Gift cards

### Analytics
- [ ] Google Analytics integration
- [ ] Sales dashboard
- [ ] Popular products report
- [ ] Conversion funnel analysis

### Internationalization
- [ ] Multi-currency support
- [ ] International shipping optimization
- [ ] Localized product descriptions

---

## 🪙 NFT Project

> All NFT tasks are tracked here. See `HolyChip/nft/NFT-PLAN.md` for full roadmap and on-chain details.

### ✅ COMPLETED — Image Consolidation (2026-03-24)

**251 images copied** from Google Drive to `HolyChip/nft/Characters/` with 8-bit binary filenames.
- Binary range: `00000001.png` to `11111011.png`
- Images are **randomly shuffled** — consecutive IDs come from different characters
- `manifest.json` maps each binary name → character + original filename + parsed attributes
- Script: `HolyChip/nft/copy-images.js` (Fisher-Yates shuffle)
- 24 character folders found, 22 with images (APOCALYPTIC and _TRUMP-MULTIVERSO have 0)
- [ ] **Delete originals from Google Drive** (pending Ricardo's confirmation)

**Image Counts by Character:**
| Character | Count | | Character | Count |
|-----------|-------|-|-----------|-------|
| ASTRONAUTA | 15 | | JASON-MAD | 12 |
| BABY | 8 | | MACACO-SPACE | 19 |
| BOT1 | 13 | | MACHINE | 14 |
| BOT2 | 11 | | MADMAX | 10 |
| BUDA-MONGE-V1 | 8 | | MEDICO-V1 | 7 |
| CICLOPE | 21 | | PIRATA | 7 |
| CONTADOR | 14 | | POLICE-V1 | 18 |
| ESPIROCADO | 9 | | ROBOT | 10 |
| EYES-OF-LOVE | 8 | | TRUMP | 10 |
| IRMAO-DO-PIRATA | 10 | | VISION | 7 |
| JASON | 13 | | ZURETA | 7 |

### ⏳ Waiting On User
- [ ] **2nd creator public key** (25% royalty split) — needed before next batch config

### 🔥 Next Up (As Soon As Keys + Images Ready)
- [ ] **Register on Magic Eden Creator Hub** — connect hot wallet (Brave/Phantom), apply as creator
- [ ] **List 1 test NFT on Magic Eden** — verify metadata, image, attributes display correctly
- [ ] **Top up hot wallet** — need ~0.8–1 SOL for 300 cNFT mint (~0.063 SOL currently)
- [ ] **Update Candy Machine config** — set 75/25 creator split (cold wallet 75% + 2nd key 25%)
- [ ] **Prepare 300 images + metadata** — batch metadata generation with attribute/rarity structure (use manifest.json from image consolidation)
- [ ] **Mint 300 cNFTs on Mainnet** — new Candy Machine with updated creator split

### 💡 Medium Priority
- [ ] **nfts.html website integration** — Magic Eden API v2, gallery grid, buy links, floor price stats
- [ ] **Automation pipeline** — drop folder of PNGs → auto-generate metadata → upload → mint → list

### 📋 NFT Decisions Made
- ✅ Two-wallet security: hot wallet (fees) + cold wallet (receives sales/royalties)
- ✅ Storage: Irys/Arweave (permanent, no subscription)
- ✅ Format: Compressed NFTs (cNFTs) for 300+ scale
- ✅ First 5 NFTs minted (Chip_0 → Chip_110) — kept as-is, no creator split change
- ✅ New batches will use 75/25 creator split
- ✅ Binary filenames (8-bit) + manifest.json for traceability (decided 2026-03-23)

---

## 🚫 Not Doing (Decided Against)

- ❌ **Auto-submit Printify orders to production** - Orders created as DRAFT, manual approval preferred for quality control
- ❌ **Color selection for t-shirts** - Brand requires white shirts only
- ❌ **Printify store integration** - Custom checkout provides better UX

---

## 📝 Notes

**Current System Status:**
- ✅ Live store on GitHub Pages
- ✅ Netlify functions for checkout
- ✅ Stripe → Webhook → Printify order pipeline (live, with email alerts)
- ✅ Buyer confirmation email + Printify shipping notifications
- ✅ 12 characters × 2 t-shirt styles + mugs
- ✅ Size selection for t-shirts
- ✅ Dynamic shipping calculation

**Netlify Env Vars:**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PRINTIFY_API_TOKEN`, `PRINTIFY_SHOP_ID`, `RESEND_API_KEY`, `CREATOR_HOT_WALLET`

**Platform:**
- Frontend: GitHub Pages
- Backend: Netlify Functions
- Payment: Stripe (2.9% + $0.30 per transaction)
- Fulfillment: Printify (pay per order)
- Email: Resend (orders@holy-chip.com, stories@holy-chip.com)

---

**Last Updated**: April 1, 2026
