# BACKLOG.md - Holy Chip Future Tasks

_Things to build, improve, and explore._

---

## ✅ Recently Completed

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

## 🔥 High Priority

### Email Notifications
- [ ] Implement email confirmations for customers (SendGrid)
- [ ] Order confirmation email after payment
- [ ] Shipping notification email (from Printify)
- [ ] Admin notification when new order is placed

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

### ⏳ Waiting On User
- [ ] **2nd creator public key** (25% royalty split) — needed before next batch config

### 🔥 Next Up (As Soon As Keys + Images Ready)
- [ ] **Register on Magic Eden Creator Hub** — connect hot wallet (Brave/Phantom), apply as creator
- [ ] **List 1 test NFT on Magic Eden** — verify metadata, image, attributes display correctly
- [ ] **Top up hot wallet** — need ~0.8–1 SOL for 300 cNFT mint (~0.063 SOL currently)
- [ ] **Update Candy Machine config** — set 75/25 creator split (cold wallet 75% + 2nd key 25%)
- [ ] **Prepare 300 images + metadata** — batch metadata generation with attribute/rarity structure
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

---

## 🚫 Not Doing (Decided Against)

- ❌ **Automatic webhook fulfillment** - Manual approval preferred for quality control
- ❌ **Color selection for t-shirts** - Brand requires white shirts only
- ❌ **Printify store integration** - Custom checkout provides better UX

---

## 📝 Notes

**Current System Status:**
- ✅ Live store on GitHub Pages
- ✅ Netlify functions for checkout
- ✅ Manual fulfillment workflow
- ✅ 12 characters × 3 t-shirt styles + mugs
- ✅ Size selection for t-shirts
- ✅ Dynamic shipping calculation

**Platform:**
- Frontend: GitHub Pages
- Backend: Netlify Functions ($19/month)
- Payment: Stripe (2.9% + $0.30 per transaction)
- Fulfillment: Printify (pay per order)

---

**Last Updated**: March 6, 2026
