// Update existing mug products to add Chip + Brand images to print areas

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

// Upload image
async function uploadImage(imagePath, fileName) {
  console.log(`  📤 Uploading ${fileName}...`);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/uploads/images.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_name: fileName,
      contents: base64Image
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  const result = await response.json();
  console.log(`  ✅ Uploaded: ${result.id}`);
  return result;
}

// Get product details
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

// Update product with images
async function updateProductWithImages(productId, chipImageId, brandImageId, variantIds) {
  const updateData = {
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: "front",
            images: [
              {
                id: chipImageId,
                x: 0.35,
                y: 0.5,
                scale: 0.8,
                angle: 0
              },
              {
                id: brandImageId,
                x: 0.65,
                y: 0.5,
                scale: 0.6,
                angle: 0
              }
            ]
          }
        ]
      }
    ]
  };

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

  return await response.json();
}

async function addImagesToMugs() {
  console.log('🖼️  Adding Images to Mug Products\n');

  let successCount = 0;

  try {
    // Upload brand image once
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');
    console.log('');

    // Process each mug
    for (const product of mugMapping.products) {
      console.log(`☕ ${product.chip}...`);

      // Upload chip image
      const chipImage = await uploadImage(`characters/${product.chip}.png`, `${product.chip}.png`);

      // Get current product to get variant IDs
      const currentProduct = await getProduct(product.productId);
      const variantIds = currentProduct.print_areas[0].variant_ids;

      console.log(`  🔧 Updating product with images...`);

      // Update product with images
      await updateProductWithImages(
        product.productId,
        chipImage.id,
        brandImage.id,
        variantIds
      );

      console.log(`  ✅ Images added!\n`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 SUCCESS!');
    console.log(`✅ Added images to ${successCount} mugs`);
    console.log(`\n📋 Next: Check Printify dashboard to verify images appear`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

addImagesToMugs();
