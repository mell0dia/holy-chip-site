// Fetch multiple mug mockup angles

const fs = require('fs');
const https = require('https');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const TEST_MUG_ID = '6993676281551e76130b809f';

async function getProductDetails(productId) {
  const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}` }
  });
  if (!response.ok) throw new Error(`Failed to get product: ${response.statusText}`);
  return await response.json();
}

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

async function fetchMugMockups() {
  console.log('☕ Fetching mug mockups...\n');

  try {
    const product = await getProductDetails(TEST_MUG_ID);
    console.log(`Product: ${product.title}`);
    console.log(`Images found: ${product.images?.length || 0}\n`);

    if (product.images && product.images.length > 0) {
      // Create test directory
      if (!fs.existsSync('assets/test-mug')) {
        fs.mkdirSync('assets/test-mug', { recursive: true });
      }

      // Download first 5 mockup images to see different angles
      for (let i = 0; i < Math.min(5, product.images.length); i++) {
        const imageUrl = product.images[i].src;
        const filepath = `assets/test-mug/mug_angle_${i}.png`;

        console.log(`Downloading angle ${i}...`);
        await downloadImage(imageUrl, filepath);
        console.log(`✅ ${filepath}`);
      }

      console.log('\n✅ Done! Check assets/test-mug/ for mockups');

    } else {
      console.log('⚠️  No mockups available yet.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fetchMugMockups();
