# Etapa de build
FROM node:22-alpine AS builder
WORKDIR /app

# Instala deps
COPY package*.json ./
RUN npm ci

# Copia resto do código
COPY . .

# Build para produção
RUN npm run build

# Etapa de runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário do builder
COPY --from=builder /app ./

# Porta padrão do Next
EXPOSE 3000

# Inicia o app
CMD ["npm", "run", "start"]
