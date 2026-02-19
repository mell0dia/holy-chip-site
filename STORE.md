# STORE.md - Holy Chip Store Strategy

_How we sell Holy Chip physical products._

---

## Store Overview

**Live Store**: https://mell0dia.github.io/holy-chip-site/store.html

The Holy Chip Store is a custom e-commerce platform focused on character-first browsing and print-on-demand merchandise.

---

## Product Catalog

### Current Products

**T-Shirts** - $25.00 each
- **Unisex Style**: Front: Brand + Chip
- **Fitted Style**: Front: Chip | Back: Brand
- **Cotton Ringer Style**: Classic retro with contrast trim
- **Colors**: WHITE only (brand requirement)
- **Sizes**: XS, S, M, L, XL, 2XL, 3XL
- **Print Provider**: SwiftPOD (Unisex/Fitted), Printify Choice (Ringer)

**Mugs** - $15.00 each
- **Style**: 11oz Accent Mug
- **Design**: Chip on front-left, Brand logo on front-right
- **Color**: Black (default)
- **Print Provider**: SwiftPOD

### Characters

12 unique Holy Chip characters:
- Chip_0, Chip_1
- Chip_100, Chip_101, Chip_110, Chip_111
- Chip_1000, Chip_1001, Chip_1010, Chip_1011, Chip_1100, Chip_1101

**Total Products**: 48
- 36 T-Shirts (12 characters × 3 styles)
- 12 Mugs (12 characters × 1 style)

---

## Store Features

### Customer Experience

**Character-First Browsing:**
- Grid of 12 character cards on homepage
- Click character → See all products for that character
- Visual focus on unique Holy Chip designs

**Product Selection:**
- Size selector for t-shirts (dropdown)
- Color automatically set to white (not selectable)
- Product mockups with lightbox (front/back for shirts, 6 angles for mugs)

**Shopping Cart:**
- Persistent cart via localStorage
- Add/remove items
- Quantity controls
- Real-time total calculation
- Cart button with count badge

**Checkout:**
- Shipping information collection
- Dynamic shipping cost calculation via Printify
- Stripe Checkout for payment
- Secure, PCI-compliant

---

## Business Rules

### Product Rules

**T-Shirts:**
- ✅ All t-shirts **MUST be white**
- ✅ Cotton Ringers use **White/Black** variant (white body, black trim)
- ✅ Size selection **required** before adding to cart
- ✅ Customer selects size, color is automatic

**Mugs:**
- ✅ Default to **Black/11oz**
- ✅ No size or color selection (default variant)

### Pricing Rules

**Product Pricing:**
- T-Shirts: $25.00 (all styles same price)
- Mugs: $15.00

**Shipping:**
- Calculated dynamically via Printify API
- Based on:
  - Destination address
  - Product types in cart
  - Print providers involved
- Typical costs:
  - Single shirt: ~$9.39
  - Single mug: ~$14.89
  - Mixed basket: $28-45 (varies)

**Stripe Fees:**
- 2.9% + $0.30 per transaction
- Customer pays full amount
- Fees deducted from revenue

---

## Order Fulfillment

### Customer Flow

1. **Browse** → Select character → Choose product & size
2. **Add to cart** → View cart → Checkout
3. **Enter shipping** → Proceed to Stripe payment
4. **Pay** → Receive confirmation → Wait for delivery

### Admin Flow (Manual)

1. **Notification** → Receive payment email from Stripe
2. **Check orders** → Run `node check-stripe-orders.js`
3. **Fulfill** → Run `node fulfill-orders.js`
   - Script creates Printify orders in DRAFT status
   - Orders include correct WHITE shirts with customer sizes
4. **Review** → Check orders in Printify dashboard
5. **Approve** → Manually click "Send to Production"
6. **Monitor** → Track fulfillment and shipping

**Why Manual?**
- Quality control before production
- Error prevention (verify sizes, addresses)
- Cost control (approve before charging)

---

## Technical Implementation

### Platform

**Frontend:**
- Static HTML/CSS/JavaScript
- Hosted on GitHub Pages
- Auto-deploys on push to `gh-pages` branch
- URL: https://mell0dia.github.io/holy-chip-site/

**Backend:**
- Netlify serverless functions
- Checkout function only (no webhooks)
- URL: https://holychip.netlify.app
- Cost: $19/month

**Payment:**
- Stripe Checkout (test mode currently)
- Hosted payment page
- PCI compliant

**Fulfillment:**
- Printify API
- Manual script-based order creation
- Draft orders with manual approval

### Data Flow

1. Customer selects products and enters shipping info
2. Checkout function:
   - Validates cart data
   - Maps sizes to WHITE Printify variants
   - Calculates shipping via Printify API
   - Creates Stripe session with cart metadata
3. Customer pays via Stripe
4. Admin runs `fulfill-orders.js`:
   - Reads cart data from Stripe metadata
   - Creates Printify order with correct variants
   - Saves to DRAFT status
5. Admin approves in Printify dashboard
6. Printify manufactures and ships

---

## Marketing Strategy

### Current

**Organic Discovery:**
- Character-focused branding
- Unique designs
- Quality products

**No Active Marketing:**
- No paid ads
- No email campaigns
- No social media promotion (yet)

### Future Considerations (See BACKLOG.md)

**Email:**
- Order confirmation emails
- Shipping notifications
- Newsletter signups

**Promotions:**
- Discount codes
- Bundle deals
- Limited editions

**Social:**
- Instagram product shots
- Share buttons on product pages
- User-generated content

---

## Product Expansion

### Potential New Products

**Apparel:**
- Hoodies
- Tank tops
- Long-sleeve shirts
- Hats/caps

**Drinkware:**
- 15oz mugs
- Water bottles
- Travel mugs
- Color options for mugs

**Accessories:**
- Stickers
- Posters
- Phone cases
- Tote bags

### New Characters

- Ready to add: Chip_10, Chip_11, Chip_1110, Chip_1111, etc.
- Process documented in ADD-NEW-PRODUCT.md
- Requires: Character PNG, Printify setup, mockups, Stripe prices

---

## Separate: NFTs

**Note:** NFTs are on a separate page (nfts.html) and are NOT sold through the main store.

See NFTS.md for NFT strategy (if that file exists).

The store focuses exclusively on physical merchandise.

---

## Performance & Metrics

### Current Status

**Live Since**: February 2026
**Products**: 48 (36 t-shirts + 12 mugs)
**Orders Processed**: Testing phase
**Platform Costs**: $19/month (Netlify)

### Success Metrics (Future)

- Orders per day
- Average order value
- Cart abandonment rate
- Customer acquisition cost
- Product popularity by character
- Return/refund rate

---

## Support & Documentation

**Customer Support:**
- Contact: (to be added)
- FAQ: (to be built)
- Returns: (Printify policy)

**Technical Documentation:**
- ARCHITECTURE.md - System architecture
- SCRIPTS.md - Order fulfillment scripts
- DEPLOYMENT.md - Deployment guide
- README.md - Project overview

---

**Last Updated**: February 18, 2026
