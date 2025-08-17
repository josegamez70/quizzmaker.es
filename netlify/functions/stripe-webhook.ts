import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] as string;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return { statusCode: 400, body: `Webhook error: ${err}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (error) {
        console.error('Error actualizando perfil Supabase:', error);
      }
    }
  }

  return { statusCode: 200, body: 'OK' };
};

export { handler };
