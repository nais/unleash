# Build Stage
FROM node:22-alpine AS builder

RUN mkdir -p /unleash && \
    chown -R node:node /unleash && \
    yarn config set loglevel "error"

WORKDIR /unleash

ADD package.json .
ADD yarn.lock .

RUN yarn install --frozen-lockfile

ADD . .

RUN yarn build

RUN rm -rf node_modules
RUN yarn cache clean

RUN yarn install --production --frozen-lockfile

# Production Stage
FROM gcr.io/distroless/nodejs20-debian11

LABEL org.opencontainers.image.source=https://github.com/nais/unleash
LABEL org.opencontainers.image.description="Unleash for NAIS"
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

COPY --from=builder /unleash/dist ./dist
COPY --from=builder /unleash/node_modules ./node_modules

CMD ["dist/index.js"]
