// api/heartbeat.js
let activeUsers = new Map(); // userId => lastPing timestamp

export default function handler(req, res) {
  const now = Date.now();

  if (req.method === 'POST') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    activeUsers.set(id, now); // mark user as active
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method === 'GET') {
    // Remove users inactive for 60 seconds
    for (const [id, lastPing] of activeUsers.entries()) {
      if (now - lastPing > 60_000) activeUsers.delete(id);
    }

    return res.status(200).json({ activeUsers: activeUsers.size });
  }

  res.status(405).end();
}
