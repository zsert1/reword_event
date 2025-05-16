# 🧱 gateway 서버

### 📜 gateway 서버 구성

| 구성 요소     | 파일                           | 역할                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| ✅ JWT 검증   | `jwt.strategy.ts`              | JWT에서 유저 정보 추출                 |
| ✅ 인증 처리  | `@UseGuards(AuthGuard('jwt'))` | 유효한 JWT인지 확인                    |
| ✅ 역할 검사  | `roles.guard.ts`               | `@Roles()`로 명시된 권한이 있는지 검사 |
| ✅ 데코레이터 | `roles.decorator.ts`           | `@Roles('ADMIN')` 등 선언 가능         |

### 📜 gateway API 구성

| 기능             | HTTP Method | Gateway 경로   | 대상 서버 경로                      |
| ---------------- | ----------- | -------------- | ----------------------------------- |
| 이벤트 목록 조회 | `GET`       | `/events`      | `http://localhost:3002/events`      |
| 이벤트 상세 조회 | `GET`       | `/events/:id`  | `http://localhost:3002/events/:id`  |
| 로그인           | `POST`      | `/auth/login`  | `http://localhost:3001/auth/login`  |
| 회원가입         | `POST`      | `/auth/signup` | `http://localhost:3001/auth/signup` |
| 유저 정보 조회   | `GET`       | `/auth/me`     | `http://localhost:3001/auth/me`     |
