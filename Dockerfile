# ETAPA 1: Construcción (Builder)
FROM node:20-slim AS builder
WORKDIR /app

# Instalamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos todo el código y construimos la app
COPY . .
RUN npm run build

# ETAPA 2: Ejecución (Runner)
FROM node:20-slim AS runner
WORKDIR /app

# Variables de entorno para que Cloud Run no falle
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Copiamos solo lo necesario desde el builder (Modo Standalone)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 8080

# IMPORTANTE: En Next.js Standalone, el punto de entrada es server.js
CMD ["node", "server.js"]