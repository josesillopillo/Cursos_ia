# Fase de Dockerización - Servicio Web (Frontend)
# La instrucción FROM sirve para basarnos en un ecosistema pre-configurado.
# Aquí usamos Nginx en su versión 'alpine' por ser extremadamente liviana (ideal para microservicios).
FROM nginx:alpine

# WORKDIR especifica nuestra área de trabajo principal dentro del contenedor.
WORKDIR /usr/share/nginx/html

# COPY traslada nuestros archivos modificados localmente hacia la imagen de producción inmutable.
COPY index.html .
COPY css/ ./css/
COPY js/ ./js/

# EXPOSE documenta que este microservicio se comunicará escuchando en el puerto 80 (HTTP).
EXPOSE 80

# CMD define el comando de arranque del contenedor.
# Aquí decimos: "inicia el servidor nginx de manera frontal (daemon off)".
CMD ["nginx", "-g", "daemon off;"]
