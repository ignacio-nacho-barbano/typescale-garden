FROM node:21

WORKDIR /server

COPY package*.json ./

RUN npm i

COPY . .

RUN ls

run npm run locommand

EXPOSE 3000

CMD [ "node", "dist/src/index.js" ]
