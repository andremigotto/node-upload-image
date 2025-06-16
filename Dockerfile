# Etapa base com Node.js completo (tem npm)
FROM node:20-alpine AS base

RUN npm i -g pnpm

# Instala dependências
FROM base AS dependencies

WORKDIR /usr/source/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Build da aplicação
FROM base AS build

WORKDIR /usr/source/app
COPY . .
COPY --from=dependencies /usr/source/app/node_modules ./node_modules
RUN pnpm build
RUN pnpm prune --prod

# Deploy com Chainguard
FROM cgr.dev/chainguard/node:latest AS deploy

USER 1000

WORKDIR /usr/source/app

COPY --from=build /usr/source/app/dist ./dist
COPY --from=build /usr/source/app/node_modules ./node_modules
COPY --from=build /usr/source/app/package.json ./package.json

EXPOSE 3333

CMD ["dist/infra/http/server.js"]
