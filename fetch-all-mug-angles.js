// Fetch multiple mockup angles for all 12 mugs
// Download 6 key views per mug: front, back, left, right, context1, context2

const fs = require('fs');
const https = require('https');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Load mug mapping
const mugMapping = JSON.parse(fs.readFileSync('mug-mapping.json', 'utf8'));

// Get product details
async function getProductDetails(productId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get product: ${response.statusText}`);
  }

  return await response.json();
}

// Download image
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Main function
async function fetchAllMugAngles() {
  console.log('☕ Fetching Multiple Angles for All Mugs');
  console.log(`📦 Total: ${mugMapping.total_products} mugs × 6 angles = ${mugMapping.total_products * 6} images\n`);

  // Create mockups directory
  const mockupsDir = 'assets/mug-mockups';
  if (!fs.existsSync(mockupsDir)) {
    fs.mkdirSync(mockupsDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  // Angle names based on typical Printify mockup structure
  const angleNames = ['front', 'back', 'left', 'right', 'context1', 'context2'];

  for (const product of mugMapping.products) {
    try {
      console.log(`☕ ${product.chip}...`);

      const productData = await getProductDetails(product.productId);

      if (!productData.images || productData.images.length === 0) {
        console.log(`  ⚠️  No images yet`);
        failCount++;
        continue;
      }

      console.log(`  Found ${productData.images.length} mockup images`);

      // Download first 6 images (representing different angles)
      // Printify typically generates images grouped by angle
      for (let i = 0; i < Math.min(6, productData.images.length); i++) {
        const imageUrl = productData.images[i].src;
        const angleName = angleNames[i] || `angle${i}`;
        const imagePath = `${mockupsDir}/${product.chip}_mug_${angleName}.png`;

        await downloadImage(imageUrl, imagePath);
        console.log(`  ✅ ${angleName}`);
      }

      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`✅ Success: ${successCount} mugs (${successCount * 6} images)`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} mugs`);
  }
  console.log(`\n📁 Mockups saved to: ${mockupsDir}/`);
  console.log(`\n📋 Images per mug: front, back, left, right, context1, context2`);
}

fetchAllMugAngles();
