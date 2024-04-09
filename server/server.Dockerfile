FROM node:18

WORKDIR /server

COPY package*.json ./

RUN npm i

COPY ./prisma/schema.prisma ./

RUN npx prisma generate

COPY ./dist ./

EXPOSE 3000

CMD [ "node", "src/index.js" ]
