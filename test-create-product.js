// Printify Product Test - Create ONE product to validate the flow
// Creates: Chip_0 T-shirt

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
  console.log(`🔍 Getting print providers for blueprint ${blueprintId}...`);

  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers.json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get print providers: ${response.statusText}`);
  }

  const printProviders = await response.json();
  console.log(`  Found ${printProviders.length} print providers`);
  return printProviders;
}

// Get variants for a print provider
async function getVariants(blueprintId, printProviderId) {
  console.log(`🔍 Getting variants for print provider ${printProviderId}...`);

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
  console.log(`  Found ${data.variants.length} variants`);
  return data.variants;
}

// Create a product
async function createProduct(chipName, productType, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  console.log(`\n🏭 Creating ${chipName} ${productType}...`);

  const title = `Holy Chip - ${chipName} ${productType.charAt(0).toUpperCase() + productType.slice(1)}`;

  console.log(`  Using print provider: ${printProvider.title}`);

  // Use first variant (usually default)
  const variant = variants[0];
  console.log(`  Using variant ID: ${variant.id}`);

  // Create product data
  const productData = {
    title: title,
    description: `${chipName} on ${productType} - AI made by a Human`,
    blueprint_id: blueprintId,
    print_provider_id: printProvider.id,
    variants: [
      {
        id: variant.id,
        price: 2500, // $25.00 for t-shirt
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
          }
        ]
      }
    ]
  };

  console.log('  Creating product in Printify...');

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
  console.log(`   View in Printify: https://printify.com/app/products/${product.id}`);

  return product;
}

// Main test function
async function testProductCreation() {
  console.log('🧪 TEST: Creating Chip_0 T-shirt\n');

  try {
    // Step 1: Upload Chip_0 image
    console.log('📦 Step 1: Uploading Chip_0 image...');
    const chipImage = await uploadImage('characters/Chip_0.png', 'Chip_0.png');

    // Step 2: Upload brand image
    console.log('\n📦 Step 2: Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    // Step 3: Get print providers
    console.log('\n📦 Step 3: Getting print providers...');
    const printProviders = await getPrintProviders(PRINTIFY_BLUEPRINTS.tshirt);
    const printProvider = printProviders[0]; // Use first provider

    // Step 4: Get variants
    console.log('\n📦 Step 4: Getting variants...');
    const variants = await getVariants(PRINTIFY_BLUEPRINTS.tshirt, printProvider.id);

    // Step 5: Create product
    console.log('\n📦 Step 5: Creating product...');
    const product = await createProduct('Chip_0', 'tshirt', chipImage.id, brandImage.id, PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants);

    // Success!
    console.log('\n🎉 SUCCESS!');
    console.log('\n📋 Product Details:');
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Title: ${product.title}`);
    console.log(`   View: https://printify.com/app/products/${product.id}`);

    console.log('\n✅ Test passed! Ready to run full automation.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPlease check the error and try again.');
  }
}

// Run test
testProductCreation();
