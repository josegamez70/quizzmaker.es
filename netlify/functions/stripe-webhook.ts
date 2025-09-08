// netlify/functions/stripe-webhook.ts
import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

const supabase = createClient(
  (process.env.SUPABASE_URL as string) || (process.env.VITE_SUPABASE_URL as string),
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

function rawBody(event: any): Buffer {
  return event.isBase64Encoded && event.body
    ? Buffer.from(event.body, "base64")
    : Buffer.from(event.body || "");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const signature =
    (event.headers["stripe-signature"] as string) ||
    (event.headers["Stripe-Signature"] as string) ||
    "";

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody(event),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    return { statusCode: 400, body: "Webhook signature verification failed" };
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id ?? null;
      const email =
        session.customer_details?.email || (session.customer_email as string) || null;

      if (userId) {
        await supabase.from("profiles").update({ is_pro: true }).eq("id", userId);
      } else if (email) {
        await supabase.from("profiles").update({ is_pro: true }).eq("email", email);
      }

      return { statusCode: 200, body: "OK" };
    }

    return { statusCode: 200, body: "Ignored" };
  } catch {
    return { statusCode: 200, body: "Received (processing error)" };
  }
};
