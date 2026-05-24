#!/bin/bash
# ============================================
# AI Master - Setup de Infisical
# ============================================
# Este script configura Infisical para la gestion
# segura de secretos en el proyecto AI Master.
#
# Prerrequisitos:
#   1. Cuenta en https://app.infisical.com (o instancia self-hosted)
#   2. CLI de Infisical instalado
#   3. Docker y kubectl configurados
#
# Uso:
#   ./scripts/setup-infisical.sh
# ============================================

set -euo pipefail

echo "============================================"
echo "  AI Master - Configuracion de Infisical"
echo "============================================"
echo ""

# --- 1. Verificar Infisical CLI ---
if ! command -v infisical &>/dev/null; then
  echo "[!] Infisical CLI no encontrado."
  echo "    Instalalo desde: https://infisical.com/docs/cli/installation"
  echo "    O via npm: npm install -g @infisical/cli"
  exit 1
fi

echo "[OK] Infisical CLI detectado: $(infisical --version)"

# --- 2. Login ---
echo ""
echo "=== Inicio de sesion en Infisical ==="
infisical login

# --- 3. Crear/Seleccionar proyecto ---
echo ""
echo "=== Configurar proyecto ==="
echo "Selecciona un proyecto existente o crea uno nuevo en:"
echo "  https://app.infisical.com"
echo ""
read -rp "ID del workspace de Infisical: " WORKSPACE_ID

if [ -z "$WORKSPACE_ID" ]; then
  echo "[!] Debes proporcionar un Workspace ID."
  exit 1
fi

# Guardar config local
cat > .infisical.json <<EOF
{
  "workspaceId": "$WORKSPACE_ID",
  "defaultEnvironment": "dev",
  "gitBranchToEnvironmentMapping": {
    "main": "prod",
    "develop": "dev"
  }
}
EOF

echo "[OK] Configuracion local guardada en .infisical.json"

# --- 4. Crear Machine Identity ---
echo ""
echo "=== Crear Machine Identity ==="
echo "Crea una identidad de maquina en:"
echo "  1. https://app.infisical.com -> Identity Management"
echo "  2. Crea una nueva identidad (acceso: read)"
echo "  3. Asociala al proyecto con permisos de lectura"
echo "  4. Genera Client ID y Client Secret"
echo ""

read -rp "Client ID: " CLIENT_ID
read -rsp "Client Secret: " CLIENT_SECRET
echo ""

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "[!] Client ID y Client Secret son requeridos."
  exit 1
fi

# --- 5. Cargar secretos iniciales ---
echo ""
echo "=== Cargar secretos iniciales en Infisical ==="
echo ""

# Leer secrets del .env si existe
if [ -f .env ]; then
  echo "Cargando secretos desde .env..."
  while IFS='=' read -r key value; do
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    if [[ "$key" =~ ^(JWT_SECRET|POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB|CORS_ORIGIN)$ ]]; then
      infisical secrets set "$key=$value" --env dev --token "$CLIENT_SECRET" 2>/dev/null || true
      echo "  [+] $key agregado"
    fi
  done < <(grep -v '^\s*#' .env | grep '=')
else
  echo "[!] No se encontro .env. Carga los secretos manualmente en la UI de Infisical."
fi

# --- 6. Configurar variable de entorno local ---
echo ""
echo "=== Configurar variables locales ==="
cat >> .env <<EOF

# Infisical
INFISICAL_CLIENT_ID=$CLIENT_ID
INFISICAL_CLIENT_SECRET=$CLIENT_SECRET
INFISICAL_SITE_URL=https://app.infisical.com
INFISICAL_ENV=dev
INFISICAL_PATH=/
EOF

echo "[OK] Variables de entorno agregadas a .env"

# --- 7. Resumen ---
echo ""
echo "============================================"
echo "  Configuracion completada!"
echo "============================================"
echo ""
echo "  Proximos pasos:"
echo "  1. Docker Compose: docker compose up -d --build"
echo "  2. K8s:           kubectl apply -f k8s/external-secret.yaml"
echo "  3. Agregar mas secretos desde CLI:"
echo "     infisical secrets set MI_SECRET=valor --env dev"
echo ""
echo "  Los secretos se cargaran automaticamente"
echo "  desde Infisical al iniciar la aplicacion."
echo "============================================"
