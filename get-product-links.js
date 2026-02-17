// Get Printify product links for all products
const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getProductDetails(productId) {
  const response = await fetch(
    `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  return await response.json();
}

async function getAllProductLinks() {
  console.log('Getting Printify product links...\n');

  const productData = JSON.parse(fs.readFileSync('public/product-data.json', 'utf8'));

  console.log('=== MUGS ===\n');
  for (const mug of productData.mugs.products) {
    try {
      const product = await getProductDetails(mug.productId);
      console.log(`${mug.chip}:`);
      console.log(`  Store URL: https://holychip.printify.me/product/${product.id}/${product.title.toLowerCase().replace(/\s+/g, '-')}`);
      console.log(`  Product ID: ${product.id}`);
      console.log('');
    } catch (error) {
      console.error(`Error for ${mug.chip}:`, error.message);
    }
  }

  console.log('\n=== T-SHIRTS ===\n');
  for (const tshirt of productData.tshirts.products) {
    try {
      const product = await getProductDetails(tshirt.productId);
      console.log(`${tshirt.chip} - ${tshirt.style}:`);
      console.log(`  Store URL: https://holychip.printify.me/product/${product.id}/${product.title.toLowerCase().replace(/\s+/g, '-')}`);
      console.log(`  Product ID: ${product.id}`);
      console.log('');
    } catch (error) {
      console.error(`Error for ${tshirt.chip} ${tshirt.style}:`, error.message);
    }
  }
}

getAllProductLinks();
