// Printify Product Automation Script
// Creates all Holy Chip products automatically

const fs = require('fs');
const path = require('path');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const PRINTIFY_BLUEPRINTS = config.PRINTIFY_BLUEPRINTS;

// List of all Chips
const CHIPS = [
  'Chip_0', 'Chip_1',
  'Chip_100', 'Chip_101', 'Chip_110', 'Chip_111',
  'Chip_1000', 'Chip_1001', 'Chip_1010', 'Chip_1011',
  'Chip_1100', 'Chip_1101'
];

// Product mapping (will be saved)
const productMapping = [];

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
  return result.id;
}

// Create a product
async function createProduct(chipName, productType, chipImageId, brandImageId) {
  console.log(`\n🏭 Creating ${chipName} ${productType}...`);

  const title = `Holy Chip - ${chipName} ${productType.charAt(0).toUpperCase() + productType.slice(1)}`;

  // Get blueprint details to find print provider and variant
  const blueprintId = PRINTIFY_BLUEPRINTS[productType];

  const blueprintResponse = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}.json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  const blueprint = await blueprintResponse.json();
  const printProvider = blueprint.print_providers[0]; // Use first print provider
  const variant = printProvider.variants[0]; // Use first variant (usually default size/color)

  // Create product
  const productData = {
    title: title,
    description: `${chipName} on ${productType} - AI made by a Human`,
    blueprint_id: blueprintId,
    print_provider_id: printProvider.id,
    variants: [
      {
        id: variant.id,
        price: productType === 'tshirt' ? 2500 : productType === 'mug' ? 1500 : 2000, // Price in cents
        is_enabled: true
      }
    ],
    print_areas: [
      {
        variant_ids: [variant.id],
        placeholders: [
          {
            position: 'front', // For now, simple approach
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

  // Save mapping
  productMapping.push({
    chip: chipName,
    productType: productType,
    printifyProductId: product.id,
    title: title
  });

  return product.id;
}

// Main automation function
async function automateProductCreation() {
  console.log('🚀 Holy Chip Product Automation\n');
  console.log(`Creating products for ${CHIPS.length} chips × 3 product types = ${CHIPS.length * 3} products\n`);

  try {
    // Step 1: Upload brand image
    console.log('📦 Step 1: Uploading brand image...');
    const brandImageId = await uploadImage('assets/brand.png', 'holychip-brand.png');

    // Step 2: Upload all Chip images
    console.log('\n📦 Step 2: Uploading Chip images...');
    const chipImageIds = {};

    for (const chip of CHIPS) {
      const chipPath = `characters/${chip}.png`;
      chipImageIds[chip] = await uploadImage(chipPath, `${chip}.png`);
    }

    // Step 3: Create products
    console.log('\n📦 Step 3: Creating products...');

    for (const chip of CHIPS) {
      for (const productType of ['tshirt', 'mug', 'hat']) {
        await createProduct(chip, productType, chipImageIds[chip], brandImageId);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Step 4: Save mapping
    console.log('\n📦 Step 4: Saving product mapping...');
    fs.writeFileSync(
      'printify-products.json',
      JSON.stringify(productMapping, null, 2)
    );
    console.log('✅ Saved to printify-products.json');

    console.log('\n🎉 SUCCESS! All products created!');
    console.log(`\nTotal products: ${productMapping.length}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nPartial mapping saved to printify-products.json');
    fs.writeFileSync(
      'printify-products.json',
      JSON.stringify(productMapping, null, 2)
    );
  }
}

// Run automation
automateProductCreation();
