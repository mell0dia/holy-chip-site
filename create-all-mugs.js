// Create all Holy Chip Mug products
// 12 Chips × 1 style = 12 mugs
// Each mug: 6 variants (Black, Red, Navy × 11oz, 15oz)

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

// All Chip characters
const CHIPS = [
  'Chip_0', 'Chip_1',
  'Chip_100', 'Chip_101', 'Chip_110', 'Chip_111',
  'Chip_1000', 'Chip_1001', 'Chip_1010', 'Chip_1011',
  'Chip_1100', 'Chip_1101'
];

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

async function getPrintProviders(blueprintId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });
  if (!response.ok) throw new Error(`Failed to get print providers: ${response.statusText}`);
  return await response.json();
}

async function getVariants(blueprintId, printProviderId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });
  if (!response.ok) throw new Error(`Failed to get variants: ${response.statusText}`);
  const data = await response.json();
  return data.variants;
}

async function createMugProduct(chipName, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  const title = `Holy Chip - ${chipName} Mug`;

  // Filter for Black, Red, Navy in both 11oz and 15oz
  const selectedVariants = variants.filter(v =>
    (v.title.includes('Black') || v.title.includes('Red') || v.title.includes('Navy'))
  );

  console.log(`  Found ${selectedVariants.length} variants (Black, Red, Navy × 11oz, 15oz)`);

  const variantIds = selectedVariants.map(v => v.id);

  // Create product - Chip (left) + Brand (right)
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
                x: 0.35,      // Left
                y: 0.5,       // Center vertical
                scale: 0.8,
                angle: 0
              },
              {
                id: brandImageId,
                x: 0.65,      // Right
                y: 0.5,       // Center vertical
                scale: 0.6,
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
  console.log(`  ✅ Created: ${product.id} - ${title}`);

  return product;
}

async function createAllMugs() {
  console.log('☕ Creating All Holy Chip Mug Products');
  console.log(`📦 Total: ${CHIPS.length} mugs (6 variants each)\n`);

  const results = [];

  try {
    // Upload brand image once
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    // Get print providers and variants once
    console.log('\n📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Create mug for each Chip
    for (const chip of CHIPS) {
      console.log(`☕ Processing ${chip}...`);

      // Upload chip image
      const chipImage = await uploadImage(`characters/${chip}.png`, `${chip}.png`);

      // Create mug product
      const mugProduct = await createMugProduct(
        chip, chipImage.id, brandImage.id,
        MUG_BLUEPRINT_ID, printProvider, variants
      );
      results.push({ chip, productId: mugProduct.id });
    }

    // Save mug mapping
    const mapping = {
      created_at: new Date().toISOString(),
      total_products: results.length,
      products: results
    };

    fs.writeFileSync('mug-mapping.json', JSON.stringify(mapping, null, 2));

    console.log('\n\n🎉 SUCCESS!');
    console.log(`✅ Created ${results.length} mug products`);
    console.log(`📋 Mug mapping saved to: mug-mapping.json`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createAllMugs();
