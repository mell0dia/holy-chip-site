// Netlify Function: Stripe Checkout Session Creator
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    // Create Stripe checkout session
    const lineItems = cart.map(item => ({
      price: item.stripePriceId,
      quantity: item.quantity
    }));

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
        cartData: JSON.stringify(cart)
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
