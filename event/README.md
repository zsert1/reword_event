# 🧱 Event 서버

| 기능                | 메서드 | 경로                   | 권한               |
| ------------------- | ------ | ---------------------- | ------------------ |
| 이벤트 등록         | `POST` | `event/register/event` | ✅ OPERATOR, ADMIN |
| 이벤트 목록 조회    | `GET`  | `/events`              | ✅ 로그인 유저     |
| 이벤트 상세 조회    | `GET`  | `/events/:id`          | ✅ 로그인 유저     |
| 보상 신청           | `POST` | `/rewards/claim`       | ✅ USER            |
| 내 보상 이력 조회   | `GET`  | `/rewards/history`     | ✅ USER            |
| 전체 보상 이력 조회 | `GET`  | `/rewards/logs`        | ✅ AUDITOR, ADMIN  |

## 스키마 구조

### 📌 이벤트 관련 전체 스키마

| 스키마명             | 설명                           |
| -------------------- | ------------------------------ |
| `Event`              | 이벤트 정의                    |
| `Reward`             | 보상 정의                      |
| `EventRewardMapping` | 이벤트-보상 매핑               |
| `UserEventProgress`  | 유저의 이벤트 진행 상태        |
| `RewardClaimLog`     | 유저의 보상 요청/지급 로그     |
| `EventAdminLog`      | 관리자의 이벤트 관련 행위 로그 |

### 📌 Event (이벤트)

| 필드                      | 타입      | 설명                                               |
| ------------------------- | --------- | -------------------------------------------------- |
| `title`                   | `string`  | 이벤트 이름                                        |
| `description`             | `string`  | 이벤트 설명                                        |
| `startDate`               | `Date`    | 이벤트 시작 시간                                   |
| `endDate`                 | `Date`    | 이벤트 종료 시간                                   |
| `eventType`               | `enum`    | 이벤트 유형 (`LOGIN_REWARD`, `LEVEL_REACHED`, ...) |
| `condition`               | `object`  | 이벤트 조건 (ex. `{ requiredLevel: 100 }`)         |
| `isActive`                | `boolean` | 이벤트 활성 여부                                   |
| `isDeleted`               | `boolean` | 논리 삭제 여부                                     |
| `createdAt` / `updatedAt` | `Date`    | 자동 생성 시간                                     |

#### 🎮 eventType 종류 (RPG 게임 기반)

- `LOGIN_REWARD`: 접속 시 보상
- `LEVEL_REACHED`: 특정 레벨 달성 시
- `QUEST_CLEAR`: 퀘스트 완료
- `BOSS_KILL`: 보스 몬스터 처치
- `DUNGEON_CLEAR`: 던전 클리어
- `FRIEND_INVITE`: 친구 초대
- `STREAK_LOGIN`: 연속 출석

#### 📦 condition 예시

| eventType       | condition 예시             |
| --------------- | -------------------------- |
| `LEVEL_REACHED` | `{ "requiredLevel": 100 }` |
| `STREAK_LOGIN`  | `{ "requiredStreak": 7 }`  |
| `FRIEND_INVITE` | `{ "minInvites": 3 }`      |

---

### 🎁 Reward (이벤트 보상)

| 필드                      | 타입      | 설명                                    |
| ------------------------- | --------- | --------------------------------------- |
| `rewardType`              | `enum`    | 보상 타입 (`POINT`, `ITEM`, `EXP`, ...) |
| `value`                   | `string`  | 보상 값 (ex. `"500"`, `"ITEM123"`)      |
| `description`             | `string`  | 보상 설명 (선택)                        |
| `isDeleted`               | `boolean` | 삭제 여부                               |
| `createdAt` / `updatedAt` | `Date`    | 자동 생성 시간                          |
| `quantity`                | `number`  | 보상 수량 (예: 3개, 500개 등)           |

#### ✅ rewardType 종류

- `POINT`: 게임 포인트 (예: 100)
- `ITEM`: 아이템 이름 (예: 엘릭서 3개)
- `COUPON`: 쿠폰 코드 (예: EXPBOOST_20)
- `EXP`: 경험치 (예: 5000)
- `CURRENCY`: 게임 내 재화 (예: 10000 메소)

### 🎁 EventRewardMapping

| 필드                      | 타입       | 설명           |
| ------------------------- | ---------- | -------------- |
| `eventId`                 | `ObjectId` | 이벤트 ID 참조 |
| `rewardId`                | `ObjectId` | 보상 ID 참조   |
| `isDeleted`               | `boolean`  | 매핑 삭제 여부 |
| `createdAt` / `updatedAt` | `Date`     | 생성/수정 시각 |

### 🎁 UserEventProgress

| 필드                      | 타입       | 설명                                         |
| ------------------------- | ---------- | -------------------------------------------- |
| `userId`                  | `string`   | 유저 식별자                                  |
| `eventId`                 | `ObjectId` | 이벤트 참조                                  |
| `progressStatus`          | `enum`     | 상태: `IN_PROGRESS`, `COMPLETED`, `REWARDED` |
| `completedAt`             | `Date`     | 완료된 시간 (선택)                           |
| `rewardClaimedAt`         | `Date`     | 보상 받은 시간 (선택)                        |
| `createdAt` / `updatedAt` | `Date`     | 자동 시간 기록                               |

### 🎁 RewardClaimLog

| 필드                      | 타입       | 설명             |
| ------------------------- | ---------- | ---------------- |
| `userId`                  | `string`   | 유저 ID          |
| `eventId`                 | `ObjectId` | 이벤트 참조      |
| `rewardId`                | `ObjectId` | 보상 참조        |
| `isSuccess`               | `boolean`  | 성공 여부        |
| `claimedAt`               | `Date`     | 요청 시각        |
| `failureReason`           | `string`   | 실패 사유 (선택) |
| `createdAt` / `updatedAt` | `Date`     | 자동 시간 기록   |

### 🎁 EventAdminLog (이벤트 관리 로그)

| 필드                      | 타입       | 설명                         |
| ------------------------- | ---------- | ---------------------------- |
| `adminId`                 | `string`   | 관리자 계정 ID               |
| `eventId`                 | `ObjectId` | 대상 이벤트                  |
| `action`                  | `enum`     | `CREATE`, `UPDATE`, `DELETE` |
| `memo`                    | `string`   | 상세 설명 (선택)             |
| `createdAt` / `updatedAt` | `Date`     | 생성/수정 시각               |

### 🎁 RewardAdminLog (보상 관리 로그)

| 필드                      | 타입          | 설명                                          |
| ------------------------- | ------------- | --------------------------------------------- |
| `adminId`                 | string        | 보상을 생성/수정/삭제한 관리자 ID             |
| `rewardId`                | ObjectId      | 대상 보상 ID                                  |
| `action`                  | enum          | 로그 액션 타입 (`CREATE`, `UPDATE`, `DELETE`) |
| `memo`                    | string (선택) | 작업에 대한 상세 설명                         |
| `createdAt` / `updatedAt` | Date          | 로그가 생성/수정된 시간 (자동 생성됨)         |

---

## 📌 DTO 정의

### ✅ CreateEventDto - 이벤트 생성

| 필드명              | 타입               | 필수 | 설명                                                |
| ------------------- | ------------------ | ---- | --------------------------------------------------- |
| `title`             | string             | ✅   | 이벤트 제목                                         |
| `description`       | string             | ❌   | 이벤트 설명                                         |
| `startDate`         | ISO8601 Date       | ✅   | 시작일 (`2025-06-01T00:00:00Z`)                     |
| `endDate`           | ISO8601 Date       | ✅   | 종료일                                              |
| `eventType`         | enum               | ✅   | 이벤트 유형 (`LOGIN_REWARD`, `LEVEL_REACHED` 등)    |
| `condition`         | object             | ❌   | 조건 정보 (예: `{ requiredLevel: 100 }`)            |
| `isActive`          | boolean            | ❌   | 기본값 true                                         |
| `adminId`           | string             | ✅   | 생성한 관리자 ID                                    |
| `newRewards`        | CreateRewardDto\[] | ✅   | 등록 시 함께 저장할 보상 배열(기존에 없던 보상)     |
| `existingRewardIds` | string\[]          | ✅   | 등록 시 함께 저장할 보상 배열(기존에 존재하는 보상) |

### ✅ CreateRewardDto - 보상 생성

| 필드명        | 타입   | 필수 | 설명                                                     |
| ------------- | ------ | ---- | -------------------------------------------------------- |
| `rewardType`  | enum   | ✅   | 보상 종류 (`POINT`, `ITEM`, `EXP`, `COUPON`, `CURRENCY`) |
| `value`       | string | ✅   | 보상 값 (예: `"500"`, `"ITEM_123"`)                      |
| `quantity`    | number | ✅   | 보상 수량 (예: 3개, 500개 등)                            |
| `description` | string | ❌   | 보상 설명                                                |

### ✅ UpdateProgressDto -유저 이벤트 상태 업데이트 요청

| 필드명           | 타입              | 필수 | 설명                                          |
| ---------------- | ----------------- | ---- | --------------------------------------------- |
| `userId`         | MongoId or string | ✅   | 대상 유저 ID                                  |
| `eventId`        | MongoId           | ✅   | 이벤트 ID                                     |
| `progressStatus` | enum              | ✅   | 상태 (`IN_PROGRESS`, `COMPLETED`, `REWARDED`) |

### ✅ ClaimRewardDto -유저가 보상 요청

| 필드명     | 타입              | 필수 | 설명             |
| ---------- | ----------------- | ---- | ---------------- |
| `userId`   | MongoId or string | ✅   | 유저 ID          |
| `eventId`  | MongoId           | ✅   | 이벤트 ID        |
| `rewardId` | MongoId           | ✅   | 요청하는 보상 ID |

### ✅ RewardResponseDto - 보상 조회

| 필드명        | 타입              | 설명                                                     |
| ------------- | ----------------- | -------------------------------------------------------- |
| `rewardId`    | string (ObjectId) | 보상 ID                                                  |
| `rewardType`  | enum              | 보상 종류 (`POINT`, `ITEM`, `EXP`, `COUPON`, `CURRENCY`) |
| `value`       | string            | 보상 값                                                  |
| `quantity`    | number            | 보상 수량                                                |
| `description` | string            | 보상 설명 (선택)                                         |

### ✅ EventResponseDto – 이벤트 조회 응답

| 필드명        | 타입              | 설명                                             |
| ------------- | ----------------- | ------------------------------------------------ |
| `eventId`     | string (ObjectId) | 이벤트 ID                                        |
| `title`       | string            | 이벤트 제목                                      |
| `description` | string            | 이벤트 설명 (선택)                               |
| `eventType`   | enum              | 이벤트 유형 (`LOGIN_REWARD`, `LEVEL_REACHED` 등) |
| `startDate`   | ISO8601 Date      | 시작일                                           |
| `endDate`     | ISO8601 Date      | 종료일                                           |
| `condition`   | object            | 조건 정보 (예: `{ requiredLevel: 100 }`)         |
| `isActive`    | boolean           | 이벤트 활성 여부                                 |

---

## 🛡️ Event 서버 API 명세서

---

## ✅ 이벤트 등록

- **URL**: `POST http://localhost:3000/event/register`
- **인증 필요**: ✅ Yes
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
  ],
  "existingRewardIds": ["1234"]
}
```

### 성공 응답 (201 Created):

```json
{
  "eventId": "665123abc...",
  "message": "이벤트가 성공적으로 등록되었습니다."
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
