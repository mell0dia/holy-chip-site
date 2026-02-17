// Check Printify shop/store information

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function getShopInfo() {
  console.log('🔍 Checking Printify Shop Information...\n');

  try {
    // Get shop details
    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get shop info: ${response.statusText}`);
    }

    const shop = await response.json();

    console.log('📋 Shop Information:');
    console.log('─'.repeat(50));
    console.log(`Shop ID: ${shop.id}`);
    console.log(`Title: ${shop.title || 'Not set'}`);
    console.log(`Sales Channel: ${shop.sales_channel || 'Not connected'}`);

    if (shop.store_url) {
      console.log(`\n🎉 Store URL: ${shop.store_url}`);
    } else {
      console.log('\n⚠️  No store URL found.');
      console.log('\nYou may need to:');
      console.log('1. Enable Printify Pop-Up Store in your dashboard');
      console.log('2. Connect to a sales channel (Shopify, Etsy, etc.)');
      console.log('3. Or use direct Printify API for checkout');
    }

    console.log('\n📦 Full shop data:');
    console.log(JSON.stringify(shop, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getShopInfo();
