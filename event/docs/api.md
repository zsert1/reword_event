## 📘 Event 서버 API 명세서

Event 서버는 유저의 행동 기록 및 조건 기반 이벤트를 관리하고, 보상을 지급하는 서버입니다.  
다음은 주요 API의 **요청 형식**, **파라미터 설명**, **성공/실패 응답 예시**를 포함한 상세 명세입니다.

---

## ✅ 1. 이벤트 등록

- **메서드**: `POST`
- **경로**: `/event/register/event`
- **권한**: `ADMIN`, `OPERATOR`
- **요청 본문**:

```json
{
  "title": "7일 출석 이벤트",
  "description": "출석하면 보상이 지급됩니다.",
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-08T00:00:00Z",
  "eventType": "STREAK_LOGIN",
  "condition": { "requiredStreak": 7 },
  "newRewards": [
    {
      "rewardType": "COUPON",
      "value": "STREAK7_COUPON",
      "quantity": 1,
      "description": "7일 출석 쿠폰"
    }
  ],
  "existingRewardIds": []
}
```

### ✅ 성공 응답:

```json
{
  "eventId": "665123abc...",
  "message": "이벤트가 성공적으로 등록되었습니다."
}
```

### ❌ 실패 응답 예시:

```json
{
  "statusCode": 400,
  "message": "존재하지 않는 보상 ID입니다: 1234",
  "from": "event-service"
}
```

---

## ✅ 2. 이벤트 목록 조회

- **메서드**: `GET`
- **경로**: `/event`
- **쿼리 파라미터**:
  - `status`: `ongoing` | `ended` (선택)

### ✅ 성공 응답:

```json
[
  {
    "eventId": "665abc...",
    "title": "연속 출석 이벤트",
    "startDate": "...",
    "endDate": "...",
    "eventType": "STREAK_LOGIN",
    "condition": { "requiredStreak": 7 },
    "isActive": true
  }
]
```

---

## ✅ 3. 이벤트 상세 조회

- **메서드**: `GET`
- **경로**: `/event/:id`

### ✅ 성공 응답:

```json
{
  "eventId": "665abc...",
  "title": "출석 이벤트",
  "eventType": "STREAK_LOGIN",
  "condition": { "requiredStreak": 7 },
  ...
}
```

### ❌ 실패 응답:

```json
{
  "statusCode": 404,
  "message": "이벤트를 찾을 수 없습니다."
}
```

---

## ✅ 4. 보상 수령

- **메서드**: `POST`
- **경로**: `/event/:id/claim`
- **Path Param**:
  - `id`: 이벤트 ID
- **Header**:
  - `x-user-id`: 사용자 ID (Gateway 주입)

### ✅ 성공 응답:

```json
{
  "status": "SUCCESS",
  "message": "보상이 성공적으로 지급되었습니다.",
  "rewards": [
    {
      "rewardType": "POINT",
      "value": "1000",
      "quantity": 1,
      "description": "출석 보상 포인트"
    }
  ]
}
```

### ❌ 실패 응답:

- **조건 미충족**:

```json
{
  "statusCode": 400,
  "message": "이벤트 조건을 아직 만족하지 않았습니다."
}
```

- **이미 보상 수령**:

```json
{
  "statusCode": 400,
  "message": "이미 보상을 지급받은 이벤트입니다."
}
```

---

## ✅ 5. 보상 이력 조회

- **메서드**: `GET`
- **경로**:
  - 본인: `/event/reward/history`
  - 타인: `/event/reward/history/:userId`
- **Query 파라미터**:
  - `startDate`: YYYY-MM-DD
  - `endDate`: YYYY-MM-DD

### ✅ 성공 응답:

```json
[
  {
    "eventId": "665abc...",
    "eventType": "DUNGEON_CLEAR",
    "claimedAt": "2025-05-18T10:45:00Z",
    "rewards": [...]
  }
]
```

---

## ✅ 6. 유저 행동 로그 기록

- **메서드**: `POST`
- **경로**: `/event/log-action`

### 요청 예시:

```json
{
  "actionType": "DUNGEON_CLEAR",
  "metadata": {
    "dungeonLevel": 5
  },
  "occurredAt": "2025-05-18T10:30:00Z"
}
```

### ✅ 성공 응답:

```json
{
  "message": "유저 행동이 기록되었습니다."
}
```

---

## ✅ 7. 특정 이벤트 진행 상태 조회

- **메서드**: `GET`
- **경로**: `/event/:eventId/progress`
- **Path Param**: `eventId`

### ✅ 성공 응답:

```json
{
  "eventId": "665abc...",
  "progressStatus": "COMPLETED",
  "completedAt": "...",
  "rewardClaimedAt": null
}
```

---

## ✅ 8. 보상 생성 + 이벤트 연결

- **메서드**: `POST`
- **경로**: `/event/reward`

### 요청 예시:

```json
{
  "rewardType": "POINT",
  "value": "1000",
  "quantity": 1,
  "description": "던전 보상",
  "eventId": "665abc123..."
}
```

### ✅ 성공 응답:

```json
{
  "rewardId": "6677def...",
  "message": "보상이 성공적으로 생성되었습니다."
}
```

---

## 🧪 Postman 테스트 안내(보상 수령 관련테스트)

❗ Gateway를 통해서만 테스트 가능
직접 Event 서버 호출 불가 → JWT 인증 미적용

반드시 localhost:3000 (Gateway 포트)로 요청해야 함

### 테스트 흐름

1. 로그인 API (e.g. /auth/login)로 JWT 발급

2. Authorization: Bearer <JWT> 헤더 설정

3. /event/:id/claim으로 POST 요청 보내기

보상 수령 관련 주의 사항
Gateway를 통해서만 호출 가능

직접 Event 서버 요청 시 인증 미적용 → 실패

반드시 Authorization: Bearer <JWT> + x-user-id 헤더 포함 필요
