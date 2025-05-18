# reword_event

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

간단한 대응으로는 다음과 같은 안내를 추가하세요:

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

## 📂 서버뱔 문서

- 🔐 [Auth 서버 README](./auth/README.md)
- 🎯 [Event 서버 README](./event/README.md)
- 🛡️ [Gateway 서버 README](./gateway/README.md)

```

```
