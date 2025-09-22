export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // Your secret stored in Vercel environment variables
  const secret = process.env.RELAY_SECRET;

  if (!secret) {
    return res.status(500).json({ error: 'Secret not set' });
  }

  res.status(200).json({ secret });
}
