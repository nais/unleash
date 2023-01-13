FROM navikt/common:0.3 AS navikt-common
FROM node:16-alpine

LABEL org.opencontainers.image.source=https://github.com/nais/unleash
LABEL org.opencontainers.image.description="Unleash for NAIS"
LABEL org.opencontainers.image.licenses=MIT

COPY --from=navikt-common /init-scripts /init-scripts
COPY --from=navikt-common /entrypoint.sh /entrypoint.sh
COPY --from=navikt-common /dumb-init /dumb-init

EXPOSE 8080

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN chmod +x /init-scripts/* /entrypoint.sh /dumb-init && \
    mkdir -p /unleash && \
    chown -R node:node /unleash && \
    yarn config set loglevel "error"

WORKDIR /unleash

ADD package.json .
ADD yarn.lock .

RUN yarn install

ADD . .

RUN yarn build && \
    yarn cache clean

ADD run-script.sh /run-script.sh

ENTRYPOINT ["/dumb-init", "--", "/entrypoint.sh"]