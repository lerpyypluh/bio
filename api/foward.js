export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const payload = req.body;

    if (!payload || !payload.content) {
      return res.status(400).json({ error: "No payload sent" });
    }

    const webhookURL = process.env.WEBHOOK_URL;

    if (!webhookURL) {
      return res.status(500).json({ error: "WEBHOOK_URL not set in environment" });
    }

    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
