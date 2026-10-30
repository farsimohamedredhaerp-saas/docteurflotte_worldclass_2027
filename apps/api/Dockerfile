# Étape 1 : Base avec pnpm activé
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Étape 2 : Préparation des dépendances
FROM base AS dependencies
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Étape 3 : Build des packages et de l'API
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-workspace.yaml tsconfig.json ./
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

# Build contracts en premier, puis build api
RUN pnpm --filter @docteurflotte/contracts build
RUN pnpm --filter @docteurflotte/api build

# Étape 4 : Runner de production
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Créer l'utilisateur non-root
USER node

COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/packages/contracts/package.json ./packages/contracts/
COPY --chown=node:node --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --chown=node:node --from=builder /app/apps/api/package.json ./apps/api/
COPY --chown=node:node --from=builder /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
