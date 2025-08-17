// netlify/functions/stripe-webhook.ts
import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  if (!sig) return { statusCode: 400, body: 'Missing signature' };

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body as string,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error('❌ Error verificando el webhook:', err);
    return { statusCode: 400, body: `Webhook Error: ${(err as Error).message}` };
  }

  // ✅ Procesar el evento
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error('❌ No se encontró user_id en metadata.');
      return { statusCode: 400, body: 'No user_id in metadata' };
    }

    console.log('✅ Pago completado por usuario:', userId);

    // 🔁 Actualizar el campo is_pro = true
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error actualizando Supabase:', error);
      return { statusCode: 500, body: 'Error updating user profile' };
    }

    console.log('✅ Usuario actualizado a Pro en Supabase:', userId);
  }

  return { statusCode: 200, body: 'OK' };
};

export { handler };
