# Holy Chip Scripts Documentation

This document describes all important scripts in the Holy Chip project, including their purpose, location, usage, and business rules.

---

## 📦 Order Fulfillment Scripts

### `fulfill-orders.js`

**Location:** `/fulfill-orders.js`

**Purpose:** Main order fulfillment script. Fetches paid Stripe orders and creates corresponding Printify orders with correct product variants.

**When to Run:**
- Run manually whenever you want to process new customer orders
- Can be run multiple times safely (tracks processed orders to avoid duplicates)
- Recommended: Run daily or after receiving payment notification emails from Stripe

**How to Run:**
```bash
node fulfill-orders.js
```

**What It Does:**
1. Fetches recent completed Stripe checkout sessions (last 20)
2. Checks `processed-orders.json` to see which orders are already fulfilled
3. For each new order:
   - Extracts cart data from session metadata
   - Maps products to correct Printify variants (white shirts + customer-selected sizes)
   - Creates Printify order in DRAFT status
   - Saves session ID to `processed-orders.json` to prevent duplicates
4. Displays summary of processed, skipped, and failed orders

**Business Rules:**
- ✅ **All t-shirts must be WHITE**
  - Regular shirts: "White / {Size}"
  - Cotton Ringers: "White/Black / {Size}"
- ✅ **Mugs default to Black/11oz** if no specific variant selected
- ✅ **Size is taken from customer selection** during checkout
- ✅ **Orders created in DRAFT status** - you must manually approve in Printify dashboard
- ✅ **Duplicate prevention** - tracks processed orders in `processed-orders.json`
- ⚠️ **Only processes orders placed AFTER the fix** (requires cartData in session metadata)

**Output Files:**
- `processed-orders.json` - Tracks which Stripe sessions have been fulfilled

**Requirements:**
- Stripe API key (test or live)
- Printify API token
- `product-data.json` file with product mappings

---

### `check-stripe-orders.js`

**Location:** `/check-stripe-orders.js`

**Purpose:** View recent Stripe checkout sessions to see what orders customers have placed.

**When to Run:**
- Before running `fulfill-orders.js` to see what orders are pending
- To verify customer orders and payment details
- To troubleshoot payment issues

**How to Run:**
```bash
node check-stripe-orders.js
```

**What It Does:**
1. Fetches the 10 most recent Stripe checkout sessions
2. Displays detailed information for each:
   - Session ID
   - Payment status (paid/unpaid)
   - Total amount
   - Customer name and email
   - Shipping address
   - Line items with quantities and prices
   - Metadata (shipping cost, cart data)

**Business Rules:**
- Shows both PAID and UNPAID sessions
- Only PAID sessions should be fulfilled
- Sessions with `cartData` in metadata were placed after the variant fix

---

## 🛠️ Netlify Functions (Serverless)

### `netlify/functions/checkout.js`

**Location:** `/netlify/functions/checkout.js`

**Purpose:** Serverless function that handles checkout requests from the website. Creates Stripe checkout sessions with correct shipping costs.

**When It Runs:**
- Automatically triggered when customer clicks "Checkout" on the website
- Runs on Netlify's servers (not manually executed)

**What It Does:**
1. Receives cart and shipping info from website
2. For each cart item:
   - Gets correct Printify variant based on size and product type
   - Calculates variant ID for white shirts (or white/black ringers)
3. Calculates shipping cost via Printify API
4. Creates Stripe checkout session with:
   - Product line items
   - Shipping as a line item
   - Cart data stored in session metadata (for fulfillment script)
5. Returns checkout URL to redirect customer

**Business Rules:**
- ✅ **All t-shirts use WHITE color**
  - Regular shirts: "White / {Size}"
  - Cotton Ringers: "White/Black / {Size}"
- ✅ **Mugs use Black/11oz** as default
- ✅ **Size from customer selection** is used to find exact variant
- ✅ **Cart data saved in metadata** for `fulfill-orders.js` to use later
- ✅ **Shipping calculated from Printify** based on actual products and destination
- ⚠️ **CORS enabled** for GitHub Pages origin

**Environment Variables Required:**
- `STRIPE_SECRET_KEY` - Stripe API key (test or live)
- `PRINTIFY_API_TOKEN` - Printify API token
- `PRINTIFY_SHOP_ID` - Printify shop ID

---

### `netlify/functions/stripe-webhook.js`

**Location:** `/netlify/functions/stripe-webhook.js`

**Purpose:** Webhook endpoint for Stripe to automatically create Printify orders when payments succeed.

**Status:** ⚠️ **NOT CURRENTLY USED** - User prefers manual fulfillment via `fulfill-orders.js`

**When It Runs:**
- Would automatically trigger when Stripe sends `checkout.session.completed` event
- Requires webhook setup in Stripe dashboard

**What It Does:**
1. Receives webhook event from Stripe
2. Verifies webhook signature for security
3. If payment succeeded:
   - Extracts cart data from session metadata
   - Creates Printify order with correct variants
   - Order created in DRAFT status (not sent to production)

**Business Rules:**
- Same variant selection rules as checkout.js
- Orders created in DRAFT status only
- User must still manually approve in Printify dashboard

**Environment Variables Required:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
- `PRINTIFY_API_TOKEN`
- `PRINTIFY_SHOP_ID`

**Note:** Can be enabled in future if automatic order creation is desired.

---

## 📊 Data Files

### `product-data.json`

**Location:** `/product-data.json`

**Purpose:** Central database of all products with Printify product IDs and Stripe price IDs.

**Structure:**
```json
{
  "lastUpdated": "ISO timestamp",
  "mugs": {
    "products": [
      {
        "chip": "Chip_0",
        "productId": "printify_product_id",
        "stripePriceId": "stripe_price_id",
        "price": 15
      }
    ]
  },
  "tshirts": {
    "products": [
      {
        "chip": "Chip_0",
        "style": "style3|style5|ringer",
        "productId": "printify_product_id",
        "stripePriceId": "stripe_price_id",
        "price": 25
      }
    ]
  }
}
```

**When to Update:**
- When adding new products to Printify
- When creating new Stripe prices
- After running product creation scripts

**Business Rules:**
- Each product must have both `productId` (Printify) and `stripePriceId` (Stripe)
- T-shirt styles: `style3` (Unisex), `style5` (Fitted), `ringer` (Cotton Ringer)
- All products use same chip designs (Chip_0 through Chip_1101)

---

### `processed-orders.json`

**Location:** `/processed-orders.json`

**Purpose:** Tracks which Stripe checkout sessions have been processed by `fulfill-orders.js`.

**Structure:**
```json
[
  {
    "sessionId": "cs_test_...",
    "processedAt": "2026-02-18T15:30:00.000Z"
  }
]
```

**When Modified:**
- Automatically updated by `fulfill-orders.js` when order is fulfilled
- Can be manually edited to re-process an order (remove its entry)

**Business Rules:**
- Prevents duplicate Printify orders for same Stripe payment
- Safe to delete file to reprocess all orders (use with caution)

---

## 🔑 Environment Variables

**Required for Scripts:**

```bash
# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_...

# Printify
PRINTIFY_API_TOKEN=eyJ0eXAiOiJKV1Q...
PRINTIFY_SHOP_ID=26508747

# Stripe Webhook (only if using webhook)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Note:** Scripts fall back to hardcoded test keys if env vars not set, but production should use environment variables.

---

## 📋 Standard Workflow

### Daily Order Fulfillment Process:

1. **Check for new orders:**
   ```bash
   node check-stripe-orders.js
   ```
   - Review paid orders
   - Verify customer details and amounts

2. **Fulfill orders:**
   ```bash
   node fulfill-orders.js
   ```
   - Script creates Printify orders for all new paid sessions
   - Orders appear in Printify dashboard as DRAFT

3. **Approve in Printify:**
   - Go to https://printify.com/app/orders
   - Review each order for correctness
   - Manually click "Send to Production"

4. **Monitor production:**
   - Track order status in Printify
   - Customer receives shipping notification when shipped

---

## ⚠️ Important Notes

### Product Variants:
- **All shirts MUST be white** - this is hardcoded in checkout and fulfillment
- Cotton Ringers use "White/Black" (white body, black trim)
- If customer somehow orders wrong color, order will fail in `fulfill-orders.js`

### Order Processing:
- Orders placed BEFORE Feb 18, 2026 may not have `cartData` in metadata
- These orders cannot be auto-fulfilled and must be created manually
- New orders (after fix) will always have `cartData` and work automatically

### Duplicate Prevention:
- `fulfill-orders.js` is safe to run multiple times
- Uses `processed-orders.json` to track completed orders
- If you need to reprocess an order, remove it from `processed-orders.json`

### Manual Approval Required:
- All Printify orders are created in DRAFT status
- You MUST manually approve each order in Printify dashboard
- This prevents accidental production of test orders
- Gives you final review before customer is charged/shipped

---

## 🚨 Troubleshooting

### Script fails with "No cart data in session metadata"
**Cause:** Order was placed before the checkout fix
**Solution:** Order cannot be auto-fulfilled, skip it or create manually

### Script creates wrong size/color
**Cause:** Bug in variant matching logic
**Solution:** Check `getProductVariant()` function in script, verify product has correct variants in Printify

### Duplicate orders created in Printify
**Cause:** `processed-orders.json` was deleted or corrupted
**Solution:** Check file exists, restore from backup if needed, cancel duplicate orders in Printify

### Shipping cost calculation fails
**Cause:** Printify API error or invalid address
**Solution:** Verify address format, check Printify API status, retry later

---

## 📝 Version History

- **2026-02-18:** Fixed variant selection to use correct white shirts and sizes
- **2026-02-18:** Added cartData to checkout session metadata
- **2026-02-18:** Updated fulfill-orders.js to use cartData for accurate fulfillment
- **2026-02-18:** Deprecated automatic webhook in favor of manual script execution
