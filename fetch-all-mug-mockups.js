// Fetch mockup images for all 12 mugs
// Download 1 main image per mug

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
async function fetchAllMugMockups() {
  console.log('☕ Fetching All Mug Mockups');
  console.log(`📦 Total: ${mugMapping.total_products} mugs\n`);

  // Create mockups directory
  const mockupsDir = 'assets/mug-mockups';
  if (!fs.existsSync(mockupsDir)) {
    fs.mkdirSync(mockupsDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const product of mugMapping.products) {
    try {
      console.log(`☕ ${product.chip}...`);

      const productData = await getProductDetails(product.productId);

      if (!productData.images || productData.images.length === 0) {
        console.log(`  ⚠️  No images yet`);
        failCount++;
        continue;
      }

      // Download first mockup image (main product view)
      const imageUrl = productData.images[0].src;
      const imagePath = `${mockupsDir}/${product.chip}_mug.png`;
      await downloadImage(imageUrl, imagePath);

      console.log(`  ✅ Downloaded`);
      successCount++;

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`✅ Success: ${successCount} mugs`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} mugs`);
  }
  console.log(`\n📁 Mockups saved to: ${mockupsDir}/`);
}

fetchAllMugMockups();
