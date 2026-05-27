# AI Master - DevOps Cursos IA

Proyecto final universitario de arquitectura DevOps. Plataforma web de cursos de Inteligencia Artificial con despliegue automatizado, infraestructura como código y GitOps.

## Arquitectura

```
┌──────────┐     ┌──────────┐     ┌────────────┐
│ Frontend │────▶│ Backend  │────▶│ PostgreSQL │
│ (Nginx)  │     │ (Node.js)│     │  (RDS)     │
└──────────┘     └──────────┘     └────────────┘
       │               │
       ▼               ▼
┌─────────────────────────────┐
│     Docker Compose (dev)    │
│     Kubernetes (prod)       │
│     ArgoCD (GitOps)         │
└─────────────────────────────┘
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla), Nginx |
| **Backend** | Node.js, Express, JWT, bcrypt |
| **Base de Datos** | PostgreSQL 15 |
| **Contenedores** | Docker, Docker Compose |
| **Orquestación** | Kubernetes (EKS), External Secrets Operator |
| **GitOps** | ArgoCD |
| **Infraestructura** | Terraform (AWS) |
| **CI/CD** | GitHub Actions |
| **Monitoreo** | Prometheus (`:9090`), Grafana (`:3001`), node-exporter (`:9100`) |
| **Secrets** | Infisical (produccion), .env (local), defaults (dev) |

## Requisitos

- Docker & Docker Compose
- Node.js 18+ (para desarrollo local)
- Terraform 1.5+ (para infraestructura)
- kubectl (para K8s)
- AWS CLI (para despliegue cloud)

## Inicio Rápido (Local)

```bash
# 1. Clonar el repositorio
git clone https://github.com/josesillopillo/Cursos_ia.git
cd Cursos_ia

# 2. Iniciar servicios (usa valores por defecto seguros)
docker compose up -d --build

# 3. Abrir en el navegador
open http://localhost:8081
```

> El proyecto funciona out-of-the-box con valores por defecto.  
> Para entornos seguros, usa Infisical (ver sección [Gestión de Secretos con Infisical](#gestión-de-secretos-con-infisical)).

## Gestión de Secretos con Infisical

Infisical es una plataforma de gestión de secretos que evita que contraseñas, tokens y claves queden escritas en el código o en el repositorio. Este proyecto lo soporta en **3 niveles de seguridad**, cada uno más estricto que el anterior:

| Nivel | Entorno | Cómo se obtienen los secretos |
|-------|---------|-------------------------------|
| 🟢 **Defaults** | Desarrollo local (`docker compose`) | Valores fijos escritos en `docker-compose.yml`. Sin configuración extra. |
| 🟡 **.env** | Local seguro | Archivo `.env` no versionado. `server.js` lee variables de entorno. |
| 🔴 **Infisical** | Producción (K8s) | SDK de Infisical o External Secrets Operator. Secreto real, cero exposición. |

### Cómo usar Infisical

#### Opción 1: Sin Infisical (por defecto — arranca y funciona)

```bash
docker compose up -d --build
# POSTGRES_PASSWORD = secure_password_123 (default en docker-compose.yml)
```

#### Opción 2: Infisical Local (desarrollador avanzado)

Crea un workspace gratuito en [app.infisical.com](https://app.infisical.com) y ejecuta el script de setup:

```bash
./scripts/setup-infisical.sh
```

El script te guiará para crear un token y las variables necesarias, y las cargará automáticamente al iniciar el backend.

Para desarrollo local sin el script, crea un archivo `.env` en la raíz:

```env
INFISICAL_TOKEN=st.your_token_here
# Opcional: también puedes definir variables directamente
# POSTGRES_PASSWORD=mi_password_segura
# JWT_SECRET=mi_jwt_secreto
```

#### Opción 3: Infisical en Kubernetes (producción)

```bash
kubectl apply -f k8s/external-secret.yaml
```

Requiere tener instalado el [External Secrets Operator](https://external-secrets.io/) en el clúster. El operador sincroniza los secretos de Infisical directamente como `Secrets` de Kubernetes.

### ¿Qué secretos gestiona Infisical?

| Secreto | Propósito |
|---------|-----------|
| `POSTGRES_PASSWORD` | Contraseña de la base de datos |
| `POSTGRES_USER` | Usuario de la BD (default: `postgres`) |
| `POSTGRES_DB` | Nombre de la BD (default: `cursos_ia`) |
| `JWT_SECRET` | Clave para firmar tokens JWT |
| `INFISICAL_CLIENT_ID` | ID de cliente machine-to-machine (SDK) |
| `INFISICAL_CLIENT_SECRET` | Secreto de cliente machine-to-machine (SDK) |

### Arquitectura de secretos

```
┌─────────────────────────────────────────────────┐
│                 Repositorio Git                  │
│  (NINGUN secreto real está en estos archivos)    │
└─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────┐    ┌──────────────────┐
│ docker-compose.yml│    │   .env (opcional) │
│ (defaults seguros) │    │ (no versionado)   │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────┐
│              Backend (server.js)                 │
│  1. Intenta cargar desde Infisical SDK          │
│  2. Si falla, usa variables de entorno (.env)   │
│  3. Si no hay, usa defaults de docker-compose   │
└─────────────────────────────────────────────────┘
```

De esta forma, **alguien que descargue el proyecto puede ejecutarlo inmediatamente** sin exponer contraseñas reales, y en producción los secretos están protegidos por Infisical sin que aparezcan en ningún archivo del repositorio.

## Estructura del Proyecto

```
├── public/              # Archivos estaticos del frontend
│   ├── index.html       # Pagina principal
│   ├── manifest.json    # PWA manifest
│   └── sw.js           # Service Worker
├── src/
│   ├── css/styles.css   # Estilos globales
│   └── js/script.js     # Logica del frontend
├── backend/
│   ├── server.js        # API REST (Express)
│   ├── package.json     # Dependencias
│   └── tests/           # Tests unitarios
├── docker/
│   └── init.sql         # Inicializacion de BD
├── k8s/                 # Manifiestos Kubernetes
│   ├── frontend-deployment.yaml
│   ├── backend-deployment.yaml
│   ├── ingress.yaml
│   ├── hpa.yaml
│   └── kustomization.yaml
├── argocd/
│   └── k8s-deployment.yaml  # Aplicacion ArgoCD
├── terraform/
│   ├── main.tf          # Infraestructura AWS
│   ├── variables.tf     # Variables
│   ├── outputs.tf       # Outputs
│   └── terraform.tfvars.example
├── monitoring/
│   ├── prometheus.yml        # Config Prometheus
│   ├── grafana/
│   │   ├── datasources/
│   │   │   └── datasource.yml   # Datasource Prometheus para Grafana
│   │   └── dashboards/
│   │       ├── dashboard.yml    # Provisioning de dashboards
│   │       └── backend-dashboard.json  # Dashboard de backend
├── scripts/
│   └── setup-infisical.sh    # Setup interactivo de Infisical
├── infisical.json            # Config de workspace Infisical
├── .github/workflows/ci.yml  # Pipeline CI/CD
├── frontend.Dockerfile
├── backend.Dockerfile
├── docker-compose.yml
├── nginx.conf
├── Makefile
└── API.md               # Documentacion de API
```

## Comandos Principales

```bash
make up       # Iniciar servicios
make down     # Detener servicios
make test     # Ejecutar tests
make logs     # Ver logs
make clean    # Limpiar todo
```

## Despliegue en AWS

### 1. Infraestructura (Terraform)

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Editar variables

terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

### 2. Configurar kubectl

```bash
aws eks update-kubeconfig --region us-east-1 --name ia-courses-cluster
```

### 3. Desplegar con ArgoCD

```bash
kubectl apply -n argocd -f argocd/k8s-deployment.yaml
```

### 4. Pipeline CI/CD

El pipeline en GitHub Actions automatiza:
- ✅ Linting y analisis estatico
- ✅ Tests unitarios y de integracion
- ✅ Escaneo de seguridad (Trivy + Gitleaks)
- ✅ Build y push a Amazon ECR
- ✅ Deploy automatico a EKS

## Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Autenticacion via JWT con expiracion de 24h
- Rate limiting para endpoints de autenticacion
- Helmet para headers de seguridad HTTP
- Validacion y sanitizacion de inputs
- Secrets gestionados con **Infisical** (SDK en backend + External Secrets Operator en K8s)
- Los secretos **nunca se versionan** en el repositorio
- 3 niveles de seguridad: defaults → .env → Infisical
- Network policies para aislamiento de pods
- Cifrado de secrets en EKS con KMS

## Monitoreo

La aplicación incluye un stack completo de observabilidad para desarrollo local con Docker Compose.

### Servicios de monitoreo

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Prometheus** | `9090` | Recopilación de métricas del backend, node-exporter y自身 |
| **Grafana** | `3001` | Dashboards de visualización con datasource Prometheus pre-configurado |
| **node-exporter** | `9100` | Métricas del sistema anfitrión (CPU, memoria, disco, red) |

### Endpoints de métricas

- `/api/health` — Health check con estado de la BD (JSON)
- `/api/metrics` — Métricas en formato Prometheus (vía `prom-client`)

### Métricas expuestas por el backend

| Métrica | Tipo | Descripción |
|---------|------|-------------|
| `http_requests_total` | Counter | Total de solicitudes HTTP por método, ruta y código |
| `http_request_duration_seconds` | Histogram | Duración de solicitudes en buckets (p50, p90, p99) |
| `db_pool_size` | Gauge | Conexiones del pool (total, active, idle, waiting) |
| `app_info` | Gauge | Versión y versión de Node.js |
| Default metrics | — | CPU, memoria, event loop lag, garbage collector |

### Dashboard Grafana

Se provisioninga automáticamente un dashboard con:

- Health status del backend
- Uptime
- Requests por segundo
- Latencia (p50/p90/p99)
- HTTP status codes (2xx/4xx/5xx)
- Conexiones del pool de BD
- CPU y memoria de Node.js

### Acceso

```bash
# Abrir en el navegador
open http://localhost:3001

# Credenciales por defecto
# Usuario: admin
# Contrasena: grafana123
```

### Monitoreo en Kubernetes

Para entornos Kubernetes se recomienda usar [kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) (Helm chart) que incluye Prometheus Operator, Grafana, Alertmanager y exporters para el cluster. El backend expone `/api/metrics` que puede ser scrapeado mediante un `ServiceMonitor` o `PodMonitor`.

## Licencia

Proyecto educativo - Universidad.
