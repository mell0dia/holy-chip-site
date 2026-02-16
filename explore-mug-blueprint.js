// Explore mug blueprint options in Printify

const config = require('./printify-config.js');
const PRINTIFY_CONFIG = config.PRINTIFY_CONFIG;

// Mug blueprint ID (from the existing mug product: 635)
const MUG_BLUEPRINT_ID = 635;

async function exploreMugBlueprint() {
  console.log('☕ Exploring Mug Blueprint Options\n');

  try {
    // Get print providers for mug
    console.log('📦 Getting print providers for mugs...');
    const providersResponse = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${MUG_BLUEPRINT_ID}/print_providers.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
      }
    });

    if (!providersResponse.ok) {
      throw new Error(`Failed to get print providers: ${providersResponse.statusText}`);
    }

    const providers = await providersResponse.json();
    console.log(`✅ Found ${providers.length} print providers\n`);

    // Use first provider
    const provider = providers[0];
    console.log(`Using provider: ${provider.title} (ID: ${provider.id})\n`);

    // Get variants for this provider
    console.log('📦 Getting mug variants...');
    const variantsResponse = await fetch(`${PRINTIFY_CONFIG.apiBase}/catalog/blueprints/${MUG_BLUEPRINT_ID}/print_providers/${provider.id}/variants.json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
      }
    });

    if (!variantsResponse.ok) {
      throw new Error(`Failed to get variants: ${variantsResponse.statusText}`);
    }

    const variantsData = await variantsResponse.json();
    const variants = variantsData.variants;

    console.log(`✅ Found ${variants.length} total variants\n`);

    // Group by color
    const colorGroups = {};
    variants.forEach(v => {
      // Extract color from title (e.g., "Black / 11oz" -> "Black")
      const color = v.title.split(' / ')[0];
      if (!colorGroups[color]) {
        colorGroups[color] = [];
      }
      colorGroups[color].push(v);
    });

    console.log('📊 Available Colors:\n');
    Object.keys(colorGroups).forEach(color => {
      const sizes = colorGroups[color].map(v => v.title.split(' / ')[1]).join(', ');
      console.log(`  ${color}: ${sizes} (${colorGroups[color].length} variants)`);
    });

    console.log('\n💡 Recommendation:');
    console.log('   - Choose 3-5 colors (e.g., White, Black, Red, Blue)');
    console.log('   - Each color typically has 2 sizes: 11oz and 15oz');
    console.log('   - Layout: Chip image + brand logo side by side on the mug');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

exploreMugBlueprint();
