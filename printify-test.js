// Printify API Test Script
// This script tests your API connection and retrieves your Shop ID

const config = require('./printify-config.js');

const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

async function testPrintifyConnection() {
  console.log('🔍 Testing Printify API connection...\n');

  try {
    // Get shops
    const response = await fetch(`${PRINTIFY_CONFIG.apiBase}/shops.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const shops = await response.json();

    console.log('✅ API Connection Successful!\n');
    console.log('📦 Your Shops:');
    console.log(JSON.stringify(shops, null, 2));

    if (shops.length > 0) {
      console.log('\n🎯 Use this Shop ID in your config:');
      console.log(`shopId: '${shops[0].id}'`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPrintifyConnection();
