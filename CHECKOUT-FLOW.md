# Holy Chip - Checkout Flow Explanation

## Current Implementation (What You Have Now)

### Shopping Cart Features ✅
- **Product Images**: Small thumbnail for each cart item
- **Quantity Controls**: +/- buttons and manual input
- **Item Subtotals**: Price × Quantity for each item
- **Cart Total**: Sum of all item subtotals
- **Remove Items**: X button to remove items
- **Persistent Cart**: Saved in localStorage (survives page refresh)

### Cart Display
```
[Image] Product Name           Qty: [-] 2 [+]    $50.00  [×]
       $25.00 each
```

---

## Checkout Options

You have **3 main approaches** for implementing checkout:

### **Option 1: Manual Fulfillment with Printify Orders API (Current Implementation)**

**How it works:**
1. User clicks "Checkout"
2. Your site collects shipping address
3. Stripe creates a checkout session in DRAFT status
4. Cart data stored in Stripe session metadata
5. Payment is processed
6. **You manually run fulfill-orders.js script**
7. Script reads cart metadata and creates Printify orders
8. Printify handles:
   - Manufacturing
   - Shipping
   - Fulfillment
9. You get charged (wholesale price)
10. Customer receives product

**Pricing Structure:**
- **You pay Printify**: Wholesale price (e.g., $8 for mug, $15 for t-shirt)
- **You charge customer**: Retail price (e.g., $15 for mug, $25 for t-shirt)
- **Your profit**: Retail - Wholesale

**Implementation Steps:**
```javascript
// 1. Create checkout session with cart metadata (create-checkout.js)
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  metadata: {
    cart: JSON.stringify(cart)
  },
  // ... other session config
});

// 2. After payment, manually run fulfill-orders.js
// This script:
// - Reads Stripe sessions
// - Extracts cart metadata
// - Creates Printify orders
// - Tracks processed orders in processed-orders.json

node fulfill-orders.js
```

**Pros:**
- Manual approval before fulfillment
- Review orders before manufacturing
- No automatic webhook issues
- Control over order processing

**Cons:**
- Requires manual intervention
- Need to run script regularly
- Not fully automated

---

### **Option 2: Printify Store Integration (Easiest)**

**How it works:**
1. Publish products to Printify Store
2. User clicks "Checkout" → Redirects to Printify-hosted checkout
3. Printify handles:
   - Payment processing
   - Shipping address collection
   - Order creation
   - Fulfillment
4. You get paid (retail price minus Printify's fees)

**Implementation:**
```javascript
function checkout() {
  // Redirect to Printify store with selected products
  window.location.href = 'https://your-printify-store.printify.me/checkout';
}
```

**Pros:**
- Simplest implementation
- No backend needed
- Printify handles everything

**Cons:**
- Less control over branding
- Can't customize checkout experience
- Must publish products to Printify Store

---

### **Option 3: Third-Party E-commerce Platform**

**Integrate with:**
- **Shopify**: Printify has official Shopify integration
- **WooCommerce**: WordPress plugin available
- **Etsy**: Connect Printify to Etsy shop

**How it works:**
1. Sync products to platform
2. Customer buys on platform
3. Order auto-forwards to Printify
4. Printify fulfills

**Pros:**
- Professional checkout
- Payment processing included
- Inventory management
- Customer accounts

**Cons:**
- Monthly fees
- More complex setup
- Less customization

---

## Recommended Approach for Holy Chip

### **Phase 1: Printify Store (Launch Fast)**
Start with Printify's hosted store:
- Publish all products to Printify Store
- Use your current site as the "catalog/browse" experience
- Redirect to Printify for checkout
- Get feedback and sales quickly

### **Phase 2: Custom Checkout (Scale Later)**
When ready to scale:
- Build backend API (Node.js/Express)
- Integrate Stripe for payments
- Use Printify Orders API
- Keep full profit margin

---

## Sample Checkout Flow (Current Implementation)

```javascript
// checkout.js - Current implementation

async function checkout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Step 1: Show shipping form
  const shippingInfo = await collectShippingInfo();

  // Step 2: Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = calculateShipping(shippingInfo.country);
  const tax = calculateTax(shippingInfo.region, subtotal);
  const total = subtotal + shipping + tax;

  // Step 3: Create Stripe checkout session with cart metadata
  const session = await createCheckoutSession({
    cart: cart,
    shipping: shippingInfo,
    total: total
  });

  // Step 4: Redirect to Stripe checkout
  window.location.href = session.url;

  // After payment succeeds:
  // - Order is in DRAFT status
  // - Cart data stored in session metadata
  // - Admin runs fulfill-orders.js to create Printify orders
}

async function createCheckoutSession(orderData) {
  const response = await fetch('https://holychip.netlify.app/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  return await response.json();
}

// Manual fulfillment (run by admin)
// node fulfill-orders.js
```

---

## Payment Processing Options

### **Stripe** (Recommended)
- Easy integration
- Low fees (2.9% + $0.30)
- Supports cards, Apple Pay, Google Pay
- Great documentation

**Setup:**
```html
<script src="https://js.stripe.com/v3/"></script>
```

```javascript
const stripe = Stripe('your_publishable_key');

async function processPayment(amount) {
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    { payment_method: paymentMethodId }
  );

  return { success: !error, orderId: paymentIntent.id };
}
```

### **PayPal**
- Familiar to customers
- Buyer protection
- Fees: 2.9% + $0.30

### **Square**
- Good for in-person + online
- Fees: 2.9% + $0.30

---

## Cost Breakdown Example

**Customer orders:**
- 1× Chip_0 Mug (Black, 11oz) × 2
- 1× Chip_1 T-Shirt (Style 3, White, L) × 1

**Pricing:**

| Item | Qty | Retail | Wholesale | Profit |
|------|-----|--------|-----------|--------|
| Mug | 2 | $30.00 | $16.00 | $14.00 |
| T-Shirt | 1 | $25.00 | $15.00 | $10.00 |
| **Total** | | **$55.00** | **$31.00** | **$24.00** |

**Minus:**
- Stripe fee: -$1.90
- **Net profit: $22.10**

---

## Next Steps to Implement Checkout

### Immediate (Today):
1. ✅ Cart with images and quantities (DONE)
2. Decide: Printify Store or Custom checkout?

### If Printify Store:
1. Publish products to Printify Store
2. Update checkout button to redirect
3. Done! Start selling.

### If Custom Checkout:
1. Set up backend server (Node.js/Express)
2. Integrate payment processor (Stripe)
3. Build shipping address form
4. Connect to Printify Orders API
5. Test end-to-end flow

---

## Security Notes

⚠️ **Never expose API keys in frontend code!**
- Printify API token must stay on backend
- Stripe secret key must stay on backend
- Use environment variables

**Safe approach:**
```javascript
// Frontend calls your backend
fetch('/api/create-order', {
  method: 'POST',
  body: JSON.stringify({ cart, shipping })
});

// Backend handles Printify API
// server.js
app.post('/api/create-order', async (req, res) => {
  const order = await printify.createOrder({
    ...req.body,
    apiToken: process.env.PRINTIFY_API_TOKEN // Secure!
  });

  res.json(order);
});
```

---

## Questions to Decide

1. **Do you want to handle payments yourself** or let Printify handle it?
   - Yourself = More profit, more control
   - Printify = Easier, faster launch

2. **Do you have a backend server** or want to keep it simple (static site)?
   - Backend = Full control
   - Static = Use Printify Store

3. **What's your timeline?**
   - Launch this week = Printify Store
   - Launch in 2-4 weeks = Custom checkout

Let me know which direction you want to go and I'll help implement it!
