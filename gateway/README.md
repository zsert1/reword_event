# 🧱 gateway 서버 

| 구성 요소    | 파일                             | 역할                         |
| -------- | ------------------------------ | -------------------------- |
| ✅ JWT 검증 | `jwt.strategy.ts`              | JWT에서 유저 정보 추출             |
| ✅ 인증 처리  | `@UseGuards(AuthGuard('jwt'))` | 유효한 JWT인지 확인               |
| ✅ 역할 검사  | `roles.guard.ts`               | `@Roles()`로 명시된 권한이 있는지 검사 |
| ✅ 데코레이터  | `roles.decorator.ts`           | `@Roles('ADMIN')` 등 선언 가능  |
