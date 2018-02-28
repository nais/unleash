FROM node:8-alpine
ADD . /
RUN npm install && npm cache clean -f
RUN npm run build
CMD npm start
