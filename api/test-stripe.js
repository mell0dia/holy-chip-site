// Minimal Stripe test endpoint
const Stripe = require('stripe');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    console.log('Initializing Stripe...');
    console.log('API Key exists:', !!process.env.STRIPE_SECRET_KEY);
    console.log('API Key starts with:', process.env.STRIPE_SECRET_KEY?.substring(0, 15));

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    console.log('Stripe initialized, attempting API call...');

    // Simple API call
    const balance = await stripe.balance.retrieve();

    console.log('Success! Balance:', balance);

    res.status(200).json({
      success: true,
      message: 'Stripe connection works!',
      balance: balance
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw
    });
  }
};
