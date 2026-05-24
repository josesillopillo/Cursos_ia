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
| **Orquestación** | Kubernetes (EKS) |
| **GitOps** | ArgoCD |
| **Infraestructura** | Terraform (AWS) |
| **CI/CD** | GitHub Actions |
| **Monitoreo** | Prometheus, Grafana |

## Requisitos

- Docker & Docker Compose
- Node.js 18+ (para desarrollo local)
- Terraform 1.5+ (para infraestructura)
- kubectl (para K8s)
- AWS CLI (para despliegue cloud)

## Inicio Rápido (Local)

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ia-courses.git
cd ia-courses

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar servicios
make up
# o: docker compose up -d --build

# 4. Abrir en el navegador
open http://localhost:8081
```

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
│   ├── prometheus.yml   # Config Prometheus
│   └── dashboard.json   # Dashboard Grafana
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
- Secrets de K8s para credenciales sensibles
- Cifrado de secrets en EKS con KMS
- Network policies para aislamiento de pods

## Monitoreo

- **Prometheus**: Recopilacion de metricas
- **Grafana**: Dashboards de visualizacion
- **Health checks**: Endpoint `/api/health` con estado de BD
- **Logs**: Morgan para logging estructurado

## Licencia

Proyecto educativo - Universidad.
