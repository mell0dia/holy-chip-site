/**
 * Verify wallet signature + fetch Holy Chip NFTs for Track B.
 *
 * POST body: { wallet, signature, message }
 *   - wallet: base58 public key
 *   - signature: base58-encoded ed25519 signature
 *   - message: the plaintext message that was signed
 *
 * Returns: { owned: [...], available: [...] }
 *   Each item: { mintAddress, name, image, character }
 */
const nacl = require('tweetnacl');

const ME_API = 'https://api-mainnet.magiceden.dev';
const COLLECTION = 'holy_chip';
const CREATOR_WALLET = process.env.CREATOR_HOT_WALLET || '3FbzRU63fER4WQF6TZyhiAra917U5KAEfWRCBZHNwDko';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Base58 decode (minimal — no external dep)
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Decode(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const idx = BASE58_ALPHABET.indexOf(str[i]);
    if (idx < 0) throw new Error('Invalid base58 character');
    let carry = idx;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  // Leading zeros
  for (let i = 0; i < str.length && str[i] === '1'; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

// Extract character name from NFT attributes or name
function getCharacter(token) {
  const attrs = token.attributes || [];
  const charAttr = attrs.find(a => a.trait_type === 'Character');
  if (charAttr) return charAttr.value;
  const match = (token.name || '').match(/- (.+)$/);
  return match ? match[1] : 'Unknown';
}

// Simplify token data for frontend
function simplifyToken(token) {
  return {
    mintAddress: token.mintAddress,
    name: token.name || 'Holy Chip',
    image: token.image || '',
    character: getCharacter(token)
  };
}

// Fetch all tokens for a wallet in the Holy Chip collection
async function fetchWalletTokens(wallet) {
  const allTokens = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const url = `${ME_API}/v2/wallets/${wallet}/tokens?collection_symbol=${COLLECTION}&offset=${offset}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allTokens.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }

  return allTokens.map(simplifyToken);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { wallet, signature, message } = body;
  if (!wallet || !signature || !message) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Missing wallet, signature, or message' }) };
  }

  // Verify signature
  try {
    const pubKeyBytes = base58Decode(wallet);
    const sigBytes = base58Decode(signature);
    const msgBytes = new TextEncoder().encode(message);

    const valid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
    if (!valid) {
      return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Invalid signature' }) };
    }
  } catch (err) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Signature verification failed: ' + err.message }) };
  }

  // Fetch NFTs for both wallets in parallel
  try {
    const [owned, creatorTokens] = await Promise.all([
      fetchWalletTokens(wallet),
      fetchWalletTokens(CREATOR_WALLET)
    ]);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ owned, available: creatorTokens })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: 'Failed to fetch NFTs: ' + err.message })
    };
  }
};
