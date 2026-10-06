// Store funnel counter. The Add to Cart button and the checkout form call this
// with a product and a country - nothing personal - so the daily store test
// can report "yesterday: N adds to cart, M checkouts started". Adds to cart
// otherwise live only in the shopper's browser and are invisible.
//
//   POST /.netlify/functions/ping   { "event": "add_to_cart", "product": "Chip_1 mug", "country": "CA" }
//   GET  /.netlify/functions/ping?days=1    -> the last N days' events (used by the daily test)
const { getStore } = require('@netlify/blobs');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};
const EVENTS = new Set(['add_to_cart', 'checkout_started']);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  const store = getStore('store-funnel');
  const day = () => new Date().toISOString().slice(0, 10);

  if (event.httpMethod === 'POST') {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (e) {}
    if (!EVENTS.has(body.event)) return { statusCode: 400, headers, body: JSON.stringify({ error: 'bad event' }) };
    const key = day();
    const list = (await store.get(key, { type: 'json' })) || [];
    list.push({ t: Date.now(), event: body.event, product: String(body.product || '').slice(0, 80), country: String(body.country || '').slice(0, 2).toUpperCase(), test: body.test === true });
    await store.setJSON(key, list.slice(-500));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === 'GET') {
    const days = Math.min(30, parseInt(event.queryStringParameters?.days || '1', 10) || 1);
    const out = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out[d] = (await store.get(d, { type: 'json' })) || [];
    }
    return { statusCode: 200, headers, body: JSON.stringify(out) };
  }
  return { statusCode: 405, headers, body: JSON.stringify({ error: 'method' }) };
};
