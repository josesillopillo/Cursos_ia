# API Documentation - AI Master

**Base URL:** `http://localhost:4000/api`

## Health Check

```http
GET /api/health
```

**Response 200:**
```json
{
  "success": true,
  "uptime": 123.45,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "database": { "connected": true, "latency": 5 }
}
```

## Register

```http
POST /api/register
Content-Type: application/json

{
  "nombre": "Juan Perez",
  "email": "juan@example.com",
  "password": "mi-clave-segura-123"
}
```

**Response 201:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "nombre": "Juan Perez", "email": "juan@example.com" }
}
```

## Login

```http
POST /api/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "mi-clave-segura-123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "nombre": "Juan Perez", "email": "juan@example.com" }
}
```

## Profile (Protected)

```http
GET /api/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "user": { "id": 1, "nombre": "Juan Perez", "email": "juan@example.com" }
}
```

## Get Courses

```http
GET /api/cursos
```

**Response 200:**
```json
{
  "success": true,
  "cursos": [
    { "id": 1, "titulo": "Prompt Engineering", "nivel": "Básico", "descripcion": "..." }
  ]
}
```

## My Courses (Protected) — Estado de inscripción

```http
GET /api/me/cursos
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "cursos": [
    { "id": 1, "titulo": "Prompt Engineering", "nivel": "Básico", "descripcion": "...", "inscrito": true },
    { "id": 2, "titulo": "DevOps con Agentes IA", "nivel": "Avanzado", "descripcion": "...", "inscrito": false },
    { "id": 3, "titulo": "Machine Learning Base", "nivel": "Intermedio", "descripcion": "...", "inscrito": true }
  ]
}
```

## Enroll (Protected)

```http
POST /api/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "curso_id": 1
}
```

**Response 201:**
```json
{
  "success": true,
  "enrolled": true,
  "message": "Inscripción exitosa."
}
```

## Error Responses

| Status | Description |
|--------|-------------|
| 400 | Validation error (invalid email, short password, etc.) |
| 401 | Unauthorized (invalid credentials or missing token) |
| 403 | Forbidden (invalid/expired token) |
| 404 | Route not found |
| 409 | Conflict (email already registered) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (database down) |
