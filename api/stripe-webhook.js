// Vercel Serverless Function: Stripe Webhook Handler
// Receives payment confirmation and creates Printify order

const Stripe = require('stripe');

// Helper function to create Printify order
async function createPrintifyOrder(cart, shipping, paymentIntentId) {
  const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
  const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

  // Load product mappings from deployed JSON file
  const productDataUrl = `${process.env.VERCEL_URL || 'http://localhost:3000'}/product-data.json`;
  const productDataResponse = await fetch(productDataUrl);
  const productData = await productDataResponse.json();

  const mugMapping = { products: productData.mugs.products };
  const productMapping = { products: productData.tshirts.products };

  // Convert cart items to Printify line items
  const lineItems = cart.map(item => {
    let printifyProductId;
    let variantId;

    // Find the Printify product ID based on chip and style
    if (item.productType === 'Mug') {
      const mugProduct = mugMapping.products.find(p => p.chip === item.chip);
      printifyProductId = mugProduct?.productId;
      // For mugs, we'd need to determine variant based on color/size
      // For now, using first variant (you'll need to expand this)
      variantId = null; // Will use default
    } else if (item.productType === 'T-Shirt') {
      const tshirtProduct = productMapping.products.find(
        p => p.chip === item.chip && p.style === item.styleId
      );
      printifyProductId = tshirtProduct?.productId;
      variantId = null; // Will use default (white)
    }

    if (!printifyProductId) {
      throw new Error(`Product not found in mapping: ${item.chip} ${item.styleId}`);
    }

    return {
      product_id: printifyProductId,
      variant_id: variantId,
      quantity: item.quantity
    };
  });

  // Create order in Printify
  const response = await fetch(
    `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_id: paymentIntentId,
        line_items: lineItems,
        shipping_method: 1, // Standard shipping
        send_shipping_notification: true,
        address_to: {
          first_name: shipping.firstName,
          last_name: shipping.lastName,
          email: shipping.email,
          phone: shipping.phone || '',
          country: shipping.country,
          region: shipping.state || '',
          address1: shipping.address1,
          address2: shipping.address2 || '',
          city: shipping.city,
          zip: shipping.zip
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Printify order creation failed: ${error}`);
  }

  return await response.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    const sig = req.headers['stripe-signature'];
    const body = await getRawBody(req);

    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Extract cart and shipping from metadata
      const shipping = JSON.parse(session.metadata.shippingData);
      const cart = JSON.parse(session.metadata.cartData);

      // Create order in Printify
      const printifyOrder = await createPrintifyOrder(
        cart,
        shipping,
        session.payment_intent
      );

      console.log('Printify order created:', printifyOrder.id);

      // TODO: Save order to database
      // TODO: Send confirmation email

      return res.status(200).json({ received: true, orderId: printifyOrder.id });

    } catch (error) {
      console.error('Error creating Printify order:', error);
      // TODO: Alert admin about failed order
      return res.status(500).json({ error: 'Order creation failed' });
    }
  }

  res.status(200).json({ received: true });
};

// Helper to get raw body for webhook verification
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(Buffer.from(data)));
    req.on('error', reject);
  });
}
