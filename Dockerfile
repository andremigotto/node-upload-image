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

ENV PORT=3333
ENV NODE_ENV=dev
ENV DATABASE_URL="postgresql://docker:docker@localhost:5432/upload"
ENV CLOUDFLARE_ACCOUNT_ID="6a057124e444cf067dee49a0b558598d"
ENV CLOUDFLARE_ACCESS_KEY_ID="811174cf9eb8e2a9d0e3caaf6c9cf333"
ENV CLOUDFLARE_SECRET_ACCESS_KEY="511df5e2ccf9ca7d50cf7481570d4828f5cc3fe4959fc0c50eaba792a85f992a"
ENV CLOUDFLARE_BUCKET="upload-server"
ENV CLOUDFLARE_PUBLIC_URL="https://pub-2b448ea4350e4a179853c7646cb7bbf7.r2.dev"

EXPOSE 3333

CMD ["dist/infra/http/server.js"]
