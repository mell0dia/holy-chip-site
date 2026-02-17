// Explore all mockup angles for Chip_1 mug to find the one with the design

const fs = require('fs');
const https = require('https');
const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;
const CHIP_1_MUG_ID = '6993683d2fdefe6cb3015448'; // From mug-mapping.json

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

async function exploreMugAngles() {
  console.log('🔍 Exploring Chip_1 mug mockup angles to find the design...\n');

  try {
    const product = await getProductDetails(CHIP_1_MUG_ID);
    console.log(`Product: ${product.title}`);
    console.log(`Total images: ${product.images?.length || 0}\n`);

    if (!product.images || product.images.length === 0) {
      console.log('⚠️  No mockups available');
      return;
    }

    // Create directory
    const dir = 'assets/mug-angle-test';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Download first 10 mockup angles
    console.log('Downloading first 10 angles...\n');
    for (let i = 0; i < Math.min(10, product.images.length); i++) {
      const imageUrl = product.images[i].src;
      const filepath = `${dir}/angle_${i}.png`;

      await downloadImage(imageUrl, filepath);
      console.log(`✅ Angle ${i}: ${filepath}`);
    }

    console.log('\n📋 Next: Check assets/mug-angle-test/ to find which angle shows the Chip + Brand design');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exploreMugAngles();
