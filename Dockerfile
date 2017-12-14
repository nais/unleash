# gjør det mulig å bytte base-image slik at vi får bygd både innenfor og utenfor NAV
ARG BASE_IMAGE_PREFIX=""
FROM ${BASE_IMAGE_PREFIX}node

RUN npm install --unsafe-perm -g unleash-server

ADD run.sh /run.sh
RUN chmod +x /run.sh
CMD bash /run.sh
