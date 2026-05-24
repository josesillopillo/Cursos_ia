.PHONY: help up down build test lint clean logs k9s tf-plan tf-apply

help:
	@echo "=== AI Master - Comandos Disponibles ==="
	@echo "make up        - Iniciar todos los servicios con Docker Compose"
	@echo "make down      - Detener todos los servicios"
	@echo "make build     - Construir imagenes sin cache"
	@echo "make test      - Ejecutar tests del backend"
	@echo "make lint      - Ejecutar linter del backend"
	@echo "make logs      - Ver logs en tiempo real"
	@echo "make clean     - Limpiar contenedores y volumnes"
	@echo "make k9s       - Desplegar en Kubernetes local (si aplica)"
	@echo "make tf-plan   - Planificar infraestructura Terraform"
	@echo "make tf-apply  - Aplicar infraestructura Terraform"

up:
	@test -f .env || cp .env.example .env
	docker compose up -d --build
	@echo "Frontend: http://localhost:8081"
	@echo "Backend:  http://localhost:4000/api/health"

down:
	docker compose down

build:
	docker compose build --no-cache

test:
	cd backend && npm test

lint:
	cd backend && npx eslint server.js

logs:
	docker compose logs -f

clean:
	docker compose down -v
	docker system prune -f

k9s:
	kubectl apply -k k8s/

tf-plan:
	cd terraform && terraform plan -out=tfplan

tf-apply:
	cd terraform && terraform apply tfplan
