-- Archivo para inicializar la Base de Datos automáticamente
-- Esto entra en el concepto de despliegues repetibles: la base de datos se crea por sí sola.

CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    nivel VARCHAR(50) NOT NULL,
    descripcion TEXT
);

-- Inserción de nuestros cursos desde la Fase 1
INSERT INTO cursos (titulo, nivel, descripcion) VALUES
('Prompt Engineering', 'Básico', 'Aprende a interactuar estructuradamente con LLMs'),
('DevOps con Agentes IA', 'Avanzado', 'Integra IA en tus pipelines CI/CD e infraestructuras'),
('Machine Learning Base', 'Intermedio', 'Construye modelos predictivos utilizando frameworks modernos');
