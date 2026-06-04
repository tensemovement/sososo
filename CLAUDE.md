# sososo

> ⚠️ 이 프로젝트는 최신 Next.js(16.x)를 사용한다. API/규약/파일 구조가 학습 데이터와 다를 수 있다.
> 코드 작성 전 `node_modules/next/dist/docs/` 의 관련 가이드를 확인하고 deprecation 경고를 따른다. (자세한 내용은 `@AGENTS.md`)

## 기술 스택

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: TailwindCSS v4 + shadcn/ui
- **Icons**: lucide-react, react-icons
- **Validation**: Zod
- **Auth**: 없음
- **State**: Zustand
- **Date**: date-fns
- **Test**: Vitest + Testing Library
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions
- **Env**: .env.local

## 프로젝트 구조

```
src/
├── app/             # App Router (페이지, API 라우트)
├── components/      # 공유 컴포넌트
│   └── ui/          # shadcn/ui 컴포넌트
├── hooks/           # 커스텀 훅
├── lib/             # 유틸리티
│   └── validations/ # Zod 스키마
├── services/        # 비즈니스 로직 계층 (Service 패턴)
├── stores/          # 상태관리 스토어 (Zustand)
└── types/           # TypeScript 타입 정의
tests/               # 테스트 코드 (루트 레벨)
├── unit/
└── integration/
```

## 핵심 규칙

### 아키텍처

- 비즈니스 로직은 **Service 패턴**으로 `src/services/` 에 둔다. 컴포넌트/라우트는 서비스를 호출만 한다.
- 현재 DB 가 없어 서비스는 인메모리로 동작한다. DB 도입 시 서비스 계층의 데이터 접근 로직만 교체한다.

### 상태관리 (Zustand)

- 전역 상태는 `src/stores/` 에 `use-*-store.ts` 형태로 정의한다.
- 스토어는 작게 쪼개고, 셀렉터로 필요한 값만 구독한다.

### 테스트 규칙

- 테스트 파일은 루트의 `tests/` 폴더에 작성한다 (src 내부에 두지 않는다).
- 테스트 실행: `npm run test` (단일 실행) / `npm run test:watch` (감시 모드).
- 파일명 패턴: `*.test.ts` 또는 `*.test.tsx`.

### 유효성 검사

- 입력값 검증은 **Zod** 스키마를 사용하고 `src/lib/validations/` 에 정의한다.

### 타입 규칙

- `any` 타입을 사용하지 않는다. `unknown`, 구체적인 타입, 또는 제네릭을 사용한다.
- `catch (e: unknown)` 로 받고, 콜백 파라미터에도 명시적 타입을 부여한다.

### 날짜 처리

- 날짜 작업은 **date-fns** 를 사용한다. `moment.js`, `dayjs` 는 사용하지 않는다.

### 환경변수

- 환경변수는 `.env.local` 에 저장한다 (`.env` 가 아님).
- `.env.example` 은 팀원 공유용 템플릿으로 git 에 커밋한다.
- `.env.local` 은 절대 git 에 커밋하지 않는다.

### 배포

- Vercel 에 배포한다. 환경변수는 Vercel 대시보드에서 설정한다.
- push → GitHub Actions CI 자동 실행 → Vercel 자동 배포.

### 콘텐츠·카피

- 출처 표기 문구는 **"이 소식은 <매체> 보도를 소소.소가 다시 정리한 것입니다."** 로 쓴다.
  "따뜻한 시선으로" 같은 자기수식 표현은 넣지 않는다 (담백하게 재정리 사실만 밝힌다).
  해당 문구는 `src/components/source-attribution.tsx` 에 있다.

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 시작 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint 실행 |
| `npm run test` | 테스트 실행 |
| `npm run test:watch` | 테스트 감시 모드 |
| `npx shadcn@latest add <component>` | shadcn/ui 컴포넌트 추가 |
