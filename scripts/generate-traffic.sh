#!/bin/bash
# Generador de trafico para validar metricas en Prometheus y Grafana
# Uso: bash scripts/generate-traffic.sh [URL base] [duracion_segundos]

BASE_URL="${1:-http://localhost:8081}"
DURATION="${2:-30}"
END=$((SECONDS + DURATION))

echo "Generando trafico hacia $BASE_URL durante ${DURATION}s..."
echo ""

generate_name() {
  local adj=("ninja" "cyber" "quantum" "neon" "astro" "dark" "pixel" "zero" "flux" "void")
  local noun=("wolf" "hawk" "panda" "cipher" "storm" "nova" "byte" "echo" "volt" "phantom")
  echo "${adj[$((RANDOM % 10))]}_${noun[$((RANDOM % 10))]}_$((RANDOM % 9999))"
}

while [ $SECONDS -lt $END ]; do
  # 1. Health check (siempre funciona)
  curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null
  echo " GET /api/health"

  # 2. Listar cursos
  curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/cursos" 2>/dev/null
  echo " GET /api/cursos"

  # 3. Listar categorias
  curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/categorias" 2>/dev/null
  echo " GET /api/categorias"

  # 4. Listar usuarios
  curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users" 2>/dev/null
  echo " GET /api/users"

  # 5. Registrar usuario
  NAME=$(generate_name)
  RESP=$(curl -s -X POST "$BASE_URL/api/register" \
    -H "Content-Type: application/json" \
    -d "{\"nombre\":\"$NAME\",\"email\":\"${NAME}@test.com\",\"password\":\"test12345\"}" 2>/dev/null)
  CODE=$(echo "$RESP" | grep -o '"success":true' | head -1)
  TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$CODE" ]; then
    echo "201 POST /api/register ($NAME)"

    # 6. Obtener perfil
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/me" \
      -H "Authorization: Bearer $TOKEN" 2>/dev/null
    echo " GET /api/me"

    # 7. Inscribirse en 1-3 cursos aleatorios
    COURSES=$(curl -s "$BASE_URL/api/cursos" 2>/dev/null | grep -o '"id":[0-9]*' | cut -d: -f2)
    for cid in $(echo "$COURSES" | shuf | head -$((RANDOM % 3 + 1))); do
      curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/enroll" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{\"curso_id\":$cid}" 2>/dev/null
      echo " POST /api/enroll (curso $cid)"
    done

    # 8. Ver perfil de otro usuario
    OTHER=$((RANDOM % 10 + 1))
    curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/users/$OTHER" 2>/dev/null
    echo " GET /api/users/$OTHER"
  else
    # ya existe -> intentar login
    RESP=$(curl -s -X POST "$BASE_URL/api/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${NAME}@test.com\",\"password\":\"test12345\"}" 2>/dev/null)
    TOKEN=$(echo "$RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
      curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/me" \
        -H "Authorization: Bearer $TOKEN" 2>/dev/null
      echo " GET /api/me (login existente)"
    fi
  fi

  # 9. Metricas endpoint
  curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/metrics" 2>/dev/null
  echo " GET /api/metrics"

  # Pequena pausa aleatoria entre requests
  sleep 0.$((RANDOM % 5 + 1))
done

echo ""
echo "Trafico generado durante ${DURATION}s."
echo "Abre http://localhost:3001 (admin / grafana123) para ver las metricas en Grafana."
