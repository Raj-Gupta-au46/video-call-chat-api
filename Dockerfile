# syntax=docker/dockerfile:1

FROM node:16.15.1

ENV NODE_ENV=production

WORKDIR /build

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

CMD [ "node", "./build/index.js" ]