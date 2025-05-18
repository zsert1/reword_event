FROM node:18

WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .
RUN npm run build


CMD ["sh", "-c", "node dist/scripts/init-users.js && node dist/src/main.js"]
