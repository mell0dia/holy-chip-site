// Cloudflare Worker: Stripe Checkout Session Creator
// This replaces the Vercel API endpoint

export default {
  async fetch(request, env) {
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { cart, shipping } = await request.json();

      if (!cart || cart.length === 0) {
        return new Response(JSON.stringify({ error: 'Cart is empty' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!shipping || !shipping.email || !shipping.address1) {
        return new Response(JSON.stringify({ error: 'Missing shipping information' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create Stripe checkout session
      const lineItems = cart.map(item => ({
        price: item.stripePriceId,
        quantity: item.quantity
      }));

      const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'mode': 'payment',
          'success_url': 'https://mell0dia.github.io/holy-chip-site/success.html?session_id={CHECKOUT_SESSION_ID}',
          'cancel_url': 'https://mell0dia.github.io/holy-chip-site/checkout.html',
          'customer_email': shipping.email,
          'shipping_address_collection[allowed_countries][0]': 'US',
          'shipping_address_collection[allowed_countries][1]': 'CA',
          'shipping_address_collection[allowed_countries][2]': 'GB',
          'shipping_address_collection[allowed_countries][3]': 'AU',
          ...lineItems.reduce((acc, item, index) => {
            acc[`line_items[${index}][price]`] = item.price;
            acc[`line_items[${index}][quantity]`] = item.quantity;
            return acc;
          }, {}),
          'metadata[shippingData]': JSON.stringify(shipping),
          'metadata[cartData]': JSON.stringify(cart)
        })
      });

      if (!stripeResponse.ok) {
        const errorText = await stripeResponse.text();
        throw new Error(`Stripe API error: ${stripeResponse.status} - ${errorText}`);
      }

      const session = await stripeResponse.json();

      return new Response(JSON.stringify({
        sessionId: session.id,
        url: session.url
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      return new Response(JSON.stringify({
        error: 'Checkout failed',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
