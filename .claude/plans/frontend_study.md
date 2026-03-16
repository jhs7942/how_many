# 프론트엔드 학습 목록

> 몇명이니 프로젝트 construction.md 기준 | 코딩 입문자용

---

## 공통 (백엔드와 함께 학습)

### 1. Git & GitHub
> 코드 변경 이력을 관리하고 협업하는 도구. 모든 개발자의 기본 소양.

| 주제 | 내용 |
|------|------|
| 기본 명령어 | `git init`, `git add`, `git commit`, `git push`, `git pull` |
| 브랜치 | `git branch`, `git checkout`, `git merge` — 기능별로 독립된 작업 공간 |
| 브랜치 전략 | main(배포) / develop(통합) / feature/* / fix/* 구분하는 이유 |
| 커밋 컨벤션 | `feat:`, `fix:`, `style:` 등 — 히스토리를 읽기 쉽게 |
| .gitignore | 올리면 안 되는 파일 (`.env`, `node_modules/`) 제외 |
| GitHub | 원격 저장소, PR(Pull Request), 코드 리뷰 흐름 |

---

### 2. 환경 변수 (.env)
> API 키, 비밀번호 등 코드에 직접 쓰면 안 되는 값을 관리하는 방식.

| 주제 | 내용 |
|------|------|
| .env.local | 로컬 개발용 환경 변수 파일 |
| .env.example | 팀원과 공유하는 변수 이름 목록 (값은 비워둠) |
| NEXT_PUBLIC_ 접두사 | 프론트엔드에서 브라우저에 노출되는 변수와 서버에서만 쓰는 변수 구분 |
| 왜 필요한가 | 환경 변수 없이 API 키를 코드에 직접 쓰면 GitHub에 올라가 보안 사고 발생 |

---

### 3. HTTP & REST API
> 프론트엔드와 백엔드가 대화하는 방식.

| 주제 | 내용 |
|------|------|
| HTTP 메서드 | GET(조회), POST(생성), PUT/PATCH(수정), DELETE(삭제) |
| URL 구조 | `/api/bookmarks/`, `/api/places/{id}/` — 자원 중심으로 설계 |
| 요청/응답 | Request(요청 헤더·바디), Response(상태코드·바디) |
| 상태 코드 | 200(성공), 201(생성됨), 400(잘못된 요청), 401(인증 필요), 404(없음), 500(서버 오류) |
| JSON | 프론트-백엔드가 데이터를 주고받는 형식 |

---

### 4. 인증 (JWT & OAuth)
> 로그인 상태를 유지하고 "이 사람이 맞다"를 증명하는 방식.

| 주제 | 내용 |
|------|------|
| 세션 vs JWT | 세션은 서버가 기억, JWT는 토큰 자체에 정보 포함 |
| Access Token | 짧은 유효기간(15분~1시간), API 요청 시 헤더에 포함 |
| Refresh Token | 긴 유효기간, Access Token 만료 시 재발급에 사용 |
| OAuth | 카카오/구글 계정으로 로그인 — 직접 비밀번호 관리 없이 인증 위임 |
| Authorization 헤더 | `Authorization: Bearer {token}` — API 요청 시 내가 누구인지 증명 |

---

## 프론트엔드 전용

### 5. HTML + CSS 기초
> 모든 웹 개발의 출발점. 반드시 먼저 학습.

| 주제 | 내용 |
|------|------|
| HTML 시맨틱 태그 | `<header>`, `<main>`, `<section>`, `<button>` 등 의미 있는 태그 사용 |
| CSS Box Model | margin, padding, border, width/height 관계 |
| Flexbox | 요소를 가로/세로로 정렬하는 핵심 레이아웃 방식 |
| CSS Grid | 격자 형태의 복잡한 레이아웃 |
| 반응형 | `@media` 쿼리, 모바일 375px 기준 설계 |
| CSS 변수 | `--color-primary: #8B9D77` — 디자인 토큰으로 활용 |

---

### 6. JavaScript 기초
> 웹을 동적으로 만드는 언어. React 이전에 반드시 학습.

| 주제 | 내용 |
|------|------|
| 변수 | `const`, `let` 차이, `var` 쓰지 않는 이유 |
| 함수 | 일반 함수 vs 화살표 함수 (`() => {}`) |
| 배열 메서드 | `map`, `filter`, `find`, `reduce` — React에서 매우 자주 사용 |
| 객체 | 구조분해할당 (`const { name, age } = user`) |
| 비동기 | Promise, `async/await`, `fetch` API |
| 모듈 | `import` / `export` — 파일 간 코드 공유 |
| DOM 조작 | 이벤트 리스너, 클릭 핸들러 (React 이전 개념으로 이해용) |

---

### 7. TypeScript
> JavaScript에 타입을 추가한 언어. 실수를 미리 잡아줌.

| 주제 | 내용 |
|------|------|
| 기본 타입 | `string`, `number`, `boolean`, `null`, `undefined` |
| 인터페이스 | `interface Place { id: string; name: string }` — 객체 구조 정의 |
| 타입 별칭 | `type GroupSize = '1-2' \| '3-5' \| '6+'` — 특정 값만 허용 |
| 제네릭 | `Array<Place>`, `Promise<User>` — 타입을 매개변수처럼 사용 |
| `any` 금지 | any 쓰면 TypeScript의 의미가 없어짐 → 정확한 타입 정의 연습 |
| 선택 속성 | `phone?: string` — 있어도 되고 없어도 되는 필드 |

---

### 8. React 기초
> Next.js의 기반. 컴포넌트 단위로 UI를 만드는 라이브러리.

| 주제 | 내용 |
|------|------|
| 컴포넌트 | UI를 재사용 가능한 조각으로 분리하는 개념 |
| JSX | HTML처럼 생겼지만 JavaScript 안에서 쓰는 문법 |
| Props | 부모 → 자식 컴포넌트로 데이터 전달 |
| State (`useState`) | 컴포넌트 안에서 변하는 데이터 관리 |
| Effect (`useEffect`) | 컴포넌트 마운트/언마운트/의존값 변경 시 실행 |
| 조건부 렌더링 | `{isLoading && <Skeleton />}` |
| 리스트 렌더링 | `{places.map(place => <PlaceCard key={place.id} />)}` |
| 커스텀 훅 | `useBookmark`, `useCardFlip` 등 로직을 재사용 가능하게 분리 |

---

### 9. Next.js (App Router)
> React 기반 풀스택 프레임워크. 이 프로젝트의 프론트엔드 핵심.

| 주제 | 내용 |
|------|------|
| 파일 기반 라우팅 | `app/home/page.tsx` 파일을 만들면 `/home` 경로 자동 생성 |
| 레이아웃 | `layout.tsx` — 여러 페이지에 공통으로 감싸는 틀 (헤더, 네비 등) |
| 동적 라우트 | `place/[id]/page.tsx` — URL의 id 값을 변수로 받음 |
| Route Groups | `(auth)/`, `(main)/` — URL에 영향 없이 폴더로 그룹화 |
| Server Component | 서버에서 렌더링, JS 번들 미포함 (기본값) |
| Client Component | `'use client'` 선언, 브라우저에서 실행, 이벤트/상태 사용 가능 |
| Route Handler | `app/api/*/route.ts` — Next.js 안의 API 엔드포인트 |
| middleware.ts | 페이지 진입 전 실행 — 로그인 여부 체크, 리다이렉트 |
| next/image | 이미지 자동 최적화 (WebP 변환, lazy load) |
| next/font | 웹폰트 최적화 (CLS 방지) |
| next/script | 외부 스크립트 로드 타이밍 제어 |
| Metadata API | `export const metadata` — OG 태그, 타이틀 설정 |

---

### 10. Tailwind CSS
> 클래스 이름으로 스타일을 바로 적용하는 CSS 프레임워크.

| 주제 | 내용 |
|------|------|
| 유틸리티 클래스 | `flex`, `items-center`, `p-4`, `text-lg` 등 클래스 = 스타일 1줄 |
| 반응형 접두사 | `md:flex-row` — md 크기 이상일 때만 적용 |
| 상태 접두사 | `hover:bg-olive`, `focus:ring-2` |
| 커스텀 토큰 | `tailwind.config.ts`에서 `cream`, `beige`, `olive`, `warmGray` 색상 등록 |
| clsx + tailwind-merge | 조건부 클래스 조합 시 충돌 방지 유틸 |
| 디자인 시스템 | 색상·간격·폰트를 변수화해 일관성 유지 |

---

### 11. 상태 관리
> 여러 컴포넌트가 공유하는 데이터를 어디서 관리할지.

#### Zustand (클라이언트 상태)
| 주제 | 내용 |
|------|------|
| 전역 상태 | `useState`는 컴포넌트 안에만, Zustand는 어디서든 접근 가능 |
| 스토어 | `useSearchStore` — 검색 조건 (인원·지역·무드) 저장 |
| persist | `localStorage`에 자동 동기화 — 새로고침해도 유지 |
| 언제 쓰나 | 로그인 상태, 검색 조건, 온보딩 완료 여부 등 UI 상태 |

#### TanStack Query (서버 상태)
| 주제 | 내용 |
|------|------|
| useQuery | 데이터 가져오기 + 로딩/에러 상태 자동 관리 |
| useMutation | 데이터 생성/수정/삭제 |
| queryKey | 캐시 식별자 — `['places', condition]` |
| staleTime | 데이터를 신선하다고 볼 시간 — 재요청 빈도 제어 |
| Optimistic Update | 서버 응답 전 UI 먼저 반영, 실패 시 롤백 |
| useQueries | 여러 요청 병렬 실행 |
| 언제 쓰나 | API에서 가져오는 데이터 (장소 목록, 북마크, 검색 이력) |

---

### 12. 폼 & 유효성 검사
> 사용자 입력을 받고, 잘못된 입력을 미리 걸러내는 방법.

| 주제 | 내용 |
|------|------|
| React Hook Form | 폼 상태 관리 — `register`, `handleSubmit`, `formState` |
| Zod | 스키마 기반 유효성 검사 — `z.number().min(0).max(100000)` |
| 두 개 함께 | `zodResolver`로 연결 — 폼 제출 시 자동 검증 |
| 적용 화면 | 가격대 입력 필드 (최소/최대 금액), 이메일 로그인 |

---

### 13. 인증 (NextAuth.js)
> 소셜 로그인(카카오, 구글)과 세션 관리를 쉽게 처리해주는 라이브러리.

| 주제 | 내용 |
|------|------|
| Provider | 카카오, 구글, 이메일 로그인 설정 |
| 콜백 | `signIn`, `jwt`, `session` — 로그인 후 처리 로직 |
| useSession | 현재 로그인 상태와 사용자 정보 조회 |
| middleware | 특정 경로(마이페이지) 비로그인 접근 차단 |
| Django 연동 | NextAuth 로그인 완료 후 Django에 JWT 발급 요청 |

---

### 14. 애니메이션 (Framer Motion)
> React에서 부드러운 애니메이션을 쉽게 구현하는 라이브러리.

| 주제 | 내용 |
|------|------|
| motion 컴포넌트 | `<motion.div animate={{ opacity: 1, y: 0 }}>` |
| variants | 애니메이션 상태를 이름으로 정의해 재사용 |
| AnimatePresence | 컴포넌트가 사라질 때도 애니메이션 적용 |
| 페이지 트랜지션 | 화면 전환 시 슬라이드 효과 |
| transform/opacity 원칙 | GPU 가속 속성만 사용 — 인앱브라우저 성능 주의 |
| useReducedMotion | 저사양 기기 / 접근성 설정 대응 |
| dynamic import | 무거운 애니메이션 컴포넌트는 필요 시에만 로드 |

---

### 15. 성능 최적화
> study.md 파일 참고. 핵심만 요약.

| 주제 | 내용 |
|------|------|
| LCP / CLS / INP | Core Web Vitals — 성능 측정 지표 |
| next/image | 이미지 WebP 변환 + lazy load → LCP 개선 |
| next/font/local | 폰트 교체 없는 로드 → CLS 방지 |
| Dynamic import | 필요한 시점에만 JS 로드 → 번들 감소 |
| React.memo + useMemo | 불필요한 리렌더링 방지 |
| Suspense | 느린 데이터를 기다리는 동안 나머지 UI 먼저 표시 |
| Optimistic Update | 클릭 즉시 UI 반영 → 체감 속도 향상 |

---

### 16. 외부 SDK 연동
> 서드파티 서비스를 프론트엔드에서 사용하는 방법.

| 주제 | 내용 |
|------|------|
| Kakao Maps SDK | 지도 표시, 마커 찍기 |
| Kakao JS SDK | `sendDefault()` — 카카오톡 공유 |
| SDK 초기화 | `window.Kakao.init(key)` — 앱 키로 초기화 |
| lazy load | `next/script strategy="lazyOnload"` — 필요 시점에 로드 |
| 폴백 처리 | SDK 로드 실패 시 클립보드 복사로 대체 |
| 인앱브라우저 감지 | UA(User-Agent) 문자열로 카카오톡 내부 여부 확인 |

---

### 17. 배포 (Vercel)
> 프론트엔드 코드를 인터넷에 올리는 방법.

| 주제 | 내용 |
|------|------|
| Vercel 연결 | GitHub 저장소 연결 → push 시 자동 배포 |
| Preview 배포 | `develop` 브랜치 → 임시 URL 자동 생성 |
| 환경 변수 설정 | Vercel 대시보드에서 `.env` 값 등록 |
| 도메인 | 기본 제공 도메인 또는 커스텀 도메인 연결 |
| Edge Cache | CDN에서 정적 응답 캐싱 → 응답 속도 향상 |

---

## 학습 순서 추천

```
1단계 (기초)
  HTML + CSS → JavaScript → TypeScript 기초

2단계 (React)
  React 기초 (컴포넌트·상태·이벤트) → 커스텀 훅

3단계 (Next.js)
  Next.js App Router → 파일 라우팅 → Server/Client Component

4단계 (스타일)
  Tailwind CSS → 디자인 토큰 → 반응형

5단계 (데이터)
  HTTP/REST → TanStack Query → Zustand

6단계 (심화)
  NextAuth → Framer Motion → 성능 최적화 → 배포
```
