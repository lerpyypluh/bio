// api/foward.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookURL = process.env.WEBHOOK_URL;
  if (!webhookURL) {
    return res.status(500).json({ error: "WEBHOOK_URL not configured" });
  }

  try {
    const body = await req.json();

    // Forward the payload to the Discord webhook
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error forwarding webhook:", err);
    res.status(500).json({ error: err.message });
  }
}
