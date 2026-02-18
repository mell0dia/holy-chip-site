// Netlify Function: Stripe Checkout Session Creator
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRINTIFY_CONFIG = {
  apiToken: process.env.PRINTIFY_API_TOKEN || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjIxNGYwMjJiYjU4NTgyMGU5Y2M1MjM5N2NlMDM0ZGYwNWQ5OWEwNjVlZjUxMjAxMDc3YWU2NmRjMTU1MmVjNjMyNTExZDdhMDE2NDI1Y2JiIiwiaWF0IjoxNzcxMDE1MzYxLjU3MDc5NiwibmJmIjoxNzcxMDE1MzYxLjU3MDc5OCwiZXhwIjoxODAyNTUxMzYxLjU2Mzk3MSwic3ViIjoiMjYzNjY3MzkiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.hCbQjh8QWaO1ex0_A6RmgB-0t_Q6auD1UeoLCSS3ZzhPC4gEFsPHHsVyTb5VVHEDvZkaDLrV9XJR8j8HFuWbdJApNUPHycXDBbRS7LwOMPYJD1jS5dmPv1MhofCF22FRsDArIkMIe9k3FjjsuINkOB3vgER99GqbGwIddxmBuNX6foePwqtlv7Hml3xlMCxQLaknHepFK7hXgV9JHaSTJUPNLSTq71bvfaapCZAGBIbxJvBsLhkLjUIqxVNiL_mP3b_c7SeKf7nbged1nObMQCz8GM42WiBnFkpeQN4ZGMFLrB4BtjgCqOAS8Bm-1GZUeQRkliqY6wNz47c1keNegwZOp17Kewv5JHI4qIVHVyuEHWRq-XD8jKOygnh43uBKk3TPp50NdCcDY0czGZquIb_K8DpimYnM-yfnHDLzsjfsP6bz1kzbU6cZZ-ZSCkOFhJAl2NCELYZ3o0sPsDYlCrdOOW4B7nFP7jsOtBDUUCUS02lwAnB_L95YyktFkOi2bJwIdNhW1mNVbQKjlNXPlGCSttdV33IXNYVN8SfAXucDCg4CtvOPf_9SbK25iJYzrWbdirAbiji1X1QK5cUOyS8yI1bVJg9-73sGzZVdfY5HjHrHSETkVPq6o63SYgrx3zE8Qy1j4Y3h8U--dhIIPuUSnvxIEU1IMPo1XsI-sFs',
  shopId: process.env.PRINTIFY_SHOP_ID || '26508747',
  apiBase: 'https://api.printify.com/v1'
};

// Fetch product variant ID from Printify
async function getProductVariant(productId) {
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
    const enabledVariant = product.variants.find(v => v.is_enabled);

    if (!enabledVariant) {
      console.error(`No enabled variants found for product ${productId}`);
      return null;
    }

    return enabledVariant.id;
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
    const { cart, shipping } = JSON.parse(event.body);

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

      const variantId = await getProductVariant(item.productId);

      if (!variantId) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to get product variant' })
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
    const shippingPrice = await stripe.prices.create({
      currency: 'usd',
      unit_amount: Math.round(shippingCost * 100), // Convert to cents
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
      success_url: 'https://mell0dia.github.io/holy-chip-site/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://mell0dia.github.io/holy-chip-site/checkout.html',
      customer_email: shipping.email,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU']
      },
      metadata: {
        shippingData: JSON.stringify(shipping),
        cartData: JSON.stringify(cart),
        shippingCost: shippingCost.toString()
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
