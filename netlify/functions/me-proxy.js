/**
 * Proxy for Magic Eden API calls — bypasses CORS restrictions.
 * Usage: /.netlify/functions/me-proxy?path=/v2/collections/holy_chip/listings&offset=0&limit=20
 */
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const apiPath = params.path || '/v2/collections/holy_chip/listings';

  // Build query string without the 'path' param
  const query = Object.entries(params)
    .filter(([k]) => k !== 'path')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `https://api-mainnet.magiceden.dev${apiPath}${query ? '?' + query : ''}`;

  try {
    const res = await fetch(url);
    const data = await res.text();
    return {
      statusCode: res.status,
      headers,
      body: data
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
