const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_WT || process.env.STRIPE_SECRET_KEY);

const PRICE_MAP = {
  pay_in_full:    { id: 'price_1TLXBbKnbiTjogJTmZz37NBP', mode: 'payment' },
  payment_plan:   { id: 'price_1TLXDgKnbiTjogJTjsBtT2YB', mode: 'subscription' },
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { plan } = JSON.parse(event.body || '{}');
    const price = PRICE_MAP[plan];
    if (!price) return { statusCode: 400, body: JSON.stringify({ error: `Unknown plan: ${plan}` }) };

    const origin = event.headers.origin || 'https://itblueprintpro.com';
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      line_items: [{ price: price.id, quantity: 1 }],
      mode: price.mode,
      return_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ clientSecret: session.client_secret }),
    };
  } catch (err) {
    console.error('Stripe error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
