// TEST: Create Chip_1 mug with 3 colors (Black, Red, Navy) × 2 sizes

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

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

// Get print providers
async function getPrintProviders(blueprintId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });
  if (!response.ok) throw new Error(`Failed to get print providers: ${response.statusText}`);
  return await response.json();
}

// Get variants
async function getVariants(blueprintId, printProviderId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });
  if (!response.ok) throw new Error(`Failed to get variants: ${response.statusText}`);
  const data = await response.json();
  return data.variants;
}

// Create mug product
async function createMugProduct(chipName, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  console.log(`\n☕ Creating ${chipName} Mug...`);

  const title = `Holy Chip - ${chipName} Mug`;

  // Filter for Black, Red, Navy in both 11oz and 15oz
  const selectedVariants = variants.filter(v =>
    (v.title.includes('Black') || v.title.includes('Red') || v.title.includes('Navy'))
  );

  console.log(`✅ Selected ${selectedVariants.length} variants:`);
  selectedVariants.forEach(v => console.log(`   - ${v.title}`));

  // Get all variant IDs
  const variantIds = selectedVariants.map(v => v.id);

  // Create product data - Chip (left) + Brand (right) side by side
  const productData = {
    title: title,
    description: `${chipName} mug with Holy Chip branding - AI made by a Human`,
    blueprint_id: blueprintId,
    print_provider_id: printProvider.id,
    variants: selectedVariants.map(v => ({
      id: v.id,
      price: 1500, // $15.00
      is_enabled: true
    })),
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: 'default',
            images: [
              {
                id: chipImageId,
                x: 0.35,      // Left side
                y: 0.5,       // Centered vertically
                scale: 0.8,   // 80% size
                angle: 0
              },
              {
                id: brandImageId,
                x: 0.65,      // Right side
                y: 0.5,       // Centered vertically
                scale: 0.6,   // 60% size (smaller than chip)
                angle: 0
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('\n📐 Design: Chip (left, 80%) + Brand (right, 60%)');

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
  console.log(`✅ Created: ${product.id} - ${title}`);
  console.log(`   View: https://printify.com/app/products/${product.id}`);

  return product;
}

// Main test
async function testMugCreation() {
  console.log('🧪 TEST: Creating Chip_1 Mug (Black, Red, Navy × 11oz, 15oz)\n');

  try {
    console.log('📤 Uploading images...');
    const chipImage = await uploadImage('characters/Chip_1.png', 'Chip_1.png');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    console.log('\n📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    console.log(`✅ Using: ${printProvider.title}`);

    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);

    const product = await createMugProduct('Chip_1', chipImage.id, brandImage.id, MUG_BLUEPRINT_ID, printProvider, variants);

    console.log('\n🎉 TEST SUCCESS!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Check Printify dashboard to verify mug design');
    console.log('   2. Verify 6 variants (Black, Red, Navy × 11oz, 15oz)');
    console.log('   3. If good, run create-all-mugs.js to create all 12 mugs');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testMugCreation();
