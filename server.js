const http = require('http');
const fs = require('fs');
const path = require('path');
const { AppSDK } = require('./appsdk');

const PORT = Number(process.env.PORT || 3000);
const XFLOOR_BASE_URL = process.env.XFLOOR_BASE_URL || 'https://api.xfloor.ai';
const XFLOOR_API_KEY = process.env.XFLOOR_API_KEY || '';
const XFLOOR_AGENT_ID = process.env.XFLOOR_AGENT_ID || '';

const staticDir = path.join(__dirname, 'public');

let appSdk;

function getSdk() {
  if (appSdk) {
    return appSdk;
  }

  appSdk = new AppSDK({
    baseUrl: XFLOOR_BASE_URL,
    apiKey: XFLOOR_API_KEY,
    agentId: XFLOOR_AGENT_ID
  });

  return appSdk;
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function getReplyText(queryResponse) {
  return (
    queryResponse?.answer ||
    queryResponse?.result?.answer ||
    queryResponse?.response?.text ||
    queryResponse?.message ||
    queryResponse?.data?.answer ||
    'I received your message, but no text reply was found in Query response.'
  );
}

async function handleChat(req, res) {
  if (!XFLOOR_AGENT_ID) {
    sendJson(res, 500, {
      error: 'Missing XFLOOR_AGENT_ID environment variable.'
    });
    return;
  }

  let body;

  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON request body.' });
    return;
  }

  const message = body?.message?.trim();
  const sessionId = body?.sessionId || 'demo-session';

  if (!message) {
    sendJson(res, 400, { error: 'message is required.' });
    return;
  }

  try {
    const sdk = getSdk();

    await sdk.event({
      sessionId,
      text: message,
      type: 'user_message'
    });

    const queryResult = await sdk.query({
      sessionId,
      query: message
    });

    sendJson(res, 200, {
      reply: getReplyText(queryResult),
      rawQueryResponse: queryResult
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error.message,
      details: error.details || null
    });
  }
}

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/index.html' : req.url;

  if (filePath.includes('..')) {
    sendJson(res, 400, { error: 'Invalid path.' });
    return;
  }

  const resolvedPath = path.join(staticDir, filePath);
  fs.readFile(resolvedPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(resolvedPath);
    const types = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8'
    };

    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    handleChat(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed.' });
});

server.listen(PORT, () => {
  console.log(`xFloor chatbot running on http://localhost:${PORT}`);
});
