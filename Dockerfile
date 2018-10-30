
FROM node:10

WORKDIR /app
CMD node server_script.js
VOLUME /app

ADD . /app

RUN cd /app \
    && rm -rf node_modules/ \
    && npm install -g nodemon \
    && npm install
