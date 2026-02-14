// Printify Catalog Explorer
// Find blueprint IDs for t-shirts, mugs, and hats

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function exploreCatalog() {
  console.log('🔍 Exploring Printify Catalog...\n');

  try {
    // Get catalog
    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const blueprints = await response.json();

    console.log(`✅ Found ${blueprints.length} product blueprints\n`);

    // Filter for products we need
    const tshirts = blueprints.filter(b =>
      b.title.toLowerCase().includes('t-shirt') ||
      b.title.toLowerCase().includes('tee')
    );

    const mugs = blueprints.filter(b =>
      b.title.toLowerCase().includes('mug')
    );

    const hats = blueprints.filter(b =>
      b.title.toLowerCase().includes('hat') ||
      b.title.toLowerCase().includes('cap')
    );

    console.log('👕 T-SHIRTS/TEES:');
    tshirts.slice(0, 5).forEach(p => {
      console.log(`  - ID: ${p.id} | ${p.title}`);
    });

    console.log('\n☕ MUGS:');
    mugs.slice(0, 5).forEach(p => {
      console.log(`  - ID: ${p.id} | ${p.title}`);
    });

    console.log('\n🧢 HATS/CAPS:');
    hats.slice(0, 5).forEach(p => {
      console.log(`  - ID: ${p.id} | ${p.title}`);
    });

    console.log('\n💡 Pick the blueprint IDs you want and update printify-config.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exploreCatalog();
