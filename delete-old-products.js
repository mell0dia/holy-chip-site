// Delete old t-shirt test products
// Keep the new 24 products, the mug, and the pixel nun t-shirt

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Old t-shirt products to delete
const oldProducts = [
  { id: '69935e87be1f7dc43a02d962', name: 'Chip_1 Style 5 (old test)' },
  { id: '69935e85350878b66800c5d2', name: 'Chip_1 Style 3 (old test)' },
  { id: '698fcc5a90577c34b0045ded', name: 'Chip_110 Tshirt' },
  { id: '698fcbba7d7e3387bd030bdb', name: 'Chip_101 Tshirt' },
  { id: '698fcb00bca977ae630b5919', name: 'Chip_100 Tshirt' },
  { id: '698fca5f8a2cda4b7b09483c', name: 'Chip_1 Tshirt' },
  { id: '698fc9c27d7e3387bd030b93', name: 'Chip_0 Tshirt' }
];

async function deleteProduct(productId, name) {
  console.log(`🗑️  Deleting: ${name} (${productId})...`);

  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete: ${response.statusText}`);
  }

  console.log(`  ✅ Deleted`);
}

async function deleteOldProducts() {
  console.log('🗑️  Deleting old t-shirt test products');
  console.log(`📦 Total to delete: ${oldProducts.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const product of oldProducts) {
    try {
      await deleteProduct(product.id, product.name);
      successCount++;
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n✅ Deleted: ${successCount} products`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} products`);
  }

  console.log('\n📋 Remaining products:');
  console.log('   - 24 new products (Chip_0 - Chip_1101, Style 3 & 5)');
  console.log('   - 1 mug (Accent Coffee Mug)');
  console.log('   - 1 other t-shirt (pixel nun graphic)');
  console.log('   Total: 26 products');
}

deleteOldProducts();
