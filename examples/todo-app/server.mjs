import { createServer } from 'node:http';

// Zero-dependency Node backend for the todo example. In-memory CRUD.
let todos = [{ id: '1', title: 'Try AVP', done: false }];
let nextId = 2;

const send = (res, status, body) => {
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

const readJson = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const { method } = req;
  if (method === 'OPTIONS') return send(res, 204);

  const match = url.pathname.match(/^\/api\/todos\/?([^/]*)$/);
  if (!match) return send(res, 404, { error: 'not found' });
  const id = match[1];

  if (method === 'GET' && !id) return send(res, 200, todos);

  if (method === 'POST' && !id) {
    const body = await readJson(req);
    const title = String(body.title ?? '').trim();
    if (!title) return send(res, 400, { error: 'title is required' });
    const todo = { id: String(nextId++), title, done: false };
    todos.push(todo);
    return send(res, 201, todo);
  }

  if (method === 'PATCH' && id) {
    const body = await readJson(req);
    todos = todos.map((t) => (t.id === id ? { ...t, ...body, id } : t));
    return send(res, 200, todos.find((t) => t.id === id) ?? null);
  }

  if (method === 'DELETE' && id) {
    todos = todos.filter((t) => t.id !== id);
    return send(res, 204);
  }

  return send(res, 405, { error: 'method not allowed' });
});

const PORT = 8787;
server.listen(PORT, () => console.log(`todo backend on http://localhost:${PORT}`));
