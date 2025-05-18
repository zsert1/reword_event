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
