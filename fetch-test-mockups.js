// Fetch mockups for test products - ONLY front and back views

const fs = require('fs');
const https = require('https');
const http = require('http');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Test products we just created
const testProducts = [
  { id: '69935e85350878b66800c5d2', chip: 'Chip_1', style: 'style3' },
  { id: '69935e87be1f7dc43a02d962', chip: 'Chip_1', style: 'style5' }
];

// Get product details
async function getProductDetails(productId) {
  console.log(`\n📦 Fetching product ${productId}...`);

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
          console.log(`  ✅ Downloaded: ${filepath}`);
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Main function
async function fetchTestMockups() {
  console.log('🎨 Fetching Test Product Mockups (white shirts, front + back only)\n');

  // Create test mockups directory
  if (!fs.existsSync('assets/test-mockups')) {
    fs.mkdirSync('assets/test-mockups', { recursive: true });
  }

  for (const testProduct of testProducts) {
    try {
      const product = await getProductDetails(testProduct.id);

      console.log(`  Product: ${product.title}`);
      console.log(`  Total images available: ${product.images?.length || 0}`);

      if (product.images && product.images.length >= 2) {
        // Download ONLY image 0 (front) and image 1 (back)
        const frontImage = product.images[0].src;
        const backImage = product.images[1].src;

        const frontPath = `assets/test-mockups/${testProduct.chip}_${testProduct.style}_white_front.png`;
        const backPath = `assets/test-mockups/${testProduct.chip}_${testProduct.style}_white_back.png`;

        console.log('  Downloading front view (image 0)...');
        await downloadImage(frontImage, frontPath);

        console.log('  Downloading back view (image 1)...');
        await downloadImage(backImage, backPath);
      } else {
        console.log('  ⚠️  Not enough images yet. Printify might still be generating mockups.');
      }

    } catch (error) {
      console.error(`  ❌ Error for ${testProduct.chip} ${testProduct.style}: ${error.message}`);
    }
  }

  console.log('\n✅ Done! Test mockups saved to assets/test-mockups/');
  console.log('📋 Check the images to verify:');
  console.log('   1. Shirts are WHITE');
  console.log('   2. Front view shows correct design');
  console.log('   3. Back view shows correct design');
}

fetchTestMockups();
