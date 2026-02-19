# Holy Chip - Complete Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Data Flow](#data-flow)
5. [Integration Points](#integration-points)
6. [File Structure](#file-structure)
7. [User Journey](#user-journey)
8. [Technical Stack](#technical-stack)
9. [Business Rules](#business-rules)

---

## System Overview

Holy Chip is a custom print-on-demand (POD) e-commerce platform that provides a seamless shopping experience while leveraging Printify for manufacturing and fulfillment.

### Key Components:
1. **Frontend**: Static website (GitHub Pages) with character-first browsing
2. **Backend**: Netlify serverless functions for checkout processing
3. **Payment**: Stripe Checkout for secure payments
4. **Fulfillment**: Manual script-based order creation in Printify
5. **Order Processing**: Manual `fulfill-orders.js` script (NO automatic webhooks)

### Architecture Pattern:
**JAMstack** (JavaScript, APIs, Markup)
- Static frontend (HTML/CSS/JS) hosted on GitHub Pages
- Serverless backend (Netlify Functions) for checkout only
- Third-party APIs (Stripe, Printify)
- Manual order fulfillment workflow

---

## Frontend Architecture

### Overview
The frontend is a static, client-side application hosted on **GitHub Pages** that provides:
- Character-based product browsing
- Shopping cart with localStorage persistence
- Size selection for t-shirts
- Responsive product gallery with lightbox
- Checkout flow integration

### Core Pages

#### 1. **store.html** - Main Store
**URL**: `https://mell0dia.github.io/holy-chip-site/store.html`

**Purpose**: Primary shopping interface

**Key Features:**
- **Character Selection**: 12 Holy Chip characters (Chip_0 through Chip_1101) displayed in grid
- **Product View**: Click character → See all products for that character
- **Size Selection**: Dropdown for t-shirt sizes (XS, S, M, L, XL, 2XL, 3XL)
- **Shopping Cart**: Persistent cart with quantity controls
- **Image Lightbox**: View product mockups (front/back for t-shirts, 6 angles for mugs)
- **Cart Animation**: Bounce animation instead of toast notifications

**State Management:**
```javascript
// Cart stored in localStorage
let cart = JSON.parse(localStorage.getItem('holyChipCart') || '[]');

// Cart item structure:
{
  chip: "Chip_0",
  styleId: "ringer",
  styleName: "Cotton Ringer",
  price: 25.00,
  productType: "T-Shirt",
  productName: "Chip_0 T-Shirt - Cotton Ringer (L)",
  productImage: "assets/mockups/Chip_0_ringer_white_front.png",
  productId: "69964086f65d6461470ec004", // Printify product ID
  stripePriceId: "price_1T2JebJZLzX0hJCS37PUz2j3",
  size: "L", // Customer-selected size
  quantity: 1
}
```

**Product Catalog:**
```javascript
const productStyles = [
  {
    id: 'style3',
    name: 'Unisex',
    description: 'Front: Brand + Chip',
    price: 25.00,
    type: 'T-Shirt',
    category: 'tshirt'
  },
  {
    id: 'style5',
    name: 'Fitted',
    description: 'Front: Chip | Back: Brand',
    price: 25.00,
    type: 'T-Shirt',
    category: 'tshirt'
  },
  {
    id: 'ringer',
    name: 'Cotton Ringer',
    description: 'Classic retro style with contrast trim',
    price: 25.00,
    type: 'T-Shirt',
    category: 'tshirt'
  },
  {
    id: 'mug',
    name: 'Mug',
    description: 'Chip + Brand side by side',
    price: 15.00,
    type: 'Mug',
    category: 'mug',
    colors: ['Black', 'Red', 'Navy'],
    sizes: ['11oz', '15oz']
  }
];
```

**Navigation Flow:**
```
Home (Character Grid)
  ↓ Click Character
Product View (All styles for that character)
  ↓ Select Size (for t-shirts)
  ↓ Add to Cart
Cart Modal
  ↓ Checkout
Redirect to checkout.html
```

#### 2. **checkout.html** - Checkout Page
**Purpose**: Collect shipping information and initiate payment

**Form Fields:**
- Personal: First Name, Last Name, Email, Phone
- Address: Address 1, Address 2, City, State, ZIP, Country

**Validation:**
- Required fields enforced via HTML5
- Client-side validation before API call

**Process:**
1. Display order summary from cart
2. Collect shipping information
3. Submit to Netlify function at `https://holychip.netlify.app/.netlify/functions/checkout`
4. Receive Stripe Checkout URL
5. Redirect to Stripe Checkout

**API Integration:**
```javascript
const response = await fetch('https://holychip.netlify.app/.netlify/functions/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ cart, shipping })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe
```

#### 3. **success.html** - Order Confirmation
**Purpose**: Show order success and clear cart

**Features:**
- Success checkmark visual
- Session ID display
- Cart cleared from localStorage
- Link back to store

---

## Backend Architecture

### Platform: Netlify Functions
**Why Netlify:**
- Generous free tier
- Simple deployment from GitHub
- Serverless functions support
- Environment variable management
- No credit card required for basic usage

**Deployment URL**: `https://holychip.netlify.app`

### Serverless Functions

#### 1. **checkout.js** - Payment Session Creation

**Endpoint**: `POST https://holychip.netlify.app/.netlify/functions/checkout`

**Location**: `/netlify/functions/checkout.js`

**Request:**
```json
{
  "cart": [
    {
      "chip": "Chip_0",
      "styleId": "ringer",
      "productName": "Chip_0 Cotton Ringer (L)",
      "price": 25.00,
      "quantity": 1,
      "productId": "69964086f65d6461470ec004",
      "stripePriceId": "price_1T2JebJZLzX0hJCS37PUz2j3",
      "size": "L",
      "productType": "T-Shirt"
    }
  ],
  "shipping": {
    "name": "John Doe",
    "email": "john@example.com",
    "address1": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US",
    "phone": "555-1234"
  }
}
```

**Process:**
1. Validate cart and shipping data
2. For each cart item:
   - Get Printify product variants
   - Find correct variant based on:
     - **Color**: WHITE for all shirts (or White/Black for Cotton Ringers)
     - **Size**: Customer-selected size from cart
     - **Color**: Black for mugs
3. Calculate shipping cost via Printify API
4. Create Stripe line items (products + shipping)
5. Create Stripe Checkout Session with:
   - Session metadata containing full cart data (for fulfillment)
6. Return session URL

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Critical Code - Variant Selection:**
```javascript
async function getProductVariant(productId, size, productType) {
  const product = await fetchFromPrintify(productId);

  // Determine color
  let color = productType === 'Mug' ? 'Black' : 'White';

  // Find variant
  if (productType === 'Mug') {
    // "11oz / Black"
    variant = product.variants.find(v => v.title === `${size || '11oz'} / ${color}`);
  } else {
    // Check if Cotton Ringer
    const isRinger = product.variants.some(v => v.title.includes('White/Black'));

    if (isRinger) {
      // "White/Black / XL"
      variant = product.variants.find(v => v.title === `White/Black / ${size}`);
    } else {
      // "White / M"
      variant = product.variants.find(v => v.title === `${color} / ${size}`);
    }
  }

  return variant.id;
}
```

**Cart Data Storage:**
```javascript
const session = await stripe.checkout.sessions.create({
  // ... other fields
  metadata: {
    shippingCost: shippingCost.toString(),
    // CRITICAL: Store full cart for fulfillment script
    cartData: JSON.stringify(cart.map(item => ({
      productId: item.productId,
      chip: item.chip,
      styleId: item.styleId,
      size: item.size,
      productType: item.productType,
      quantity: item.quantity
    })))
  }
});
```

#### 2. **stripe-webhook.js** - Webhook Handler (NOT USED)

**Status**: ⚠️ **NOT CURRENTLY USED**

**Location**: `/netlify/functions/stripe-webhook.js`

**Reason**: User prefers manual order fulfillment via `fulfill-orders.js` script instead of automatic webhook processing.

**Purpose**: Would automatically create Printify orders when Stripe payments succeed, but user chose manual workflow for better control.

---

## Data Flow

### Current Order Fulfillment Flow (Manual)

```
1. FRONTEND (store.html): Customer browses products
   ↓
2. FRONTEND: Customer selects character (e.g., Chip_1)
   ↓
3. FRONTEND: Customer views t-shirt and mug options
   ↓
4. FRONTEND: Customer selects SIZE for t-shirt (e.g., "L")
   ↓
5. FRONTEND: Customer adds to cart
   - Cart stores: productId, size, productType, quantity
   ↓
6. FRONTEND (checkout.html): Customer fills shipping form
   ↓
7. NETLIFY FUNCTION (checkout.js):
   - Receives cart + shipping
   - Maps size + productType to correct WHITE variant
   - Calculates Printify shipping cost
   - Creates Stripe Checkout Session
   - Stores cartData in session metadata
   - Returns Stripe URL
   ↓
8. STRIPE CHECKOUT: Customer enters payment
   ↓
9. STRIPE: Payment succeeds
   - Session marked as "paid"
   - Customer redirected to success.html
   ↓
10. ADMIN: Runs fulfill-orders.js script (MANUAL STEP)
   - Script checks Stripe for paid sessions
   - Reads cartData from session metadata
   - For each cart item:
     * Gets correct Printify variant (WHITE + size)
     * Creates line item
   - Creates Printify order in DRAFT status
   - Marks session as processed
   ↓
11. ADMIN: Reviews order in Printify dashboard
   ↓
12. ADMIN: Manually clicks "Send to Production" in Printify
   ↓
13. PRINTIFY: Manufactures and ships
   ↓
14. CUSTOMER: Receives products
```

### Data Storage

**Frontend (Client-Side):**
- Cart data: `localStorage.holyChipCart`
- Temporary, per-browser
- Cleared on order completion

**Backend (Stateless):**
- No database required
- All data passed via:
  - API requests
  - Stripe session metadata
  - `processed-orders.json` (local file tracking)

**Third-Party:**
- **Stripe**: Payment records, session metadata with cart data
- **Printify**: Order records, shipping status

---

## Integration Points

### 1. Stripe Integration

**Purpose**: Payment processing

**Components:**
- Stripe Checkout: Hosted payment page
- Stripe Sessions API: Create checkout sessions
- Stripe SDK: Node.js library

**Test Mode:**
- Test keys: `sk_test_51FAfoSJZLzX0hJCS...`
- Test card: `4242 4242 4242 4242`

**Security:**
- API keys stored in Netlify environment variables
- HTTPS enforced

### 2. Printify Integration

**Purpose**: Product manufacturing and fulfillment

**API Endpoints Used:**
- `GET /shops/{shop_id}/products/{id}.json` - Get product variants
- `POST /shops/{shop_id}/orders/shipping.json` - Calculate shipping
- `POST /shops/{shop_id}/orders.json` - Create order

**Authentication:**
- Bearer token in Authorization header
- Token: `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...`
- Shop ID: `26508747`

**Print Providers:**
- **SwiftPOD (39)**: Unisex and Fitted t-shirts, Mugs
- **Printify Choice (99)**: Cotton Ringer t-shirts

**Order Submission:**
```javascript
{
  "external_id": "cs_test_b1MVXcfOw...",
  "line_items": [
    {
      "product_id": "69964086f65d6461470ec004",
      "variant_id": 102310, // White/Black / L
      "quantity": 1
    }
  ],
  "shipping_method": 1, // Standard
  "send_shipping_notification": true,
  "address_to": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "country": "CA",
    "region": "BC",
    "address1": "123 Main St",
    "city": "Vancouver",
    "zip": "V6R 1W1"
  }
}
```

### 3. GitHub Pages Deployment

**Repository**: `https://github.com/mell0dia/holy-chip-site`

**Branch**: `gh-pages`

**URL**: `https://mell0dia.github.io/holy-chip-site/`

**Deployment:**
```bash
git add .
git commit -m "Update site"
git push origin gh-pages
```

**Automatic**: GitHub Pages rebuilds automatically on push to `gh-pages` branch.

### 4. Netlify Functions Deployment

**Site**: `holychip.netlify.app`

**Connected to**: GitHub repository (auto-deploys on push)

**Environment Variables:**
- `STRIPE_SECRET_KEY` - Stripe API key
- `PRINTIFY_API_TOKEN` - Printify API token
- `PRINTIFY_SHOP_ID` - Printify shop ID (26508747)

**Build Settings:**
- Build command: (none - static site)
- Publish directory: `/`
- Functions directory: `netlify/functions`

---

## File Structure

```
holy-chip-site/
│
├── netlify/
│   └── functions/                        # Netlify Serverless Functions
│       ├── checkout.js                   # Creates Stripe checkout session
│       └── stripe-webhook.js             # (NOT USED) Webhook handler
│
├── store.html                            # Main store interface
├── checkout.html                         # Checkout page
├── success.html                          # Order confirmation
│
├── assets/
│   └── mockups/                          # Product mockup images
│       ├── Chip_0_style3_white_front.png
│       ├── Chip_0_style3_white_back.png
│       ├── Chip_0_ringer_white_front.png
│       ├── Chip_0_ringer_white_back.png
│       ├── Chip_0_mug_front.png
│       ├── Chip_0_mug_back.png
│       └── ... (all 12 chips × all styles)
│
├── product-data.json                     # Product catalog with IDs
├── processed-orders.json                 # Tracks fulfilled Stripe sessions
│
├── fulfill-orders.js                     # MAIN FULFILLMENT SCRIPT (manual)
├── check-stripe-orders.js                # View recent Stripe orders
│
├── package.json                          # Node.js dependencies
├── .gitignore                            # Ignores scripts with API keys
│
├── SCRIPTS.md                            # Scripts documentation
├── ARCHITECTURE.md                       # This file
├── DEPLOYMENT.md                         # Deployment instructions
└── README.md                             # Quick start guide
```

---

## User Journey

### 1. Discovery & Browsing
**Page**: `store.html`

```
User lands on page
  → Sees 12 character cards in grid
  → Clicks on character (e.g., Chip_1)
  → Character grid hides
  → Product grid shows (3 t-shirt styles + 1 mug)
```

### 2. Product Selection
**Page**: `store.html`

```
User views products
  → For T-SHIRT:
    * Selects SIZE from dropdown (S, M, L, XL, etc.)
    * Clicks on product image → Opens lightbox (front/back views)
  → For MUG:
    * No size selection (defaults to Black/11oz)
    * Clicks on image → Opens lightbox (6 angles)
  → Clicks "Add to Cart"
  → Product added with selected size
  → Cart count badge animates
```

### 3. Cart Management
**Page**: `store.html` (Cart Modal)

```
User clicks cart icon
  → Cart modal opens
  → Shows all cart items:
    - Thumbnail
    - Name with size (e.g., "Chip_1 Cotton Ringer (L)")
    - Price
    - Quantity controls (+/-)
    - Remove button
  → User adjusts quantities
  → Total updates
  → Clicks "Checkout"
```

### 4. Checkout
**Page**: `checkout.html`

```
User redirected to checkout
  → Sees order summary
  → Fills shipping form
  → Clicks "Proceed to Payment"
  → Netlify function processes:
    * Validates cart
    * Maps sizes to WHITE variants
    * Calculates shipping
    * Creates Stripe session with cartData
  → Redirected to Stripe Checkout
```

### 5. Payment
**Page**: Stripe Checkout

```
User on Stripe's page
  → Enters card info
  → Completes payment
  → Redirected to success.html
```

### 6. Fulfillment (Manual - Admin Side)
**Admin Process**:

```
Admin runs: node fulfill-orders.js
  → Script fetches paid Stripe sessions
  → Filters out already-processed orders
  → For each new order:
    * Reads cartData from metadata
    * For each item:
      - Gets Printify product
      - Finds WHITE variant + correct size
      - Adds to line items
    * Creates Printify order (DRAFT status)
    * Marks session as processed
  → Admin reviews orders in Printify dashboard
  → Admin manually sends to production
```

### 7. Confirmation
**Page**: `success.html`

```
User sees success page
  → Success message
  → Session ID
  → Cart cleared
  → "Continue Shopping" link
```

### 8. Delivery
**External**: Printify fulfillment

```
Printify manufactures
  → Ships to customer
  → Sends tracking email
  → Customer receives products
```

---

## Business Rules

### Product Variants

**CRITICAL RULE: All t-shirts MUST be WHITE**

1. **Regular T-Shirts (Unisex, Fitted)**:
   - Color: **WHITE** (hardcoded, not selectable)
   - Size: Customer-selected from dropdown
   - Variant format: `"White / M"`, `"White / XL"`, etc.

2. **Cotton Ringer T-Shirts**:
   - Color: **White/Black** (white body, black trim)
   - Size: Customer-selected from dropdown
   - Variant format: `"White/Black / L"`, `"White/Black / XL"`, etc.

3. **Mugs**:
   - Color: **Black** (default, not selectable)
   - Size: **11oz** (default, not selectable)
   - Variant format: `"11oz / Black"`

### Size Selection

- **T-Shirts**: User MUST select size before adding to cart
- **Mugs**: No size selection, defaults to 11oz
- Sizes stored in cart and passed to checkout
- Checkout function uses exact size to find variant

### Order Processing

- **NO automatic fulfillment** - user rejected webhooks
- **Manual script execution** - `fulfill-orders.js` run on-demand
- **Draft orders only** - Printify orders created in DRAFT status
- **Manual approval required** - Admin must approve in Printify dashboard
- **Duplicate prevention** - `processed-orders.json` tracks completed sessions

### Pricing

- **Unisex T-Shirt**: $25.00
- **Fitted T-Shirt**: $25.00
- **Cotton Ringer T-Shirt**: $25.00
- **Mug**: $15.00
- **Shipping**: Calculated dynamically via Printify API

---

## Technical Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling, grid layout, animations
- **JavaScript (Vanilla)**: No frameworks
- **localStorage API**: Cart persistence
- **GitHub Pages**: Static hosting

### Backend
- **Node.js**: Runtime environment
- **Netlify Functions**: Serverless compute (checkout only)
- **Stripe SDK**: Payment processing
- **Fetch API**: Printify API calls

### Scripts (Local Execution)
- **fulfill-orders.js**: Manual order creation
- **check-stripe-orders.js**: View pending orders

### Third-Party Services
- **GitHub Pages**: Frontend hosting
- **Netlify**: Serverless functions
- **Stripe**: Payment processing
- **Printify**: POD manufacturing + shipping

---

## Security

### API Keys
- Stored in Netlify environment variables
- Never in code or committed to Git
- `.gitignore` blocks scripts with hardcoded keys

### Payment Security
- PCI compliance handled by Stripe
- No card data touches our servers
- Stripe Checkout is PCI DSS Level 1 certified

### HTTPS
- GitHub Pages enforces HTTPS
- Netlify enforces HTTPS
- All traffic encrypted

---

## Scalability

### Current Capacity
- **GitHub Pages**: Unlimited static requests
- **Netlify Free Tier**:
  - 100 GB bandwidth/month
  - 125k function invocations/month
  - 100 hours runtime/month

### Projected Scaling
**100 orders/day** (~3,000/month):
- Bandwidth: ~5 GB/month
- Function calls: ~3,000/month
- Cost: **$0** (within free tier)

**1,000 orders/day** (~30,000/month):
- Bandwidth: ~50 GB/month
- Function calls: ~30,000/month
- Cost: **$0** (still within free tier)

**Note**: User upgraded to Netlify paid plan ($19/month) due to previous usage.

---

## Monitoring & Logging

### Netlify Dashboard
- Function execution logs
- Error tracking
- Deployment history

### Stripe Dashboard
- Payment logs
- Session details with cartData
- Successful/failed payments

### Printify Dashboard
- Order status
- Manufacturing progress
- Shipping tracking

### Local Logs
- `fulfill-orders.js` console output
- `processed-orders.json` tracking file

---

## Cost Analysis

### Monthly Costs

**Fixed Costs:**
- GitHub Pages: $0 (free)
- Netlify: $19/month (paid plan - user's choice)
- Stripe: $0 (pay per transaction)
- Printify: $0 (pay per order)

**Variable Costs (per order):**
- Stripe fees: 2.9% + $0.30 per transaction
- Printify wholesale: ~$12-20 per product
- **Customer pays**: $15 (mug) or $25 (t-shirt)

---

## Maintenance

### Daily Tasks
- Check email for new Stripe payments
- Run `node fulfill-orders.js` to create Printify orders
- Review and approve orders in Printify dashboard

### Weekly Tasks
- Monitor Netlify function logs
- Check for abandoned carts in Stripe

### Monthly Tasks
- Review Printify order history
- Update product catalog if needed
- Check script for any errors

---

## Future Enhancements

### Considered but Rejected
- ❌ Automatic webhook fulfillment (user prefers manual control)

### Possible Phase 2
- [ ] Email confirmations (SendGrid)
- [ ] Order tracking page
- [ ] Customer accounts
- [ ] Admin dashboard for order management

### Possible Phase 3
- [ ] Analytics integration
- [ ] Inventory management
- [ ] A/B testing
- [ ] Automated email marketing

---

## Conclusion

The Holy Chip architecture provides:
1. **Simple UX**: Character-first browsing, size selection, custom checkout
2. **Manual Control**: User reviews every order before production
3. **Scalable Infrastructure**: Serverless, auto-scaling backend
4. **Low Risk**: Manual approval prevents errors
5. **Cost Effective**: Minimal platform costs

**Result**: A professional e-commerce platform with full manual control over order fulfillment, ensuring quality and preventing costly mistakes.
