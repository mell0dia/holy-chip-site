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

---

## System Overview

Holy Chip is a custom print-on-demand (POD) e-commerce platform that provides a seamless shopping experience while leveraging Printify for manufacturing and fulfillment.

### Key Components:
1. **Frontend**: Custom website with character-first browsing
2. **Backend**: Vercel serverless functions for payment & order processing
3. **Payment**: Stripe Checkout for secure payments
4. **Fulfillment**: Printify API for automated manufacturing & shipping

### Architecture Pattern:
**JAMstack** (JavaScript, APIs, Markup)
- Static frontend (HTML/CSS/JS)
- Serverless backend (Vercel Functions)
- Third-party APIs (Stripe, Printify)

---

## Frontend Architecture

### Overview
The frontend is a static, client-side application that provides:
- Character-based product browsing
- Shopping cart with localStorage persistence
- Responsive product gallery with lightbox
- Checkout flow integration

### Core Pages

#### 1. **store-v2.html** - Main Store
**Purpose**: Primary shopping interface

**Key Features:**
- **Character Selection**: 12 Holy Chip characters displayed in grid
- **Product View**: Click character → See all products for that character
- **Shopping Cart**: Persistent cart with quantity controls
- **Image Lightbox**: View product mockups (front/back for t-shirts, 6 angles for mugs)

**State Management:**
```javascript
// Cart stored in localStorage
let cart = JSON.parse(localStorage.getItem('holyChipCart') || '[]');

// Cart item structure:
{
  chip: "Chip_0",
  styleId: "style3",
  styleName: "Style 3",
  price: 25.00,
  productType: "T-Shirt",
  productName: "Chip_0 T-Shirt - Style 3",
  productImage: "assets/mockups/Chip_0_style3_white_front.png",
  quantity: 1
}
```

**Product Catalog:**
```javascript
const productStyles = [
  {
    id: 'style3',
    name: 'Style 3',
    description: 'Front: Chip | Back: Brand',
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
3. Submit to `/api/create-checkout`
4. Redirect to Stripe Checkout

**API Integration:**
```javascript
const response = await fetch('/api/create-checkout', {
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
- Order ID display
- Cart cleared from localStorage
- Link back to store

---

## Backend Architecture

### Platform: Vercel Serverless Functions
**Why Vercel:**
- Zero server management
- Auto-scaling
- Global CDN
- Free tier sufficient for startup
- Instant deployment

### Serverless Functions

#### 1. **create-checkout.js** - Payment Session Creation

**Endpoint**: `POST /api/create-checkout`

**Request:**
```json
{
  "cart": [
    {
      "chip": "Chip_0",
      "productName": "Chip_0 T-Shirt - Style 3",
      "price": 25.00,
      "quantity": 2,
      "productImage": "assets/mockups/..."
    }
  ],
  "shipping": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "address1": "123 Main St",
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US"
  }
}
```

**Process:**
1. Validate cart and shipping data
2. Calculate total
3. Create Stripe line items
4. Create Stripe Checkout Session
5. Store cart/shipping in session metadata
6. Return session URL

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Key Code:**
```javascript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: lineItems,
  mode: 'payment',
  success_url: 'https://yoursite.com/success.html?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yoursite.com/store-v2.html',
  customer_email: shipping.email,
  metadata: {
    shippingData: JSON.stringify(shipping),
    cartData: JSON.stringify(cart)
  }
});
```

#### 2. **stripe-webhook.js** - Payment Fulfillment

**Endpoint**: `POST /api/stripe-webhook`

**Purpose**: Receive payment confirmation from Stripe and create Printify order

**Webhook Event**: `checkout.session.completed`

**Process:**
1. Verify webhook signature (security)
2. Extract cart and shipping from session metadata
3. Map cart items to Printify product IDs
4. Create order in Printify via API
5. Log order creation
6. Return success

**Printify Order Creation:**
```javascript
const lineItems = cart.map(item => {
  // Map Holy Chip product to Printify product
  const printifyProductId = findPrintifyProduct(item.chip, item.styleId);

  return {
    product_id: printifyProductId,
    variant_id: getVariantId(item), // Based on size/color
    quantity: item.quantity
  };
});

const order = await fetch('https://api.printify.com/v1/shops/{shop_id}/orders.json', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_TOKEN}` },
  body: JSON.stringify({
    external_id: paymentIntentId,
    line_items: lineItems,
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: shippingAddress
  })
});
```

**Product Mapping:**
```javascript
// Environment variables store product mappings
const mugMapping = JSON.parse(process.env.MUG_MAPPING);
const productMapping = JSON.parse(process.env.PRODUCT_MAPPING);

// Find Printify product ID
if (item.productType === 'Mug') {
  const mugProduct = mugMapping.products.find(p => p.chip === item.chip);
  printifyProductId = mugProduct.productId;
}
```

---

## Data Flow

### Complete Purchase Flow

```
1. FRONTEND: Customer browses store-v2.html
   ↓
2. FRONTEND: Selects character (e.g., Chip_0)
   ↓
3. FRONTEND: Views products for that character
   ↓
4. FRONTEND: Adds items to cart (stored in localStorage)
   ↓
5. FRONTEND: Clicks "Checkout" → Redirect to checkout.html
   ↓
6. FRONTEND: Fills shipping form
   ↓
7. FRONTEND: Clicks "Proceed to Payment"
   ↓
8. BACKEND: POST /api/create-checkout
   - Receives cart + shipping
   - Creates Stripe Checkout Session
   - Returns session URL
   ↓
9. STRIPE: Customer redirected to Stripe Checkout
   - Enters payment information
   - Completes payment
   ↓
10. STRIPE: Sends webhook to /api/stripe-webhook
   ↓
11. BACKEND: Receives checkout.session.completed event
   - Extracts cart + shipping from metadata
   - Maps products to Printify IDs
   - Creates order in Printify
   ↓
12. PRINTIFY: Receives order
   - Queues for manufacturing
   - Sends confirmation
   ↓
13. STRIPE: Redirects customer to success.html
   ↓
14. FRONTEND: Shows success page
   - Clears cart
   - Displays order ID
   ↓
15. PRINTIFY: Manufactures products
   ↓
16. PRINTIFY: Ships to customer
   ↓
17. CUSTOMER: Receives products
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
  - Environment variables

**Third-Party:**
- **Stripe**: Payment records, customer data
- **Printify**: Order records, shipping status

---

## Integration Points

### 1. Stripe Integration

**Purpose**: Payment processing

**Components:**
- Stripe Checkout: Hosted payment page
- Stripe Webhooks: Payment notifications
- Stripe SDK: Node.js library

**Test Mode:**
- Test keys: `sk_test_...` / `pk_test_...`
- Test card: `4242 4242 4242 4242`

**Live Mode:**
- Live keys: `sk_live_...` / `pk_live_...`
- Real payments processed

**Security:**
- API keys stored in environment variables
- Webhook signature verification
- HTTPS enforced

### 2. Printify Integration

**Purpose**: Product manufacturing and fulfillment

**API Endpoints Used:**
- `POST /shops/{shop_id}/orders.json` - Create order
- `GET /shops/{shop_id}/products/{id}.json` - Get product details

**Authentication:**
- Bearer token in Authorization header
- Token stored in environment variable

**Order Submission:**
```javascript
{
  "external_id": "stripe_payment_intent_id",
  "line_items": [
    {
      "product_id": "69937fa881551e76130b84e8",
      "variant_id": 72180,
      "quantity": 2
    }
  ],
  "shipping_method": 1,
  "send_shipping_notification": true,
  "address_to": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "country": "US",
    "address1": "123 Main St",
    "city": "Los Angeles",
    "region": "CA",
    "zip": "90001"
  }
}
```

**Product Mapping:**
- Mugs: `mug-mapping.json` → Maps Chip_X to Printify product ID
- T-Shirts: `product-mapping.json` → Maps Chip_X + Style to Printify product ID

### 3. Vercel Deployment

**Configuration**: `vercel.json`
```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

**Environment Variables:**
- Stored in Vercel dashboard
- Injected at runtime
- Encrypted at rest

**Deployment:**
```bash
vercel          # Deploy preview
vercel --prod   # Deploy production
```

---

## File Structure

```
holy-chip-site/
│
├── api/                              # Vercel Serverless Functions
│   ├── create-checkout.js           # Creates Stripe checkout session
│   └── stripe-webhook.js            # Handles payment → Printify order
│
├── public/                           # Static files (served by Vercel)
│   ├── store-v2.html                # Main store interface
│   ├── checkout.html                # Checkout page
│   ├── success.html                 # Order confirmation
│   └── assets/                      # Static assets
│       ├── mockups/                 # T-shirt product images
│       │   ├── Chip_0_style3_white_front.png
│       │   ├── Chip_0_style3_white_back.png
│       │   └── ...
│       ├── mug-mockups/             # Mug product images (6 angles each)
│       │   ├── Chip_0_mug_front.png
│       │   ├── Chip_0_mug_back.png
│       │   ├── Chip_0_mug_left.png
│       │   ├── Chip_0_mug_right.png
│       │   ├── Chip_0_mug_context1.png
│       │   ├── Chip_0_mug_context2.png
│       │   └── ...
│       ├── brand.png                # Holy Chip branding
│       └── style.css                # Global styles
│
├── characters/                       # Character source images
│   ├── Chip_0.png
│   ├── Chip_1.png
│   └── ...
│
├── printify-config.js               # Printify API configuration
├── mug-mapping.json                 # Maps Chips → Printify mug products
├── product-mapping.json             # Maps Chips + Styles → Printify t-shirts
│
├── package.json                     # Node.js dependencies
├── vercel.json                      # Vercel deployment config
├── .env.example                     # Environment variables template
│
├── ARCHITECTURE.md                  # This file
├── DEPLOYMENT.md                    # Deployment instructions
├── AUTOMATION-GUIDE.md              # Product creation automation
├── CHECKOUT-FLOW.md                 # Checkout options explained
└── README.md                        # Quick start guide
│
└── Automation Scripts (development only)
    ├── recreate-all-mugs-final.js   # Create all 12 mug products
    ├── create-all-products.js       # Create all 24 t-shirt products
    ├── fetch-all-mug-angles.js      # Download mug mockup images
    ├── fetch-all-mockups.js         # Download t-shirt mockup images
    └── publish-to-printify-store.js # Publish products (not needed for custom checkout)
```

---

## User Journey

### 1. Discovery & Browsing
**Page**: `store-v2.html`

```
User lands on page
  → Sees 12 character cards in grid
  → Clicks on character (e.g., Chip_0)
  → Character grid hides
  → Product grid shows (t-shirts + mugs for that character)
```

### 2. Product Selection
**Page**: `store-v2.html`

```
User views products
  → Clicks on product image → Opens lightbox
    - T-shirts: Front/Back views with arrow navigation
    - Mugs: 6 angles (front, back, left, right, context1, context2)
  → Clicks "Add to Cart"
  → Product added to cart (with quantity 1)
  → Cart count updates in header
```

### 3. Cart Management
**Page**: `store-v2.html` (Cart Modal)

```
User clicks cart icon
  → Cart modal opens
  → Shows all cart items with:
    - Product thumbnail
    - Product name
    - Price per unit
    - Quantity controls (+/- buttons)
    - Subtotal per item
    - Remove button
  → User adjusts quantities
  → Total updates automatically
  → Clicks "Checkout"
```

### 4. Checkout
**Page**: `checkout.html`

```
User redirected to checkout page
  → Sees order summary (cart items + total)
  → Fills shipping form:
    - Name, email, phone
    - Address, city, state, ZIP, country
  → Clicks "Proceed to Payment"
  → API call to /api/create-checkout
  → Redirected to Stripe Checkout
```

### 5. Payment
**Page**: Stripe Checkout (stripe.com)

```
User on Stripe's secure checkout page
  → Enters credit card information
  → Completes payment
  → Stripe processes payment
  → Triggers webhook to backend
```

### 6. Fulfillment (Background)
**Backend**: Webhook processing

```
Webhook received
  → Extracts cart and shipping data
  → Maps products to Printify IDs
  → Creates order in Printify
  → Printify queues order for manufacturing
```

### 7. Confirmation
**Page**: `success.html`

```
User redirected from Stripe
  → Sees success message
  → Order ID displayed
  → Cart cleared from localStorage
  → "Continue Shopping" button
```

### 8. Delivery (Printify)
**External**: Printify fulfillment

```
Printify manufactures products
  → Ships to customer address
  → Sends tracking email to customer
  → Customer receives products
```

---

## Technical Stack

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom styling, grid layout, responsive design
- **JavaScript (Vanilla)**: No frameworks, lightweight
- **localStorage API**: Cart persistence

### Backend
- **Node.js**: Runtime environment
- **Vercel Functions**: Serverless compute
- **Stripe SDK**: Payment processing
- **Fetch API**: HTTP requests to Printify

### Third-Party Services
- **Vercel**: Hosting + serverless functions
- **Stripe**: Payment processing
- **Printify**: POD manufacturing + shipping

### Development Tools
- **npm**: Package management
- **Vercel CLI**: Local dev + deployment
- **Git**: Version control

---

## Security

### API Keys
- Stored in environment variables (never in code)
- Different keys for test/live modes
- Vercel encrypts all environment variables

### Payment Security
- PCI compliance handled by Stripe
- No card data touches our servers
- Stripe Checkout is PCI DSS Level 1 certified

### Webhook Verification
- Stripe webhook signatures verified
- Prevents unauthorized requests
- Protects against replay attacks

### HTTPS
- Enforced by Vercel
- All traffic encrypted
- Free SSL certificates

---

## Scalability

### Current Capacity
- **Vercel Free Tier**:
  - 100 GB bandwidth/month
  - 100 GB-hours serverless execution
  - Unlimited static requests

### Projected Scaling
**100 orders/day:**
- Bandwidth: ~5 GB/month (plenty)
- Function execution: ~10 GB-hours/month (plenty)
- Cost: $0 (within free tier)

**1000 orders/day:**
- Bandwidth: ~50 GB/month (still free)
- Function execution: ~100 GB-hours/month
- Cost: ~$20/month (if exceeded free tier)

### Bottlenecks
1. **Printify API rate limits**: ~60 requests/minute
2. **Stripe limits**: 100 requests/second (unlikely to hit)
3. **Vercel limits**: Scales automatically

### Optimization Strategies
- Cache product data in environment variables
- Batch Printify orders if needed
- Use Vercel Edge Functions for lower latency
- Add Redis for session storage (if needed)

---

## Monitoring & Logging

### Vercel Logs
- Function execution logs
- Error tracking
- Performance metrics

### Stripe Dashboard
- Payment logs
- Webhook delivery logs
- Failed payment alerts

### Printify Dashboard
- Order status
- Manufacturing progress
- Shipping tracking

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Custom browsing experience
- ✅ Shopping cart
- ✅ Stripe checkout
- ✅ Printify fulfillment

### Phase 2 (Recommended)
- [ ] Email confirmations (SendGrid/Mailgun)
- [ ] Order tracking page
- [ ] Customer accounts
- [ ] Order history

### Phase 3 (Advanced)
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Analytics integration
- [ ] A/B testing
- [ ] Abandoned cart recovery

---

## Cost Analysis

### Monthly Costs (Estimated)

**Fixed Costs:**
- Vercel: $0 (free tier sufficient for startup)
- Stripe: $0 (pay per transaction)
- Printify: $0 (pay per order)

**Variable Costs (per $100 in sales):**
- Stripe fees: $3.20 (2.9% + $0.30 per transaction)
- Printify (wholesale): ~$60 (depends on products)
- **Net profit**: ~$36.80 per $100 in sales

**Scaling Costs:**
- 100 orders/month: $0 platform costs
- 1000 orders/month: ~$20 platform costs
- 10,000 orders/month: ~$200 platform costs

---

## Maintenance

### Regular Tasks
- Monitor Vercel logs for errors
- Check Stripe webhook delivery
- Review Printify order status
- Update product prices as needed

### Periodic Updates
- Rotate API keys (quarterly)
- Update dependencies (npm update)
- Review and update product catalog
- Test checkout flow

### Disaster Recovery
- Code backed up in Git
- Environment variables documented
- Product mappings saved in JSON
- Can redeploy from scratch in minutes

---

## Conclusion

The Holy Chip architecture provides:
1. **Seamless UX**: Character-first browsing, custom checkout
2. **Automated Fulfillment**: Hands-off order processing
3. **Scalable Infrastructure**: Serverless, auto-scaling
4. **Low Overhead**: Minimal ongoing costs
5. **Easy Maintenance**: Simple, well-documented codebase

**Result**: A professional e-commerce platform that lets you focus on marketing and growth while technology handles the operations.
