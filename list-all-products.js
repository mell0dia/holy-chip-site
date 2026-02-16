// List all products in Printify store

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function listAllProducts() {
  console.log('📦 Listing all products in Printify store...\n');

  try {
    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get products: ${response.statusText}`);
    }

    const products = await response.json();

    console.log(`Total products: ${products.data.length}\n`);

    products.data.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Blueprint: ${product.blueprint_id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllProducts();
