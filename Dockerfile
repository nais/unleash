FROM navikt/common:0.3 AS navikt-common
FROM node:16-alpine

LABEL org.opencontainers.image.source=https://github.com/nais/unleash
LABEL org.opencontainers.image.description="Unleash for NAIS"
LABEL org.opencontainers.image.licenses=MIT

EXPOSE 8080

ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV GOOGLE_PROJECT_ID=nais-management-7178

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

ADD run-script.sh /run-script.sh

CMD ./run-script.sh
