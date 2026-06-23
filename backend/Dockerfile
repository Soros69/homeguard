
FROM node:20-alpine

WORKDIR /app

RUN addgroup -S homeguard && adduser -S homeguard -G homeguard

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

USER homeguard

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node_modules/.bin/tsx", "src/index.ts"]
