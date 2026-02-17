// Check what a created mug product actually looks like

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

async function checkProduct(productId, chipName) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  const product = await response.json();

  console.log(`\n📦 ${chipName}`);
  console.log(`Product ID: ${product.id}`);
  console.log(`Title: ${product.title}`);
  console.log(`\nPrint Areas: ${product.print_areas?.length || 0}`);

  if (product.print_areas && product.print_areas.length > 0) {
    product.print_areas.forEach((area, i) => {
      console.log(`\n  Print Area ${i}:`);
      console.log(`    Variants: ${area.variant_ids?.length || 0}`);
      console.log(`    Placeholders: ${area.placeholders?.length || 0}`);

      if (area.placeholders && area.placeholders.length > 0) {
        area.placeholders.forEach((ph, j) => {
          console.log(`\n    Placeholder ${j}:`);
          console.log(`      Position: ${ph.position}`);
          console.log(`      Images: ${ph.images?.length || 0}`);

          if (ph.images && ph.images.length > 0) {
            ph.images.forEach((img, k) => {
              console.log(`\n      Image ${k}:`);
              console.log(`        ID: ${img.id}`);
              console.log(`        X: ${img.x}, Y: ${img.y}`);
              console.log(`        Scale: ${img.scale}`);
            });
          }
        });
      }
    });
  }

  console.log(`\nImages (mockups): ${product.images?.length || 0}`);

  // Save full product data for inspection
  fs.writeFileSync(`product-${chipName}-inspect.json`, JSON.stringify(product, null, 2));
  console.log(`\n✅ Full product data saved to: product-${chipName}-inspect.json`);
}

async function main() {
  console.log('🔍 Checking Mug Products\n');

  try {
    // Check Chip_1 (one that should have images)
    const chip1 = mugMapping.products.find(p => p.chip === 'Chip_1');
    await checkProduct(chip1.productId, 'Chip_1');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
