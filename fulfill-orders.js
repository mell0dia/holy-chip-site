// Order Fulfillment Script
// Fetches completed Stripe payments and creates Printify orders

const fs = require('fs');
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY';
const PRINTIFY_CONFIG = {
  apiToken: process.env.PRINTIFY_API_TOKEN || 'YOUR_PRINTIFY_TOKEN',
  shopId: process.env.PRINTIFY_SHOP_ID || 'YOUR_SHOP_ID',
  apiBase: 'https://api.printify.com/v1'
};

const stripe = new Stripe(STRIPE_SECRET_KEY);

// Track processed orders
const PROCESSED_ORDERS_FILE = 'processed-orders.json';

function loadProcessedOrders() {
  try {
    if (fs.existsSync(PROCESSED_ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(PROCESSED_ORDERS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading processed orders:', error);
  }
  return [];
}

function saveProcessedOrder(sessionId) {
  const processed = loadProcessedOrders();
  processed.push({
    sessionId,
    processedAt: new Date().toISOString()
  });
  fs.writeFileSync(PROCESSED_ORDERS_FILE, JSON.stringify(processed, null, 2));
}

async function getRecentCheckoutSessions(limit = 10) {
  console.log('Fetching recent Stripe checkout sessions...\n');

  try {
    const sessions = await stripe.checkout.sessions.list({
      limit: limit,
      status: 'complete'
    });

    return sessions.data;
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    return [];
  }
}

async function getLineItems(sessionId) {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
    return lineItems.data;
  } catch (error) {
    console.error('Error fetching line items:', error.message);
    return [];
  }
}

async function createPrintifyOrder(session, lineItems) {
  console.log(`\n=== Creating Printify Order for Session ${session.id} ===`);

  // Load product data to map Stripe Price IDs to Printify Product IDs
  const productData = JSON.parse(fs.readFileSync('public/product-data.json', 'utf8'));

  // Build price ID to product ID mapping
  const priceToProduct = {};

  productData.mugs.products.forEach(p => {
    if (p.stripePriceId) {
      priceToProduct[p.stripePriceId] = {
        printifyProductId: p.productId,
        chip: p.chip,
        type: 'mug'
      };
    }
  });

  productData.tshirts.products.forEach(p => {
    if (p.stripePriceId) {
      priceToProduct[p.stripePriceId] = {
        printifyProductId: p.productId,
        chip: p.chip,
        style: p.style,
        type: 'tshirt'
      };
    }
  });

  // Extract shipping address from session
  const shipping = session.shipping_details || session.customer_details;

  if (!shipping || !shipping.address) {
    console.error('❌ No shipping address found in session');
    return false;
  }

  // Build Printify line items
  const printifyLineItems = [];

  for (const item of lineItems) {
    const priceId = item.price.id;
    const productInfo = priceToProduct[priceId];

    if (!productInfo) {
      console.error(`❌ Cannot find Printify product for Stripe Price ID: ${priceId}`);
      continue;
    }

    printifyLineItems.push({
      product_id: productInfo.printifyProductId,
      variant_id: 1, // Default variant (you may need to adjust this)
      quantity: item.quantity
    });

    console.log(`  ✅ Mapped: ${item.description} → Printify Product ${productInfo.printifyProductId}`);
  }

  if (printifyLineItems.length === 0) {
    console.error('❌ No valid line items to create Printify order');
    return false;
  }

  // Create Printify order
  const printifyOrder = {
    external_id: session.id,
    line_items: printifyLineItems,
    shipping_method: 1, // Standard shipping
    send_shipping_notification: true,
    address_to: {
      first_name: shipping.name ? shipping.name.split(' ')[0] : 'Customer',
      last_name: shipping.name ? shipping.name.split(' ').slice(1).join(' ') : '',
      email: session.customer_details?.email || 'no-email@holychip.com',
      phone: shipping.phone || '',
      country: shipping.address.country,
      region: shipping.address.state || '',
      address1: shipping.address.line1,
      address2: shipping.address.line2 || '',
      city: shipping.address.city,
      zip: shipping.address.postal_code
    }
  };

  console.log('\nPrintify Order Payload:');
  console.log(JSON.stringify(printifyOrder, null, 2));

  try {
    const response = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printifyOrder)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Printify API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`\n✅ Printify Order Created: ${result.id}`);
    return true;

  } catch (error) {
    console.error('❌ Failed to create Printify order:', error.message);
    return false;
  }
}

async function fulfillOrders() {
  console.log('🚀 Holy Chip Order Fulfillment\n');
  console.log('=====================================\n');

  const processedOrders = loadProcessedOrders();
  const processedIds = processedOrders.map(o => o.sessionId);

  const sessions = await getRecentCheckoutSessions(20);

  console.log(`Found ${sessions.length} completed checkout sessions\n`);

  let newOrders = 0;
  let skipped = 0;

  for (const session of sessions) {
    if (processedIds.includes(session.id)) {
      console.log(`⏭️  Skipping already processed: ${session.id}`);
      skipped++;
      continue;
    }

    console.log(`\n📦 Processing new order: ${session.id}`);
    console.log(`   Customer: ${session.customer_details?.email || 'Unknown'}`);
    console.log(`   Amount: $${(session.amount_total / 100).toFixed(2)}`);

    const lineItems = await getLineItems(session.id);

    if (lineItems.length === 0) {
      console.log('   ⚠️  No line items found, skipping');
      continue;
    }

    const success = await createPrintifyOrder(session, lineItems);

    if (success) {
      saveProcessedOrder(session.id);
      newOrders++;
      console.log(`   ✅ Order fulfilled and marked as processed`);
    } else {
      console.log(`   ❌ Order failed to fulfill`);
    }
  }

  console.log('\n=====================================');
  console.log(`\n✅ Fulfillment Complete!`);
  console.log(`   New orders fulfilled: ${newOrders}`);
  console.log(`   Skipped (already processed): ${skipped}`);
  console.log(`   Total sessions checked: ${sessions.length}\n`);
}

fulfillOrders().catch(console.error);
