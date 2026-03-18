#!/usr/bin/env node
// Switch all 12 Holy Chip mugs from blueprint 635/Harrier to blueprint 1301/Duplium (ORCA Coating)
// CA shipping: $14.89 → $7.99

const { PRINTIFY_CONFIG } = require('./printify-config.js');
const { apiToken, shopId, apiBase } = PRINTIFY_CONFIG;

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

async function api(method, path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

async function getAllProducts() {
  const all = [];
  for (const page of [1, 2]) {
    const data = await api('GET', `/shops/${shopId}/products.json?limit=50&page=${page}`);
    all.push(...(data.data || []));
  }
  return all;
}

async function getProductDetails(id) {
  return api('GET', `/shops/${shopId}/products/${id}.json`);
}

async function createDupliumMug(charName, images) {
  // Blueprint 1301 / Duplium(41) / Black 11oz variant = 98595
  const body = {
    title: `Holy Chip - ${charName} Mug`,
    description: `Holy Chip ${charName} ceramic mug, 11oz, black accent interior and handle. ORCA Coating® for vibrant, scratch-resistant print.`,
    blueprint_id: 1301,
    print_provider_id: 41,
    variants: [{ id: 98595, price: 1799, is_enabled: true }],
    print_areas: [{
      variant_ids: [98595],
      placeholders: [{
        position: 'front',
        images
      }]
    }]
  };
  return api('POST', `/shops/${shopId}/products.json`, body);
}

async function deleteProduct(id) {
  const res = await fetch(`${apiBase}/shops/${shopId}/products/${id}.json`, {
    method: 'DELETE',
    headers
  });
  return res.status;
}

async function main() {
  console.log('Fetching all products...');
  const all = await getAllProducts();
  const oldMugs = all.filter(p => p.title.includes('Mug') && !p.title.includes('[TEST]'));
  console.log(`Found ${oldMugs.length} mugs to migrate:\n`);
  oldMugs.forEach(p => console.log(`  ${p.title} (${p.id})`));
  console.log();

  const newProductIds = {}; // charName -> new Printify product ID
  const results = [];

  for (const mug of oldMugs) {
    // Extract character name e.g. "Holy Chip - Chip_0 Mug" → "Chip_0"
    const match = mug.title.match(/Holy Chip - (Chip_\S+) Mug/);
    if (!match) { console.log(`  SKIP: can't parse name from "${mug.title}"`); continue; }
    const charName = match[1];

    console.log(`Processing ${charName}...`);

    // Get full product to read print area images
    const full = await getProductDetails(mug.id);
    const pa = full.print_areas?.[0];
    const ph = pa?.placeholders?.find(p => p.position === 'front');
    if (!ph) { console.log(`  ERROR: no front placeholder for ${charName}`); continue; }

    const images = ph.images.map(img => ({
      id: img.id,
      x: img.x,
      y: img.y,
      scale: img.scale,
      angle: img.angle
    }));

    // Create new Duplium product
    const created = await createDupliumMug(charName, images);
    if (!created.id) {
      console.log(`  ERROR creating ${charName}:`, JSON.stringify(created));
      continue;
    }
    console.log(`  ✓ Created: ${created.id}`);
    newProductIds[charName] = created.id;
    results.push({ charName, oldId: mug.id, newId: created.id });

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n--- All new products created ---');
  console.log(JSON.stringify(results, null, 2));

  // Now delete old mugs
  console.log('\nDeleting old mug products...');
  for (const { charName, oldId } of results) {
    const status = await deleteProduct(oldId);
    console.log(`  ${charName} old (${oldId}): HTTP ${status}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // Also delete the [TEST] product
  const testProduct = all.find(p => p.title.includes('[TEST]') && p.title.includes('Duplium'));
  if (testProduct) {
    const status = await deleteProduct(testProduct.id);
    console.log(`  [TEST] product deleted: HTTP ${status}`);
  }

  console.log('\n--- Done ---');
  console.log('New Printify product IDs (update product-data.json):');
  results.forEach(({ charName, newId }) => console.log(`  ${charName}: ${newId}`));
}

main().catch(console.error);
