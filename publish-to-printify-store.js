// Publish all products to Printify Store
// This makes products available for purchase on your Printify store

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Publish a product
async function publishProduct(productId, productName) {
  console.log(`📤 Publishing: ${productName}...`);

  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}/publish.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: true,        // Publish with title
      description: true,  // Publish with description
      images: true,       // Publish with images
      variants: true,     // Publish with variants
      tags: true          // Publish with tags
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish: ${error}`);
  }

  console.log(`✅ Published: ${productName}`);
  return await response.json();
}

async function publishAllProducts() {
  console.log('🚀 Publishing All Products to Printify Store\n');

  let successCount = 0;
  let failCount = 0;

  try {
    // Read from public/product-data.json (the authoritative source)
    const productDataPath = 'public/product-data.json';
    if (!fs.existsSync(productDataPath)) {
      throw new Error('product-data.json not found');
    }

    const productData = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));

    // Publish mugs
    console.log('☕ Publishing Mugs...\n');
    for (const product of productData.mugs.products) {
      try {
        await publishProduct(product.productId, `${product.chip} Mug`);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to publish ${product.chip}: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n');

    // Publish t-shirts
    console.log('👕 Publishing T-Shirts...\n');
    for (const product of productData.tshirts.products) {
      try {
        await publishProduct(product.productId, `${product.chip} ${product.style}`);
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Failed to publish ${product.chip} ${product.style}: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n🎉 Done!');
    console.log(`✅ Successfully published: ${successCount} products`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount} products`);
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Printify dashboard');
    console.log('2. Click "My Products" → Published products should show');
    console.log('3. Get your Printify Store URL (Settings → Store)');
    console.log('4. Update the checkout button to redirect to your store');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

publishAllProducts();
