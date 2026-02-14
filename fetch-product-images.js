// Fetch product mockup images from Printify

const fs = require('fs');
const https = require('https');
const http = require('http');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Our test products (we created these earlier)
const testProducts = [
  { id: '698fc9c27d7e3387bd030b93', chip: 'Chip_0', style: 'test' },
  { id: '698fca5f8a2cda4b7b09483c', chip: 'Chip_1', style: 'style3' }, // Front: Chip | Back: Brand
  { id: '698fcb00bca977ae630b5919', chip: 'Chip_100', style: 'style3' }, // Front: Chip | Back: Brand 50% top
  { id: '698fcbba7d7e3387bd030bdb', chip: 'Chip_101', style: 'style5_broken' },
  { id: '698fcc5a90577c34b0045ded', chip: 'Chip_110', style: 'style5' } // Front: Brand 80% + Chip 80%
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
async function fetchProductImages() {
  console.log('🎨 Fetching Printify Product Mockup Images\n');

  // Create mockups directory if it doesn't exist
  if (!fs.existsSync('assets/mockups')) {
    fs.mkdirSync('assets/mockups', { recursive: true });
  }

  for (const testProduct of testProducts) {
    try {
      const product = await getProductDetails(testProduct.id);

      console.log(`  Product: ${product.title}`);
      console.log(`  Images found: ${product.images?.length || 0}`);

      // Download mockup images
      if (product.images && product.images.length > 0) {
        for (let i = 0; i < product.images.length; i++) {
          const imageUrl = product.images[i].src;
          const filename = `${testProduct.chip}_${testProduct.style}_${i}.png`;
          const filepath = `assets/mockups/${filename}`;

          await downloadImage(imageUrl, filepath);
        }
      }

      // Also save product info
      const infoFile = `assets/mockups/${testProduct.chip}_${testProduct.style}_info.json`;
      fs.writeFileSync(infoFile, JSON.stringify(product, null, 2));
      console.log(`  ✅ Saved info: ${infoFile}`);

    } catch (error) {
      console.error(`  ❌ Error for ${testProduct.chip}: ${error.message}`);
    }
  }

  console.log('\n✅ Done! Mockup images saved to assets/mockups/');
}

fetchProductImages();
