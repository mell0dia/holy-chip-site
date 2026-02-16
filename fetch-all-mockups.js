// Fetch mockup images for all 24 products
// Download ONLY front (image 0) and back (image 1) views
// White shirts only - 2 images per product = 48 total images

const fs = require('fs');
const https = require('https');
const http = require('http');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Load product mapping
const productMapping = JSON.parse(fs.readFileSync('product-mapping.json', 'utf8'));

// Get product details from Printify
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

// Download image from URL
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    client.get(url, (res) => {
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
async function fetchAllMockups() {
  console.log('🎨 Fetching All Product Mockups');
  console.log(`📦 Total: ${productMapping.total_products} products × 2 images = ${productMapping.total_products * 2} images\n`);

  // Create mockups directory
  const mockupsDir = 'assets/mockups-final';
  if (!fs.existsSync(mockupsDir)) {
    fs.mkdirSync(mockupsDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  for (const product of productMapping.products) {
    try {
      console.log(`📦 ${product.chip} ${product.style}...`);

      const productData = await getProductDetails(product.productId);

      if (!productData.images || productData.images.length < 2) {
        console.log(`  ⚠️  Not enough images yet (found ${productData.images?.length || 0}). Printify may still be generating mockups.`);
        failCount++;
        continue;
      }

      // Download front view (image 0)
      const frontUrl = productData.images[0].src;
      const frontPath = `${mockupsDir}/${product.chip}_${product.style}_white_front.png`;
      await downloadImage(frontUrl, frontPath);

      // Download back view (image 1)
      const backUrl = productData.images[1].src;
      const backPath = `${mockupsDir}/${product.chip}_${product.style}_white_back.png`;
      await downloadImage(backUrl, backPath);

      console.log(`  ✅ Downloaded front + back`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`✅ Success: ${successCount} products (${successCount * 2} images)`);
  if (failCount > 0) {
    console.log(`⚠️  Failed: ${failCount} products (may need to retry later)`);
  }
  console.log(`\n📁 Mockups saved to: ${mockupsDir}/`);
}

// Run
fetchAllMockups();
