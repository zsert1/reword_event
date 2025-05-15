| 기능              | 설명                                           |
| --------------- | -------------------------------------------- |
| **유저 등록**       | username + password로 회원가입(0)                    |
| **로그인**         | 로그인 성공 시 JWT 발급(0)                              |
| **역할(Role) 관리** | USER / OPERATOR / AUDITOR / ADMIN 중 1개 이상 할당 |
| **JWT 인증**      | `@nestjs/passport`, `AuthGuard` 사용           |
| **Role 기반 인가**  | `RolesGuard`로 접근 제어                          |
| **테스트 코드 작성**   | 회원가입, 로그인, Role 가드 테스트     |

