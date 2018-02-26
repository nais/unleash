FROM node:8-alpine
ADD . /
RUN npm install && npm cache clean -f
CMD npm start
