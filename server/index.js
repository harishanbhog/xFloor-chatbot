import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.join(__dirname, '..', 'public')

const store = { events: [], conversations: new Map() }

const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(obj))
}

function serveStatic(req, res) {
  let reqPath = req.url === '/' ? '/index.html' : req.url
  const safe = path.normalize(reqPath).replace(/^\.+/, '')
  const filePath = path.join(publicDir, safe)
  if (!filePath.startsWith(publicDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404)
    return res.end('Not found')
  }
  const ext = path.extname(filePath)
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' }
  res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' })
  fs.createReadStream(filePath).pipe(res)
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
  })
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/api/recent')) {
    const query = new URL(req.url, 'http://localhost').searchParams
    const limit = Math.max(1, Math.min(Number(query.get('limit') || 20), 100))
    return sendJson(res, 200, { items: store.events.slice(0, limit) })
  }

  if (req.method === 'POST' && req.url === '/api/content') {
    try {
      const { floor_id, block_id, block_type, user_id, title = '', description } = await parseBody(req)
      if (!floor_id || !block_id || !block_type || !user_id || !description) {
        return sendJson(res, 400, { error: 'Missing required fields' })
      }
      const event = {
        id: id('evt'), floor_id, block_id, block_type, user_id, title, description,
        createdAt: new Date().toISOString(), status: 'queued'
      }
      store.events.unshift(event)
      setTimeout(() => { event.status = 'indexed' }, 1200)
      return sendJson(res, 200, { id: event.id, status: event.status, createdAt: event.createdAt })
    } catch (e) {
      return sendJson(res, 400, { error: e.message })
    }
  }

  if (req.method === 'POST' && req.url === '/api/query') {
    try {
      const { user_id, app_id, prompt } = await parseBody(req)
      if (!user_id || !app_id || !prompt) {
        return sendJson(res, 400, { error: 'user_id, app_id, and prompt are required' })
      }
      const prior = store.conversations.get(user_id) || []
      const recent = store.events.slice(0, 3).map((e) => e.description).join(' | ') || 'no ingested events yet'
      const answer = `Stubbed answer for ${user_id}: You asked "${prompt}". Recent memory context: ${recent}.`
      store.conversations.set(user_id, [...prior, { prompt, answer, at: new Date().toISOString() }].slice(-10))
      return sendJson(res, 200, { answer, conversation_length: store.conversations.get(user_id).length })
    } catch (e) {
      return sendJson(res, 400, { error: e.message })
    }
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    return sendJson(res, 200, { ok: true })
  }

  return serveStatic(req, res)
})

const port = Number(process.env.PORT || 8787)
server.listen(port, () => console.log(`Server on http://localhost:${port}`))
