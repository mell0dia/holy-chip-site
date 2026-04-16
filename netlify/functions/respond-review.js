// Netlify Function: Respond to Review
// Submitter confirms or requests clarification on our interpretation.
//
// Required env vars:
//   SUPABASE_URL          — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  — service role key
//   RESEND_API_KEY        — (optional) sends notification to Ricardo
//   NOTIFICATION_EMAIL    — (optional) Ricardo's email
//
// POST body: { id, token, response, handle, notes }

const crypto = require('crypto');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  const { id, token, response, handle, notes } = body;

  if (!id || !token || !response) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required fields (id, token, response)' })
    };
  }

  if (!['confirmed', 'needs_clarification'].includes(response)) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid response type' })
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
    // Fetch submission to verify token and get current review_note
    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(id)}&select=id,email,review_note,status,title`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (!fetchRes.ok) {
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to fetch submission' })
      };
    }

    const data = await fetchRes.json();
    if (!data || data.length === 0) {
      return {
        statusCode: 404,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Submission not found' })
      };
    }

    const submission = data[0];

    // Verify token
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

    // Check if already responded
    if (['confirmed', 'needs_clarification'].includes(submission.status)) {
      return {
        statusCode: 409,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Already responded', status: submission.status })
      };
    }

    // Build updated review_note JSON
    let reviewData = {};
    if (submission.review_note) {
      try {
        reviewData = JSON.parse(submission.review_note);
      } catch {
        reviewData = { interpretation: submission.review_note };
      }
    }

    reviewData.submitter_response = response;
    reviewData.submitter_handle = handle ? handle.trim() : null;
    reviewData.submitter_notes = notes ? notes.trim() : null;
    reviewData.responded_at = new Date().toISOString();

    const newStatus = response === 'confirmed' ? 'confirmed' : 'needs_clarification';

    // Update in Supabase
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/submissions?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          review_note: JSON.stringify(reviewData),
          status: newStatus,
          reviewed_at: new Date().toISOString()
        })
      }
    );

    if (!updateRes.ok) {
      console.error('Supabase update error:', await updateRes.text());
      return {
        statusCode: 500,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to save response' })
      };
    }

    // Notify Ricardo via Resend (non-blocking)
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.NOTIFICATION_EMAIL || 'rico.duoba@gmail.com';

    if (resendKey) {
      const statusLabel = response === 'confirmed' ? 'CONFIRMED' : 'NEEDS CLARIFICATION';
      const emailBody = [
        `Story "${submission.title}" review response:`,
        ``,
        `Status: ${statusLabel}`,
        handle ? `Handle: ${handle}` : '',
        notes ? `Notes: ${notes}` : '',
        ``,
        `View in Supabase dashboard.`
      ].filter(Boolean).join('\n');

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Holy Chip <stories@holy-chip.com>',
            to: notifyEmail,
            subject: `[Review ${statusLabel}] ${submission.title}`,
            text: emailBody
          })
        });
      } catch (err) {
        console.error('Resend notification error:', err);
        // Non-fatal
      }
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, status: newStatus })
    };
  } catch (err) {
    console.error('respond-review error:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
