// Printify Product Test v3 - Create Chip_100 T-shirt
// Front: Chip_100, Back: Brand (50% size, top position)

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

// Create a product with front and back print areas
async function createProduct(chipName, productType, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  console.log(`\n🏭 Creating ${chipName} ${productType}...`);

  const title = `Holy Chip - ${chipName} ${productType.charAt(0).toUpperCase() + productType.slice(1)}`;

  const variant = variants[0];

  // Create product data
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
                id: chipImageId,
                x: 0.5,
                y: 0.5,
                scale: 1,
                angle: 0
              }
            ]
          },
          {
            position: 'back',
            images: [
              {
                id: brandImageId,
                x: 0.5,     // Centered horizontally
                y: 0.2,     // Top of print area
                scale: 0.5, // 50% size
                angle: 0
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('  Front: Chip (100% size, centered)');
  console.log('  Back: Brand (50% size, top position)');

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
  console.log('🧪 TEST v3: Chip_100 T-shirt (Brand 50% size, top position)\n');

  try {
    console.log('📦 Uploading Chip_100 image...');
    const chipImage = await uploadImage('characters/Chip_100.png', 'Chip_100.png');

    console.log('\n📦 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    console.log('\n📦 Getting print providers...');
    const printProviders = await getPrintProviders(PRINTIFY_BLUEPRINTS.tshirt);
    const printProvider = printProviders[0];

    console.log('\n📦 Getting variants...');
    const variants = await getVariants(PRINTIFY_BLUEPRINTS.tshirt, printProvider.id);

    console.log('\n📦 Creating product...');
    const product = await createProduct('Chip_100', 'tshirt', chipImage.id, brandImage.id, PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants);

    console.log('\n🎉 SUCCESS!');
    console.log('\n📋 Product Details:');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   Front: Chip_100 (full size, centered)`);
    console.log(`   Back: Brand (50% size, top position)`);
    console.log(`   View: https://printify.com/app/products/${product.id}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run test
testProductCreation();
