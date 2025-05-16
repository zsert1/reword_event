FROM node:18

WORKDIR /app


COPY package*.json ./
RUN npm install


COPY . .
RUN npm run build

# ✅ Seed script 실행 후 앱 실행
CMD ["sh", "-c", "node dist/scripts/init-users.js && node dist/src/main.js"]
