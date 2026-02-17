// Create T-Shirt Products for a Single Character
// Usage: node create-single-tshirt.js Chip_0
// Creates both Style 3 and Style 5 t-shirts

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const TSHIRT_BLUEPRINT_ID = 6; // Bella+Canvas 3001 Unisex

// T-Shirt Styles
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
    description: 'Front: Brand (40% top) + Chip (60% bottom)',
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
              y: 0.30,
              scale: 0.4,
              angle: 0
            },
            {
              id: chipImageId,
              x: 0.5,
              y: 0.65,
              scale: 0.6,
              angle: 0
            }
          ]
        }
      ]
    }]
  }
};

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

async function createTShirt(chipName, styleId, styleConfig, chipImage, brandImage, printProvider, variants) {
  console.log(`\n👕 Creating ${styleConfig.name} T-Shirt for ${chipName}\n`);

  // Filter for WHITE variants only
  const whiteVariants = variants.filter(v => v.title.includes('White'));
  const whiteVariantIds = whiteVariants.map(v => v.id);

  if (whiteVariants.length === 0) {
    throw new Error('No white variants found');
  }

  console.log(`✅ Using ${whiteVariants.length} white variants (all sizes)`);

  // Create product
  const productData = {
    title: `Holy Chip - ${chipName} ${styleConfig.name}`,
    description: `${chipName} ${styleConfig.description} - AI made by a Human`,
    blueprint_id: TSHIRT_BLUEPRINT_ID,
    print_provider_id: printProvider.id,
    variants: whiteVariants.map(v => ({
      id: v.id,
      price: styleConfig.price,
      is_enabled: true
    })),
    print_areas: styleConfig.printAreas(chipImage.id, brandImage.id, whiteVariantIds)
  };

  console.log('🔨 Creating product...');
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
  console.log(`✅ Product created: ${product.id}`);

  return { styleId, productId: product.id };
}

async function createTShirtsForChip(chipName) {
  console.log(`\n👕 Creating T-Shirts for ${chipName}\n`);

  try {
    // Verify character image exists
    const chipPath = `public/characters/${chipName}.png`;
    if (!fs.existsSync(chipPath)) {
      throw new Error(`Character image not found: ${chipPath}`);
    }

    // Upload images (reuse if already uploaded)
    console.log('📤 Uploading images...');
    const chipImage = await uploadImage(chipPath, `${chipName}.png`);
    const brandImage = await uploadImage('public/assets/brand.png', 'holychip-brand.png');
    console.log('');

    // Get print providers and variants
    console.log('📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(TSHIRT_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(TSHIRT_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Create both t-shirt styles
    const results = [];
    for (const [styleId, styleConfig] of Object.entries(STYLES)) {
      const result = await createTShirt(chipName, styleId, styleConfig, chipImage, brandImage, printProvider, variants);
      results.push(result);

      // Wait 2 seconds between products to avoid rate limits
      if (styleId === 'style3') {
        console.log('\n⏳ Waiting 2 seconds before creating next style...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Update product-data.json
    const productDataPath = 'public/product-data.json';
    let productData = {
      lastUpdated: new Date().toISOString(),
      mugs: { products: [] },
      tshirts: { products: [] }
    };

    if (fs.existsSync(productDataPath)) {
      productData = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));
    }

    // Add or update t-shirt products
    for (const { styleId, productId } of results) {
      const existingIndex = productData.tshirts.products.findIndex(
        p => p.chip === chipName && p.style === styleId
      );

      if (existingIndex >= 0) {
        productData.tshirts.products[existingIndex].productId = productId;
      } else {
        productData.tshirts.products.push({ chip: chipName, style: styleId, productId });
      }
    }

    productData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(productDataPath, JSON.stringify(productData, null, 2));
    console.log(`\n✅ Updated public/product-data.json`);

    console.log(`\n🎉 SUCCESS!`);
    console.log(`📋 Created 2 t-shirt styles for ${chipName}`);
    console.log(`🔄 Printify will generate mockups in 30min - 2 hours`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Get chip name from command line
const chipName = process.argv[2];

if (!chipName) {
  console.error('❌ Usage: node create-single-tshirt.js Chip_X');
  console.error('Example: node create-single-tshirt.js Chip_0');
  process.exit(1);
}

createTShirtsForChip(chipName);
