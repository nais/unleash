FROM navikt/common:0.3 AS navikt-common
FROM node:16-alpine

COPY --from=navikt-common /init-scripts /init-scripts
COPY --from=navikt-common /entrypoint.sh /entrypoint.sh
COPY --from=navikt-common /dumb-init /dumb-init

RUN chmod +x /init-scripts/* /entrypoint.sh /dumb-init

ADD . /unleash
WORKDIR /unleash

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm config set loglevel "error"
RUN npm install --unsafe-perm
RUN npm run build
RUN npm cache clean -f

EXPOSE 8080

ADD run-script.sh /run-script.sh

ENTRYPOINT ["/dumb-init", "--", "/entrypoint.sh"]
