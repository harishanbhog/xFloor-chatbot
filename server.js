const http = require('http');
const fs = require('fs');
const path = require('path');
const { XFloorMemorySDK, buildEventInput, buildQueryRequest } = require('./appsdk');

const PORT = Number(process.env.PORT || 3000);
const XFLOOR_APP_ID = process.env.XFLOOR_APP_ID || '';

const staticDir = path.join(__dirname, 'public');
let sdkInstance;

function getSdk() {
  if (!sdkInstance) {
    sdkInstance = new XFloorMemorySDK({ appId: XFLOOR_APP_ID });
  }

  return sdkInstance;
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

async function handleEventIngestion(req, res) {
  let body;

  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON request body.' });
    return;
  }

  const required = ['floorId', 'blockId', 'blockType', 'userId', 'title', 'description'];
  for (const key of required) {
    if (!body?.[key]) {
      sendJson(res, 400, { error: `${key} is required.` });
      return;
    }
  }

  try {
    const inputInfo = buildEventInput(body);
    const result = await getSdk().event(inputInfo, body.metadata || {});

    sendJson(res, 200, {
      message: 'Event accepted',
      eventResponse: result
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error?.message || 'Event ingestion failed.',
      details: error || null
    });
  }
}

async function handleQuery(req, res) {
  let body;

  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON request body.' });
    return;
  }

  if (!body?.userId) {
    sendJson(res, 400, { error: 'userId is required.' });
    return;
  }

  if (!body?.query) {
    sendJson(res, 400, { error: 'query is required.' });
    return;
  }

  try {
    const queryRequest = buildQueryRequest(body);
    const result = await getSdk().query(queryRequest);

    sendJson(res, 200, {
      answer: result?.answer || '',
      queryResponse: result
    });
  } catch (error) {
    sendJson(res, 502, {
      error: error?.message || 'Query failed.',
      details: error || null
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
  if (req.method === 'POST' && req.url === '/api/event') {
    handleEventIngestion(req, res);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/query') {
    handleQuery(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed.' });
});

server.listen(PORT, () => {
  console.log(`xFloor memory demo running on http://localhost:${PORT}`);
});
