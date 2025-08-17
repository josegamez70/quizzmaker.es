import Stripe from "stripe";
import { Handler } from "@netlify/functions";
import { supabase } from "../../src/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
});

const handler: Handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { origin, user } = body;

    if (!user || !user.id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta el ID del usuario." }),
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Cuenta Pro - QuizzMaker",
            },
            unit_amount: 490, // en céntimos
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id, // 👈 ESENCIAL para que el webhook sepa qué usuario actualizar
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error("Error creando sesión de Stripe:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al crear la sesión de pago" }),
    };
  }
};

export { handler };
