// Setup Stripe Products and Prices for all Holy Chip products
// Run this once to create products in Stripe and save Price IDs

const fs = require('fs');
const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'YOUR_STRIPE_SECRET_KEY';
const stripe = new Stripe(STRIPE_SECRET_KEY);

const MUG_PRICE = 15.00;
const TSHIRT_PRICE = 25.00;

async function createStripeProduct(name, price, description) {
  console.log(`Creating Stripe product: ${name}...`);

  try {
    // Create product
    const product = await stripe.products.create({
      name: name,
      description: description,
      default_price_data: {
        currency: 'usd',
        unit_amount: Math.round(price * 100) // Convert to cents
      }
    });

    console.log(`✅ Created: ${name} (Price ID: ${product.default_price})`);
    return product.default_price;

  } catch (error) {
    console.error(`❌ Failed to create ${name}:`, error.message);
    throw error;
  }
}

async function setupAllProducts() {
  console.log('Setting up Stripe products for Holy Chip...\n');

  const productDataPath = 'public/product-data.json';
  const productData = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));

  // Process mugs
  console.log('=== CREATING MUGS ===\n');
  for (const product of productData.mugs.products) {
    const name = `Holy Chip - ${product.chip} Mug`;
    const description = `Ceramic mug featuring ${product.chip}`;

    const priceId = await createStripeProduct(name, MUG_PRICE, description);
    product.stripePriceId = priceId;
    product.price = MUG_PRICE;
  }

  // Process t-shirts
  console.log('\n=== CREATING T-SHIRTS ===\n');
  for (const product of productData.tshirts.products) {
    const styleName = product.style === 'style3' ? 'Unisex' : 'Fitted';
    const name = `Holy Chip - ${product.chip} T-Shirt (${styleName})`;
    const description = `${styleName} t-shirt featuring ${product.chip}`;

    const priceId = await createStripeProduct(name, TSHIRT_PRICE, description);
    product.stripePriceId = priceId;
    product.price = TSHIRT_PRICE;
  }

  // Update product-data.json with Stripe Price IDs
  productData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(productDataPath, JSON.stringify(productData, null, 2));

  console.log('\n✅ ALL PRODUCTS CREATED!');
  console.log(`Updated ${productDataPath} with Stripe Price IDs`);
  console.log(`\nTotal products: ${productData.mugs.products.length + productData.tshirts.products.length}`);
}

setupAllProducts().catch(console.error);
