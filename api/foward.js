// forward.js
const express = require("express");
const fetch = require("node-fetch"); // npm install node-fetch@2
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Get the target webhook URL from Vercel secret
const TARGET_WEBHOOK = process.env.TARGET_WEBHOOK; // set this in Vercel

if (!TARGET_WEBHOOK) {
  console.error("TARGET_WEBHOOK is not set in environment variables!");
  process.exit(1);
}

app.post("/api/forward", async (req, res) => {
  try {
    const payload = req.body;

    console.log("Received payload:", payload); // optional debug log

    const response = await fetch(TARGET_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error("Failed to forward payload:", response.statusText);
      return res.status(500).json({ status: "error", message: "Failed to forward payload" });
    }

    res.json({ status: "success", message: "Payload forwarded" });
  } catch (error) {
    console.error("Error in /forward:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Forward API running on port ${PORT}`);
});
