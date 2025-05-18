# reword_event

> RPG 이벤트 기반 보상 시스템 – NestJS 기반 MSA 아키텍처

## 🚀 실행 방법 (가장 빠른 테스트 방법)

### 1. 프로젝트 루트에서 아래 명령어 실행

```bash
docker-compose up --build
```

### 2. !!MongoDB Replica Set 초기화 (최초 1회만)

```
docker exec -it mongodb mongosh
rs.initiate()
```

## 🧩 설계 설명 및 구현 의도

### 1. 이벤트 및 보상 설계

- RPG 게임의 다양한 이벤트 시나리오를 반영하기 위해 `EventType` Enum을 도입하여 `LOGIN_REWARD`, `LEVEL_REACHED`, `BOSS_KILL`, `STREAK_LOGIN` 등 이벤트 타입을 유연하게 확장할 수 있도록 설계했습니다.
- 이벤트와 보상은 N:N 관계로, 별도의 매핑 테이블(`EventRewardMapping`)을 구성하여 이벤트에 여러 보상을 연결하거나 재사용 가능한 구조로 만들었습니다.

### 2. 조건 검증 방식

- 각 이벤트 타입에 따라 다른 조건 검증이 필요한 점을 고려해 `checkCondition()` 메서드에 `switch-case` 기반 분기 처리를 적용했습니다.
- 조건 비교는 유저 행동 로그의 `metadata`를 기반으로 실행되며, 예를 들어 `BOSS_KILL`은 `bossId`, `STREAK_LOGIN`은 `currentStreak`를 비교합니다.

### 3. API 구조 및 인증 처리

- 인증/인가는 Gateway 서버에서 JWT를 검증하고, `x-user-id` 헤더로 내부 서비스에 유저 정보를 전달하는 구조를 사용했습니다.
- 인증 로직과 비즈니스 로직을 명확히 분리하여 확장성과 테스트 용이성을 높였습니다.

### 4. 이벤트 보상 흐름

1. 유저가 특정 행동을 수행하면 `/event/action` API를 통해 로그가 기록됩니다.
2. 해당 행동이 조건을 충족하는지 실시간으로 검사하고, 조건을 만족하면 `UserEventProgress`를 `COMPLETED`로 업데이트합니다.
3. 사용자가 `/event/:id/claim` API를 호출하면 보상이 지급되고, `UserRewardHistory`에 기록됩니다.

### 5. 트랜잭션 사용 이유

- 이벤트 생성 및 보상 생성, 매핑 등록, 로그 기록은 모두 하나의 트랜잭션으로 처리되어야 합니다.
- MongoDB 트랜잭션 사용을 위해 `Replica Set` 모드에서 실행되며, NestJS의 `startSession()` + `commitTransaction()` 구조를 도입했습니다.

---

## 🌱 Seed Script 설명 (자동 초기화)

### 목적

**즉시 기능 테스트**를 진행할 수 있도록 사용자, 이벤트, 보상, 행동 이력을 도커 실행 시 자동으로 삽입합니다.

### 구성

| 서버       | Seed 파일       | 설명                                        |
| ---------- | --------------- | ------------------------------------------- |
| Auth 서버  | `user-seed.ts`  | 유저 및 관리자 계정 사전 등록               |
| Event 서버 | `event-seed.ts` | 이벤트 3종, 보상, 매핑, 유저 행동 로그 삽입 |

---

### 주요 데이터 흐름

1. **유저 데이터**

   - `_id` 명시 지정 (ObjectId) → 이벤트 서버에서 참조 가능
   - `ADMIN`, `USER` 권한 계정 구분 포함

2. **이벤트 및 보상**

   - `EventService.createEvent()` 내부 로직을 그대로 사용
   - `userIds` 배열을 통해 유저별 `UserEventProgress` 자동 생성
   - 보상은 `newRewards`, `existingRewardIds`를 혼합 지원

3. **행동 로그**
   - 예: user1이 `LOGIN_REWARD` 조건을 충족하도록 `logUserAction`으로 미리 삽입
   - `updateProgressIfCompleted()` 호출되어 상태 자동 반영

---

### 초기화 결과 예시

- `/event` 조회 시 미리 생성된 3개의 이벤트 확인 가능
- `/event/:id/progress` 또는 `/event/:id/claim` 테스트 시, 각 유저별 진행 상태 확인 가능
- `/event/rewards/history` 호출 시, 이미 보상 받은 이력 확인 가능

---

### 기타

- `docker-compose up` 실행 후 자동으로 seed가 실행되도록 내부 모듈에서 `onModuleInit` 또는 CLI 명령어(`seed:run`) 등으로 구성
- MongoDB Replica Set 초기화 안내도 함께 포함되어 있음

## 🧠 설계 시 고려한 점 요약

### 1. 유연한 이벤트 타입 확장

- 조건 기반으로 다양한 이벤트를 처리할 수 있어야 했기 때문에 switch-case 기반의 메타데이터 조건 분기 구조를 설계함

### 2. 인증과 책임 분리

- 인증은 Gateway, 비즈니스는 내부 서비스로 나누어 개발하며 역할과 책임을 명확히 나눔

### 3. 유저 행동 기반 실시간 이벤트 상태 전이

- 단순 기록이 아닌 행동과 이벤트 조건이 일치하는 경우에만 상태를 `COMPLETED`로 자동 전이되도록 설계

### 4. 초기화 자동화 및 채점 편의성

- docker-compose 실행 후 바로 테스트할 수 있도록 유저/이벤트/보상/행동 로그 자동 삽입

### 5. 트랜잭션 기반 데이터 무결성 보장

- MongoDB는 기본적으로 트랜잭션을 지원하지 않기 때문에 Replica Set 환경을 구성하고 NestJS 세션으로 감싸 트랜잭션 처리

### 프로젝트 실행 환경

Node.js: v18  
NestJS (gateway, auth, event - MSA 구조)  
MongoDB (공통 사용, DB 이름 분리)  
Docker + docker-compose 기반 통합 실행  
| 서버 | 포트 |
| ------- | ------ |
| gateway | `3000` |
| auth | `3001` |
| event | `3002` |

### 디렉토리 구조

event-reward-system/  
├── gateway/ # Gateway Server (포트: 3000)  
├── auth/ # Auth Server (포트: 3001, DB: auth_db)  
├── event/ # Event Server (포트: 3002, DB: event_db)  
├── docker-compose.yml

---

- ### Docker 명령어 정리

---

- **실행** (루트 디렉토리(reword_event)에서 아래 명령어 실행)

```
docker-compose up --build
```

---

- **종료(중지)**

```
# 실행 중인 docker-compose 전체 종료
Ctrl + C
```

- 종료 후 백그라운드 **컨테이너 삭제**

```
docker-compose down
```

- **특정 서버**만 중지(예시 auth 서버)

```

docker stop auth
```

---

- **재시작**(예시 auth 서버)

```
docker restart auth
```

---

- **로그** 확인

```
docker logs auth
docker logs gateway
docker logs event
```

### 🧱 MongoDB 설정

#### 🧩 MongoDB Replica Set 초기 설정 (최초 1회만)

- MongoDB **트랜잭션**을 사용하기 위해 Replica Set 모드로 실행되어야합니다.

1. 컨테이너 실행

```bash
 docker-compose up --build
```

2. Replica Set 초기화 (최초 1회만 실행)

- shell 진입

```bash
docker exec -it mongodb mongosh
```

- 초기화 진행

```bash
rs.initiate()
```

- 정상적으로 초기화되면 다음과 같은 메시지가 출력됩니다:

```json
{ "ok": 1 }
```

3. 정상 여부 확인

```js
rs.status();
```

```json
"stateStr": "PRIMARY"
```

로 표시되면 정상입니다.

1. 🛠 MongoDB Replica Set 재초기화가 필요한 경우 안내 추가

### ❗ MongoDB Replica Set 재초기화가 필요한 경우

간혹 MongoDB가 `AlreadyInitialized`, `InvalidReplicaSetConfig` 오류를 발생시키는 경우가 있습니다.

이럴 땐 다음 명령어로 강제로 수정할 수 있습니다:

```bash
docker exec -it mongodb mongosh
```

```js
cfg = rs.conf();
cfg.members[0].host = "mongodb:27017";
// 반드시 docker-compose 서비스명과 동일해야 합니다.
rs.reconfig(cfg, { force: true });
rs.status(); // "stateStr": "PRIMARY"이면 정상
```

### 💡 이유: 컨테이너가 자동 생성한 호스트명(abc123:27017)으로 레플리카셋이 구성된 경우, mongodb:27017과 불일치하여 MongoDB가 자신이 구성원이 아니라고 판단할 수 있습니다.

### 2. 🧪 `healthcheck` 설정 안내 또는 옵션 제안

MongoDB가 준비되기 전에 Auth/Event 서버가 연결을 시도하면 실패할 수 있습니다.

### 🔄 MongoDB 연결 지연으로 인한 초기 연결 오류 발생 시

간혹 MongoDB가 완전히 초기화되기 전에 다른 서비스(Auth/Event)가 연결을 시도하여 실패할 수 있습니다.

이 경우, 아래 명령어로 각 서버를 개별 재시작하세요:

```bash
docker restart auth
docker restart event
```

---

### ℹ️ 왜 Replica Set이 필요한가요?

MongoDB 트랜잭션, ChangeStream 기능을 사용하려면 `replicaSet` 환경이 필수입니다.

따라서 모든 서버는 아래와 같은 URI 형식으로 MongoDB에 연결합니다:

```js
mongodb://mongodb:27017/<database>?replicaSet=rs0
```

- mongodb: 도커 내 MongoDB 서비스 이름

- <database> 예) auth_db, event_db

- rs0: replica set 이름 (rs.initiate({ \_id: 'rs0', ... })와 일치)

## 🧑‍💼 초기 계정 정보 (Seeded Users)

`docker-compose up --build` 실행 시, 다음과 같은 계정들이 자동으로 생성됩니다.

| 역할 (Role)        | 이메일                                     | 비밀번호       |
| ------------------ | ------------------------------------------ | -------------- |
| 관리자 (ADMIN)     | `admin@example.com`                        | `admin1234`    |
| 운영자 (OPERATOR)  | `operator@example.com`                     | `operator1234` |
| 감사자 (AUDITOR)   | `auditor@example.com`                      | `auditor1234`  |
| 일반 사용자 (USER) | `user1@example.com` ~ `user10@example.com` | `user1234`     |

> 🛡️ 비밀번호는 bcrypt로 해싱되어 저장되며, JWT 로그인 테스트 시 사용 가능합니다.

---

## 📂 서버별 문서

- 🔐 [Auth 서버 README](./auth/README.md)
- 🎯 [Event 서버 README](./event/README.md)
- 🛡️ [Gateway 서버 README](./gateway/README.md)

## 🧪 Postman 테스트 시나리오

### ✅ [1] 로그인

**POST** `/auth/login`

```json
{
  "email": "user1@example.com",
  "password": "user1234"
}
```

### ✅ [2] 이벤트 목록 조회

**GET** `/event`

### ✅ [3] 유저 행동 기록

**POST** `/event/action`

```json
{
  "actionType": "BOSS_KILL",
  "metadata": { "bossId": "dragon_lord" }
}
```

### ✅ [4] 특정 이벤트 참여 상태 확인

**GET** `/event/<eventId>/progress`

### ✅ [5] 보상 지급 요청

**POST** `/event/<eventId>/claim`

### ✅ [6] 보상 이력 조회

**GET** `/event/rewards/history?startDate=Date&endDate=Date`
