// Orange Money manual validation endpoint
// Stores payment requests for manual admin review

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

  const { email, phone, transactionId, name } = body;

  if (!email || !phone || !transactionId || !name) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  // Sanitize inputs
  const sanitized = {
    email: email.slice(0, 100),
    phone: phone.replace(/[^0-9+\s]/g, "").slice(0, 20),
    transactionId: transactionId.replace(/[^a-zA-Z0-9\-_]/g, "").slice(0, 50),
    name: name.replace(/[<>]/g, "").slice(0, 100),
    submittedAt: new Date().toISOString(),
  };

  // In production: store to Supabase or send email notification to admin
  // For now: log and return pending status
  console.log("Orange Money payment request:", JSON.stringify(sanitized));

  // TODO: Connect to Supabase
  // const { data, error } = await supabase.from('payment_requests').insert(sanitized);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: "pending",
      message: "Your payment request has been received. Access will be activated within 2 hours after verification.",
      reference: `OM-${Date.now()}`,
    }),
  };
};
