// Create all Holy Chip T-shirt products
// 12 Chips × 2 Styles = 24 products
// WHITE shirts as primary variant

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const PRINTIFY_BLUEPRINTS = config.PRINTIFY_BLUEPRINTS;

// All Chip characters
const CHIPS = [
  'Chip_0', 'Chip_1',
  'Chip_100', 'Chip_101', 'Chip_110', 'Chip_111',
  'Chip_1000', 'Chip_1001', 'Chip_1010', 'Chip_1011',
  'Chip_1100', 'Chip_1101'
];

// Product styles
const STYLES = {
  style3: {
    name: 'Style 3',
    description: 'Front: Chip | Back: Brand (50% top)',
    price: 2500, // $25.00
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
    price: 2500, // $25.00
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

// Upload image to Printify
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

// Create a product
async function createProduct(chipName, styleKey, chipImageId, brandImageId, blueprintId, printProvider, variants) {
  const style = STYLES[styleKey];
  const title = `Holy Chip - ${chipName} ${style.name}`;

  // Filter for WHITE variants only
  const whiteVariants = variants.filter(v => v.title.includes('White'));

  if (whiteVariants.length === 0) {
    throw new Error('No white variants found!');
  }

  console.log(`  Found ${whiteVariants.length} white variants`);

  // Get all white variant IDs
  const whiteVariantIds = whiteVariants.map(v => v.id);

  // Create product data
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

// Main function
async function createAllProducts() {
  console.log('🎨 Creating All Holy Chip T-shirt Products');
  console.log(`📦 Total: ${CHIPS.length} Chips × 2 Styles = ${CHIPS.length * 2} products\n`);

  const results = [];

  try {
    // Upload brand image once (reuse for all products)
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');

    // Get print providers and variants once
    console.log('\n📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(PRINTIFY_BLUEPRINTS.tshirt);
    const printProvider = printProviders[0];
    const variants = await getVariants(PRINTIFY_BLUEPRINTS.tshirt, printProvider.id);
    console.log(`✅ Using print provider: ${printProvider.title}`);

    // Create products for each Chip
    for (const chip of CHIPS) {
      console.log(`\n🔷 Processing ${chip}...`);

      // Upload chip image
      const chipImage = await uploadImage(`characters/${chip}.png`, `${chip}.png`);

      // Create Style 3 product
      console.log(`  Creating ${chip} - Style 3...`);
      const style3Product = await createProduct(
        chip, 'style3', chipImage.id, brandImage.id,
        PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants
      );
      results.push({ chip, style: 'style3', productId: style3Product.id });

      // Create Style 5 product
      console.log(`  Creating ${chip} - Style 5...`);
      const style5Product = await createProduct(
        chip, 'style5', chipImage.id, brandImage.id,
        PRINTIFY_BLUEPRINTS.tshirt, printProvider, variants
      );
      results.push({ chip, style: 'style5', productId: style5Product.id });
    }

    // Save product mapping
    const mapping = {
      created_at: new Date().toISOString(),
      total_products: results.length,
      products: results
    };

    fs.writeFileSync('product-mapping.json', JSON.stringify(mapping, null, 2));

    console.log('\n\n🎉 SUCCESS!');
    console.log(`✅ Created ${results.length} products`);
    console.log(`📋 Product mapping saved to: product-mapping.json`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
createAllProducts();
