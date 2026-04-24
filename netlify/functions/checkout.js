const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid body" }) };
  }

  const { email, language = "fr" } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid email" }) };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [{
        price_data: {
          currency: "xaf",
          unit_amount: 100000, // 1000 FCFA in centimes
          recurring: { interval: "month" },
          product_data: {
            name: language === "fr" ? "AutoFlow Pro — Abonnement mensuel" : "AutoFlow Pro — Monthly subscription",
            description: language === "fr"
              ? "Génération illimitée de workflows n8n par IA"
              : "Unlimited AI-powered n8n workflow generation",
          },
        },
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/pricing`,
    });

    return { statusCode: 200, headers, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error("Stripe error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Payment setup failed" }) };
  }
};
