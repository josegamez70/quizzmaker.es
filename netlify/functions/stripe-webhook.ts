// netlify/functions/stripe-webhook.ts
import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Usa la clave service role
);

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'] || '';
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return { statusCode: 400, body: `Webhook Error: ${err}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (userId) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (error) {
        console.error('Error actualizando perfil en Supabase:', error);
        return { statusCode: 500, body: 'Error actualizando perfil en Supabase' };
      }

      console.log(`✅ Usuario ${userId} actualizado como Pro`);
    } else {
      console.warn('⚠️ No se encontró user_id en metadata');
    }
  }

  return { statusCode: 200, body: 'Webhook recibido correctamente' };
};
