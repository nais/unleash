FROM node
ADD . /unleash
WORKDIR /unleash

ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN npm config set loglevel "error"
RUN npm install --unsafe-perm
RUN npm run build
RUN npm cache clean -f

EXPOSE 8080
CMD npm start
