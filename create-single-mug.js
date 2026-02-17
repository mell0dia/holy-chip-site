// Create a Single Mug Product for a New Character
// Usage: node create-single-mug.js Chip_10

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

// TESTED SETTINGS - DO NOT CHANGE without testing
const MUG_SETTINGS = {
  position: "front",
  chip: { x: 0.30, y: 0.5, scale: 0.55 },
  brand: { x: 0.80, y: 0.5, scale: 0.5 }
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

async function createMug(chipName) {
  console.log(`\n☕ Creating Mug for ${chipName}\n`);

  try {
    // Verify character image exists
    const chipPath = `characters/${chipName}.png`;
    if (!fs.existsSync(chipPath)) {
      throw new Error(`Character image not found: ${chipPath}`);
    }

    // Upload images
    console.log('📤 Uploading images...');
    const chipImage = await uploadImage(chipPath, `${chipName}.png`);
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');
    console.log('');

    // Get print providers and variants
    console.log('📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Filter for Black, Red, Navy
    const selectedVariants = variants.filter(v =>
      (v.title.includes('Black') || v.title.includes('Red') || v.title.includes('Navy'))
    );

    const variantIds = selectedVariants.map(v => v.id);

    // Create product with tested settings
    const productData = {
      title: `Holy Chip - ${chipName} Mug`,
      description: `${chipName} mug with Holy Chip branding - AI made by a Human`,
      blueprint_id: MUG_BLUEPRINT_ID,
      print_provider_id: printProvider.id,
      variants: selectedVariants.map(v => ({
        id: v.id,
        price: 1500,
        is_enabled: true
      })),
      print_areas: [
        {
          variant_ids: variantIds,
          placeholders: [
            {
              position: MUG_SETTINGS.position,
              images: [
                {
                  id: chipImage.id,
                  x: MUG_SETTINGS.chip.x,
                  y: MUG_SETTINGS.chip.y,
                  scale: MUG_SETTINGS.chip.scale,
                  angle: 0
                },
                {
                  id: brandImage.id,
                  x: MUG_SETTINGS.brand.x,
                  y: MUG_SETTINGS.brand.y,
                  scale: MUG_SETTINGS.brand.scale,
                  angle: 0
                }
              ]
            }
          ]
        }
      ]
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
    console.log(`✅ Product created: ${product.id}\n`);

    // Update mug mapping (legacy file)
    let mapping = { created_at: new Date().toISOString(), total_products: 0, settings: MUG_SETTINGS, products: [] };
    if (fs.existsSync('mug-mapping.json')) {
      mapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));
    }

    // Check if chip already exists and update, otherwise add
    const existingIndex = mapping.products.findIndex(p => p.chip === chipName);
    if (existingIndex >= 0) {
      mapping.products[existingIndex].productId = product.id;
      console.log(`✅ Updated ${chipName} in mug-mapping.json`);
    } else {
      mapping.products.push({ chip: chipName, productId: product.id });
      mapping.total_products = mapping.products.length;
      console.log(`✅ Added ${chipName} to mug-mapping.json`);
    }

    fs.writeFileSync('mug-mapping.json', JSON.stringify(mapping, null, 2));

    // ALSO update public/product-data.json (for deployment)
    const productDataPath = 'public/product-data.json';
    let productData = { lastUpdated: new Date().toISOString(), mugs: { settings: MUG_SETTINGS, products: [] }, tshirts: { products: [] } };
    if (fs.existsSync(productDataPath)) {
      productData = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));
    }

    const existingMugIndex = productData.mugs.products.findIndex(p => p.chip === chipName);
    if (existingMugIndex >= 0) {
      productData.mugs.products[existingMugIndex].productId = product.id;
    } else {
      productData.mugs.products.push({ chip: chipName, productId: product.id });
    }

    productData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(productDataPath, JSON.stringify(productData, null, 2));
    console.log(`✅ Updated public/product-data.json`);

    console.log(`\n🎉 SUCCESS!`);
    console.log(`📋 Product: ${product.title}`);
    console.log(`🆔 ID: ${product.id}`);
    console.log(`\n📸 Printify will generate mockups in 30min - 2 hours`);
    console.log(`🔄 Run "node fetch-all-mug-angles.js" later to download mockup images`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Get chip name from command line
const chipName = process.argv[2];

if (!chipName) {
  console.error('❌ Usage: node create-single-mug.js Chip_X');
  console.error('Example: node create-single-mug.js Chip_10');
  process.exit(1);
}

createMug(chipName);
