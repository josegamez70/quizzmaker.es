// netlify/functions/stripe-webhook.ts
import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-04-10',
});

// Crea Supabase client porque estamos en función serverless (no usar supabaseClient.ts)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ATENCIÓN: aquí necesitas la clave secreta "service_role"
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const handler: Handler = async (event) => {
  const signature = event.headers['stripe-signature'];
  if (!signature) return { statusCode: 400, body: 'Missing stripe-signature header' };

  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body!, signature, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err);
    return { statusCode: 400, body: 'Webhook Error' };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error('❌ Metadata.user_id is missing in session');
      return { statusCode: 400, body: 'Missing user_id in metadata' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (error) {
        console.error('❌ Supabase update failed:', error.message);
        return { statusCode: 500, body: 'Failed to update user in Supabase' };
      }

      console.log(`✅ Usuario ${userId} actualizado como PRO.`);
      return { statusCode: 200, body: 'User upgraded to PRO successfully' };
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      return { statusCode: 500, body: 'Unexpected error updating user' };
    }
  }

  // Para cualquier otro evento, responde 200 sin acción
  return { statusCode: 200, body: 'Webhook received with no action' };
};

export { handler };
