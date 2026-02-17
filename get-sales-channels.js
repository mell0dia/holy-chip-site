// Get available sales channels (including Pop-Up Store)

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getSalesChannels() {
  console.log('🔍 Checking Available Sales Channels\n');

  try {
    // Get all shops (sales channels)
    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get shops: ${response.statusText}`);
    }

    const shops = await response.json();

    console.log(`Found ${shops.length} sales channel(s):\n`);

    shops.forEach((shop, index) => {
      console.log(`${index + 1}. ${shop.title || 'Unnamed'}`);
      console.log(`   ID: ${shop.id}`);
      console.log(`   Type: ${shop.sales_channel || 'Unknown'}`);
      console.log('');
    });

    // Find Pop-Up Store
    const popUpStore = shops.find(s =>
      s.title?.toLowerCase().includes('pop-up') ||
      s.sales_channel?.toLowerCase().includes('pop-up')
    );

    if (popUpStore) {
      console.log('✅ Pop-Up Store Found!');
      console.log(`   Store ID: ${popUpStore.id}`);
      console.log(`   Title: ${popUpStore.title}`);
      console.log('\n💡 We can now:');
      console.log('   1. Recreate all products with Pop-Up Store connection');
      console.log('   2. Or update existing products to add to Pop-Up Store');
    } else {
      console.log('⚠️  Pop-Up Store not found in sales channels');
      console.log('   Current shop ID being used: ' + PRINTIFY_CONFIG.shopId);
    }

    // Save for reference
    require('fs').writeFileSync('sales-channels.json', JSON.stringify(shops, null, 2));
    console.log('\n📁 Full data saved to: sales-channels.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getSalesChannels();
