FROM node:18-alpine

LABEL org.opencontainers.image.source=https://github.com/nais/unleash
LABEL org.opencontainers.image.description="Unleash for NAIS"
LABEL org.opencontainers.image.licenses=MIT

EXPOSE 8080

RUN mkdir -p /unleash && \
    chown -R node:node /unleash && \
    yarn config set loglevel "error"

WORKDIR /unleash

ADD package.json .
ADD yarn.lock .

RUN yarn install

ADD . .

RUN yarn build && \
    yarn cache clean

CMD node dist/index.js
