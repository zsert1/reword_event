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

### 🎁 UserActionLog (유저 행동 로그)

| 필드                     | 타입                  | 설명                                               |
| ------------------------ | --------------------- | -------------------------------------------------- |
| `userId`                 | `Types.ObjectId`      | 행동을 수행한 유저 ID                              |
| `actionType`             | `EventType` (enum)    | 이벤트 유형 (`LOGIN_REWARD`, `LEVEL_REACHED`, ...) |
| `metadata`               | `Record<string, any>` | 행동의 상세 정보 (예: `{ bossId: 'dragon_lord' }`) |
| `occurredAt`             | `Date` (optional)     | 행동 발생 시점 (없으면 `createdAt` 사용)           |
| `createdAt`, `updatedAt` | `Date`                | `@Schema({ timestamps: true })`에 의해 자동 처리됨 |

### 🎁 UserRewardHistory(보상을 수령한 시점과 지급 내용을 기록)

| 필드명                | 타입                  | 설명                   |
| --------------------- | --------------------- | ---------------------- |
| `userId`              | `ObjectId`            | 보상을 수령한 유저     |
| `eventId`             | `ObjectId`            | 보상이 연결된 이벤트   |
| `eventType`           | `EventType`           | 어떤 유형의 이벤트인지 |
| `rewards`             | `Reward[]`            | 지급된 보상            |
| `claimedAt`           | `Date`                | 보상 지급 시점         |
| `conditionSnapshot`   | `Record<string, any>` | 조건 만족에 대한 증빙  |
| `createdAt/updatedAt` | `Date`                | 자동 기록              |

---
