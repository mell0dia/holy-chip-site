// Fetch T-Shirt Mockup Images from Printify
// Downloads front and back mockups for all t-shirt products

const fs = require('fs');
const https = require('https');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getProduct(productId) {
  const response = await fetch(
    `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`,
    {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  return await response.json();
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function fetchTShirtMockups() {
  console.log('\n👕 Fetching T-Shirt Mockups from Printify\n');

  try {
    // Read product data
    const productDataPath = 'public/product-data.json';
    if (!fs.existsSync(productDataPath)) {
      throw new Error('product-data.json not found. Run create-single-tshirt.js first.');
    }

    const productData = JSON.parse(fs.readFileSync(productDataPath, 'utf8'));
    const tshirts = productData.tshirts.products;

    if (tshirts.length === 0) {
      console.log('❌ No t-shirt products found in product-data.json');
      return;
    }

    console.log(`📦 Found ${tshirts.length} t-shirt products\n`);

    // Create mockups directory if it doesn't exist
    const mockupDir = 'public/assets/mockups';
    if (!fs.existsSync(mockupDir)) {
      fs.mkdirSync(mockupDir, { recursive: true });
    }

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each t-shirt product
    for (const tshirt of tshirts) {
      const { chip, style, productId } = tshirt;
      console.log(`\n📸 Fetching mockups for ${chip} - ${style}...`);

      try {
        // Get product details from Printify
        const product = await getProduct(productId);

        if (!product.images || product.images.length === 0) {
          console.log(`⚠️  No mockups available yet for ${chip} ${style} (Printify still generating)`);
          skippedCount++;
          continue;
        }

        console.log(`✅ Found ${product.images.length} mockup images`);

        // Download each mockup
        for (const image of product.images) {
          // Determine view type from position or variant
          let view = 'front';
          if (image.position === 'back' || (image.variant_ids && image.variant_ids.length > 0)) {
            // Try to determine if it's back view
            // Printify's image structure varies, so we'll use position if available
            if (product.images.length > 1 && product.images.indexOf(image) > 0) {
              view = 'back';
            }
          }

          // For t-shirts, Printify typically returns:
          // - First image: front view
          // - Second image: back view (if applicable)
          const imageIndex = product.images.indexOf(image);
          if (imageIndex === 0) view = 'front';
          if (imageIndex === 1 && style === 'style3') view = 'back'; // Style 3 has back design

          const filename = `${chip}_${style}_white_${view}.png`;
          const filepath = `${mockupDir}/${filename}`;

          // Skip if already exists
          if (fs.existsSync(filepath)) {
            console.log(`   ⏭️  ${filename} (already exists)`);
            continue;
          }

          console.log(`   📥 Downloading ${filename}...`);
          await downloadImage(image.src, filepath);
          console.log(`   ✅ Saved: ${filename}`);
        }

        successCount++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`✅ Success: ${successCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products (mockups not ready)`);
    console.log(`❌ Errors: ${errorCount} products`);
    console.log('='.repeat(50));

    if (skippedCount > 0) {
      console.log('\n⏳ Some mockups are not ready yet.');
      console.log('💡 Printify takes 30min - 2 hours to generate mockups.');
      console.log('🔄 Run this script again later to download remaining mockups.');
    }

    if (successCount > 0) {
      console.log('\n✅ Mockups downloaded to: public/assets/mockups/');
      console.log('📋 Next steps:');
      console.log('   1. Verify mockups look correct');
      console.log('   2. Deploy to Vercel: vercel --prod --yes');
      console.log('   3. T-shirts will appear on your store!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fetchTShirtMockups();
