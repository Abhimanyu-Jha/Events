FROM node:10

WORKDIR /app

RUN npm install -g nodemon 

RUN wget -O wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh && chmod +x wait-for-it.sh

ADD package.json package.json

ADD package-lock.json package-lock.json

RUN rm -rf node_modules && npm install
