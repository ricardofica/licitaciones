# Usamos una imagen ligera de Node.js
FROM node:20-slim

# Creamos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias
COPY package*.json ./

# Instalamos las librerías
RUN npm install --only=production

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa Cloud Run (8080 por defecto)
EXPOSE 8080

# Comando para arrancar la app
CMD [ "node", "server.js" ]