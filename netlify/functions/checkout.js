// Netlify Function: Stripe Checkout Session Creator
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRINTIFY_CONFIG = {
  apiToken: process.env.PRINTIFY_API_TOKEN,   // set on Netlify; never hardcode (a leaked token was removed 2026-10-06)
  shopId: process.env.PRINTIFY_SHOP_ID || '26508747',
  apiBase: 'https://api.printify.com/v1'
};

// Fetch product variant ID from Printify based on size and color
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

    // Determine the color based on product type
    let color;
    if (productType === 'Mug') {
      color = 'Black'; // Default mug color
    } else {
      color = 'White'; // All shirts are white
    }

    // Find variant matching color and size
    let variant;

    if (productType === 'Mug') {
      // Mugs: Duplium format is "Color / Size" (e.g., "Black / 11oz")
      // Harrier legacy format was "Size / Color" — try both
      const sizeMatch = size || '11oz';
      variant = product.variants.find(v =>
        v.title === `${color} / ${sizeMatch}` || v.title === `${sizeMatch} / ${color}`
      );
    } else {
      // T-Shirts: check if it's a ringer (format: "Color1/Color2 / Size")
      const isRinger = product.variants.some(v => v.title.includes('/') && v.title.split('/').length > 2);

      if (isRinger) {
        // Ringer format: "White/Black / XL"
        variant = product.variants.find(v => v.title === `White/Black / ${size}`);
      } else {
        // Regular shirt format: "White / M"
        variant = product.variants.find(v => v.title === `${color} / ${size}`);
      }
    }

    if (!variant) {
      console.error(`No variant found for ${productType} - ${color} / ${size}`);
      console.error(`Available variants:`, product.variants.slice(0, 5).map(v => v.title));
      return null;
    }

    console.log(`✅ Found variant: ${variant.title} (ID: ${variant.id})`);
    return variant.id;
  } catch (error) {
    console.error(`Error fetching variant for product ${productId}:`, error.message);
    return null;
  }
}

// Calculate shipping cost from Printify
async function calculateShipping(lineItems, address) {
  try {
    const response = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/orders/shipping.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          line_items: lineItems,
          address_to: address
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Printify shipping API error: ${response.status} - ${errorText}`);
      return null;
    }

    const shippingOptions = await response.json();

    // Return standard shipping (usually the first/cheapest option)
    if (shippingOptions && shippingOptions.standard) {
      return shippingOptions.standard;
    }

    return null;
  } catch (error) {
    console.error('Error calculating shipping:', error.message);
    return null;
  }
}

exports.handler = async (event) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { cart, shipping } = body;

    if (!cart || cart.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Cart is empty' })
      };
    }

    if (!shipping || !shipping.email || !shipping.address1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing shipping information' })
      };
    }

    // Build Printify line items for shipping calculation
    const printifyLineItems = [];

    for (const item of cart) {
      if (!item.productId) {
        console.error('Cart item missing productId:', item);
        continue;
      }

      // Get size from cart item (for t-shirts) or default for mugs
      const size = item.size || (item.productType === 'Mug' ? '11oz' : 'M');
      const productType = item.productType || 'T-Shirt';

      const variantId = await getProductVariant(item.productId, size, productType);

      if (!variantId) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: `Failed to get variant for ${item.productName}. Please contact support.` })
        };
      }

      printifyLineItems.push({
        product_id: item.productId,
        variant_id: variantId,
        quantity: item.quantity
      });
    }

    // Calculate shipping from Printify
    const printifyAddress = {
      first_name: shipping.name ? shipping.name.split(' ')[0] : 'Customer',
      last_name: shipping.name ? shipping.name.split(' ').slice(1).join(' ') : '',
      email: shipping.email,
      phone: shipping.phone || '',
      country: shipping.country,
      region: shipping.state || '',
      address1: shipping.address1,
      address2: shipping.address2 || '',
      city: shipping.city,
      zip: shipping.zip
    };

    const shippingCost = await calculateShipping(printifyLineItems, printifyAddress);

    if (!shippingCost) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to calculate shipping. Please try again.' })
      };
    }

    // Create Stripe checkout session with products
    const lineItems = cart.map(item => ({
      price: item.stripePriceId,
      quantity: item.quantity
    }));

    // Add shipping as a line item
    // Note: Printify returns cost in cents, so no need to multiply by 100
    const shippingPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: shippingCost, // Already in cents from Printify
      product_data: {
        name: 'Shipping'
      }
    });

    lineItems.push({
      price: shippingPrice.id,
      quantity: 1
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://www.holy-chip.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://www.holy-chip.com/checkout.html',
      customer_email: shipping.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU']
      },
      metadata: {
        storeTest: body.storeTest === true ? '1' : '0',   // the daily store test marks its sessions
        shippingCost: shippingCost.toString(),
        // Store cart data for webhook to create Printify order
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId: session.id,
        url: session.url
      })
    };

  } catch (error) {
    console.error('Checkout error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Checkout failed',
        message: error.message
      })
    };
  }
};
