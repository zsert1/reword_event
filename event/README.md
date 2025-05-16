# 🧱 Event 서버

| 기능                | 메서드 | 경로               | 권한               |
| ------------------- | ------ | ------------------ | ------------------ |
| 이벤트 등록         | `POST` | `/events`          | ✅ OPERATOR, ADMIN |
| 이벤트 목록 조회    | `GET`  | `/events`          | ✅ 로그인 유저     |
| 이벤트 상세 조회    | `GET`  | `/events/:id`      | ✅ 로그인 유저     |
| 보상 신청           | `POST` | `/rewards/claim`   | ✅ USER            |
| 내 보상 이력 조회   | `GET`  | `/rewards/history` | ✅ USER            |
| 전체 보상 이력 조회 | `GET`  | `/rewards/logs`    | ✅ AUDITOR, ADMIN  |

## 스키마 구조

### 📌 Event (이벤트)

| 필드명        | 타입     | 설명                    |
| ------------- | -------- | ----------------------- |
| `_id`         | ObjectId | MongoDB 자동 생성 ID    |
| `title`       | string   | 이벤트 제목             |
| `description` | string   | 이벤트 설명 (선택)      |
| `startDate`   | Date     | 시작일                  |
| `endDate`     | Date     | 종료일                  |
| `eventType`   | enum     | 이벤트 유형 (아래 참고) |
| `condition`   | object   | 조건 값 (타입별로 다름) |
| `isActive`    | boolean  | 현재 진행 중 여부       |
| `createdAt`   | Date     | 생성일 (자동)           |
| `updatedAt`   | Date     | 수정일 (자동)           |

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

| 필드명        | 타입     | 설명                  |
| ------------- | -------- | --------------------- |
| `_id`         | ObjectId | MongoDB 자동 생성 ID  |
| `eventId`     | string   | 연관된 이벤트 ID      |
| `rewardType`  | enum     | 보상 유형 (아래 참고) |
| `value`       | string   | 실제 보상 내용        |
| `description` | string   | 보상 설명 (선택)      |
| `createdAt`   | Date     | 생성일 (자동)         |
| `updatedAt`   | Date     | 수정일 (자동)         |

#### 🎁 rewardType 종류

- `POINT`: 게임 포인트 (예: 100)
- `ITEM`: 아이템 이름 (예: 엘릭서 3개)
- `COUPON`: 쿠폰 코드 (예: EXPBOOST_20)
- `EXP`: 경험치 (예: 5000)
- `CURRENCY`: 게임 내 재화 (예: 10000 메소)
