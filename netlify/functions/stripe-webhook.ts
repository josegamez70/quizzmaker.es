// netlify/functions/stripe-webhook.ts
import { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ---- ENV --------------------------------------------------------------------
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

// Permite usar SUPABASE_URL o VITE_SUPABASE_URL según tengas definido
const SUPABASE_URL =
  (process.env.SUPABASE_URL as string) ||
  (process.env.VITE_SUPABASE_URL as string);
const SUPABASE_SERVICE_ROLE_KEY = process.env
  .SUPABASE_SERVICE_ROLE_KEY as string;

if (!STRIPE_SECRET_KEY) console.error("❌ Falta STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) console.error("❌ Falta STRIPE_WEBHOOK_SECRET");
if (!SUPABASE_URL) console.error("❌ Falta SUPABASE_URL/VITE_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE_KEY)
  console.error("❌ Falta SUPABASE_SERVICE_ROLE_KEY");

// ---- CLIENTES ---------------------------------------------------------------
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" });
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// ---- UTILS ------------------------------------------------------------------
/** Netlify puede mandar body en base64: lo normalizamos a Buffer crudo */
function getRawBody(event: any): Buffer {
  if (event.isBase64Encoded && event.body) {
    return Buffer.from(event.body, "base64");
  }
  return Buffer.from(event.body || "");
}

// ---- WEBHOOK HANDLER --------------------------------------------------------
export const handler: Handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Verificación de firma
  const signature =
    event.headers["stripe-signature"] ||
    event.headers["Stripe-Signature"] ||
    "";

  let stripeEvent: Stripe.Event;

  try {
    const rawBody = getRawBody(event);
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("❌ Error verificando firma del webhook:", err?.message);
    return { statusCode: 400, body: `Webhook signature verification failed` };
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;

        // 1) Preferimos user_id desde metadata (configúralo en tu Checkout Session)
        const metaUserId =
          (session.metadata && session.metadata.user_id) || null;

        // 2) Alternativa por email si no hay user_id
        const email =
          (session.customer_details && session.customer_details.email) ||
          (session.customer_email as string) ||
          null;

        // Marca Pro en Supabase
        let updateError: any = null;

        if (metaUserId) {
          const { error } = await supabase
            .from("profiles")
            .update({ is_pro: true })
            .eq("id", metaUserId);
          updateError = error;
        } else if (email) {
          const { error } = await supabase
            .from("profiles")
            .update({ is_pro: true })
            .eq("email", email);
          updateError = error;
        } else {
          console.warn(
            "⚠️ checkout.session.completed sin metadata.user_id ni email"
          );
        }

        if (updateError) {
          console.error("❌ Error actualizando Supabase:", updateError.message);
          // Devolvemos 200 igualmente para no reintentar eternamente,
          // pero registramos el error para revisar en logs.
          return {
            statusCode: 200,
            body: "Received (Supabase update failed)",
          };
        }

        console.log("✅ Usuario actualizado a Pro en Supabase");
        return { statusCode: 200, body: "User upgraded to Pro" };
      }

      // Puedes añadir aquí más eventos según necesites
      // case "invoice.paid": ...
      // case "customer.subscription.created": ...

      default:
        // Importante responder 200 aunque no lo manejes
        return { statusCode: 200, body: "Event received (ignored)" };
    }
  } catch (err: any) {
    console.error("❌ Error procesando evento:", stripeEvent.type, err);
    // 200 para evitar loop de reintentos si el error es de tu lógica
    return { statusCode: 200, body: "Received (processing error)" };
  }
};
