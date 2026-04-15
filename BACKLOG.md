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

## 📦 GitHub / Repo Organization

- [ ] **Create separate repo for Claude commands/skills/tools** (Apr 14, 2026)
  - Commands: `analyzeStory.md` (story analysis + blog generation)
  - Tools: `tweet_image.py`, Twitter posting scripts
  - Config: `story-posts.json` (post tracking), `.env` (gitignored)
  - Decide repo name and structure
  - Stories analysis files (`stories/analysis/`) stay in `holy-chip-site` repo — they will become blog/post pages on the website

- [ ] **Build blog/post page from analysis files** (Apr 14, 2026)
  - Transform `stories/analysis/HC###.blog.md` files into browsable blog posts on the website
  - Add a blog/posts section or integrate with stories page

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
- [x] Social media share buttons (Follow on X added to nav + Post on X added to stories — Apr 2026)

---

## 🔧 Claude Code Hooks — Automation & Safety

> Source: [@zodchiii thread](https://x.com/zodchiii/status/2040000216456143002) on Claude Code hooks.
> Hooks are automatic actions that fire every time Claude edits a file, runs a command, or finishes a task. Unlike CLAUDE.md instructions (followed ~80% of the time), hooks are deterministic — they run every time, no exceptions.
> Config lives in `.claude/settings.json` (committed to git = team-wide).

### Hook 1 — Auto-format every file Claude touches
- **What:** Runs Prettier (or any formatter) automatically after every Write|Edit
- **Pros:** Eliminates "forgot to format" commits. Zero effort after setup. Works with any formatter (Prettier, Black, gofmt, rustfmt). First hook everyone should set up.
- **Cons:** Adds a small delay after every edit (~200ms). Could conflict if the project has no formatter configured. May reformat files in unexpected ways if Prettier config is missing or loose.
- **Best for:** HolyChip website (JS/CSS/HTML across many pages), SGen (active Node/React dev)
- **Priority:** HIGH
- [ ] Set up for holy-chip-site
- [ ] Set up for SGen

### Hook 2 — Block dangerous commands
- **What:** Pre-hook on Bash that regex-matches `rm -rf`, `git reset --hard`, `DROP TABLE`, `curl|sh`, etc. Blocks with exit code 2 and tells Claude to propose a safer alternative.
- **Pros:** Hard safety net for production-critical mistakes. Catches the "probably won't happen but if it does you're screwed" scenarios. Claude auto-proposes safer alternatives when blocked.
- **Cons:** Regex-based — can false-positive on legitimate commands (e.g., a harmless `rm -rf` on a temp dir). Need to maintain the pattern list as new risky commands emerge. Doesn't catch indirect destruction (e.g., a script that internally runs dangerous commands).
- **Best for:** All projects — especially 4D (email automation, Outlook.sqlite), NFT (on-chain operations with real SOL)
- **Priority:** HIGH
- [ ] Set up globally (~/.claude/settings.json)

### Hook 3 — Protect sensitive files from edits
- **What:** Pre-hook on Edit|Write that blocks changes to `.env*`, `*.pem`, `*.key`, `package-lock.json`, `secrets/*`, etc.
- **Pros:** Prevents accidental edits to config, lock files, secrets, and credentials. Claude sees the block reason and explains why it wanted to edit. Customizable per project.
- **Cons:** Can be annoying when you legitimately need Claude to edit a protected file — have to temporarily disable or adjust the list. Lock file protection means Claude can't fix dependency issues directly.
- **Best for:** HolyChip website (protect `product-data.json`, `netlify.toml`), 4D (protect `olm-config.json`, client JSONs), NFT (protect wallet keypairs)
- **Priority:** HIGH
- [ ] Set up for holy-chip-site (protect product-data.json, netlify.toml, .env files)
- [ ] Set up for 4D projects

### Hook 4 — Run tests after every edit
- **What:** Post-hook on Write|Edit that runs `npm run test` (tail -5 for short output). Claude sees failures immediately and self-corrects.
- **Pros:** Creates a feedback loop that improves Claude's output quality 2-3x (per Boris Cherny, Claude Code creator). Catches regressions instantly. Claude fixes its own mistakes before you ever see them.
- **Cons:** Runs the full test suite after EVERY edit — can be very slow on large projects. Noisy if tests are flaky. Burns CPU/time on trivial edits (CSS changes, comments). Not useful for projects without tests.
- **Best for:** SGen (active development, has test suite), Generator (marked stable — any edit should validate nothing broke)
- **Priority:** MEDIUM — only valuable for projects with actual test suites
- [ ] Set up for SGen
- [ ] Set up for Generator (if tests exist)

### Hook 5 — Require passing tests before creating a PR
- **What:** Pre-hook on PR creation that blocks unless all tests pass. Hard gate — no green tests, no PR.
- **Pros:** Prevents embarrassing red CI on PRs. Reviewer never sees broken code. Claude fixes failures before submitting.
- **Cons:** Can block you when tests fail for reasons unrelated to your changes (flaky tests, external dependencies). Only works if using GitHub MCP tool for PR creation — doesn't apply if Claude uses `gh` CLI directly.
- **Best for:** Any project with CI/CD and team reviewers
- **Priority:** LOW for now — Ricardo works solo on most projects, PRs are self-reviewed
- [ ] Consider when team collaboration increases

### Hook 6 — Auto-lint and report errors
- **What:** Post-hook that runs ESLint --fix after every edit. Can chain with Hook #1 (Prettier first, then ESLint).
- **Pros:** Code is lint-clean before you ever look at it. ESLint --fix auto-corrects many issues. Remaining errors fed back to Claude for manual fix.
- **Cons:** Same performance concern as Hook #4 — runs after every edit. ESLint can be slow on large files. --fix can make unwanted changes if rules are aggressive. Redundant if you already have strict Prettier + editor linting.
- **Best for:** SGen (active JS/React development), holy-chip-site (if ESLint is configured)
- **Priority:** MEDIUM
- [ ] Set up for SGen (chain with Hook #1)

### Hook 7 — Log every command Claude runs
- **What:** Pre-hook on Bash that appends every command + timestamp to `.claude/command-log.txt`. Add to .gitignore.
- **Pros:** Full audit trail of everything Claude did. Invaluable for debugging "what broke and when." Lightweight — just a printf, near-zero overhead.
- **Cons:** Log file grows indefinitely — need periodic cleanup. Only logs commands, not their output. Doesn't capture Edit/Write operations (only Bash).
- **Best for:** All projects — especially useful for debugging across sessions
- **Priority:** MEDIUM
- [ ] Set up globally (~/.claude/settings.json)

### Hook 8 — Auto-commit after each completed task
- **What:** Stop hook that runs `git add -A && git commit` when Claude finishes a response. Every task gets its own atomic commit.
- **Pros:** Never forget to commit. Clean git history with one commit per task. Pairs well with `claude -w` worktrees for isolated feature branches.
- **Cons:** `git add -A` is dangerous — can accidentally commit .env, secrets, large binaries, or work-in-progress files. Commit messages are generic ("chore(ai): apply Claude edit") — lose context. Can create noise commits for trivial responses. Ricardo prefers reviewing before committing.
- **Best for:** Experimental/throwaway branches where speed > cleanliness
- **Priority:** LOW — conflicts with Ricardo's preference for deliberate commits with meaningful messages. Consider only for worktree experiments.
- [ ] Consider for isolated worktree workflows only

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

**Last Updated**: April 4, 2026
