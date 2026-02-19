# Holy Chip - Custom Checkout Deployment Guide

## Overview
Your store now has:
- ✅ Custom browsing experience (character selection → products)
- ✅ Shopping cart with quantities
- ✅ Custom checkout page (shipping collection)
- ✅ Stripe payment processing
- ✅ Manual Printify order creation via fulfill-orders.js script
- ✅ Draft order creation (manual approval required)

## Prerequisites

1. **Stripe Account** - https://stripe.com
   - Get API keys (test + live)
   - Set up webhook endpoint (optional for draft orders)

2. **Netlify Account** - https://netlify.com
   - Sign up (free tier is plenty)
   - Install Netlify CLI

3. **Printify Account** - Already set up ✓
   - API token: Already have it
   - Shop ID: 26508747 (storefront)

---

## Step 1: Get Stripe API Keys

1. Go to https://dashboard.stripe.com/
2. Click **Developers** → **API keys**
3. Copy:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...)
4. Save these for later

---

## Step 2: Install Dependencies

```bash
cd /Users/wakanda2/Desktop/4D\ Documents/Claude/HolyChip/website/holy-chip-site
npm install
```

---

## Step 3: Deploy Frontend to GitHub Pages

The frontend is hosted on GitHub Pages at https://mell0dia.github.io/holy-chip-site/

```bash
# Commit and push your changes
git add .
git commit -m "Update store"
git push origin main
```

GitHub Pages will automatically deploy from the main branch.

---

## Step 4: Install Netlify CLI

```bash
npm install -g netlify-cli
```

---

## Step 5: Deploy Backend to Netlify

```bash
# Login to Netlify
netlify login

# Deploy (follow prompts)
netlify deploy

# When prompted:
# - Create & configure a new site? Yes
# - Team? Your account
# - Site name? holychip
# - Publish directory? ./netlify/functions
```

Netlify will give you a URL like: `https://holychip.netlify.app`

---

## Step 6: Set Environment Variables in Netlify

Go to Netlify dashboard → Site → Settings → Environment Variables

Add these variables:

### Stripe Keys:
```
STRIPE_SECRET_KEY = sk_test_... (your secret key)
STRIPE_PUBLISHABLE_KEY = pk_test_... (your publishable key)
```

### Printify Config:
```
PRINTIFY_API_TOKEN = (copy from printify-config.js)
PRINTIFY_SHOP_ID = 26508747
```

### Product Mappings:
```bash
# Get these from your local files:
cat mug-mapping.json
cat product-mapping.json

# Then set in Netlify:
MUG_MAPPING = (paste mug-mapping.json content as one line)
PRODUCT_MAPPING = (paste product-mapping.json content as one line)
```

---

## Step 7: Redeploy with Environment Variables

```bash
netlify deploy --prod
```

This deploys to production with all environment variables set.

---

## Step 8: Test the Flow

1. Go to https://mell0dia.github.io/holy-chip-site/store.html
2. Browse products → Select character → Add to cart
3. Click checkout
4. Fill shipping form
5. Click "Proceed to Payment"
6. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
7. Complete payment
8. Should see success page
9. Order is created in DRAFT status - manually approve in Stripe dashboard
10. Run fulfill-orders.js script to create orders in Printify

---

## Going Live (Real Payments)

### 1. Switch to Stripe Live Keys
In Netlify environment variables, replace:
- `sk_test_...` → `sk_live_...`
- `pk_test_...` → `pk_live_...`

### 2. Redeploy
```bash
netlify deploy --prod
```

### 3. Test with Real Card
Use real payment method to verify everything works

### 4. Manually Fulfill Orders
Run the fulfill-orders.js script regularly to process orders:
```bash
node fulfill-orders.js
```

---

## Custom Domain (Optional)

### 1. Buy Domain
Buy `holychip.com` (or similar) from any registrar

### 2. Add to Netlify
- Netlify Dashboard → Site → Domain Settings → Add custom domain
- Follow DNS setup instructions

### 3. Update GitHub Pages (if needed)
- Add CNAME file for custom domain on frontend

---

## Monitoring

### Check Orders
- **Printify Dashboard**: See manufacturing status
- **Stripe Dashboard**: See payments (draft status)
- **Netlify Logs**: See API requests
- **processed-orders.json**: Track fulfilled orders

### Manual Fulfillment Process
1. Check Stripe Dashboard for new orders
2. Manually approve orders in Stripe
3. Run `node fulfill-orders.js` to create Printify orders
4. Check `processed-orders.json` for fulfillment history

---

## Troubleshooting

### Payment works but no draft order created
- Check Netlify function logs
- Verify environment variables are set
- Check Stripe dashboard for payment intent

### Checkout page doesn't load
- Check `store.html` is deployed on GitHub Pages
- Check API endpoint `/api/create-checkout` works on Netlify

### Product not found error
- Check MUG_MAPPING and PRODUCT_MAPPING env vars
- Verify product IDs match Printify products

### fulfill-orders.js script fails
- Verify Printify API token is valid
- Check cart metadata in Stripe session
- Ensure processed-orders.json exists and is writable

---

## File Structure

```
holy-chip-site/
├── netlify/functions/
│   ├── create-checkout.js      # Creates Stripe checkout session (draft)
│   └── stripe-webhook.js       # Optional: webhook handler
├── public/
│   ├── store.html             # Main store (on GitHub Pages)
│   ├── checkout.html          # Checkout page
│   ├── success.html           # Order confirmation
│   └── assets/                # Images, mockups
├── fulfill-orders.js          # Manual order fulfillment script
├── processed-orders.json      # Tracks fulfilled orders
├── netlify.toml              # Netlify configuration
├── package.json              # Dependencies
└── .env.example             # Environment variables template
```

---

## Next Steps After Deployment

1. **Test thoroughly** with test cards
2. **Set up regular fulfillment schedule** (run fulfill-orders.js daily)
3. **Customize design** (colors, branding)
4. **Add email confirmations** (SendGrid/Mailgun)
5. **Set up analytics** (Google Analytics)
6. **Go live** with real Stripe keys!

---

## Support

- **Netlify Docs**: https://docs.netlify.com
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Stripe Docs**: https://stripe.com/docs
- **Printify API**: https://developers.printify.com

---

## Cost Breakdown

- **GitHub Pages**: Free (public repository)
- **Netlify Functions**: Free (up to 125k requests/mo)
- **Stripe**: 2.9% + $0.30 per transaction
- **Printify**: Wholesale cost per product

**Example:** Customer buys $50 worth of products
- Stripe fee: $1.75
- Printify cost: ~$30 (wholesale)
- Your profit: ~$18.25
