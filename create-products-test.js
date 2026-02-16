// TEST: Create products for Chip_1 only (2 products)
// Verify white variants and mockup generation before full run

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const PRINTIFY_BLUEPRINTS = config.PRINTIFY_BLUEPRINTS;

// Test with just one Chip
const TEST_CHIPS = ['Chip_1'];

// Product styles
const STYLES = {
  style3: {
    name: 'Style 3',
    description: 'Front: Chip | Back: Brand (50% top)',
    price: 2500,
    printAreas: (chipImageId, brandImageId, whiteVariantIds) => [{
      variant_ids: whiteVariantIds,
      placeholders: [
        {
          position: 'front',
          images: [{
            id: chipImageId,
            x: 0.5,
            y: 0.5,
            scale: 1.0,
            angle: 0
          }]
        },
        {
          position: 'back',
          images: [{
            id: brandImageId,
            x: 0.5,
            y: 0.25,
            scale: 0.5,
            angle: 0
          }]
        }
      ]
    }]
  },
  style5: {
    name: 'Style 5',
    description: 'Front: Brand (80% top) + Chip (80% bottom)',
    price: 2500,
    printAreas: (chipImageId, brandImageId, whiteVariantIds) => [{
      variant_ids: whiteVariantIds,
      placeholders: [
        {
          position: 'front',
          images: [
            {
              id: brandImageId,
              x: 0.5,
              y: 0.3,
              scale: 0.8,
              angle: 0
            },
            {
              id: chipImageId,
              x: 0.5,
              y: 0.75,
              scale: 0.8,
              angle: 0
            }
          ]
        }
      ]
    }]
  }
};

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

async function createProduct(chipName, styleKey, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  const style = STYLES[styleKey];
  const title = `Holy Chip - ${chipName} ${style.name}`;

  // Filter for WHITE variants only
  const whiteVariants = variants.filter(v => v.title.includes('White'));

  if (whiteVariants.length === 0) {
    throw new Error('No white variants found!');
  }

  console.log(`  ✅ Found ${whiteVariants.length} white variants`);
  console.log(`  📏 Sizes: ${whiteVariants.map(v => v.title).join(', ')}`);

  const whiteVariantIds = whiteVariants.map(v => v.id);

  const productData = {
    title: title,
    description: `${chipName} ${style.description} - AI made by a Human`,
    blueprint_id: blueprintId,
    print_provider_id: printProvider.id,
    variants: whiteVariants.map(v => ({
      id: v.id,
      price: style.price,
      is_enabled: true
    })),
    print_areas: style.printAreas(chipImageId, brandImageId, whiteVariantIds)
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

async function testProductCreation() {
  console.log('🧪 TEST: Creating products for Chip_1 (white shirts only)\n');

  try {
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    console.log('\n📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(PRINTIFY_BLUEPRINTS.tshirt);
    const printProvider = printProviders[0];
    const variants = await getVariants(PRINTIFY_BLUEPRINTS.tshirt, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}`);

    for (const chip of TEST_CHIPS) {
      console.log(`\n🔷 Creating products for ${chip}...`);
      const chipImage = await uploadImage(`characters/${chip}.png`, `${chip}.png`);

      console.log('\n  Style 3: Front=Chip | Back=Brand');
      const style3 = await createProduct(chip, 'style3', chipImage.id, brandImage.id, PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants);

      console.log('\n  Style 5: Front=Brand+Chip');
      const style5 = await createProduct(chip, 'style5', chipImage.id, brandImage.id, PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants);

      console.log(`\n✅ ${chip} Products Created:`);
      console.log(`   Style 3: https://printify.com/app/products/${style3.id}`);
      console.log(`   Style 5: https://printify.com/app/products/${style5.id}`);
    }

    console.log('\n\n🎉 TEST SUCCESS!');
    console.log('📋 Next: Check Printify dashboard to verify:');
    console.log('   1. Products show WHITE shirts');
    console.log('   2. Mockups are generated correctly');
    console.log('   3. Front and back designs are correct');
    console.log('\n   Then run: node create-all-products.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testProductCreation();
