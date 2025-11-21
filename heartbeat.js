// api/heartbeat.js

// Using a simple object as a pseudo "global" store
// Works per Vercel instance; multiple instances won't sync but is okay for small-scale
let activeUsers = {}; // userId => lastPing timestamp

export default function handler(req, res) {
  const now = Date.now();

  if (req.method === 'POST') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    activeUsers[id] = now; // mark user as active
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method === 'GET') {
    // Remove users inactive for 60 seconds
    for (const id in activeUsers) {
      if (now - activeUsers[id] > 60_000) {
        delete activeUsers[id];
      }
    }

    // Return count and optional list of active user IDs
    const userIds = Object.keys(activeUsers);
    return res.status(200).json({ activeUsersCount: userIds.length, userIds });
  }

  res.status(405).end(); // Method Not Allowed
}
