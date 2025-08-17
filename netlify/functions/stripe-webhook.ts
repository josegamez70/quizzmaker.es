// netlify/functions/stripe-webhook.ts

import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Falta la firma de Stripe');
    return { statusCode: 400, body: 'Missing Stripe signature' };
  }

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('❌ Error validando webhook:', err);
    return { statusCode: 400, body: `Webhook Error: ${err}` };
  }

  console.log('✅ Evento recibido:', stripeEvent.type);

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    console.log('🧾 user_id:', userId);
    console.log('🧾 email:', session.customer_email);

    if (!userId) {
      console.error('❌ No se recibió user_id en metadata');
      return { statusCode: 400, body: 'No user_id in metadata' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error actualizando Supabase:', error.message);
      return { statusCode: 500, body: 'Supabase update failed' };
    }

    console.log('✅ Usuario actualizado a Pro en Supabase');
    return { statusCode: 200, body: 'User upgraded to Pro' };
  }

  return { statusCode: 200, body: 'Event received (ignored)' };
};

export { handler };
