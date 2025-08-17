import { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const handler: Handler = async (event) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      // 🔧 Corrección aquí: usar URLs absolutas válidas
      success_url: 'https://quizzmaker.es/success',
      cancel_url: 'https://quizzmaker.es/cancel',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error: any) {
    console.error('Error creando sesión de Stripe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'No se pudo crear la sesión de pago.' }),
    };
  }
};

export { handler };
