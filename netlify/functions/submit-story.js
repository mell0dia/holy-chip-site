// Netlify Function: Submit Story
// Saves to Supabase + sends confirmation emails via SendGrid
//
// Required env vars (set in Netlify dashboard):
//   SUPABASE_URL          — e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_KEY  — service role key (not anon key)
//   SENDGRID_API_KEY      — SendGrid API key
//   NOTIFICATION_EMAIL    — Ricardo's email for new submission alerts
//
// Supabase table: submissions
// CREATE TABLE submissions (
//   id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   track            text NOT NULL,         -- 'open' | 'nft'
//   char_a           text,
//   char_b           text,
//   title            text,
//   panels           jsonb,
//   pre_intro        jsonb,
//   email            text NOT NULL,
//   pitch            text,
//   wallet           text,                  -- null for track 'open'
//   status           text DEFAULT 'pending',
//   review_note      text,
//   submitted_at     timestamptz DEFAULT now(),
//   reviewed_at      timestamptz,
//   nft_mint_address text,
//   royalty_paid     boolean DEFAULT false
// );

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { track, char_a, char_b, title, panels, pre_intro, email, pitch } = body;

  // Basic server-side validation
  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: 'Invalid email' };
  }
  if (!track || !title || !panels || panels.length < 3) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const notifyEmail = process.env.NOTIFICATION_EMAIL || 'Ricardo.Mello@4d.com';

  // ── Save to Supabase ────────────────────────────────────────
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars not configured');
    return { statusCode: 500, body: 'Storage not configured' };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        track,
        char_a: char_a || null,
        char_b: char_b || null,
        title,
        panels,
        pre_intro: pre_intro || null,
        email,
        pitch: pitch || null,
        wallet: null,
        status: 'pending'
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Supabase error:', err);
      return { statusCode: 500, body: 'Failed to save submission' };
    }
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return { statusCode: 500, body: 'Failed to save submission' };
  }

  // ── Send emails via SendGrid ────────────────────────────────
  if (sendgridKey) {
    const panelText = panels.map((p, i) =>
      `Panel ${i + 1}:\n` + p.map(d => `  ${d.speaker}: ${d.text}`).join('\n')
    ).join('\n\n');

    const emails = [
      // Confirmation to submitter
      {
        to: email,
        subject: 'Holy Chip — Story Received',
        text: `Hi,\n\nYour story "${title}" has been received. We review every submission carefully.\n\nCharacters: ${char_a || '?'} + ${char_b || '?'}\n\nYou'll hear from us if it moves forward.\n\n— Holy Chip`
      },
      // Notification to Ricardo
      {
        to: notifyEmail,
        subject: `[Open Submission] ${title}`,
        text: `New story submission:\n\nTitle: ${title}\nCharacters: ${char_a} + ${char_b}\nEmail: ${email}\n\n${panelText}${pitch ? `\n\nPitch:\n${pitch}` : ''}\n\nReview in Supabase dashboard.`
      }
    ];

    for (const mail of emails) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: mail.to }] }],
            from: { email: 'stories@holy-chip.com', name: 'Holy Chip' },
            subject: mail.subject,
            content: [{ type: 'text/plain', value: mail.text }]
          })
        });
      } catch (err) {
        console.error('SendGrid error:', err); // Non-fatal — submission already saved
      }
    }
  } else {
    console.warn('SENDGRID_API_KEY not set — emails skipped');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
