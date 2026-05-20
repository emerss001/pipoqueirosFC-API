FROM node:22-slim

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

CMD ["npm", "run", "dev"]
