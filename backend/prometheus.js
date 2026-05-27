const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracion de las solicitudes HTTP en segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duracion de consultas a la base de datos en segundos',
  labelNames: ['operation'],
  buckets: [0.001, 0.01, 0.05, 0.1, 0.3, 0.5, 1],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de solicitudes HTTP',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const dbPoolSize = new client.Gauge({
  name: 'db_pool_size',
  help: 'Tamanio del pool de conexiones a la BD',
  labelNames: ['type'],
  registers: [register],
});

const appInfo = new client.Gauge({
  name: 'app_info',
  help: 'Informacion de la aplicacion',
  labelNames: ['version', 'node_version'],
  registers: [register],
});

appInfo.set({ version: '2.0.0', node_version: process.version }, 1);

function middleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.url;
    httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
    httpRequestsTotal.inc({ method: req.method, route, status_code: res.statusCode });
  });
  next();
}

function trackDbQuery(operation, durationMs) {
  dbQueryDuration.observe({ operation }, durationMs / 1000);
}

function trackPoolSize(total, active, idle, waiting) {
  dbPoolSize.set({ type: 'total' }, total);
  dbPoolSize.set({ type: 'active' }, active);
  dbPoolSize.set({ type: 'idle' }, idle);
  dbPoolSize.set({ type: 'waiting' }, waiting);
}

let poolRef = null;
function attachPool(pool) {
  poolRef = pool;
  setInterval(() => {
    if (poolRef && poolRef.totalCount !== undefined) {
      trackPoolSize(
        poolRef.totalCount,
        poolRef.activeCount,
        poolRef.idleCount,
        poolRef.waitingCount,
      );
    }
  }, 10000);
}

module.exports = { register, middleware, trackDbQuery, attachPool };
