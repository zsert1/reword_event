# 🧱 gateway 서버

### 📜 gateway 서버 구성

| 구성 요소     | 파일                           | 역할                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| ✅ JWT 검증   | `jwt.strategy.ts`              | JWT에서 유저 정보 추출                 |
| ✅ 인증 처리  | `@UseGuards(AuthGuard('jwt'))` | 유효한 JWT인지 확인                    |
| ✅ 역할 검사  | `roles.guard.ts`               | `@Roles()`로 명시된 권한이 있는지 검사 |
| ✅ 데코레이터 | `roles.decorator.ts`           | `@Roles('ADMIN')` 등 선언 가능         |

### 📜 gateway API 구성

| 기능             | HTTP Method | Gateway 경로   | 대상 서버 경로                        |
| ---------------- | ----------- | -------------- | ------------------------------------- |
| 이벤트 목록 조회 | `GET`       | `/events`      | `http://localhost:3002/events`        |
| 이벤트 상세 조회 | `GET`       | `/events/:id`  | `http://localhost:3002/events/:id`    |
| 로그인           | `POST`      | `/auth/login`  | `http://localhost:3001/auth/login`    |
| 회원가입         | `POST`      | `/auth/signup` | `http://localhost:3001/auth/signup`   |
| 유저 정보 조회   | `GET`       | `/auth/me`     | `http://localhost:3001/auth/user/:id` |

## Gateway 서버 - Auth API 명세서

✅ 인증은 Gateway에서 처리, 비즈니스 로직은 Auth 서버로 프록시
✅ 역할(Role) 기반 접근 제어는 @RoleGuard를 통해 Gateway에서 검증

### ✅ 회원가입

URL: POST /auth/signup  
인증 필요: ❌ No  
Body:

```json

{
  "username": "user1",
  "password": "pass123"
}
응답 (201 Created):
```

```json
{
  "_id": "...",
  "username": "user1",
  "role": "USER"
}
```

### ✅ 로그인

URL: POST /auth/login

인증 필요: ❌ No

Body:

```json
{
  "username": "user1",
  "password": "pass123"
}
```

응답 (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### ✅ 내 정보 조회

URL: GET /auth/me

인증 필요: ✅ Yes

Header:

```
Authorization: Bearer <accessToken>
```

응답 (200 OK):

```json
{
  "userId": "6650abc...",
  "username": "user1",
  "role": "USER"
}
```

### ✅ 관리자 계정 생성

URL: POST /auth/admin

인증 필요: ✅ Yes

Role 제한: ADMIN

Body:

```json
{
  "username": "admin2",
  "password": "adminpass"
}
```

응답 (201 Created):

```json
{
  "_id": "...",
  "username": "admin2",
  "role": "ADMIN"
}
```

### ✅ 역할(Role) 수정

URL: PATCH /auth/updateroles

인증 필요: ✅ Yes

Role 제한: ADMIN

Body:

```json
{
  "userId": "6650abc...",
  "role": "OPERATOR"
}
```

응답 (200 OK):

```json
{
  "success": true
}
```

### ✅ 유저 삭제 (논리 삭제)

URL: DELETE /auth/:id

인증 필요: ✅ Yes

Role 제한: ADMIN

응답 (200 OK):

```json
{
  "success": true
}
```
