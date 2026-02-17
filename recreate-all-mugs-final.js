// Recreate All 12 Holy Chip Mugs with Correct Settings
//
// SOLUTION FOUND THROUGH TESTING:
// ================================
// 1. Position MUST be "front" (not "default") for mugs
// 2. Chip image positioning: x=0.30 (30% from left), scale=0.55 (55% size)
// 3. Brand image positioning: x=0.80 (80% from left / 20% from right), scale=0.5 (50% size)
// 4. Both images: y=0.5 (centered vertically), angle=0
//
// This configuration ensures:
// - Images don't overlap
// - Chip appears on left side of mug
// - Brand appears on right side of mug
// - Proper sizing for visual balance

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

// All 12 Chip characters
const CHIPS = [
  'Chip_0', 'Chip_1',
  'Chip_100', 'Chip_101', 'Chip_110', 'Chip_111',
  'Chip_1000', 'Chip_1001', 'Chip_1010', 'Chip_1011',
  'Chip_1100', 'Chip_1101'
];

// Delete product
async function deleteProduct(productId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to delete product: ${response.statusText}`);
  }

  return true;
}

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

  const variantIds = selectedVariants.map(v => v.id);

  // CRITICAL: Print area configuration for mugs
  // - position: "front" is required (not "default")
  // - Chip on left: x=0.30, scale=0.55
  // - Brand on right: x=0.80, scale=0.5
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
            position: "front",  // MUST be "front" for mugs, not "default"
            images: [
              {
                id: chipImageId,
                x: 0.30,      // 30% from left
                y: 0.5,       // Center vertical
                scale: 0.55,  // 55% size (tested to avoid overlap)
                angle: 0
              },
              {
                id: brandImageId,
                x: 0.80,      // 80% from left (20% from right)
                y: 0.5,       // Center vertical
                scale: 0.5,   // 50% size (tested to match chip)
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
  console.log(`  ✅ Created: ${product.id}`);

  return product;
}

async function recreateAllMugs() {
  console.log('☕ Recreating All 12 Holy Chip Mugs with Correct Settings');
  console.log('📋 Settings: position="front", Chip(x=0.30, scale=0.55), Brand(x=0.80, scale=0.5)\n');

  const results = [];
  let deleteCount = 0;
  let createCount = 0;

  try {
    // Load current mug mapping to get product IDs to delete
    let mugMapping = null;
    if (fs.existsSync('mug-mapping.json')) {
      mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

      console.log('🗑️  Deleting old mugs...');
      for (const product of mugMapping.products) {
        try {
          await deleteProduct(product.productId);
          console.log(`  ✅ Deleted: ${product.chip}`);
          deleteCount++;
        } catch (error) {
          console.log(`  ⚠️  Could not delete ${product.chip}: ${error.message}`);
        }
      }
      console.log('');
    }

    // Delete test mug
    if (fs.existsSync('test-mug-id.txt')) {
      const testMugId = fs.readFileSync('test-mug-id.txt', 'utf8').trim();
      try {
        await deleteProduct(testMugId);
        console.log(`🗑️  Deleted test mug\n`);
      } catch (error) {
        console.log(`⚠️  Could not delete test mug: ${error.message}\n`);
      }
    }

    // Get print providers and variants
    console.log('📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Upload brand image once (reused for all mugs)
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');
    console.log('');

    // Create mug for each Chip
    for (const chip of CHIPS) {
      console.log(`☕ Processing ${chip}...`);

      // Upload chip image
      const chipImage = await uploadImage(`characters/${chip}.png`, `${chip}.png`);

      // Create mug product with correct settings
      const mugProduct = await createMugProduct(
        chip, chipImage.id, brandImage.id,
        MUG_BLUEPRINT_ID, printProvider, variants
      );

      results.push({ chip, productId: mugProduct.id });
      createCount++;

      console.log('');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save new mug mapping
    const mapping = {
      created_at: new Date().toISOString(),
      total_products: results.length,
      settings: {
        position: "front",
        chip: { x: 0.30, y: 0.5, scale: 0.55 },
        brand: { x: 0.80, y: 0.5, scale: 0.5 }
      },
      products: results
    };

    fs.writeFileSync('mug-mapping.json', JSON.stringify(mapping, null, 2));

    console.log('🎉 SUCCESS!');
    console.log(`🗑️  Deleted: ${deleteCount} old mugs`);
    console.log(`✅ Created: ${createCount} new mugs with correct settings`);
    console.log(`📋 Mug mapping saved to: mug-mapping.json`);
    console.log(`\n📸 Printify will generate mockups in 30min - 2 hours`);
    console.log(`🔄 Run "node fetch-all-mug-angles.js" later to download mockup images`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

recreateAllMugs();
