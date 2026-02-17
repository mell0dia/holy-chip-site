// Update test mug with better positioning to avoid overlap

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getProduct(productId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  return await response.json();
}

async function updateTestMug() {
  console.log('🔧 Updating Test Mug Positions\n');

  try {
    // Get test mug ID
    const productId = fs.readFileSync('test-mug-id.txt', 'utf8').trim();
    console.log(`Product ID: ${productId}\n`);

    // Get current product
    console.log('📦 Getting current product...');
    const product = await getProduct(productId);
    const variantIds = product.print_areas[0].variant_ids;
    const currentImages = product.print_areas[0].placeholders[0].images;

    console.log(`Current positions:`);
    console.log(`  Chip (Image 0): x=${currentImages[0].x}, y=${currentImages[0].y}, scale=${currentImages[0].scale}`);
    console.log(`  Brand (Image 1): x=${currentImages[1].x}, y=${currentImages[1].y}, scale=${currentImages[1].scale}`);
    console.log('');

    // Update with new positions
    const updateData = {
      print_areas: [
        {
          variant_ids: variantIds,
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: currentImages[0].id,  // Chip
                  x: 0.30,  // 30% from left
                  y: 0.5,
                  scale: 0.55,  // 55% size (reduced by 45% total)
                  angle: 0
                },
                {
                  id: currentImages[1].id,  // Brand
                  x: 0.80,  // 80% from left (20% from right)
                  y: 0.5,
                  scale: 0.5,  // 50% size
                  angle: 0
                }
              ]
            }
          ]
        }
      ]
    };

    console.log('🔨 Updating settings...');
    console.log(`New settings:`);
    console.log(`  Chip: x=0.30, scale=0.55 (55% size)`);
    console.log(`  Brand: x=0.80, scale=0.5 (50% size)`);
    console.log('');

    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Update failed: ${error}`);
    }

    const updatedProduct = await response.json();

    console.log('✅ Product updated!\n');

    const updatedImages = updatedProduct.print_areas[0].placeholders[0].images;
    console.log(`Updated positions:`);
    console.log(`  Chip: x=${updatedImages[0].x}, y=${updatedImages[0].y}, scale=${updatedImages[0].scale}`);
    console.log(`  Brand: x=${updatedImages[1].x}, y=${updatedImages[1].y}, scale=${updatedImages[1].scale}`);

    console.log(`\n✅ Check Printify dashboard to verify the spacing looks better!`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

updateTestMug();
