// Netlify Function: Get Review
// Returns submission data for the review page.
// The submitter visits review.html?id=xxx&token=yyy to see our interpretation.
//
// Required env vars:
//   SUPABASE_URL          — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  — service role key
//
// Token = first 16 hex chars of SHA256(id + email)

const crypto = require('crypto');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
  }

  const { id, token } = event.queryStringParameters || {};
  if (!id || !token) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing id or token' })
    };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured' })
    };
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(id)}&select=id,title,panels,char_a,char_b,email,review_note,status,track,pre_intro`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!res.ok) {
      console.error('Supabase error:', await res.text());
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to fetch submission' })
      };
    }

    const data = await res.json();
    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    const submission = data[0];

    // Verify token: SHA256(id + email), first 16 hex chars
    const expectedToken = crypto
      .createHash('sha256')
      .update(submission.id + submission.email)
      .digest('hex')
      .substring(0, 16);

    if (token !== expectedToken) {
      return {
        statusCode: 403,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Parse review_note — could be plain text or JSON
    let reviewData = {};
    if (submission.review_note) {
      try {
        reviewData = JSON.parse(submission.review_note);
      } catch {
        reviewData = { interpretation: submission.review_note };
      }
    }

    // Check if already responded
    const alreadyResponded = ['confirmed', 'needs_clarification'].includes(submission.status);

    // Build safe response (no email exposed)
    const response = {
      id: submission.id,
      title: submission.title,
      panels: submission.panels,
      char_a: submission.char_a,
      char_b: submission.char_b,
      track: submission.track,
      pre_intro: submission.pre_intro,
      status: submission.status,
      interpretation: reviewData.interpretation || null,
      already_responded: alreadyResponded,
      submitter_response: reviewData.submitter_response || null,
      submitter_handle: reviewData.submitter_handle || null,
      submitter_notes: reviewData.submitter_notes || null
    };

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };
  } catch (err) {
    console.error('get-review error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
