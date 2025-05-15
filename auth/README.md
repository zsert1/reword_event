| 기능              | 설명                                           |
| --------------- | -------------------------------------------- |
| **유저 등록**       | username + password로 회원가입(0)                    |
| **로그인**         | 로그인 성공 시 JWT 발급(0)                              |
| **역할(Role) 관리** | USER / OPERATOR / AUDITOR / ADMIN 중 1개 이상 할당 (0)|
| **JWT 인증**      | `@nestjs/passport`, `AuthGuard` 사용 (0)          |
| **Role 기반 인가**  | `RolesGuard`로 접근 제어(0)                            |
| **테스트 코드 작성**   | 회원가입, 로그인, Role 가드 테스트 (0)      |


# 🛡️ Auth 서버 API 명세서

NestJS + JWT 기반 인증 및 권한 관리 기능을 제공합니다.

---

## ✅ 회원가입

- **URL**: `POST /auth/signup`
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
  "roles": ["USER"],
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

- **URL**: `POST /auth/login`
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

- **URL**: `GET /auth/me`
- **인증 필요**:  ✅ Yes
- **Header**:
```
Authorization: Bearer <accessToken>
```

### 성공 응답 (200 OK):
```json
{
  "userId": "66502...",
  "username": "user1",
  "roles": ["USER"]
}
```

## ✅ 관리자 전용 API 테스트

- **URL**: `GET /auth/admin-only`
- **인증 필요**:  ✅ Yes
- **Header**:
```
Authorization: Bearer <accessToken>
```

### 성공 응답 (200 OK):
```json
{
  "user": {
    "userId": "66502...",
    "username": "admin1",
    "roles": ["ADMIN"]
  }
}
```

### 실패 응답 (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "권한이 없습니다.",
  "error": "Forbidden"
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