// File: api/forward.js
// Simple Vercel serverless function that validates a secret header and forwards JSON to a Discord webhook.
// Env vars required: DISCORD_WEBHOOK_URL, VERCEL_RELAY_SECRET

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Verify secret header
  const clientSecret = req.headers["x-relay-secret"];
  const EXPECTED_SECRET = process.env.VERCEL_RELAY_SECRET;
  if (!EXPECTED_SECRET || clientSecret !== EXPECTED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate JSON body
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const webhookURL = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookURL) {
    return res.status(500).json({ error: "Server misconfiguration: missing webhook url" });
  }

  try {
    const discordRes = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      return res.status(502).json({ error: "Discord webhook error", status: discordRes.status, body: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Forward error:", err);
    return res.status(500).json({ error: "Forward failed", message: err.message });
  }
}
