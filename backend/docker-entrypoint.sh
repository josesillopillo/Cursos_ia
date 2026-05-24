#!/bin/sh
# ============================================
# AI Master - Docker Entrypoint
# ============================================
# Si INFISICAL_TOKEN esta configurado y el CLI
# de infisical esta disponible, inyecta los
# secretos antes de iniciar la aplicacion.
# ============================================

set -e

# Si Infisical esta configurado, intentar inyectar secretos
if [ -n "$INFISICAL_TOKEN" ] && command -v infisical >/dev/null 2>&1; then
  echo "[Entrypoint] Infisical detectado. Inyectando secretos..."

  # Autenticar con el token universal
  export INFISICAL_UNIVERSAL_AUTH_TOKEN="$INFISICAL_TOKEN"

  # Usar infisical run para inyectar secretos como variables de entorno
  exec infisical run --token "$INFISICAL_TOKEN" -- node server.js
fi

# Si solo tenemos CLIENT_ID/CLIENT_SECRET, el SDK lo maneja
if [ -n "$INFISICAL_CLIENT_ID" ] && [ -n "$INFISICAL_CLIENT_SECRET" ]; then
  echo "[Entrypoint] Infisical SDK configurado via CLIENT_ID/CLIENT_SECRET."
  echo "[Entrypoint] Los secretos se cargaran desde el SDK en Node.js."
fi

# Fallback: iniciar directamente
echo "[Entrypoint] Iniciando aplicacion..."
exec node server.js
