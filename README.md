# Holy Chip - E-Commerce Platform

A custom print-on-demand e-commerce platform featuring 12 unique Holy Chip characters on t-shirts and mugs.

**Live Site**: https://mell0dia.github.io/holy-chip-site/store.html

---

## Quick Start

### For Customers
Visit the store and browse by character:
- Choose your favorite Holy Chip character (Chip_0 through Chip_1101)
- Select product type (Unisex, Fitted, Cotton Ringer t-shirt, or Mug)
- Pick your size (for t-shirts)
- Checkout with Stripe
- Products manufactured and shipped by Printify

### For Admins - Daily Order Processing

**1. Check for new orders:**
```bash
node check-stripe-orders.js
```

**2. Fulfill paid orders:**
```bash
node fulfill-orders.js
```

**3. Approve in Printify:**
- Go to https://printify.com/app/orders
- Review each order
- Click "Send to Production"

---

## System Overview

### Architecture
- **Frontend**: Static HTML/CSS/JS on GitHub Pages
- **Backend**: Netlify serverless functions
- **Payment**: Stripe Checkout
- **Fulfillment**: Printify API (manual script-based)

### Key Features
- Character-first browsing (12 unique Holy Chip designs)
- Size selection for t-shirts
- Shopping cart with localStorage
- Dynamic shipping calculation
- Manual order approval workflow

### Business Rules
- **All t-shirts are WHITE** (not customer-selectable)
- **Cotton Ringers use White/Black** variant
- **Mugs default to Black/11oz**
- **Orders created in DRAFT** (manual approval required)

---

## Documentation

### Core Documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture
- **[SCRIPTS.md](./SCRIPTS.md)** - Script usage and workflow
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment instructions

### Reference Documentation
- **[AUTOMATION-GUIDE.md](./AUTOMATION-GUIDE.md)** - Product creation automation
- **[ADD-NEW-PRODUCT.md](./ADD-NEW-PRODUCT.md)** - Adding new products
- **[CHECKOUT-FLOW.md](./CHECKOUT-FLOW.md)** - Checkout implementation
- **[SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)** - Initial setup guide

---

## Order Fulfillment Workflow

### Customer Flow
1. Browse store → Select character → Choose product & size
2. Add to cart → Checkout → Enter shipping info
3. Pay with Stripe → Receive confirmation
4. Wait for delivery (Printify fulfills)

### Admin Flow (Manual)
1. Receive payment notification email from Stripe
2. Run `node fulfill-orders.js` to create Printify orders
3. Review orders in Printify dashboard
4. Manually approve and send to production
5. Printify manufactures and ships

**Why Manual?** User chose manual approval for quality control and error prevention.

---

## Product Management

### Current Products
- **12 Characters**: Chip_0, Chip_1, Chip_100, Chip_101, Chip_110, Chip_111, Chip_1000, Chip_1001, Chip_1010, Chip_1011, Chip_1100, Chip_1101
- **3 T-Shirt Styles**: Unisex, Fitted, Cotton Ringer (all white)
- **1 Mug Style**: 11oz Black accent mug

### Add New Character

**1. Add character image:**
```bash
# Place new PNG in characters/ folder
characters/Chip_10.png
```

**2. Create products in Printify:**
```bash
# Create mug
node create-single-mug.js Chip_10

# Create t-shirts (modify scripts as needed)
```

**3. Wait for Printify to generate mockups (1-2 hours)**

**4. Download mockup images:**
```bash
node fetch-all-mug-angles.js
```

**5. Update product-data.json** with new product IDs and Stripe prices

**6. Create Stripe prices** for the new products

See **[ADD-NEW-PRODUCT.md](./ADD-NEW-PRODUCT.md)** for detailed instructions.

---

## Development

### Prerequisites
- Node.js 14+
- Stripe account (test mode)
- Printify account
- Netlify account (for serverless functions)
- GitHub account (for hosting)

### Environment Variables

**Netlify (for checkout function):**
```bash
STRIPE_SECRET_KEY=sk_test_...
PRINTIFY_API_TOKEN=eyJ0eXAi...
PRINTIFY_SHOP_ID=26508747
```

**Local (for fulfillment script):**
```bash
# Scripts fallback to hardcoded test keys
# but can use env vars in production
```

### Local Development

**Install dependencies:**
```bash
npm install
```

**Test checkout function locally:**
```bash
netlify dev
```

**Run fulfillment script:**
```bash
node fulfill-orders.js
```

---

## Deployment

### Frontend (GitHub Pages)
```bash
git add .
git commit -m "Update site"
git push origin gh-pages
```

**Auto-deploys** to: https://mell0dia.github.io/holy-chip-site/

### Backend (Netlify Functions)

**Connected to GitHub** - Auto-deploys on push to `gh-pages` branch

**Deployed at**: https://holychip.netlify.app

---

## File Structure

```
holy-chip-site/
├── store.html                    # Main store page
├── checkout.html                 # Checkout page
├── success.html                  # Order confirmation
├── netlify/functions/
│   ├── checkout.js              # Stripe checkout session creator
│   └── stripe-webhook.js        # (NOT USED) Webhook handler
├── assets/mockups/              # Product images
├── product-data.json            # Product catalog
├── processed-orders.json        # Fulfilled order tracking
├── fulfill-orders.js            # Main fulfillment script
├── check-stripe-orders.js       # View pending orders
└── [documentation].md           # Various docs
```

---

## Troubleshooting

### Checkout not working
- Check Netlify function logs
- Verify environment variables set in Netlify
- Confirm Netlify paid plan is active ($19/month required)

### Order not created in Printify
- Run `node check-stripe-orders.js` to verify payment succeeded
- Check for `cartData` in session metadata
- Ensure `fulfill-orders.js` completed without errors

### Wrong size/color created
- Verify cart includes `size` field
- Check variant matching logic in `fulfill-orders.js`
- Confirm all shirts are WHITE in Printify products

### Duplicate orders
- Check `processed-orders.json` for session ID
- Script prevents duplicates automatically
- If needed, remove entry from JSON to reprocess

---

## Support

- **Issues**: https://github.com/mell0dia/holy-chip-site/issues
- **Documentation**: See individual .md files in this repo
- **Order Status**: https://printify.com/app/orders

---

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Hosting**: GitHub Pages (frontend), Netlify (functions)
- **Payment**: Stripe Checkout
- **Fulfillment**: Printify API
- **Storage**: localStorage (cart), Stripe metadata (order data)

---

## License

Proprietary - Holy Chip brand and designs

---

**Last Updated**: February 18, 2026
