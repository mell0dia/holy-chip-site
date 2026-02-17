// Check which products are published and where

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getProductDetails(productId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  return await response.json();
}

async function checkPublishedProducts() {
  console.log('🔍 Checking Published Products Status\n');

  try {
    // Check a few mug products
    const mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

    console.log('Checking first mug (Chip_0)...\n');
    const product = await getProductDetails(mugMapping.products[0].productId);

    console.log(`Product: ${product.title}`);
    console.log(`ID: ${product.id}`);
    console.log(`Visible: ${product.visible}`);
    console.log(`Published: ${product.is_locked ? 'Yes' : 'No'}`);

    if (product.sales_channel_properties) {
      console.log(`\nSales Channel Properties:`);
      console.log(JSON.stringify(product.sales_channel_properties, null, 2));
    }

    console.log(`\n📋 To add products to your Pop-Up Store:`);
    console.log(`1. Go to Printify Dashboard → My Products`);
    console.log(`2. For each product, click the "..." menu`);
    console.log(`3. Select "Add to Pop-Up Store" or "Publish to Store"`);
    console.log(`\nOr we can try republishing via API to the Pop-Up Store channel.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPublishedProducts();
