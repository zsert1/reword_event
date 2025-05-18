# 🧱 Event 서버

- 이 서버는 이벤트 진행 상태 추적 및 보상 지급 시스템을 담당합니다.
  RPG 게임의 다양한 유저 활동(출석, 던전 클리어, 보스 처치 등)을 기반으로 보상을 지급하고,
  운영자는 이를 등록·수정·관리할 수 있습니다.

| 기능                | 메서드 | 경로                    | 권한               |
| ------------------- | ------ | ----------------------- | ------------------ |
| 이벤트 등록         | `POST` | `event/register/event`  | ✅ OPERATOR, ADMIN |
| 이벤트 목록 조회    | `GET`  | `event`                 | ✅ 로그인 유저     |
| 이벤트 상세 조회    | `GET`  | `event/:id`             | ✅ 로그인 유저     |
| 보상 신청           | `POST` | `event/rewards/claim`   | ✅ USER            |
| 내 보상 이력 조회   | `GET`  | `event/rewards/history` | ✅ USER            |
| 전체 보상 이력 조회 | `GET`  | `event/rewards/logs`    | ✅ AUDITOR, ADMIN  |

## 🚦 서버 포트 및 접근

- Base URL: http://localhost:3002

- Gateway를 통해 접근 시: http://localhost:3000/event/...

- JWT 인증 필요: 모든 API는 Gateway에서 JWT를 통해 인증/인가됨 (x-user-id 필요)

## 가능요약

| 기능                         | 메서드 | 경로                           | 권한                        |
| ---------------------------- | ------ | ------------------------------ | --------------------------- |
| 이벤트 등록                  | POST   | /event/register/event          | ✅ OPERATOR, ADMIN          |
| 이벤트 목록 조회             | GET    | /event                         | ✅ 로그인 유저              |
| 이벤트 상세 조회             | GET    | /event/\:id                    | ✅ 로그인 유저              |
| 이벤트 수정                  | PATCH  | /event/\:id                    | ✅ OPERATOR, ADMIN          |
| 이벤트 삭제 (소프트 삭제)    | DELETE | /event/\:id                    | ✅ OPERATOR, ADMIN          |
| 유저 행동 로그 기록          | POST   | /event/log-action              | ✅ 모든 인증 유저           |
| 보상 수령                    | POST   | /event/\:id/claim              | ✅ USER                     |
| 내 보상 이력 조회            | GET    | /event/reward/history          | ✅ USER                     |
| 유저 보상 이력 조회          | GET    | /event/reward/history/\:userId | ✅ ADMIN, OPERATOR, AUDITOR |
| 내 이벤트 진행 상태 조회     | GET    | /event/progress                | ✅ USER                     |
| 특정 이벤트에 대한 진행 조회 | GET    | /event/:eventId/progress       | ✅ USER                     |
| 전체 보상 목록 조회          | GET    | /event/reward                  | ✅ OPERATOR, ADMIN          |
| 보상 단건 조회               | GET    | /event/reward/:id              | ✅ OPERATOR, ADMIN          |
| 보상 생성 + 이벤트 연결      | POST   | /event/reward                  | ✅ OPERATOR, ADMIN          |

## 📄 상세 문서

- [API 명세서](./docs/api.md)
- [스키마 구조](./docs/schema.md)
- [DTO 정의](./docs/dto.md)
