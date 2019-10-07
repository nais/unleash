ARG BASE_IMAGE_PREFIX=""
FROM ${BASE_IMAGE_PREFIX}node

ADD . /unleash
WORKDIR /unleash

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm config set loglevel "error"
RUN npm install --unsafe-perm
RUN npm run build
RUN npm cache clean -f

ENV http_proxy=http://webproxy-nais.nav.no:8088
ENV https_proxy=http://webproxy-nais.nav.no:8088
ENV no_proxy=localhost,127.0.0.1,.local,.adeo.no,.aetat.no,.devillo.no,.oera.no

EXPOSE 8080
CMD npm start
