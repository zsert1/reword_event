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
