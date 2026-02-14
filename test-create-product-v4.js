// Printify Product Test v4 - Create Chip_101 T-shirt
// Front: Brand (80% top) + Chip_101 (100% bottom), stacked vertically

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const PRINTIFY_BLUEPRINTS = config.PRINTIFY_BLUEPRINTS;

// Upload image to Printify
async function uploadImage(imagePath, fileName) {
  console.log(`📤 Uploading ${fileName}...`);

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
  console.log(`✅ Uploaded: ${result.id}`);
  return result;
}

// Get blueprint print providers
async function getPrintProviders(blueprintId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers.json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get print providers: ${response.statusText}`);
  }

  return await response.json();
}

// Get variants for a print provider
async function getVariants(blueprintId, printProviderId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get variants: ${response.statusText}`);
  }

  const data = await response.json();
  return data.variants;
}

// Create a product with both images on front (stacked)
async function createProduct(chipName, productType, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  console.log(`\n🏭 Creating ${chipName} ${productType}...`);

  const title = `Holy Chip - ${chipName} ${productType.charAt(0).toUpperCase() + productType.slice(1)}`;

  const variant = variants[0];

  // Create product data - both images on FRONT, stacked
  const productData = {
    title: title,
    description: `${chipName} on ${productType} - AI made by a Human`,
    blueprint_id: blueprintId,
    print_provider_id: printProvider.id,
    variants: [
      {
        id: variant.id,
        price: 2500,
        is_enabled: true
      }
    ],
    print_areas: [
      {
        variant_ids: [variant.id],
        placeholders: [
          {
            position: 'front',
            images: [
              {
                id: brandImageId,
                x: 0.5,     // Centered horizontally
                y: 0.25,    // Top position
                scale: 0.8, // 80% size
                angle: 0
              },
              {
                id: chipImageId,
                x: 0.5,     // Centered horizontally
                y: 0.65,    // Below brand
                scale: 1.0, // 100% size
                angle: 0
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('  Front: Brand (80%, top) + Chip (100%, bottom)');
  console.log('  Back: Empty');

  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Product creation failed: ${error}`);
  }

  const product = await response.json();
  console.log(`✅ Created product ID: ${product.id}`);
  console.log(`   View: https://printify.com/app/products/${product.id}`);

  return product;
}

// Main test function
async function testProductCreation() {
  console.log('🧪 TEST v4: Chip_101 T-shirt (Both on front - stacked)\n');

  try {
    console.log('📦 Uploading Chip_101 image...');
    const chipImage = await uploadImage('characters/Chip_101.png', 'Chip_101.png');

    console.log('\n📦 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    console.log('\n📦 Getting print providers...');
    const printProviders = await getPrintProviders(PRINTIFY_BLUEPRINTS.tshirt);
    const printProvider = printProviders[0];

    console.log('\n📦 Getting variants...');
    const variants = await getVariants(PRINTIFY_BLUEPRINTS.tshirt, printProvider.id);

    console.log('\n📦 Creating product...');
    const product = await createProduct('Chip_101', 'tshirt', chipImage.id, brandImage.id, PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants);

    console.log('\n🎉 SUCCESS!');
    console.log('\n📋 Product Details:');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   Front: Brand (80%, top) + Chip_101 (100%, bottom)`);
    console.log(`   Back: Empty`);
    console.log(`   View: https://printify.com/app/products/${product.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run test
testProductCreation();
