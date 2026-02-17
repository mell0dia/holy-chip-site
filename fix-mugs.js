// Fix broken mugs: Delete products without images and recreate them

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

// Load current mug mapping
const mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

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

  const selectedVariants = variants.filter(v =>
    (v.title.includes('Black') || v.title.includes('Red') || v.title.includes('Navy'))
  );

  const variantIds = selectedVariants.map(v => v.id);

  const productData = {
    title: title,
    description: `${chipName} mug with Holy Chip branding - AI made by a Human`,
    blueprint_id: blueprintId,
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
            position: 'default',
            images: [
              {
                id: chipImageId,
                x: 0.35,
                y: 0.5,
                scale: 0.8,
                angle: 0
              },
              {
                id: brandImageId,
                x: 0.65,
                y: 0.5,
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
  console.log(`  ✅ Created: ${product.id}`);
  return product;
}

async function fixMugs() {
  console.log('🔧 Fixing Broken Mug Products\n');

  const results = [];
  let deleteCount = 0;
  let createCount = 0;

  try {
    // Get print providers and variants
    console.log('📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Upload brand image once
    console.log('📤 Uploading brand image...');
    const brandImage = await uploadImage('assets/brand.png', 'holychip-brand.png');
    console.log('');

    // Process each mug
    for (const product of mugMapping.products) {
      console.log(`☕ ${product.chip}...`);

      // Delete broken product
      console.log(`  🗑️  Deleting broken product...`);
      await deleteProduct(product.productId);
      deleteCount++;
      console.log(`  ✅ Deleted`);

      // Upload chip image
      const chipImage = await uploadImage(`characters/${product.chip}.png`, `${product.chip}.png`);

      // Recreate product
      const newProduct = await createMugProduct(
        product.chip, chipImage.id, brandImage.id,
        MUG_BLUEPRINT_ID, printProvider, variants
      );
      createCount++;

      results.push({ chip: product.chip, productId: newProduct.id });

      console.log('');

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save updated mapping
    const mapping = {
      created_at: new Date().toISOString(),
      total_products: results.length,
      products: results
    };

    fs.writeFileSync('mug-mapping.json', JSON.stringify(mapping, null, 2));

    console.log('\n🎉 SUCCESS!');
    console.log(`🗑️  Deleted: ${deleteCount} mugs`);
    console.log(`✅ Recreated: ${createCount} mugs with images`);
    console.log(`📋 Updated mapping saved to: mug-mapping.json`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixMugs();
