# gjør det mulig å bytte base-image slik at vi får bygd både innenfor og utenfor NAV
ARG BASE_IMAGE_PREFIX=""
FROM ${BASE_IMAGE_PREFIX}node
RUN npm install --unsafe-perm -g unleash-server
CMD unleash -d postgres://${UNLEASH_PG_USERNAME}:${UNLEASH_PG_PASSWORD}@tpa-unleashdb-postgresql.tpa.svc.nais.local:5432/unleash -p 8080
