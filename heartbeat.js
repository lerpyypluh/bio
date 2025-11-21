import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.body
    await redis.set(id, Date.now(), { ex: 60 }) // key expires after 60 seconds
    return res.status(200).json({ status: 'ok' })
  }

  if (req.method === 'GET') {
    const keys = await redis.keys('*')
    return res.status(200).json({ activeUsers: keys.length })
  }

  res.status(405).end()
}
