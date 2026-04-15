import { Hono } from 'hono'

const app = new Hono()

app.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  await next()
})

const welcomeStrings = [
  'Hello Hono!',
  'To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono'
]

app.get('/', (c) => {
  return c.text(welcomeStrings.join('\n\n'))
})

app.get('/api/classify', async (c) => {
  const name = c.req.query('name')

  if (name === undefined || name === '') {
    return c.json({ status: 'error', message: 'Missing name parameter' }, 400)
  }

  if (typeof name !== 'string') {
    return c.json({ status: 'error', message: 'Name must be a string' }, 422)
  }

  try {
    const response = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`)
    
    if (!response.ok) {
      const status = response.status
      return c.json({ status: 'error', message: 'External API error' }, status >= 500 ? 502 : status)
    }

    const data = await response.json()

    if (data.gender === null || data.count === 0) {
      return c.json({ status: 'error', message: 'No prediction available for the provided name' }, 400)
    }

    const probability = data.probability
    const sample_size = data.count
    const is_confident = probability >= 0.7 && sample_size >= 100

    return c.json({
      status: 'success',
      data: {
        name: data.name,
        gender: data.gender,
        probability: probability,
        sample_size: sample_size,
        is_confident: is_confident,
        processed_at: new Date().toISOString()
      }
    })
  } catch (error) {
    return c.json({ status: 'error', message: 'Internal server error' }, 500)
  }
})

export default app
