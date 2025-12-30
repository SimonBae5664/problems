# PostgreSQL 함수 기반 이메일 인증 시스템

이 프로젝트는 PostgreSQL의 고급 기능을 활용하여 이메일 인증 시스템을 구현합니다.

## 구현된 PostgreSQL 기능

### 1. 함수 (Functions)

#### `generate_verification_code()`
- **기능**: 6자리 랜덤 숫자 코드 생성
- **반환**: TEXT (6자리 숫자)
- **사용**: 코드 생성 시 자동 호출

#### `check_resend_limit(p_user_id TEXT)`
- **기능**: 재전송 제한 확인 (5분당 3회)
- **반환**: BOOLEAN
- **사용**: 코드 생성 전 재전송 제한 확인

#### `create_verification_code(p_user_id TEXT)`
- **기능**: 인증 코드 생성 및 저장 (재전송 제한 포함)
- **반환**: TEXT (생성된 코드)
- **에러**: 재전송 제한 초과 시 예외 발생

#### `verify_email_code(p_code TEXT, p_email TEXT)`
- **기능**: 코드 검증 및 사용자 인증 완료 처리
- **반환**: JSONB `{success: boolean, message: string}`
- **처리 내용**:
  - 코드 유효성 검사
  - 만료 시간 확인
  - 시도 횟수 확인 및 증가
  - 사용자 이메일 인증 완료 처리

#### `cleanup_expired_verification_codes()`
- **기능**: 만료된 인증 코드 자동 삭제
- **반환**: INTEGER (삭제된 레코드 수)
- **사용**: 트리거 또는 수동 실행

### 2. 트리거 (Triggers)

#### `cleanup_expired_codes_trigger`
- **테이블**: `EmailVerification`
- **이벤트**: AFTER INSERT OR UPDATE
- **기능**: INSERT/UPDATE 시 만료된 코드 자동 정리
- **효과**: 데이터베이스 레벨에서 자동으로 오래된 데이터 정리

### 3. 인덱스 최적화

- `EmailVerification_userId_createdAt_idx`: 사용자별 최근 코드 조회 최적화
- `EmailVerification_expiresAt_idx`: 만료된 코드 조회 최적화 (부분 인덱스)

## 마이그레이션 실행

```bash
cd backend
npm run prisma:migrate
```

마이그레이션 이름: `add_postgresql_functions`

## 사용 방법

### 코드 생성
```typescript
// PostgreSQL 함수를 통해 자동으로 생성 및 저장
const code = await EmailService.createVerificationCode(userId);
```

### 코드 검증
```typescript
// PostgreSQL 함수를 통해 검증 및 인증 처리
const result = await EmailService.verifyCode(code, email);
```

### 만료된 코드 정리 (수동)
```typescript
// 필요시 수동으로 실행 가능
const deletedCount = await EmailService.cleanupExpiredCodes();
```

## 장점

1. **성능 향상**: 데이터베이스 레벨에서 처리하여 네트워크 왕복 감소
2. **원자성 보장**: 트랜잭션 내에서 모든 작업이 원자적으로 처리
3. **자동 정리**: 트리거를 통해 만료된 코드 자동 삭제
4. **보안 강화**: 재전송 제한이 데이터베이스 레벨에서 강제됨
5. **일관성**: 모든 로직이 데이터베이스에 집중되어 일관성 유지

## 주의사항

- Supabase는 PostgreSQL 확장 기능을 지원하지만, 일부 제한이 있을 수 있습니다
- 트리거는 성능에 영향을 줄 수 있으므로 모니터링이 필요합니다
- 함수는 Prisma 스키마에 반영되지 않으므로, 마이그레이션 파일에서 관리해야 합니다

## Supabase Cron Job 설정 (선택사항)

만료된 코드를 주기적으로 정리하려면 Supabase Cron Job을 설정할 수 있습니다:

1. Supabase 대시보드 > Database > Cron Jobs
2. 새 Cron Job 생성:
   - Schedule: `*/10 * * * *` (10분마다)
   - SQL: `SELECT cleanup_expired_verification_codes();`

