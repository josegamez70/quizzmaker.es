// netlify/functions/create-checkout-session.ts

import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { user_id } = JSON.parse(event.body || '{}');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1RkO0CD66URNCYcO5LMLPRGe',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://quizzmaker.es/success',
      cancel_url: 'https://quizzmaker.es/cancel',
      metadata: {
        user_id, // ✅ Aquí enviamos el user_id a Stripe
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ id: session.id }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
