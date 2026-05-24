// Infisical secret manager integration
//
// Modos de uso:
//   1. CLI (recomendado): El entrypoint del contenedor ejecuta
//      `infisical run -- node server.js` que inyecta secrets como env vars.
//      No requiere este modulo.
//
//   2. SDK: Setear INFISICAL_CLIENT_ID y INFISICAL_CLIENT_SECRET
//      para cargar secrets via @infisical/sdk v1.2.11
//
//   3. Fallback: Variables de entorno tradicionales (.env, k8s secrets)

const INFISICAL_ENABLED = process.env.INFISICAL_TOKEN
  || (process.env.INFISICAL_CLIENT_ID && process.env.INFISICAL_CLIENT_SECRET);

let client = null;
let isInitialized = false;

async function initSDK() {
  if (isInitialized) return;

  if (process.env.INFISICAL_TOKEN) {
    console.log('[Infisical] Usando token de ambiente (INFISICAL_TOKEN).');
    isInitialized = true;
    return;
  }

  try {
    const { InfisicalClient } = require('@infisical/sdk');
    client = new InfisicalClient({
      logLevel: process.env.INFISICAL_LOG_LEVEL || 'error',
    });
    console.log('[Infisical] SDK inicializado correctamente.');
  } catch (err) {
    console.error('[Infisical] Error al inicializar SDK:', err.message);
    console.log('[Infisical] Usando variables de entorno como fallback.');
  }
  isInitialized = true;
}

async function loadSecrets() {
  await initSDK();
  if (!client) return {};

  const env = process.env.INFISICAL_ENV || 'dev';
  const path = process.env.INFISICAL_PATH || '/';
  const projectId = process.env.INFISICAL_PROJECT_ID;

  if (!projectId) {
    console.warn('[Infisical] INFISICAL_PROJECT_ID no configurado.');
    return {};
  }

  try {
    const secrets = await client.listSecrets({
      environment: env,
      path,
      projectId,
    });
    const map = {};
    for (const s of secrets) {
      map[s.secretKey] = s.secretValue;
    }
    console.log(`[Infisical] ${Object.keys(map).length} secretos cargados de "${env}${path}".`);
    return map;
  } catch (err) {
    console.error('[Infisical] Error al cargar secretos:', err.message);
    return {};
  }
}

async function getSecret(key, defaultValue = null) {
  if (!client) return process.env[key] || defaultValue;

  const env = process.env.INFISICAL_ENV || 'dev';
  const path = process.env.INFISICAL_PATH || '/';
  const projectId = process.env.INFISICAL_PROJECT_ID;

  if (!projectId) return process.env[key] || defaultValue;

  try {
    const secret = await client.getSecret({
      environment: env,
      path,
      projectId,
      secretName: key,
    });
    return secret.secretValue || process.env[key] || defaultValue;
  } catch {
    return process.env[key] || defaultValue;
  }
}

module.exports = { loadSecrets, getSecret, INFISICAL_ENABLED };
