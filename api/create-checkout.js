// Vercel Serverless Function: Create Stripe Checkout Session
// This creates a payment session and prepares for order creation

const Stripe = require('stripe');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cart, shipping } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    if (!shipping || !shipping.email || !shipping.address1) {
      return res.status(400).json({ error: 'Missing shipping information' });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Base URL for images and redirects
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    // Create line items for Stripe
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productName,
          images: [item.productImage ? `${baseUrl}/${item.productImage}` : undefined].filter(Boolean)
        },
        unit_amount: Math.round(item.price * 100) // Convert to cents
      },
      quantity: item.quantity
    }));

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store.html`,
      customer_email: shipping.email,
      metadata: {
        shippingData: JSON.stringify(shipping),
        cartData: JSON.stringify(cart)
      }
    });

    res.status(200).json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout error:', error);
    console.error('Error type:', error.type);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      error: 'Checkout failed',
      message: error.message,
      type: error.type,
      code: error.code
    });
  }
};
