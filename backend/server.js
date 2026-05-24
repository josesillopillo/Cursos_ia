const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const infisical = require('./infisical');

const app = express();

let JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const PORT = process.env.PORT || 3000;
const SALT_ROUNDS = 12;

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'administrador',
  host: process.env.POSTGRES_HOST || 'database',
  database: process.env.POSTGRES_DB || 'ia_courses_db',
  password: process.env.POSTGRES_PASSWORD || 'secure_password_123',
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el pool de conexiones:', err.message);
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cursos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(100) NOT NULL UNIQUE,
        nivel VARCHAR(50) NOT NULL,
        descripcion TEXT,
        objetivos TEXT DEFAULT '',
        requisitos TEXT DEFAULT '',
        categoria VARCHAR(50) NOT NULL DEFAULT 'General',
        duracion_semanas INT DEFAULT 4,
        icono VARCHAR(50) DEFAULT 'code'
      );

      CREATE TABLE IF NOT EXISTS usuarios_cursos (
        usuario_id INT REFERENCES usuarios(id),
        curso_id INT REFERENCES cursos(id),
        inscrito_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        progreso INT DEFAULT 0,
        PRIMARY KEY (usuario_id, curso_id)
      );
    `);

    const { rows } = await client.query('SELECT COUNT(*) as count FROM cursos');
    const EXPECTED_COURSES = 33;
    if (parseInt(rows[0].count, 10) < EXPECTED_COURSES) {
      await client.query(`
        INSERT INTO cursos (titulo, nivel, descripcion, objetivos, requisitos, categoria, duracion_semanas, icono) VALUES
        -- ===== Fundamentos de IA =====
        ('Introduccion a la Inteligencia Artificial', 'Basico',
          'Un recorrido completo por los fundamentos de la Inteligencia Artificial: desde sus origenes historicos hasta las aplicaciones modernas que estan transformando industrias enteras. Exploraremos los diferentes tipos de IA, los paradigmas de aprendizaje automatico y el impacto social de estas tecnologias.',
          'Comprender la historia y evolucion de la IA. Identificar los diferentes tipos de IA (debil, general, superinteligente). Diferenciar entre machine learning, deep learning y redes neuronales. Analizar casos de uso reales en industria, salud y finanzas.',
          'Conocimientos basicos de computacion. Ganas de aprender. No se requiere experiencia previa en IA.',
          'Fundamentos de IA', 3, 'brain'),

        ('Prompt Engineering', 'Basico',
          'Domina el arte de comunicarte con modelos de lenguaje masivos (LLMs) como GPT, Claude y Llama. Aprende tecnicas avanzadas de ingenieria de prompts para obtener respuestas precisas, estructuradas y creativas. Cubriremos desde prompts basicos hasta cadenas complejas, few-shot learning y agentes conversacionales.',
          'Construir prompts efectivos para diferentes tareas y dominios. Implementar tecnicas de few-shot y chain-of-thought. Disenar sistemas conversacionales complejos. Optimizar tokens y gestionar contextos largos.',
          'Familiaridad basica con chatbots de IA. No se requiere programacion.',
          'Fundamentos de IA', 4, 'message'),

        ('Machine Learning Base', 'Intermedio',
          'Aprende los fundamentos teoricos y practicos del machine learning. Implementa algoritmos de regresion, clasificacion, clustering y reduccion de dimensionalidad utilizando Python y librerias modernas como scikit-learn. Incluye proyectos practicos con datasets reales y tecnicas de validacion.',
          'Implementar algoritmos de regression lineal y logistica. Construir arboles de decision y Random Forests. Aplicar tecnicas de clustering con K-Means y DBSCAN. Evaluar modelos con metricas de precision, recall y F1-score.',
          'Conceptos basicos de programacion en Python. Conocimientos elementales de estadistica y algebra lineal.',
          'Fundamentos de IA', 6, 'chart'),

        ('Etica y Seguridad en IA', 'Intermedio',
          'Explora las dimensiones eticas, legales y sociales de la Inteligencia Artificial. Analiza sesgos algoritmicos, fairness, transparencia, explicabilidad y privacidad. Estudia ataques adversarios, envenenamiento de datos y tecnicas para construir sistemas de IA responsables y seguros.',
          'Identificar sesgos algoritmicos y tecnicas de mitigacion. Disenar sistemas de IA explicables y transparentes. Implementar medidas de seguridad contra ataques adversarios. Conocer el marco regulatorio europeo de IA.',
          'Conocimientos basicos de IA. Interes en aspectos eticos y legales de la tecnologia.',
          'Fundamentos de IA', 3, 'shield'),

        ('Agentes Autonomos con IA', 'Avanzado',
          'Disena, implementa y despliega agentes autonomos impulsados por modelos de lenguaje. Aprende a construir sistemas multi-agente, herramientas de razonamiento, planificacion automatica y ejecucion de tareas complejas. Utiliza frameworks como LangGraph, AutoGen y CrewAI para orquestar agentes colaborativos.',
          'Construir agentes autonomos con capacidades de razonamiento y planificacion. Implementar sistemas multi-agente con roles y objetivos especificos. Integrar herramientas externas como APIs, bases de datos y buscadores. Desplegar agentes en produccion con monitoreo y logging.',
          'Experiencia en Python. Conocimientos de LLMs y APIs. Familiaridad con conceptos de agentes de IA.',
          'Fundamentos de IA', 5, 'bot'),

        ('Sistemas RAG y Busqueda Inteligente', 'Avanzado',
          'Construye sistemas de Retrieval-Augmented Generation (RAG) que combinan la potencia de los LLMs con bases de conocimiento vectoriales. Aprende a implementar pipelines de ingestion, chunking, embedding, indexacion y recuperacion semantica. Cubre RAG avanzado con reranking, multi-query y fusion.',
          'Implementar pipelines completos de RAG con LangChain y LlamaIndex. Disenar estrategias de chunking y embedding optimas. Configurar bases vectoriales con Chroma, Pinecone o Weaviate. Aplicar tecnicas avanzadas como RAPTOR, HyDE y Self-RAG.',
          'Python intermedio. Familiaridad con LLMs y APIs de OpenAI. Conceptos basicos de busqueda y recuperacion de informacion.',
          'Fundamentos de IA', 5, 'search'),

        -- ===== DevOps & Cloud =====
        ('Docker y Kubernetes', 'Intermedio',
          'Domina la contenerizacion de aplicaciones con Docker y la orquestacion de microservicios con Kubernetes. Aprende a crear imagenes optimizadas, gestionar contenedores multietapa, orquestar pods, servicios, deployments, configmaps y secretos en clusters Kubernetes.',
          'Crear y optimizar imagenes Docker con multi-stage builds. Orquestar contenedores con Docker Compose. Desplegar y gestionar aplicaciones en Kubernetes. Configurar auto-escalado, balanceo y actualizaciones rolling.',
          'Conocimientos basicos de Linux y linea de comandos. Familiaridad con conceptos de virtualizacion.',
          'DevOps & Cloud', 6, 'container'),

        ('CI/CD Pipeline Automation', 'Intermedio',
          'Automatiza todo el ciclo de vida del software con pipelines de integracion y despliegue continuo. Configura GitHub Actions, Jenkins y GitLab CI para compilar, testear y desplegar automaticamente. Incluye analisis estatico, seguridad, artefactos y despliegue multi-entorno.',
          'Disenar pipelines CI/CD multi-etapa con GitHub Actions. Integrar analisis de seguridad y calidad de codigo. Automatizar despliegues en diferentes entornos (dev, staging, prod). Implementar estrategias de rollback y approval gates.',
          'Experiencia basica con Git y control de versiones. Conocimientos de desarrollo de software.',
          'DevOps & Cloud', 5, 'repeat'),

        ('Infrastructure as Code con Terraform', 'Avanzado',
          'Gestiona infraestructura cloud de forma declarativa con Terraform. Aprende a escribir configuraciones HCL, modularizar infraestructura, gestionar estado remoto, workspaces y modulos reutilizables. Incluye provisionamiento de AWS, Azure y GCP con las mejores practicas de IaC.',
          'Escribir configuraciones Terraform modulares y reutilizables. Gestionar estado remoto con S3 y DynamoDB. Implementar infraestructura multi-entorno con workspaces. Aplicar politicas de seguridad con Sentinel y OPA.',
          'Experiencia basica con servicios cloud (AWS, Azure o GCP). Conocimientos de Linux y redes.',
          'DevOps & Cloud', 6, 'cloud'),

        ('DevOps con Agentes IA', 'Avanzado',
          'Integra Inteligencia Artificial en tus practicas DevOps para automatizar revisiones de codigo, generacion de tests, analisis de logs, deteccion de anomalias y optimizacion de infraestructura. Aprende a utilizar agentes IA como asistentes en pipelines CI/CD y operaciones.',
          'Automatizar code reviews con asistentes IA. Generar tests unitarios y de integracion automaticamente. Implementar deteccion de anomalias en logs y metricas. Optimizar costos de infraestructura con recomendaciones IA.',
          'Experiencia en DevOps y CI/CD. Conocimientos basicos de IA y LLMs. Python intermedio.',
          'DevOps & Cloud', 8, 'cpu'),

        ('AWS para Arquitectos Cloud', 'Avanzado',
          'Disena e implementa arquitecturas escalables, resilientes y seguras en Amazon Web Services. Cubre VPC, EC2, S3, Lambda, RDS, DynamoDB, API Gateway, CloudFront y Step Functions. Incluye patrones de microservicios, serverless y event-driven con las mejores practicas del Well-Architected Framework.',
          'Disenar arquitecturas cloud escalables y resilientes. Implementar microservicios serverless con Lambda y API Gateway. Configurar autoscaling, balanceo y alta disponibilidad. Aplicar el Well-Architected Framework de AWS.',
          'Experiencia previa con AWS basico. Conocimientos de redes (VPC, subnets, DNS). Familiaridad con Linux.',
          'DevOps & Cloud', 7, 'aws'),

        ('Monitorizacion con Prometheus y Grafana', 'Intermedio',
          'Implementa observabilidad completa en tus sistemas con Prometheus para metricas y Grafana para visualizacion. Aprende a disenar dashboards efectivos, configurar alertas, instrumentar aplicaciones con exporters y gestionar logs centralizados con Loki.',
          'Configurar Prometheus para recoleccion de metricas. Disenar dashboards profesionales en Grafana. Implementar alertas inteligentes con Alertmanager. Centralizar logs con Loki y visualizarlos en Grafana.',
          'Conceptos basicos de DevOps y administracion de sistemas. Experiencia basica con Linux.',
          'DevOps & Cloud', 4, 'activity'),

        ('GitOps con ArgoCD y Flux', 'Avanzado',
          'Implementa despliegues automatizados y declarativos utilizando GitOps con ArgoCD y Flux CD. Aprende a gestionar clusters Kubernetes completos desde repositorios Git, con sincronizacion automatica, auto-healing, canary deployments y multi-cluster management.',
          'Configurar ArgoCD para despliegue GitOps. Implementar auto-healing y sync policies. Realizar canary y blue-green deployments. Gestionar multi-cluster con ApplicationSets.',
          'Experiencia con Kubernetes y kubectl. Conocimientos de Git y CI/CD. Familiaridad con manifiestos YAML.',
          'DevOps & Cloud', 5, 'git-branch'),

        -- ===== Data Science =====
        ('Python para Data Science', 'Basico',
          'Aprende Python desde cero con un enfoque practico en analisis de datos. Domina Pandas para manipulacion de datos, NumPy para computacion numerica y Matplotlib con Seaborn para visualizacion. Incluye proyectos con datasets reales de Kaggle y ejercicios de limpieza y exploracion.',
          'Manipular datos con DataFrames de Pandas. Realizar analisis exploratorio y limpieza de datos. Crear visualizaciones impactantes con Matplotlib y Seaborn. Aplicar tecnicas de feature engineering basico.',
          'No se requiere experiencia previa en Python. Conocimientos basicos de computacion y logica.',
          'Data Science', 5, 'terminal'),

        ('SQL Avanzado para Analitica', 'Intermedio',
          'Lleva tus habilidades SQL al siguiente nivel con consultas complejas, ventanas, CTEs recursivas, optimizacion de queries y modelado de datos relacionales. Aprende a escribir SQL analitico para extraer insights de bases de datos con millones de registros.',
          'Escribir consultas con window functions y CTEs recursivas. Optimizar queries con EXPLAIN ANALYZE y indices. Disenar esquemas de datos normalizados y desnormalizados. Implementar ETLs con SQL puro.',
          'Conocimientos basicos de SQL (SELECT, JOIN, GROUP BY). Familiaridad con bases de datos relacionales.',
          'Data Science', 4, 'database'),

        ('Visualizacion de Datos', 'Intermedio',
          'Crea dashboards interactivos y visualizaciones profesionales con Plotly, Streamlit y herramientas de BI. Aprende principios de diseno de visualizacion, storytelling con datos y construccion de aplicaciones web analiticas completas desplegadas en la nube.',
          'Construir dashboards interactivos con Plotly Dash. Crear aplicaciones analiticas con Streamlit. Disenar visualizaciones efectivas siguiendo principios de storytelling. Desplegar dashboards en produccion.',
          'Python basico. Familiaridad con Pandas y analisis de datos. No se requiere experiencia en frontend.',
          'Data Science', 4, 'bar-chart'),

        ('Estadistica Aplicada con Python', 'Intermedio',
          'Aplica metodos estadisticos fundamentales al analisis de datos con Python. Cubre estadistica descriptiva, distribuciones de probabilidad, tests de hipotesis, ANOVA, regresion lineal y multiple, analisis de correlacion y tecnicas de bootstrap para inferencia robusta.',
          'Realizar tests de hipotesis y ANOVA. Construir modelos de regression lineal y multiple. Aplicar tecnicas de bootstrap y simulacion Monte Carlo. Interpretar resultados estadisticos en contextos de negocio.',
          'Python basico. Conocimientos elementales de estadistica descriptiva. Matematicas a nivel bachillerato.',
          'Data Science', 5, 'sigma'),

        ('Big Data con Apache Spark', 'Avanzado',
          'Procesa y analiza volumenes masivos de datos con Apache Spark y PySpark. Aprende a trabajar con RDDs, DataFrames, Spark SQL, streaming, MLlib y GraphX. Incluye optimizacion de jobs, gestion de cluster Databricks y Data Lakes con Delta Lake.',
          'Procesar terabytes de datos con PySpark DataFrames y Spark SQL. Implementar pipelines de streaming en tiempo real. Construir modelos de ML distribuidos con MLlib. Optimizar rendimiento con particionamiento y caching.',
          'Python intermedio. Experiencia con SQL. Conceptos basicos de sistemas distribuidos. Familiaridad con Linux.',
          'Data Science', 6, 'layers'),

        -- ===== ML & Deep Learning =====
        ('Redes Neuronales con PyTorch', 'Avanzado',
          'Construye y entrena redes neuronales profundas utilizando PyTorch. Aprende desde los fundamentos de autograd y tensores hasta arquitecturas avanzadas como CNNs, RNNs, LSTMs, GANs y Transformers. Incluye entrenamiento distribuido con GPU acceleration y deployment con TorchScript.',
          'Construir redes neuronales desde cero con PyTorch. Implementar CNNs para clasificacion de imagenes. Entrenar modelos con GPU acceleration y mixed precision. Desplegar modelos en produccion con TorchScript.',
          'Python intermedio. Conocimientos de machine learning basico. Familiaridad con algebra lineal y calculo.',
          'ML & Deep Learning', 7, 'network'),

        ('Procesamiento de Lenguaje Natural', 'Avanzado',
          'Domina el NLP moderno con transformers, BERT, GPT y fine-tuning. Aprende a procesar texto, entrenar modelos de lenguaje, clasificar documentos, extraer entidades, analizar sentimientos y generar texto. Incluye Hugging Face, spaCy, NLTK y despliegue de modelos NLP.',
          'Fine-tunear modelos BERT y GPT para tareas especificas. Implementar pipelines de NLP con Hugging Face. Construir sistemas de extraccion de informacion y analisis de sentimientos. Desplegar modelos NLP como APIs REST.',
          'Python intermedio. Familiaridad con deep learning. Conocimientos de linguistica computacional (deseable).',
          'ML & Deep Learning', 7, 'book'),

        ('Vision por Computadora', 'Avanzado',
          'Explora el fascinante mundo de la vision por computadora con CNN, YOLO, Segmentacion Semantica y GANs. Aprende a clasificar imagenes, detectar objetos en tiempo real, segmentar escenas y generar imagenes sinteticas. Usa OpenCV, PyTorch y modelos pre-entrenados.',
          'Clasificar imagenes con CNNs y transfer learning. Detectar objetos en tiempo real con YOLO y SSD. Segmentar imagenes con U-Net y Mask R-CNN. Generar imagenes con GANs y modelos de difusion.',
          'Python intermedio. Conocimientos de deep learning. Algebra lineal y procesamiento de imagenes basico.',
          'ML & Deep Learning', 7, 'camera'),

        ('MLOps y Despliegue de Modelos', 'Avanzado',
          'Lleva modelos de machine learning a produccion con pipelines automatizados, monitoreo continuo, versionado de modelos, A/B testing y drift detection. Cubre MLflow, Kubeflow, Docker, Kubernetes, feature stores y practicas de MLOps para equipos de data science.',
          'Automatizar pipelines de ML con MLflow y Kubeflow. Desplegar modelos como microservicios con Docker y FastAPI. Implementar monitoreo de drift y re-entrenamiento automatico. Gestionar versiones de modelos y experimentos.',
          'Experiencia en machine learning y Python. Conocimientos basicos de Docker y DevOps. Familiaridad con cloud computing.',
          'ML & Deep Learning', 6, 'rocket'),

        ('Aprendizaje por Refuerzo', 'Avanzado',
          'Adentrate en el mundo del Reinforcement Learning con algoritmos clasicos y modernos. Implementa Q-Learning, Deep Q-Networks, Policy Gradients, PPO y SAC. Entrena agentes que aprenden a jugar videojuegos, controlar robots y optimizar sistemas complejos.',
          'Implementar algoritmos de RL tabular y basados en Deep Learning. Entrenar agentes con PPO, DQN y SAC en entornos Gym. Disenar funciones de recompensa efectivas. Aplicar RL a problemas del mundo real.',
          'Python intermedio. Conocimientos de deep learning. Probabilidad y estadistica. Experiencia con PyTorch (deseable).',
          'ML & Deep Learning', 6, 'zap'),

        ('Generacion Aumentada con IA', 'Intermedio',
          'Descubre como crear contenido generativo con modelos de diffusion, transformers y GANs. Aprende a generar imagenes con Stable Diffusion y DALL-E, musica con modelos de audio, texto creativo con LLMs y video con modelos de difusion temporal.',
          'Generar imagenes con Stable Diffusion y ControlNet. Crear contenido textual creativo con LLMs fine-tuneados. Implementar pipelines de generacion de audio y musica. Construir aplicaciones de IA generativa.',
          'Python basico-intermedio. Familiaridad con conceptos de IA y deep learning. Creatividad y curiosidad.',
          'ML & Deep Learning', 5, 'sparkles'),

        -- ===== Desarrollo Web =====
        ('HTML, CSS y JavaScript Moderno', 'Basico',
          'Aprende los fundamentos del desarrollo web desde cero con HTML5 semantico, CSS3 moderno (Flexbox, Grid, animaciones) y JavaScript ES6+. Incluye proyectos practicos: landing pages, formularios interactivos, APIs del navegador y publicacion en produccion.',
          'Construir paginas web semanticas y accesibles con HTML5. Disenar layouts responsive con Flexbox y CSS Grid. Programar interactividad con JavaScript moderno (ES6+). Consumir APIs REST y manejar eventos del DOM.',
          'No se requiere experiencia previa. Conocimientos basicos de computacion y navegacion web.',
          'Desarrollo Web', 5, 'globe'),

        ('React y Next.js', 'Intermedio',
          'Construye aplicaciones web modernas y performantes con React 18, Hooks, Context API y Next.js 14. Aprende Server Components, SSR, ISR, App Router, autenticacion, bases de datos con Prisma y despliegue en Vercel. Incluye proyecto final tipo SaaS.',
          'Desarrollar componentes React con Hooks y Context. Implementar Server Components y App Router de Next.js. Configurar autenticacion con NextAuth.js. Desplegar aplicaciones full-stack en Vercel.',
          'HTML, CSS y JavaScript basico. Familiaridad con programacion asincrona y APIs REST.',
          'Desarrollo Web', 7, 'code-2'),

        ('Node.js y Express API', 'Intermedio',
          'Desarrolla APIs RESTful profesionales con Node.js, Express, autenticacion JWT, bases de datos PostgreSQL/MongoDB, testing, documentacion con Swagger y despliegue. Aprende buenas practicas de diseno de APIs, rate limiting, validacion y manejo de errores.',
          'Disenar e implementar APIs RESTful con Express. Implementar autenticacion y autorizacion con JWT. Conectar y modelar bases de datos con PostgreSQL y Prisma. Documentar APIs con Swagger/OpenAPI.',
          'JavaScript basico. Conceptos de programacion asincrona. Familiaridad con HTTP y APIs REST.',
          'Desarrollo Web', 6, 'server'),

        ('TypeScript Avanzado', 'Intermedio',
          'Domina TypeScript desde los fundamentos hasta patrones avanzados. Aprende tipos genericos, conditional types, mapped types, decoradores, programacion funcional, patrones de diseno y como integrar TypeScript en proyectos React, Node y Express.',
          'Escribir tipos avanzados con genericos y conditional types. Aplicar patrones de diseno con TypeScript. Integrar TypeScript en proyectos React y Node.js. Configurar tsconfig para proyectos enterprise.',
          'JavaScript intermedio. Experiencia basica con React o Node.js. Conocimientos de POO (deseable).',
          'Desarrollo Web', 5, 'file-type'),

        -- ===== Ciberseguridad =====
        ('Fundamentos de Ciberseguridad', 'Basico',
          'Introduccion completa a la seguridad informatica: principios CIA, criptografia basica, autenticacion, control de acceso, seguridad en redes, malware, firewalls, IDS/IPS, politicas de seguridad y normativas ISO 27001. Ideal para iniciarse en el mundo de la ciberseguridad.',
          'Comprender los principios fundamentales de seguridad (CIA). Identificar tipos de malware y vectores de ataque. Configurar firewalls y sistemas de deteccion. Conocer normativas y estandares de seguridad.',
          'Conocimientos basicos de redes y sistemas operativos. Interes en seguridad informatica.',
          'Ciberseguridad', 4, 'lock'),

        ('Ethical Hacking y Pentesting', 'Intermedio',
          'Aprende tecnicas de hacking etico y penetration testing con herramientas profesionales. Cubre reconocimiento, escaneo, enumeracion, explotacion de vulnerabilidades, post-explotacion y reportes. Usa Kali Linux, Metasploit, Burp Suite y Nmap en entornos controlados.',
          'Realizar pentesting web y de redes con Metasploit y Burp Suite. Ejecutar fases de reconocimiento, escaneo y explotacion. Elaborar informes profesionales de vulnerabilidades. Aplicar tecnicas de post-explotacion y pivoting.',
          'Conocimientos de redes (TCP/IP, DNS, HTTP). Linux basico. Familiaridad con conceptos de seguridad.',
          'Ciberseguridad', 6, 'shield-off'),

        ('Seguridad en la Nube', 'Intermedio',
          'Protege infraestructuras y aplicaciones cloud con las mejores practicas de seguridad. Cubre IAM, cifrado, WAF, Security Groups, guardDuty, Inspector, Config, CloudTrail y el modelo de responsabilidad compartida. Incluye AWS, Azure y GCP.',
          'Configurar IAM con politicas de minimo privilegio. Implementar cifrado en reposo y en transito. Desplegar WAF y Shield para proteccion de aplicaciones. Monitorear amenazas con GuardDuty y Security Hub.',
          'Experiencia basica con servicios cloud (AWS, Azure o GCP). Conocimientos de redes y seguridad.',
          'Ciberseguridad', 5, 'cloud-off'),

        ('Seguridad en Aplicaciones Web', 'Intermedio',
          'Previene los ataques mas comunes del OWASP Top 10: SQL Injection, XSS, CSRF, SSRF, IDOR y RCE. Aprende a implementar controles de seguridad en el desarrollo, realizar code review seguro y usar herramientas SAST/DAST para automatizar la deteccion.',
          'Identificar y prevenir SQL Injection, XSS y CSRF. Implementar controles de acceso seguros. Realizar code review con enfoque en seguridad. Integrar herramientas SAST/DAST en pipelines CI/CD.',
          'Experiencia en desarrollo web (cualquier lenguaje). Conocimientos basicos de HTTP y APIs REST.',
          'Ciberseguridad', 5, 'lock'),

        ('Criptografia Aplicada', 'Avanzado',
          'Domina los fundamentos matematicos y practicos de la criptografia moderna. Cubre cifrado simetrico y asimetrico, funciones hash, firmas digitales, PKI, TLS, criptografia de curva eliptica, cifrado homomorfico y aplicaciones blockchain.',
          'Implementar cifrado simetrico (AES) y asimetrico (RSA, ECC). Configurar PKI y certificados TLS/SSL. Aplicar criptografia en aplicaciones blockchain. Comprender protocolos criptograficos avanzados (Zero-Knowledge, Homomorphic).',
          'Conocimientos de programacion (Python o similar). Matematicas discretas y algebra. Familiaridad con redes y protocolos de internet.',
          'Ciberseguridad', 5, 'key')
        ON CONFLICT DO NOTHING;
      `);
      console.log(`[DB] Cursos sincronizados (${parseInt(rows[0].count, 10)} -> ${EXPECTED_COURSES} esperados).`);
    } else {
      console.log(`[DB] ${rows[0].count} cursos encontrados en la base de datos.`);
    }

    try {
      await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await client.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT \'General\'');
      await client.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS duracion_semanas INT DEFAULT 4');
      await client.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS icono VARCHAR(50) DEFAULT \'code\'');
      await client.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS objetivos TEXT DEFAULT \'\'');
      await client.query('ALTER TABLE cursos ADD COLUMN IF NOT EXISTS requisitos TEXT DEFAULT \'\'');
      await client.query('ALTER TABLE usuarios_cursos ADD COLUMN IF NOT EXISTS inscrito_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      await client.query('ALTER TABLE usuarios_cursos ADD COLUMN IF NOT EXISTS progreso INT DEFAULT 0');
      console.log('[DB] Migraciones aplicadas correctamente.');
    } catch (err) {
      console.log('[DB] Migraciones ya aplicadas o no necesarias.');
    }
  } finally {
    client.release();
  }
}

async function waitForDatabase() {
  // Load secrets from Infisical if configured
  if (infisical.INFISICAL_ENABLED) {
    const secrets = await infisical.loadSecrets();
    for (const [key, value] of Object.entries(secrets)) {
      if (!process.env[key]) process.env[key] = value;
    }
    JWT_SECRET = process.env.JWT_SECRET || JWT_SECRET;
    pool.options.user = process.env.POSTGRES_USER || pool.options.user;
    pool.options.host = process.env.POSTGRES_HOST || pool.options.host;
    pool.options.database = process.env.POSTGRES_DB || pool.options.database;
    pool.options.password = process.env.POSTGRES_PASSWORD || pool.options.password;
    pool.options.port = parseInt(process.env.POSTGRES_PORT, 10) || pool.options.port;
  }

  let connected = false;
  while (!connected) {
    try {
      await pool.query('SELECT 1');
      connected = true;
    } catch {
      console.log('[DB] Esperando conexion a la base de datos...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  try {
    await initDatabase();
    console.log('[DB] Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('[DB] Error inicializando base de datos:', err.message);
  }
}

waitForDatabase();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '16kb' }));
app.use(morgan('combined', { skip: () => process.env.NODE_ENV === 'test' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Demasiados intentos de autenticacion. Intenta de nuevo en 15 minutos.' },
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido.' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token invalido o expirado.' });
    }
    req.user = user;
    next();
  });
}

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos invalidos.',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// Health
app.get('/api/health', async (req, res) => {
  const dbStatus = { connected: false, latency: null };
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    dbStatus.connected = true;
    dbStatus.latency = Date.now() - start;
  } catch {
    dbStatus.connected = false;
  }
  res.status(dbStatus.connected ? 200 : 503).json({
    success: dbStatus.connected,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Register
app.post(
  '/api/register',
  authLimiter,
  [
    body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('email').trim().isEmail().normalizeEmail().withMessage('Correo electronico invalido.'),
    body('password').isLength({ min: 8, max: 128 }).withMessage('La contrasena debe tener al menos 8 caracteres.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
      const query =
        'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email, created_at';
      const result = await pool.query(query, [nombre, email, password_hash]);

      const token = jwt.sign(
        { id: result.rows[0].id, nombre: result.rows[0].nombre, email: result.rows[0].email },
        JWT_SECRET,
        { expiresIn: '24h' },
      );

      res.status(201).json({ success: true, token, user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: 'El correo ya esta registrado.' });
      }
      console.error('[Register Error]', error.message);
      res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
  },
);

// Login
app.post(
  '/api/login',
  authLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().withMessage('Correo electronico invalido.'),
    body('password').notEmpty().withMessage('La contrasena es requerida.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const query = 'SELECT id, nombre, email, password_hash, created_at FROM usuarios WHERE email = $1';
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Credenciales invalidas.' });
      }

      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.status(401).json({ success: false, error: 'Credenciales invalidas.' });
      }

      const token = jwt.sign(
        { id: user.id, nombre: user.nombre, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' },
      );

      res.json({
        success: true,
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, created_at: user.created_at },
      });
    } catch (error) {
      console.error('[Login Error]', error.message);
      res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
  },
);

// Profile
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nombre, u.email, u.created_at,
        (SELECT COUNT(*) FROM usuarios_cursos WHERE usuario_id = u.id) AS cursos_inscritos
      FROM usuarios u WHERE u.id = $1
    `;
    const result = await pool.query(query, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('[Profile Error]', error.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// Update profile
app.put(
  '/api/me',
  authenticateToken,
  [
    body('nombre').optional().trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    body('email').optional().trim().isEmail().normalizeEmail().withMessage('Correo electronico invalido.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { nombre, email } = req.body;
    try {
      const fields = [];
      const values = [];
      let idx = 1;

      if (nombre) {
        fields.push(`nombre = $${idx++}`);
        values.push(nombre);
      }
      if (email) {
        fields.push(`email = $${idx++}`);
        values.push(email);
      }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, error: 'No hay campos para actualizar.' });
      }

      values.push(req.user.id);
      const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx}
        RETURNING id, nombre, email, created_at`;
      const result = await pool.query(query, values);

      const token = jwt.sign(
        { id: result.rows[0].id, nombre: result.rows[0].nombre, email: result.rows[0].email },
        JWT_SECRET,
        { expiresIn: '24h' },
      );

      res.json({ success: true, user: result.rows[0], token });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, error: 'El correo ya esta registrado.' });
      }
      console.error('[Profile Update Error]', error.message);
      res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
  },
);

// List all users (for profiles directory)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.created_at,
        (SELECT COUNT(*) FROM usuarios_cursos WHERE usuario_id = u.id) AS cursos_inscritos,
        (SELECT COUNT(*) FROM usuarios_cursos WHERE usuario_id = u.id AND progreso >= 100) AS cursos_completados
      FROM usuarios u ORDER BY u.created_at DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('[Users List Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener usuarios.' });
  }
});

// Get specific user profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.created_at,
        (SELECT COUNT(*) FROM usuarios_cursos WHERE usuario_id = u.id) AS cursos_inscritos,
        (SELECT COUNT(*) FROM usuarios_cursos WHERE usuario_id = u.id AND progreso >= 100) AS cursos_completados
      FROM usuarios u WHERE u.id = $1
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }
    const user = result.rows[0];
    const cursosResult = await pool.query(`
      SELECT c.id, c.titulo, c.nivel, c.descripcion, c.categoria, c.duracion_semanas, c.icono,
        uc.progreso, uc.inscrito_en
      FROM cursos c
      JOIN usuarios_cursos uc ON c.id = uc.curso_id AND uc.usuario_id = $1
      ORDER BY uc.inscrito_en DESC
    `, [id]);
    res.json({ success: true, user, cursos: cursosResult.rows });
  } catch (error) {
    console.error('[User Detail Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener usuario.' });
  }
});

// Delete account
app.delete('/api/me', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM usuarios_cursos WHERE usuario_id = $1', [req.user.id]);
    await client.query('DELETE FROM usuarios WHERE id = $1', [req.user.id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Cuenta eliminada correctamente.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Delete Account Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al eliminar cuenta.' });
  } finally {
    client.release();
  }
});

// Change password
app.put(
  '/api/me/password',
  authenticateToken,
  [
    body('current_password').notEmpty().withMessage('La contrasena actual es requerida.'),
    body('new_password').isLength({ min: 8, max: 128 }).withMessage('La nueva contrasena debe tener al menos 8 caracteres.'),
  ],
  handleValidationErrors,
  async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
      const result = await pool.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
      }
      const match = await bcrypt.compare(current_password, result.rows[0].password_hash);
      if (!match) {
        return res.status(401).json({ success: false, error: 'La contrasena actual es incorrecta.' });
      }
      const password_hash = await bcrypt.hash(new_password, SALT_ROUNDS);
      await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);
      res.json({ success: true, message: 'Contrasena actualizada correctamente.' });
    } catch (error) {
      console.error('[Change Password Error]', error.message);
      res.status(500).json({ success: false, error: 'Error al cambiar contrasena.' });
    }
  },
);

// Cursos publicos con filtro por categoria
app.get('/api/cursos', async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = 'SELECT id, titulo, nivel, descripcion, objetivos, requisitos, categoria, duracion_semanas, icono FROM cursos';
    const params = [];

    if (categoria) {
      query += ' WHERE categoria = $1';
      params.push(categoria);
    }

    query += ' ORDER BY categoria, id';
    const result = await pool.query(query, params);
    res.json({ success: true, cursos: result.rows });
  } catch (error) {
    console.error('[Cursos Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener cursos.' });
  }
});

// Categorias disponibles
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT categoria, COUNT(*) as total FROM cursos GROUP BY categoria ORDER BY categoria',
    );
    res.json({ success: true, categorias: result.rows });
  } catch (error) {
    console.error('[Categorias Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener categorias.' });
  }
});

// My courses (enrolled)
app.get('/api/me/cursos', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.titulo, c.nivel, c.descripcion, c.categoria, c.duracion_semanas, c.icono,
        CASE WHEN uc.usuario_id IS NOT NULL THEN true ELSE false END AS inscrito,
        uc.progreso, uc.inscrito_en
      FROM cursos c
      LEFT JOIN usuarios_cursos uc ON c.id = uc.curso_id AND uc.usuario_id = $1
      ORDER BY c.categoria, c.id
    `;
    const result = await pool.query(query, [req.user.id]);
    res.json({ success: true, cursos: result.rows });
  } catch (error) {
    console.error('[My Courses Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al obtener tus cursos.' });
  }
});

// Enroll
app.post('/api/enroll', authenticateToken, async (req, res) => {
  const { curso_id } = req.body;
  if (!curso_id) {
    return res.status(400).json({ success: false, error: 'curso_id es requerido.' });
  }
  try {
    const query = 'INSERT INTO usuarios_cursos (usuario_id, curso_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *';
    const result = await pool.query(query, [req.user.id, curso_id]);
    res.status(201).json({
      success: true,
      enrolled: result.rows.length > 0,
      message: result.rows.length > 0 ? 'Inscripcion exitosa.' : 'Ya estabas inscrito en este curso.',
    });
  } catch (error) {
    console.error('[Enroll Error]', error.message);
    if (error.code === '23503') {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado. Vuelve a iniciar sesion.' });
    }
    res.status(500).json({ success: false, error: 'Error al inscribir.' });
  }
});

// Unenroll
app.delete('/api/enroll/:curso_id', authenticateToken, async (req, res) => {
  const curso_id = parseInt(req.params.curso_id, 10);
  try {
    const query = 'DELETE FROM usuarios_cursos WHERE usuario_id = $1 AND curso_id = $2 RETURNING *';
    const result = await pool.query(query, [req.user.id, curso_id]);
    res.json({
      success: true,
      unenrolled: result.rows.length > 0,
      message: result.rows.length > 0 ? 'Inscripcion cancelada.' : 'No estabas inscrito en este curso.',
    });
  } catch (error) {
    console.error('[Unenroll Error]', error.message);
    res.status(500).json({ success: false, error: 'Error al cancelar inscripcion.' });
  }
});

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Ruta ${req.originalUrl} no encontrada.` });
});

app.listen(PORT, () => console.log(`[Backend API] Corriendo en puerto ${PORT}`));

module.exports = app;
