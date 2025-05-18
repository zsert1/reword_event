FROM node:18

WORKDIR /app

# 의존성 복사 및 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 앱 실행 + 시드 함께
CMD ["sh", "-c", "node dist/scripts/event_init.js && node dist/src/main.js"]
