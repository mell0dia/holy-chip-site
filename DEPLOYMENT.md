# Holy Chip - Custom Checkout Deployment Guide

## Overview
Your store now has:
- ✅ Custom browsing experience (character selection → products)
- ✅ Shopping cart with quantities
- ✅ Custom checkout page (shipping collection)
- ✅ Stripe payment processing
- ✅ Automatic Printify order creation
- ✅ Complete fulfillment automation

## Prerequisites

1. **Stripe Account** - https://stripe.com
   - Get API keys (test + live)
   - Set up webhook endpoint

2. **Vercel Account** - https://vercel.com
   - Sign up (free tier is plenty)
   - Install Vercel CLI

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

## Step 3: Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 4: Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? holy-chip-store
# - Directory? ./
# - Override settings? No
```

Vercel will give you a URL like: `https://holy-chip-store.vercel.app`

---

## Step 5: Set Environment Variables in Vercel

Go to your Vercel dashboard → Project → Settings → Environment Variables

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

# Then set in Vercel:
MUG_MAPPING = (paste mug-mapping.json content as one line)
PRODUCT_MAPPING = (paste product-mapping.json content as one line)
```

---

## Step 6: Set Up Stripe Webhook

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe-webhook`
4. Events to listen to:
   - `checkout.session.completed`
5. Copy the **Signing secret** (whsec_...)
6. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_...
   ```

---

## Step 7: Redeploy with Environment Variables

```bash
vercel --prod
```

This deploys to production with all environment variables set.

---

## Step 8: Test the Flow

1. Go to your Vercel URL
2. Browse products → Select character → Add to cart
3. Click checkout
4. Fill shipping form
5. Click "Proceed to Payment"
6. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
7. Complete payment
8. Should see success page
9. Check Printify dashboard for new order!

---

## Going Live (Real Payments)

### 1. Switch to Stripe Live Keys
In Vercel environment variables, replace:
- `sk_test_...` → `sk_live_...`
- `pk_test_...` → `pk_live_...`

### 2. Update Webhook
Create new webhook with live mode secret (whsec_...)

### 3. Redeploy
```bash
vercel --prod
```

### 4. Test with Real Card
Use real payment method to verify everything works

---

## Custom Domain (Optional)

### 1. Buy Domain
Buy `holychip.com` (or similar) from any registrar

### 2. Add to Vercel
- Vercel Dashboard → Project → Settings → Domains
- Add your domain
- Follow DNS setup instructions

### 3. Update Stripe Webhook
Update webhook URL to use your custom domain

---

## Monitoring

### Check Orders
- **Printify Dashboard**: See manufacturing status
- **Stripe Dashboard**: See payments
- **Vercel Logs**: See API requests

### Webhook Logs
Stripe Dashboard → Webhooks → Your endpoint → View logs

---

## Troubleshooting

### Payment works but no Printify order
- Check Vercel function logs
- Check webhook is configured correctly
- Verify environment variables are set

### Checkout page doesn't load
- Check `public/checkout.html` is deployed
- Check API endpoint `/api/create-checkout` works

### Product not found error
- Check MUG_MAPPING and PRODUCT_MAPPING env vars
- Verify product IDs match Printify products

---

## File Structure

```
holy-chip-site/
├── api/
│   ├── create-checkout.js      # Creates Stripe checkout session
│   └── stripe-webhook.js       # Handles payment → Printify order
├── public/
│   ├── store-v2.html          # Main store
│   ├── checkout.html          # Checkout page
│   ├── success.html           # Order confirmation
│   └── assets/                # Images, mockups
├── vercel.json                # Vercel configuration
├── package.json               # Dependencies
└── .env.example              # Environment variables template
```

---

## Next Steps After Deployment

1. **Test thoroughly** with test cards
2. **Add more products** (t-shirts when rate limit clears)
3. **Customize design** (colors, branding)
4. **Add email confirmations** (SendGrid/Mailgun)
5. **Set up analytics** (Google Analytics)
6. **Go live** with real Stripe keys!

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Printify API**: https://developers.printify.com

---

## Cost Breakdown

- **Vercel**: Free (up to 100GB bandwidth/mo)
- **Stripe**: 2.9% + $0.30 per transaction
- **Printify**: Wholesale cost per product

**Example:** Customer buys $50 worth of products
- Stripe fee: $1.75
- Printify cost: ~$30 (wholesale)
- Your profit: ~$18.25
