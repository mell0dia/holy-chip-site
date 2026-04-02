// Netlify Function: Stripe Webhook Handler
// Handles checkout.session.completed -> creates Printify order + sends email notifications
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRINTIFY_CONFIG = {
  apiToken: process.env.PRINTIFY_API_TOKEN,
  shopId: process.env.PRINTIFY_SHOP_ID,
  apiBase: 'https://api.printify.com/v1'
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = 'rico.duoba@gmail.com';
const FROM_EMAIL = 'orders@holy-chip.com';

// Send email via Resend (to = string or array, defaults to NOTIFY_EMAIL)
async function sendEmail(subject, htmlBody, to) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured - skipping email');
    return;
  }
  const recipients = to ? (Array.isArray(to) ? to : [to]) : [NOTIFY_EMAIL];
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Holy Chip <${FROM_EMAIL}>`,
        to: recipients,
        subject,
        html: htmlBody
      })
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend email failed:', resp.status, err);
    } else {
      console.log('Email sent to', recipients.join(', '), ':', subject);
    }
  } catch (error) {
    console.error('Email send error:', error.message);
  }
}

// Build buyer confirmation email HTML
function buyerConfirmationHtml(customerName, cart, amount, shippingCost, address) {
  const itemRows = cart.map(item =>
    `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:Calibri,sans-serif;font-size:14px;">
        ${item.chip} - ${item.productType || 'T-Shirt'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:Calibri,sans-serif;font-size:14px;text-align:center;">
        ${item.size || 'One Size'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #eee;font-family:Calibri,sans-serif;font-size:14px;text-align:center;">
        ${item.quantity}
      </td>
    </tr>`
  ).join('');

  return `<div style="max-width:560px;margin:0 auto;font-family:Calibri,sans-serif;color:#222;">
    <div style="text-align:center;padding:24px 0 16px;">
      <h1 style="font-family:'Courier New',monospace;font-size:22px;color:#0A6821;margin:0;">HOLY CHIP</h1>
      <p style="font-size:13px;color:#888;margin:4px 0 0;">www.holy-chip.com</p>
    </div>
    <div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:28px;">
      <h2 style="font-size:18px;color:#1e8449;margin:0 0 6px;">Order Confirmed!</h2>
      <p style="font-size:14px;color:#555;margin:0 0 20px;">Hi ${customerName.split(' ')[0]}, thanks for your order. We're getting it ready!</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <tr style="background:#f8f8f8;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#888;font-weight:600;">ITEM</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">SIZE</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#888;font-weight:600;">QTY</th>
        </tr>
        ${itemRows}
      </table>

      <table style="width:100%;font-size:14px;margin-bottom:20px;">
        <tr>
          <td style="padding:4px 0;color:#555;">Subtotal</td>
          <td style="padding:4px 0;text-align:right;">$${(parseFloat(amount) - shippingCost).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#555;">Shipping</td>
          <td style="padding:4px 0;text-align:right;">$${shippingCost.toFixed(2)}</td>
        </tr>
        <tr style="border-top:2px solid #222;">
          <td style="padding:8px 0 0;font-weight:bold;font-size:15px;">Total</td>
          <td style="padding:8px 0 0;text-align:right;font-weight:bold;font-size:15px;">$${amount} USD</td>
        </tr>
      </table>

      <div style="background:#f8f8f8;border-radius:6px;padding:14px 16px;margin-bottom:16px;">
        <p style="font-size:12px;color:#888;margin:0 0 4px;font-weight:600;">SHIPPING TO</p>
        <p style="font-size:14px;margin:0;">${formatAddress(address)}</p>
      </div>

      <p style="font-size:13px;color:#555;margin:0;">You'll receive another email with tracking info once your order ships. Print-on-demand items are typically produced and shipped within 3-7 business days.</p>
    </div>
    <div style="text-align:center;padding:16px 0;">
      <p style="font-size:12px;color:#aaa;margin:0;">Holy Chip - www.holy-chip.com</p>
    </div>
  </div>`;
}

// Format cart items as HTML table
function cartToHtml(cart) {
  const rows = cart.map(item =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #ddd;">${item.chip || 'N/A'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #ddd;">${item.productType || 'T-Shirt'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #ddd;">${item.size || 'N/A'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #ddd;">${item.quantity}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #ddd;font-size:11px;color:#888;">${item.productId}</td>
    </tr>`
  ).join('');
  return `<table style="border-collapse:collapse;width:100%;font-family:Calibri,sans-serif;font-size:13px;">
    <tr style="background:#f2f2f2;">
      <th style="padding:6px 12px;text-align:left;">Chip</th>
      <th style="padding:6px 12px;text-align:left;">Type</th>
      <th style="padding:6px 12px;text-align:left;">Size</th>
      <th style="padding:6px 12px;text-align:left;">Qty</th>
      <th style="padding:6px 12px;text-align:left;">Printify ID</th>
    </tr>
    ${rows}
  </table>`;
}

// Format address as string
function formatAddress(addr) {
  if (!addr) return 'N/A';
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
    .filter(Boolean).join(', ');
}

// Get variant ID matching size and color
async function getProductVariant(productId, size, productType) {
  try {
    const response = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/products/${productId}.json`,
      {
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch product ${productId}: ${response.status}`);
      return null;
    }

    const product = await response.json();

    let color;
    if (productType === 'Mug') {
      color = 'Black';
    } else {
      color = 'White';
    }

    let variant;

    if (productType === 'Mug') {
      const sizeMatch = size || '11oz';
      variant = product.variants.find(v =>
        v.title === `${color} / ${sizeMatch}` || v.title === `${sizeMatch} / ${color}`
      );
    } else {
      const isRinger = product.variants.some(v => v.title.includes('/') && v.title.split('/').length > 2);

      if (isRinger) {
        variant = product.variants.find(v => v.title === `White/Black / ${size}`);
      } else {
        variant = product.variants.find(v => v.title === `${color} / ${size}`);
      }
    }

    if (!variant) {
      console.error(`No variant found for ${productType} - ${color} / ${size}`);
      return null;
    }

    return variant.id;
  } catch (error) {
    console.error(`Error fetching variant:`, error.message);
    return null;
  }
}

// Create Printify order from checkout session (with retry)
async function createPrintifyOrder(session) {
  const log = [];

  try {
    log.push(`Processing session: ${session.id}`);

    const cartData = session.metadata?.cartData;

    if (!cartData) {
      log.push('ERROR: No cart data in session metadata');
      return { success: false, error: 'Missing cart data', log };
    }

    const cart = JSON.parse(cartData);
    log.push(`Cart: ${cart.length} items`);

    // Build Printify line items
    const printifyItems = [];

    for (const item of cart) {
      const size = item.size || (item.productType === 'Mug' ? '11oz' : 'M');
      const productType = item.productType || 'T-Shirt';

      const variantId = await getProductVariant(item.productId, size, productType);

      if (!variantId) {
        log.push(`WARN: No variant for ${item.chip} ${productType} (${size}) - product ${item.productId}`);
        continue;
      }

      printifyItems.push({
        product_id: item.productId,
        variant_id: variantId,
        quantity: item.quantity
      });

      log.push(`OK: ${item.chip} ${productType} (${size}) - variant ${variantId}`);
    }

    if (printifyItems.length === 0) {
      log.push('ERROR: No valid items to create order');
      return { success: false, error: 'No valid items', log, cart };
    }

    // Build shipping address
    const shipping = session.shipping_details || session.customer_details;
    const address = shipping.address;
    const name = shipping.name || session.customer_details.name || 'Customer';
    const nameParts = name.split(' ');

    const printifyAddress = {
      first_name: nameParts[0] || 'Customer',
      last_name: nameParts.slice(1).join(' ') || '',
      email: session.customer_details.email || session.customer_email,
      phone: shipping.phone || '',
      country: address.country,
      region: address.state || '',
      address1: address.line1,
      address2: address.line2 || '',
      city: address.city,
      zip: address.postal_code
    };

    const orderPayload = {
      external_id: session.id,
      label: `Holy Chip Order - ${session.id.slice(-8)}`,
      line_items: printifyItems,
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: printifyAddress
    };

    // Attempt 1
    log.push('Creating Printify order (attempt 1)...');
    let createResp = await fetch(
      `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/orders.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      }
    );

    let order = await createResp.json();

    // Retry once on failure
    if (!createResp.ok) {
      log.push(`Attempt 1 failed: ${createResp.status} - ${JSON.stringify(order)}`);
      log.push('Retrying in 2s...');
      await new Promise(r => setTimeout(r, 2000));

      createResp = await fetch(
        `${PRINTIFY_CONFIG.apiBase}/shops/${PRINTIFY_CONFIG.shopId}/orders.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PRINTIFY_CONFIG.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderPayload)
        }
      );

      order = await createResp.json();

      if (!createResp.ok) {
        log.push(`Attempt 2 failed: ${createResp.status} - ${JSON.stringify(order)}`);
        return { success: false, error: order, log, cart };
      }
    }

    log.push(`Printify order created: ${order.id}`);
    return { success: true, orderId: order.id, log, cart };

  } catch (error) {
    log.push(`EXCEPTION: ${error.message}`);
    return { success: false, error: error.message, log };
  }
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const sig = event.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      await sendEmail(
        '!! HOLY CHIP - Webhook misconfigured',
        '<p style="font-family:Calibri;font-size:13px;color:#c0392b;"><strong>STRIPE_WEBHOOK_SECRET is not set on Netlify.</strong> Webhook cannot verify Stripe signatures. Orders will not be created.</p>'
      );
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Webhook not configured' })
      };
    }

    // Verify webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        sig,
        webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    console.log(`Received event: ${stripeEvent.type}`);

    // Handle checkout.session.completed
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;

      if (session.payment_status !== 'paid') {
        console.log(`Session ${session.id} not paid yet - skipping`);
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
      }

      console.log(`Payment succeeded for session: ${session.id}`);

      // Parse cart for email
      let cart = [];
      try { cart = JSON.parse(session.metadata?.cartData || '[]'); } catch (e) {}

      const amount = (session.amount_total / 100).toFixed(2);
      const shipping = session.shipping_details || session.customer_details || {};
      const address = shipping.address || {};
      const customerName = shipping.name || session.customer_details?.name || 'Unknown';
      const customerEmail = session.customer_details?.email || session.customer_email || 'Unknown';

      // Check Printify config before attempting
      if (!PRINTIFY_CONFIG.apiToken || !PRINTIFY_CONFIG.shopId) {
        console.error('Printify not configured');
        await sendEmail(
          `!! HOLY CHIP ORDER FAILED - $${amount} - Missing Printify config`,
          `<div style="font-family:Calibri;font-size:13px;">
            <h2 style="color:#c0392b;">Printify Configuration Missing</h2>
            <p><strong>PRINTIFY_API_TOKEN or PRINTIFY_SHOP_ID not set on Netlify.</strong></p>
            <p>Payment of <strong>$${amount} USD</strong> was collected but no Printify order was created.</p>
            <hr>
            <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
            <p><strong>Shipping:</strong> ${formatAddress(address)}</p>
            <p><strong>Stripe Session:</strong> ${session.id}</p>
            <p><strong>Payment Intent:</strong> ${session.payment_intent}</p>
            <h3>Cart</h3>
            ${cartToHtml(cart)}
            <hr>
            <p style="color:#c0392b;"><strong>ACTION REQUIRED:</strong> Set PRINTIFY_API_TOKEN and PRINTIFY_SHOP_ID on Netlify, then manually create this order on Printify.</p>
          </div>`
        );
        return { statusCode: 200, headers, body: JSON.stringify({ received: true }) };
      }

      // Create Printify order
      const result = await createPrintifyOrder(session);

      if (result.success) {
        console.log(`Printify order created: ${result.orderId}`);

        // BUYER CONFIRMATION EMAIL
        const shippingCostUsd = parseInt(session.metadata?.shippingCost || '0') / 100;
        if (customerEmail && customerEmail !== 'Unknown') {
          await sendEmail(
            `Order Confirmed - Holy Chip`,
            buyerConfirmationHtml(customerName, cart, amount, shippingCostUsd, address),
            customerEmail
          );
        }

        // ADMIN NOTIFICATION EMAIL
        await sendEmail(
          `Holy Chip Order - $${amount} - ${customerName}`,
          `<div style="font-family:Calibri;font-size:13px;">
            <h2 style="color:#1e8449;">New Order - $${amount} USD</h2>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Shipping:</strong> ${formatAddress(address)}</p>
            <h3>Items</h3>
            ${cartToHtml(cart)}
            <h3>Status</h3>
            <p style="color:#1e8449;"><strong>Printify order created: ${result.orderId}</strong></p>
            <p>Order is in DRAFT - approve in Printify dashboard to send to production.</p>
            <hr>
            <p style="font-size:11px;color:#888;">Stripe Session: ${session.id}<br>Payment Intent: ${session.payment_intent}<br>Shipping cost: $${(parseInt(session.metadata?.shippingCost || '0') / 100).toFixed(2)}</p>
            <h3 style="font-size:11px;">Webhook Log</h3>
            <pre style="font-size:11px;background:#f5f5f5;padding:8px;border-radius:4px;">${(result.log || []).join('\n')}</pre>
          </div>`
        );
      } else {
        // FAILURE EMAIL
        console.error('Failed to create Printify order:', result.error);
        await sendEmail(
          `!! HOLY CHIP ORDER FAILED - $${amount} - ${customerName}`,
          `<div style="font-family:Calibri;font-size:13px;">
            <h2 style="color:#c0392b;">Order Failed - $${amount} USD</h2>
            <p><strong>Payment was collected but Printify order was NOT created.</strong></p>
            <hr>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Shipping:</strong> ${formatAddress(address)}</p>
            <h3>Items</h3>
            ${cartToHtml(cart)}
            <h3>Error</h3>
            <pre style="font-size:12px;background:#fff0f0;padding:8px;border-radius:4px;color:#c0392b;">${JSON.stringify(result.error, null, 2)}</pre>
            <h3>Full Log</h3>
            <pre style="font-size:11px;background:#f5f5f5;padding:8px;border-radius:4px;">${(result.log || []).join('\n')}</pre>
            <hr>
            <p><strong>Stripe Session:</strong> ${session.id}</p>
            <p><strong>Payment Intent:</strong> ${session.payment_intent}</p>
            <p style="color:#c0392b;"><strong>ACTION REQUIRED:</strong> Manually create this order on Printify using the cart data above.</p>
          </div>`
        );
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    // Try to send alert even on unexpected errors
    await sendEmail(
      '!! HOLY CHIP WEBHOOK CRASH',
      `<div style="font-family:Calibri;font-size:13px;">
        <h2 style="color:#c0392b;">Webhook Function Crashed</h2>
        <pre style="font-size:12px;background:#fff0f0;padding:8px;">${error.message}\n${error.stack || ''}</pre>
        <p>Check Netlify function logs for details.</p>
      </div>`
    );
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
