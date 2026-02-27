# ETAPA 1: Construcción
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ETAPA 2: Ejecución
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Copiamos los archivos generados
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# TRUCO VITAL: Next.js suele meter el server.js dentro de .next/standalone/server.js
# pero a veces también lo pone en la raíz. Este comando asegura que esté en la raíz de /app
RUN if [ -f "./server.js" ]; then echo "Server found in root"; else cp -r .next/standalone/* ./ ; fi

EXPOSE 8080

# Ejecución directa
CMD ["node", "server.js"]