# Memo Calendar

캘린더와 메모를 통합한 스마트 웹 애플리케이션입니다. AI 기반 날짜 분석 기능으로 메모에서 자동으로 날짜를 추출하여 캘린더 이벤트를 생성할 수 있습니다.

## 주요 기능

### 1. 스마트 메모
- 메모 작성 및 관리 (CRUD)
- 메모 내용에서 자동으로 날짜 추출 (Chrono.js 사용)
- 날짜가 감지되면 캘린더에 추가하는 버튼 자동 생성

### 2. 다중 캘린더 관리
- 여러 종류의 캘린더 생성 가능
  - 개인 (Personal)
  - 업무 (Work)
  - 학교 (School)
  - 자녀 (Family)
  - 건강 (Health)
  - 커스텀 카테고리
- 각 캘린더별 색상 및 타입 설정
- 캘린더 표시/숨김 기능

### 3. 통합 캘린더 뷰
- 여러 캘린더를 한 화면에서 통합 표시
- 선택한 캘린더만 필터링하여 보기
- 레이어 방식으로 캘린더 관리

### 4. 이벤트 관리
- 캘린더 이벤트 생성, 수정, 삭제
- 메모와 연동된 이벤트 추적
- 날짜 범위 검색

## 기술 스택

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- NextAuth.js (인증)

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL

### AI/NLP
- Chrono.js (자연어 날짜 파싱)

## 프로젝트 구조

```
memo-calendar/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth 라우트
│   │   ├── register/              # 회원가입 API
│   │   ├── memos/                 # 메모 CRUD API
│   │   ├── calendars/             # 캘린더 CRUD API
│   │   └── events/                # 이벤트 CRUD API
│   ├── login/                     # 로그인 페이지
│   ├── register/                  # 회원가입 페이지
│   ├── dashboard/                 # 메인 대시보드
│   ├── layout.tsx                 # 루트 레이아웃
│   ├── page.tsx                   # 홈 페이지 (리다이렉트)
│   └── providers.tsx              # NextAuth SessionProvider
├── lib/
│   ├── prisma.ts                  # Prisma 클라이언트
│   ├── auth.ts                    # NextAuth 설정
│   └── dateParser.ts              # 날짜 분석 유틸리티
├── prisma/
│   └── schema.prisma              # 데이터베이스 스키마
└── package.json
```

## 데이터베이스 스키마

### User
사용자 정보 및 인증

### Calendar
캘린더 카테고리 (개인, 업무, 학교 등)

### Memo
사용자 메모 및 자동 추출된 날짜 정보

### Event
캘린더 이벤트 (메모와 연동 가능)

### Account, Session, VerificationToken
NextAuth.js 인증 관련 테이블

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 수정하여 데이터베이스 URL과 인증 설정을 구성합니다:

```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

또는 Prisma Postgres를 사용하는 경우:

```bash
npx prisma dev
npx prisma migrate dev
```

### 4. Prisma Client 생성

```bash
npx prisma generate
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 애플리케이션을 확인합니다.

## API 엔드포인트

### 인증
- `POST /api/register` - 회원가입
- `POST /api/auth/signin` - 로그인
- `POST /api/auth/signout` - 로그아웃

### 메모
- `GET /api/memos` - 모든 메모 조회
- `POST /api/memos` - 메모 생성 (자동 날짜 분석)
- `GET /api/memos/[id]` - 특정 메모 조회
- `PATCH /api/memos/[id]` - 메모 수정
- `DELETE /api/memos/[id]` - 메모 삭제

### 캘린더
- `GET /api/calendars` - 모든 캘린더 조회
- `POST /api/calendars` - 캘린더 생성
- `PATCH /api/calendars/[id]` - 캘린더 수정
- `DELETE /api/calendars/[id]` - 캘린더 삭제

### 이벤트
- `GET /api/events` - 이벤트 조회 (필터링 가능)
- `POST /api/events` - 이벤트 생성
- `PATCH /api/events/[id]` - 이벤트 수정
- `DELETE /api/events/[id]` - 이벤트 삭제

## 향후 개발 계획

### Phase 1 (현재 완료)
- [x] 기본 인증 시스템
- [x] 메모 CRUD API
- [x] 캘린더 CRUD API
- [x] 이벤트 CRUD API
- [x] 날짜 분석 기능
- [x] 기본 UI (로그인, 회원가입, 대시보드)

### Phase 2 (다음 단계)
- [ ] 메모 리스트 및 작성 UI 완성
- [ ] 날짜 감지 시 캘린더 추가 버튼 UI
- [ ] 캘린더 뷰 구현 (월간, 주간, 일간)
- [ ] 다중 캘린더 레이어 뷰
- [ ] 드래그 앤 드롭으로 이벤트 이동
- [ ] 이벤트 상세 정보 모달

### Phase 3 (미래)
- [ ] React Native 모바일 앱
- [ ] 실시간 동기화
- [ ] 공유 캘린더
- [ ] 리마인더 및 알림
- [ ] 반복 이벤트
- [ ] 파일 첨부
- [ ] 검색 기능 강화
- [ ] AI 기반 일정 추천

## 라이선스

MIT
