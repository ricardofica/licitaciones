# ETAPA 1: Construcción
FROM node:20-slim AS builder
WORKDIR /app

# Instalamos dependencias (incluyendo las de desarrollo para el build)
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Ejecutamos el build (esto generará la carpeta .next/standalone)
RUN npm run build

# ETAPA 2: Ejecución (Imagen final ultra ligera)
FROM node:20-slim AS runner
WORKDIR /app

# Seteamos variables de entorno críticas para Cloud Run
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Copiamos solo lo necesario desde la etapa de construcción
# El modo standalone de Next.js 15 requiere estos 3 elementos:
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Exponemos el puerto
EXPOSE 8080

# Comando de ejecución directa (Evitamos npm start para mayor velocidad)
# Next.js standalone genera su propio server.js
CMD ["node", "server.js"]