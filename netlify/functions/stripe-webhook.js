// Netlify Function: Stripe Webhook Handler
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRINTIFY_CONFIG = {
  apiToken: process.env.PRINTIFY_API_TOKEN,
  shopId: process.env.PRINTIFY_SHOP_ID,
  apiBase: 'https://api.printify.com/v1'
};

// Get variant ID matching size and color
async function getProductVariant(productId, size, productType) {
  try {
    const response = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}: ${response.status}`);
      return null;
    }

    const product = await response.json();

    // Determine color
    let color;
    if (productType === 'Mug') {
      color = 'Black';
    } else {
      color = 'White'; // All shirts are white
    }

    // Find variant matching color and size
    let variant;

    if (productType === 'Mug') {
      // Mugs: "11oz / Black"
      variant = product.variants.find(v => {
        const sizeMatch = size || '11oz';
        return v.title === `${sizeMatch} / ${color}`;
      });
    } else {
      // Check if ringer
      const isRinger = product.variants.some(v => v.title.includes('/') && v.title.split('/').length > 2);

      if (isRinger) {
        // Ringer: "White/Black / XL"
        variant = product.variants.find(v => v.title === `White/Black / ${size}`);
      } else {
        // Regular: "White / M"
        variant = product.variants.find(v => v.title === `${color} / ${size}`);
      }
    }

    if (!variant) {
      console.error(`No variant found for ${productType} - ${color} / ${size}`);
      return null;
    }

    return variant.id;
  } catch (error) {
    console.error(`Error fetching variant:`, error.message);
    return null;
  }
}

// Create Printify order from checkout session
async function createPrintifyOrder(session) {
  try {
    console.log(`Creating Printify order for session: ${session.id}`);

    // Get cart data from session metadata
    const cartData = session.metadata?.cartData;

    if (!cartData) {
      console.error('No cart data in session metadata');
      return { success: false, error: 'Missing cart data' };
    }

    const cart = JSON.parse(cartData);
    console.log(`Found ${cart.length} cart items`);

    // Build Printify line items
    const printifyItems = [];

    for (const item of cart) {
      const size = item.size || (item.productType === 'Mug' ? '11oz' : 'M');
      const productType = item.productType || 'T-Shirt';

      // Get correct variant
      const variantId = await getProductVariant(item.productId, size, productType);

      if (!variantId) {
        console.error(`Failed to get variant for ${item.chip} ${productType} (${size})`);
        continue;
      }

      printifyItems.push({
        product_id: item.productId,
        variant_id: variantId,
        quantity: item.quantity
      });

      console.log(`✅ Added: ${item.chip} ${productType} (${size}) - Variant ${variantId}`);
    }

    if (printifyItems.length === 0) {
      console.error('No valid items to create Printify order');
      return { success: false, error: 'No valid items' };
    }

    // Build shipping address
    const shipping = session.shipping_details || session.customer_details;
    const address = shipping.address;
    const name = shipping.name || session.customer_details.name || 'Customer';
    const nameParts = name.split(' ');

    const printifyAddress = {
      first_name: nameParts[0] || 'Customer',
      last_name: nameParts.slice(1).join(' ') || '',
      email: session.customer_details.email || session.customer_email,
      phone: shipping.phone || '',
      country: address.country,
      region: address.state || '',
      address1: address.line1,
      address2: address.line2 || '',
      city: address.city,
      zip: address.postal_code
    };

    // Create Printify order
    const orderPayload = {
      external_id: session.id,
      label: `Holy Chip Order - ${session.id}`,
      line_items: printifyItems,
      shipping_method: 1, // Standard shipping
      send_shipping_notification: false,
      address_to: printifyAddress
    };

    console.log('Creating Printify order:', JSON.stringify(orderPayload, null, 2));

    const createResp = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      }
    );

    const order = await createResp.json();

    if (!createResp.ok) {
      console.error('Failed to create Printify order:', order);
      return { success: false, error: order };
    }

    console.log(`✅ Printify order created: ${order.id}`);
    console.log('⚠️  Order is in DRAFT - review and approve in Printify dashboard');

    return { success: true, orderId: order.id };

  } catch (error) {
    console.error('Error creating Printify order:', error);
    return { success: false, error: error.message };
  }
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Webhook not configured' })
      };
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    console.log(`Received event: ${stripeEvent.type}`);

    // Handle checkout.session.completed
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;

      // Only process if payment succeeded
      if (session.payment_status === 'paid') {
        console.log(`Payment succeeded for session: ${session.id}`);

        // Create Printify order
        const result = await createPrintifyOrder(session);

        if (result.success) {
          console.log(`Printify order created successfully: ${result.orderId}`);
        } else {
          console.error('Failed to create Printify order:', result.error);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
