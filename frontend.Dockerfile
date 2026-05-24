FROM nginx:alpine AS production

ENV BACKEND_HOST=backend

WORKDIR /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY public/ /usr/share/nginx/html/
COPY src/css/ /usr/share/nginx/html/css/
COPY src/js/ /usr/share/nginx/html/js/

RUN mkdir -p /usr/share/nginx/html/icons

EXPOSE 80
