# 🧱 gateway 서버

### 📜 gateway 서버 구성

| 구성 요소     | 파일                           | 역할                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| ✅ JWT 검증   | `jwt.strategy.ts`              | JWT에서 유저 정보 추출                 |
| ✅ 인증 처리  | `@UseGuards(AuthGuard('jwt'))` | 유효한 JWT인지 확인                    |
| ✅ 역할 검사  | `roles.guard.ts`               | `@Roles()`로 명시된 권한이 있는지 검사 |
| ✅ 데코레이터 | `roles.decorator.ts`           | `@Roles('ADMIN')` 등 선언 가능         |

### 📜 gateway API 구성

| 기능                          | HTTP Method | Gateway 경로                    | 대상 서버 경로                                   |
| ----------------------------- | ----------- | ------------------------------- | ------------------------------------------------ |
| 이벤트 목록 조회              | `GET`       | `/event?status=...`             | `http://event:3002/event?status=...`             |
| 이벤트 상세 조회              | `GET`       | `/event/:id`                    | `http://event:3002/event/:id`                    |
| 이벤트 등록                   | `POST`      | `/event/register`               | `http://event:3002/event/register/event`         |
| 이벤트 수정                   | `PATCH`     | `/event/event/:id`              | `http://event:3002/event/:id`                    |
| 이벤트 삭제 (소프트 삭제)     | `DELETE`    | `/event/event/:id`              | `http://event:3002/event/:id`                    |
| 이벤트 보상 수령 (Claim)      | `POST`      | `/event/:id/claim`              | `http://event:3002/event/:id/claim`              |
| 유저 행동 기록 (Log Action)   | `POST`      | `/event/log-action`             | `http://event:3002/event/log-action`             |
| 내 보상 이력 조회             | `GET`       | `/event/reward/history`         | `http://event:3002/event/reward/history`         |
| 특정 유저 보상 이력 조회      | `GET`       | `/event/reward/history/:userId` | `http://event:3002/event/reward/history/:userId` |
| 특정 이벤트 진행 상태 조회    | `GET`       | `/event/:eventId/progress`      | `http://event:3002/event/:eventId/progress`      |
| 내 전체 이벤트 진행 상태 조회 | `GET`       | `/event/progress`               | `http://event:3002/event/progress`               |
| 전체 보상 목록 조회           | `GET`       | `/event/reward`                 | `http://event:3002/event/reward`                 |
| 보상 단건 조회                | `GET`       | `/event/reward/:id`             | `http://event:3002/event/reward/:id`             |
| 보상 생성 + 이벤트 연결       | `POST`      | `/event/reward`                 | `http://event:3002/event/reward`                 |
| 로그인                        | `POST`      | `/auth/login`                   | `http://auth:3001/auth/login`                    |
| 회원가입                      | `POST`      | `/auth/signup`                  | `http://auth:3001/auth/signup`                   |
| 내 정보 조회                  | `GET`       | `/auth/me`                      | `http://auth:3001/auth/user/:id`                 |
| 관리자 계정 생성              | `POST`      | `/auth/admin`                   | `http://auth:3001/auth/admin`                    |
| 유저 역할(Role) 수정          | `PATCH`     | `/auth/updateroles`             | `http://auth:3001/auth/updateroles`              |
| 유저 삭제 (논리 삭제)         | `DELETE`    | `/auth/:id`                     | `http://auth:3001/auth/:id`                      |

## Gateway 서버 - Auth API 명세서

| 기능                  | HTTP Method | Gateway 경로        | 대상 서버 경로                      |
| --------------------- | ----------- | ------------------- | ----------------------------------- |
| 로그인                | `POST`      | `/auth/login`       | `http://auth:3001/auth/login`       |
| 회원가입              | `POST`      | `/auth/signup`      | `http://auth:3001/auth/signup`      |
| 내 정보 조회          | `GET`       | `/auth/me`          | `http://auth:3001/auth/user/:id`    |
| 관리자 계정 생성      | `POST`      | `/auth/admin`       | `http://auth:3001/auth/admin`       |
| 유저 역할(Role) 수정  | `PATCH`     | `/auth/updateroles` | `http://auth:3001/auth/updateroles` |
| 유저 삭제 (논리 삭제) | `DELETE`    | `/auth/:id`         | `http://auth:3001/auth/:id`         |

✅ 인증은 Gateway에서 처리, 비즈니스 로직은 Auth 서버로 프록시
✅ 역할(Role) 기반 접근 제어는 @RoleGuard를 통해 Gateway에서 검증

### ✅ 회원가입

- **URL**: POST `http://localhost:3000/auth/signup`
- **인증 필요**: ❌ No
- **Body**:

```json
{
  "username": "user1",
  "password": "pass123"
}
```

응답 (201 Created):

```json
{
  "_id": "...",
  "username": "user1",
  "role": "USER"
}
```

### ✅ 로그인

- **URL**: POST `http://localhost:3000/auth/login`
- **인증 필요**: ❌ No
- **Body**:

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

- **URL**: GET `http://localhost:3000/auth/me`

- **인증 필요**: ✅ Yes

- **Header**:

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

- **URL**: POST /auth/admin

- **인증 필요**: ✅ Yes

- **Role 제한**: ADMIN

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

- **URL**: PATCH `http://localhost:3000/auth/updateroles`

- **인증 필요**: ✅ Yes

- **Role 제한**: ADMIN

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

- **URL**: `DELETE http://localhost:3000/auth/:id`
- **인증 필요**: ✅ Yes
- **Role 제한**: ADMIN
- 응답 (200 OK):

```json
{
  "success": true
}
```

## Gateway 서버 - event API 명세서

### ✅ 📡 Gateway 서버 이벤트 관련 기능

| 기능                       | 경로 (Method)                       | 역할 권한                | 내부 프록시 대상                    |
| -------------------------- | ----------------------------------- | ------------------------ | ----------------------------------- |
| 이벤트 등록                | `POST /event/register`              | ADMIN, OPERATOR          | `POST /event/register/event`        |
| 이벤트 전체 조회           | `GET /event?status=...`             | 모든 권한                | `GET /event?status=...`             |
| 이벤트 단건 조회           | `GET /event/:id`                    | 모든 권한                | `GET /event/:id`                    |
| 보상 수령 (claim)          | `POST /event/:id/claim`             | USER                     | `POST /event/:id/claim`             |
| 유저 행동 로그             | `POST /event/log-action`            | USER, OPERATOR, ADMIN    | `POST /event/log-action`            |
| 보상 이력 조회 (본인)      | `GET /event/reward/history`         | USER                     | `GET /event/reward/history`         |
| 보상 이력 조회 (타인)      | `GET /event/reward/history/:userId` | ADMIN, OPERATOR, AUDITOR | `GET /event/reward/history/:userId` |
| 특정 이벤트 진행 상태 조회 | `GET /event/:eventId/progress`      | USER                     | `GET /event/:eventId/progress`      |
| 전체 이벤트 진행 상태 조회 | `GET /event/progress`               | USER                     | `GET /event/progress`               |
| 이벤트 수정                | `PATCH /event/event/:id`            | OPERATOR, ADMIN          | `PATCH /event/:id`                  |
| 이벤트 삭제                | `DELETE /event/event/:id`           | OPERATOR, ADMIN          | `DELETE /event/:id`                 |
| 보상 전체 조회             | `GET /event/reward`                 | OPERATOR, ADMIN          | `GET /event/reward`                 |
| 보상 단건 조회             | `GET /event/reward/:id`             | OPERATOR, ADMIN          | `GET /event/reward/:id`             |
| 보상 생성 + 이벤트 연결    | `POST /event/reward`                | OPERATOR, ADMIN          | `POST /event/reward`                |

### ✅ 이벤트 등록

- **_URL_**: `POST http://localhost:3000/event/register`
- **인증 필요**: ✅ Yes
- **Role 제한**: ADMIN,OPERATOR
- **Body**:

```json
{
  "title": "5일 연속 출석 보상 기록",
  "description": "7일 연속 출석 시 보상",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-08T00:00:00Z",
  "eventType": "STREAK_LOGIN",
  "condition": {
    "requiredStreak": 7
  },
  "newRewards": [
    {
      "rewardType": "COUPON",
      "value": "STREAK7DAY_COUPON",
      "quantity": 1,
      "description": "5일 연속 출석 쿠폰"
    }
  ]
}
```

### 성공 응답 (201 Created):

```json
{
  "eventId": "665123abc...",
  "message": "이벤트가 성공적으로 등록되었습니다."
}
```

### **Body**(실패에시):

```json
{
  "title": "5일 연속 출석 보상 기록",
  "description": "7일 연속 출석 시 보상",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-08T00:00:00Z",
  "eventType": "STREAK_LOGIN",
  "condition": {
    "requiredStreak": 7
  },
  "newRewards": [
    {
      "rewardType": "COUPON",
      "value": "STREAK7DAY_COUPON",
      "quantity": 1,
      "description": "5일 연속 출석 쿠폰"
    }
  ]
}
```

### 실패 응답 (400 ):

```json
{
  "statusCode": 400,
  "message": "존재하지 않는 보상 ID입니다: 1234",
  "from": "event-service"
}
```

### ✅ 이벤트 전체 조회

- **_URL_**: `GET http://localhost:3000/event?status=ongoing|ended`
- **인증 필요**: ✅ Yes
- **Query Parameter:**:
  - status (optional): ongoing 또는 ended 중 하나
  - ongoing: 현재 진행 중인 이벤트만 조회
  - ended: 종료된 이벤트만 조회
  - 생략 시 전체 이벤트 반환

### 성공 응답 (200 OK):

```json
[
  {
    "eventId": "665123abc...",
    "title": "7일 출석 보상",
    "description": "7일 연속 출석하면 쿠폰 지급",
    "eventType": "STREAK_LOGIN",
    "startDate": "2025-06-01T00:00:00Z",
    "endDate": "2025-06-08T00:00:00Z",
    "condition": {
      "requiredStreak": 7
    },
    "isActive": true
  },
  ...
]
```

### 실패 응답 (400 Bad Request)"

```json
{
  "statusCode": 404,
  "message": "이벤트를 찾을 수 없습니다.",
  "from": "event-service"
}
```

## ✅ 이벤트 단건 조회

- **URL**: `GET http://localhost:3000/event/:id`
- **인증 필요**: ✅ Yes
- **Path Parameter:**:
  - id: 조회할 이벤트의 고유 ID

### 성공 응답 (200 OK):

```json
{
  "eventId": "665123abc...",
  "title": "7일 출석 보상",
  "description": "7일 연속 출석하면 쿠폰 지급",
  "eventType": "STREAK_LOGIN",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-08T00:00:00Z",
  "condition": {
    "requiredStreak": 7
  },
  "isActive": true
}
```

### 실패 응답 (404 Not Found):

```json
{
  "statusCode": 404,
  "message": "이벤트를 찾을 수 없습니다.",
  "from": "event-service"
}
```

## ✅ 3. 이벤트 보상 신청 (Claim)

- **URL**: `POST http://localhost:3000/event/:id/claim`
- **인증 필요**: ✅ Yes
- **Path Parameter:**:

  - id: 보상 신청할 이벤트의 고유 ID

- **Header**: Authorization: Bearer <JWT>

### 성공 응답 (200 OK):

```json
{
  "status": "SUCCESS",
  "rewards": [
    {
      "rewardType": "COUPON",
      "value": "STREAK7DAY_COUPON",
      "quantity": 1,
      "description": "7일 연속 출석 쿠폰"
    }
  ],
  "message": "보상이 성공적으로 지급되었습니다."
}
```

### 🔹 실패 응답 예시 1: 조건 미충족

```json
{
  "statusCode": 400,
  "message": "이벤트 조건을 아직 만족하지 않았습니다.",
  "from": "event-service"
}
```

### 🔹 실패 응답 예시 2: 이미 보상 받음

```json
{
  "statusCode": 400,
  "message": "이미 보상을 지급받은 이벤트입니다.",
  "from": "event-service"
}
```

### ✅ 4. 이벤트 진행 상태 조회

- **URL**: `GET http://localhost:3000/event/:eventId/progress`
- **인증 필요**: ✅ Yes
- **Role 제한**: USER

- 성공 응답 예시

```json
{
  "eventId": "665abc123...",
  "progressStatus": "COMPLETED",
  "completedAt": "2025-05-17T12:00:00.000Z",
  "rewardClaimedAt": null
}
```

### 📌 유저의 전체 이벤트 진행 상태 목록 조회

- **URL**: `GET http://localhost:3000/event/progress`

- **인증 필요**: ✅ Yes

- **Role 제한**: USER

- 성공 응답 예시

```json
[
  {
    "eventId": "665abc123...",
    "progressStatus": "NOT_STARTED",
    "completedAt": null,
    "rewardClaimedAt": null
  },
  {
    "eventId": "665abc456...",
    "progressStatus": "COMPLETED",
    "completedAt": "2025-05-18T10:22:00.000Z",
    "rewardClaimedAt": "2025-05-18T11:30:00.000Z"
  }
]
```

✅ 5. 보상 이력 조회

- **URL**: `GET http://localhost:3000/event/reward/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- **인증 필요**: ✅ Yes
- **Role 제한**: USER

- 성공 응답 예시

```json
[
  {
    "eventId": "665abc...",
    "eventType": "DUNGEON_CLEAR",
    "rewards": [
      {
        "rewardType": "COUPON",
        "value": "50",
        "quantity": 1,
        "description": "던전 클리어 보상"
      }
    ],
    "claimedAt": "2025-05-18T10:45:44.274Z"
  }
]
```

### 📌 관리자 보상 이력 조회 (타 유저)

- **URL**: `GET http://localhost:3000/event/reward/history/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

- **인증 필요**: ✅ Yes

- **Role 제한**: ADMIN, OPERATOR, AUDITOR

### ✅ 6. 보상 전체 조회

- **URL**: `GET http://localhost:3000/event/reward`
- **인증 필요**: ✅ Yes
- **Role 제한**: OPERATOR, ADMIN

- 성공

```json

[
{
"rewardType": "COUPON",
"value": "STREAK5DAY_COUPON",
"quantity": 1,
"description": "5일 출석 쿠폰"
},
...
]
```

### ✅ 7. 보상 단건 조회

- **URL**: `GET http://localhost:3000/event/reward/:id`

- **인증 필요**: ✅ Yes

- **Role 제한**: OPERATOR, ADMIN

- **Path Parameter:**:

  - id: 조회할 보상 ID

- 성공

```json
{
  "_id": "6650ab...",
  "rewardType": "COUPON",
  "value": "STREAK7DAY_COUPON",
  "quantity": 1,
  "description": "7일 출석 쿠폰",
  "isDeleted": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### ✅ 8. 보상 생성 + 이벤트 연결

- **URL**: `POST http://localhost:3000/event/reward`

- **인증 필요**: ✅ Yes

- **Role 제한**: OPERATOR, ADMIN

- **요청 Body 예시**

```json
{
  "rewardType": "POINT",
  "value": "1000",
  "quantity": 1,
  "description": "출석 보상 포인트",
  "eventId": "6650abc123..." // 생략 가능
}
```

- 성공 응답

```json
{
  "rewardId": "6650def...",
  "message": "보상이 성공적으로 생성되었습니다."
}
```
