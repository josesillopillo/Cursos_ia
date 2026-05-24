const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

let app;
let baseUrl;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.POSTGRES_HOST = 'localhost';
  // Usamos un servidor real pero sin DB para probar solo rutas
  app = require('../server');
  const http = require('http');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  global.__server__ = server;
});

after((done) => {
  global.__server__.close(done);
});

describe('GET /api/health', () => {
  it('deberia responder con 200 y estructura valida', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok('success' in body);
    assert.ok('uptime' in body);
    assert.ok('timestamp' in body);
    assert.ok('database' in body);
  });
});

describe('POST /api/register - validacion', () => {
  it('deberia rechazar email invalido', async () => {
    const res = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Test', email: 'no-es-email', password: '12345678' }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
    assert.ok(body.details);
  });

  it('deberia rechazar password corta', async () => {
    const res = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: 'Test', email: 'test@test.com', password: '123' }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  });
});

describe('POST /api/login - validacion', () => {
  it('deberia rechazar email invalido', async () => {
    const res = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad', password: '12345678' }),
    });
    const body = await res.json();
    assert.equal(res.status, 400);
    assert.equal(body.success, false);
  });
});

describe('GET /api/me sin token', () => {
  it('deberia devolver 401', async () => {
    const res = await fetch(`${baseUrl}/api/me`);
    assert.equal(res.status, 401);
  });
});

describe('GET /api/cursos', () => {
  it('deberia responder (aunque vacio sin DB)', async () => {
    const res = await fetch(`${baseUrl}/api/cursos`);
    assert.equal(res.status, 200);
  });
});

describe('404 en rutas desconocidas', () => {
  it('deberia devolver 404', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent`);
    const body = await res.json();
    assert.equal(res.status, 404);
    assert.equal(body.success, false);
  });
});
