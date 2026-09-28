FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL=mysql://placeholder:placeholder@localhost:3306/placeholder \
    ./node_modules/.bin/prisma generate --config prisma7.config.ts \
    && npm run build

EXPOSE 3000
