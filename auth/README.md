# 🧱 Auth 서버

| 기능             | 메서드   | 경로                | 권한                       |
| ---------------- | -------- | ------------------- | -------------------------- |
| 회원가입         | `POST`   | `/auth/signup`      | ❌ 공개                    |
| 로그인           | `POST`   | `/auth/login`       | ❌ 공개                    |
| 내 정보 조회     | `GET`    | `/auth/user/:id`    | ✅ 로그인 유저             |
| 유저 역할 변경   | `PATCH`  | `/auth/updateroles` | ✅ ADMIN                   |
| 유저 목록 조회   | `GET`    | `/auth/users`       | ✅ ADMIN                   |
| (선택) 유저 삭제 | `DELETE` | `/auth/:userId`     | ✅ ADMIN                   |
| 관리자 계정 등록 | `POST`   | `/auth/admin`       | ❌ 내부 또는 한정된 사용자 |
| 관리자 수정      | `PATCH`  | `/auth/:id`         | ✅ ADMIN                   |
| 관리자 삭제      | `DELETE` | `/auth/:id`         | ✅ ADMIN                   |

## 🔐 Auth 서버 스키마 구조

### 👤 User (유저)

| 필드명      | 타입     | 설명                                               |
| ----------- | -------- | -------------------------------------------------- |
| `_id`       | ObjectId | MongoDB 자동 생성 ID                               |
| `username`  | string   | 유저명 (중복 불가)                                 |
| `password`  | string   | bcrypt로 암호화된 비밀번호                         |
| `role`      | string   | 역할 목록 (`USER`, `OPERATOR`, `AUDITOR`, `ADMIN`) |
| `createdAt` | Date     | 생성일 (자동)                                      |
| `updatedAt` | Date     | 수정일 (자동)                                      |

#### 🎭 역할(Role) 종류

| 역할명     | 설명                          |
| ---------- | ----------------------------- |
| `USER`     | 기본 권한. 보상 요청 가능     |
| `OPERATOR` | 이벤트 및 보상 등록 가능      |
| `AUDITOR`  | 모든 보상 요청 이력 조회 가능 |
| `ADMIN`    | 모든 기능 접근 가능           |

---

### 📜 LoginHistory (로그인 이력)

| 필드명      | 타입     | 설명                      |
| ----------- | -------- | ------------------------- |
| `_id`       | ObjectId | MongoDB 자동 생성 ID      |
| `userId`    | string   | 로그인한 유저 ID          |
| `ip`        | string   | 로그인 요청 IP 주소       |
| `userAgent` | string   | 로그인 시 클라이언트 정보 |
| `createdAt` | Date     | 로그인 시각               |
| `updatedAt` | Date     | 수정 시각 (자동)          |

#### 🧭 사용 목적

- 연속 출석 이벤트 처리
- 누적 로그인 횟수 계산
- 특정 기간 내 로그인 여부 체크

## 🛡️ Auth 서버 API 명세서

NestJS + JWT 기반 인증 및 권한 관리 기능을 제공합니다.

---

## ✅ 회원가입

- **URL**: `POST http://localhost:3001/auth/signup`
- **인증 필요**: ❌ No
- **Body**:

```json
{
  "username": "user1",
  "password": "pass123"
}
```

### 성공 응답 (201 Created):

```json
{
  "_id": "66502...",
  "username": "user1",
  "role": "USER",
  "createdAt": "2025-05-15T12:00:00.000Z",
  "updatedAt": "2025-05-15T12:00:00.000Z"
}
```

### 실패 응답 (409 Conflict):

```json
{
  "statusCode": 409,
  "message": "이미 존재하는 유저명입니다.",
  "error": "Conflict"
}
```

## ✅ 로그인

- **URL**: `POST http://localhost:3001/auth/login`
- **인증 필요**: ❌ No
- **Body**:

```json
{
  "username": "user1",
  "password": "pass123"
}
```

### 성공 응답 (200 OK):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### 실패 응답 (401 Unauthorized):

```json
{
  "message": "올바른 정보가 아닙니다.",
  "error": "Unauthorized",
  "statusCode": 401
}
```

## ✅ 내 정보 조회

- **URL**: `GET http://localhost:3001/user/:id`
- **인증 필요**: ✅ Yes
- **Header**:

### 성공 응답 (200 OK):

```json
{
  "userId": "66502...",
  "username": "user1",
  "role": "USER"
}
```

## ✅ 관리자 계정 생성

- **URL**: `POST http://localhost:3001/auth/admin`
- **인증 필요**: ✅ Yes
- **Body**:

```json
{
  "username": "admin1",
  "password": "adminpass"
}
```

### 성공 응답 (200 OK):

```json
{
  "_id": "...",
  "username": "admin1",
  "role": "ADMIN"
}
```

## ✅ 역할수정

- **URL**: `POST http://localhost:3001/auth/updateroles`
- **인증 필요**: ✅ Yes(ADMIN만)
- **Body**:

```json
{
  "userId": "682749c974014366400fc30a",
  "role": "OPERATOR"
}
```

### 성공 응답 (200 OK):

```json
{
  "success": true
}
```

## ✅ 유저 논리 삭제

- **URL**: `DELETE http://localhost:3001/auth/:id`
- **인증 필요**: ✅ Yes(ADMIN만)

### 성공 응답 (200 OK):

```json
{
  "success": true
}
```

# ✅ 🧪 테스트 실행

## 전체 테스트 실행

```bash
npm run test
```

## 테스트 결과 확인 (Jest 기반)

```
PASS src/auth/auth.service.spec.ts
  AuthService
    ✓ should create a new user if not exists
    ✓ should throw ConflictException if user exists
    ✓ should return token if user & password match
    ✓ should throw UnauthorizedException if user not found
    ✓ should throw UnauthorizedException if password does not match
```
