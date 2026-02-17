// Test creating a mug with correct print area structure

const fs = require('fs');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const MUG_BLUEPRINT_ID = 635;

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

async function testCreateMug() {
  console.log('🧪 Testing Mug Creation with Correct Structure\n');

  try {
    // Upload images
    console.log('📤 Uploading images...');
    const chipImage = await uploadImage('characters/Chip_0.png', 'test-chip.png');
    const brandImage = await uploadImage('assets/brand.png', 'test-brand.png');
    console.log('');

    // Get print providers and variants
    console.log('📦 Getting print providers and variants...');
    const printProviders = await getPrintProviders(MUG_BLUEPRINT_ID);
    const printProvider = printProviders[0];
    const variants = await getVariants(MUG_BLUEPRINT_ID, printProvider.id);
    console.log(`✅ Using: ${printProvider.title}\n`);

    // Filter for Black, Red, Navy variants
    const selectedVariants = variants.filter(v =>
      (v.title.includes('Black') || v.title.includes('Red') || v.title.includes('Navy'))
    );

    console.log(`Found ${selectedVariants.length} variants\n`);

    const variantIds = selectedVariants.map(v => v.id);

    // Create product with "front" position instead of "default"
    const productData = {
      title: "TEST MUG - Holy Chip",
      description: "Test mug with correct image positioning",
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
              position: "front",  // Changed from "default" to "front"
              images: [
                {
                  id: chipImage.id,
                  x: 0.35,
                  y: 0.5,
                  scale: 0.8,
                  angle: 0
                },
                {
                  id: brandImage.id,
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

    console.log('🔨 Creating test mug product...');
    console.log('Print area structure:');
    console.log(JSON.stringify(productData.print_areas, null, 2));
    console.log('');

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
    console.log(`\nTitle: ${product.title}`);

    // Check if images are in print areas
    if (product.print_areas && product.print_areas[0].placeholders[0].images) {
      const imageCount = product.print_areas[0].placeholders[0].images.length;
      console.log(`\n📸 Images in print area: ${imageCount}`);

      if (imageCount > 0) {
        console.log('\n🎉 SUCCESS! Images were added to print area!');
        product.print_areas[0].placeholders[0].images.forEach((img, i) => {
          console.log(`  Image ${i}: ID=${img.id}, x=${img.x}, y=${img.y}, scale=${img.scale}`);
        });
      } else {
        console.log('\n⚠️  WARNING: Print area has no images');
      }
    }

    // Save product ID for cleanup
    fs.writeFileSync('test-mug-id.txt', product.id);
    console.log(`\n📋 Product ID saved to: test-mug-id.txt`);
    console.log(`\n✅ Check this product on Printify dashboard to verify images appear`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testCreateMug();
