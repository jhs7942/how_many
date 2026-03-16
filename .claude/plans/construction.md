# 몇명이니? (HowMany) - 기술 구현 계획

> 마지막 업데이트: 2026-03-12

---

## 전체 아키텍처

```
카카오톡 인앱브라우저
        ↓
  Next.js (Vercel)          ← 프론트엔드 + 소셜 로그인(NextAuth)
        ↓ REST API (JWT)
  Django REST API (Fly.io) ← 비즈니스 로직 + 데이터 영속성
        ↓
  PostgreSQL (Supabase)     ← DB
```

- **프론트엔드**: Next.js → Vercel 배포
- **백엔드**: Django REST Framework → Fly.io 배포
- **DB**: PostgreSQL → Supabase (무료 플랜)
- **인증 흐름**: NextAuth(소셜 OAuth) → Django JWT 발급 → 이후 API 호출 시 헤더 포함

---

## 기술 스택

### 프론트엔드

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js 14 (App Router) + TypeScript (strict) |
| 스타일링 | Tailwind CSS (커스텀 디자인 토큰) |
| 애니메이션 | Framer Motion v11 |
| 상태 관리 | Zustand v4 (클라이언트) + TanStack Query v5 (서버) |
| 폼 검증 | React Hook Form + Zod |
| 인증 | NextAuth.js v5 (카카오·구글·이메일) |
| 지도 | Kakao Maps JavaScript SDK |
| 공유 | Kakao JavaScript SDK (sendDefault) |
| 유틸 | clsx + tailwind-merge, Pretendard 웹폰트 |

### 백엔드

| 항목 | 선택 |
|------|------|
| 프레임워크 | Django 5 + Django REST Framework |
| 인증 | djangorestframework-simplejwt |
| CORS | django-cors-headers |
| DB 연결 | psycopg2-binary |
| 환경 변수 | python-decouple |
| 배포 | Fly.io (gunicorn + whitenoise) |

---

## 인증 흐름

```
1. 사용자가 카카오/구글 로그인 클릭
2. NextAuth가 OAuth 처리
3. NextAuth signIn 콜백에서 Django POST /api/auth/social/ 호출
   → 사용자 생성 또는 조회
   → Django가 JWT(access + refresh) 발급
4. JWT를 NextAuth session에 저장
5. 이후 모든 API 요청: Authorization: Bearer {access_token}
6. access token 만료 시 refresh token으로 재발급
```

---

## 모노레포 폴더 구조

```
how_many/
├── frontend/                        ← Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/
│   │   │   ├── (main)/home/, conditions/, results/, random/, place/[id]/, mypage/
│   │   │   ├── onboarding/
│   │   │   ├── splash/
│   │   │   └── api/auth/[...nextauth]/   ← NextAuth Route Handler만 유지
│   │   ├── components/
│   │   │   ├── ui/          Button, Card, Badge, Input, ProgressDots, EmptyState, Skeleton, BottomNav
│   │   │   ├── layout/      MobileContainer, Header
│   │   │   └── splash/, onboarding/, home/, conditions/, results/, random/, place/, mypage/
│   │   ├── store/
│   │   │   ├── useSearchStore.ts
│   │   │   ├── useUserStore.ts
│   │   │   └── useOnboardingStore.ts
│   │   ├── hooks/           useCardFlip, useGeolocation, usePlaceRecommend, useInAppBrowser
│   │   ├── types/           place.ts, user.ts, search.ts, common.ts
│   │   ├── data/            places.ts (20+개 Mock - MVP용)
│   │   └── lib/             utils.ts (cn), constants.ts, auth.ts, kakao.ts, inAppBrowser.ts, api.ts
│   ├── public/
│   │   └── og-image.png
│   ├── .env.local
│   ├── .env.example
│   ├── next.config.ts
│   └── middleware.ts
│
├── backend/                         ← Django
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── local.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── users/           사용자 모델, JWT 인증 엔드포인트
│   │   ├── places/          장소 데이터 (MVP 이후 실제 DB로 전환)
│   │   ├── bookmarks/       찜한 장소 CRUD
│   │   └── search_history/  최근 검색 이력 CRUD
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── local.txt
│   │   └── production.txt
│   ├── .env
│   ├── .env.example
│   ├── manage.py
│   └── Procfile             ← Fly.io 배포용 (gunicorn)
│
└── .gitignore               ← 루트 공통 gitignore
```

---

## Django API 엔드포인트

```
# 인증
POST   /api/auth/social/         소셜 로그인 → JWT 발급
POST   /api/auth/token/refresh/  access token 재발급

# 북마크
GET    /api/bookmarks/           찜 목록 조회
POST   /api/bookmarks/           찜 추가 { place_id }
DELETE /api/bookmarks/{id}/      찜 삭제

# 방문이력
GET    /api/visits/              방문이력 조회
POST   /api/visits/              방문 표시 { place_id }
DELETE /api/visits/{id}/         방문 표시 취소

# 검색이력
GET    /api/search-history/      최근 검색 이력 조회 (최대 5개)
POST   /api/search-history/      검색 이력 저장
DELETE /api/search-history/{id}/ 검색 이력 삭제

# 장소 (MVP는 Mock, 이후 DB로 전환)
GET    /api/places/              장소 목록 (필터 파라미터)
GET    /api/places/{id}/         장소 상세
GET    /api/places/random/       랜덤 장소
```

---

## 프론트엔드 API 호출 (`src/lib/api.ts`)

```typescript
// Django API base URL
const BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const apiClient = {
  get: (path: string, token?: string) =>
    fetch(`${BASE_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(res => res.json()),

  post: (path: string, body: unknown, token?: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }).then(res => res.json()),
}
```

---

## 타입 정의

### Place 타입 (`frontend/src/types/place.ts`)

```typescript
export interface Place {
  id: string
  name: string
  category: Category
  subCategory?: string
  mood: Mood[]
  groupSize: GroupSize[]
  location: {
    district: string
    city: string
    address: string
    lat: number
    lng: number
  }
  pricePerPerson: number
  priceRange: { min: number; max: number }
  images: string[]
  description: string
  recommendReason: string
  rating: number
  reviewCount: number
  distance?: number
  businessHours: BusinessHours
  reservationUrl?: string
  phone?: string
}

export interface BusinessHours {
  mon?: string
  tue?: string
  wed?: string
  thu?: string
  fri?: string
  sat?: string
  sun?: string
  holiday?: string
  note?: string
}

export type GroupSize = '1-2' | '3-5' | '6+'
export type Mood = 'quiet' | 'lively' | 'view' | 'hip' | 'cozy' | 'premium'
export type Category = 'restaurant' | 'cafe' | 'bar' | 'complex'
export type SortType = 'distance' | 'popular'
export type DislikeCategory = 'karaoke' | 'escape_room' | 'pc_cafe' | 'billiards' | 'bowling'
```

### Search 타입 (`frontend/src/types/search.ts`)

```typescript
export interface SearchCondition {
  groupSize: GroupSize | null
  location: { district: string; city: string } | null
  mood: Mood[]
  category: Category[]
  priceInput: {
    min: number | null
    max: number | null
  }
  dislikeFilter: DislikeCategory[]
  openNow: boolean
}

export interface RecentSearch {
  id: string
  condition: SearchCondition
  savedAt: string
  label: string
}
```

---

## 핵심 상태 관리

### useSearchStore (Zustand)

```typescript
interface SearchStore {
  current: SearchCondition
  recentSearches: RecentSearch[]   // 로그인 시 서버 동기화, 비로그인 시 로컬만

  setGroupSize: (size: GroupSize | null) => void
  setLocation: (location: { district: string; city: string } | null) => void
  setMood: (mood: Mood[]) => void
  setCategory: (category: Category[]) => void
  setPriceInput: (min: number | null, max: number | null) => void
  setDislikeFilter: (items: DislikeCategory[]) => void
  setOpenNow: (value: boolean) => void
  saveRecentSearch: () => void
  applyRecentSearch: (id: string) => void
  clearCurrent: () => void
}
```

### useUserStore

```typescript
interface UserStore {
  user: User | null
  bookmarks: string[]       // 서버 동기화
  visitHistory: string[]    // 서버 동기화

  setUser: (user: User | null) => void
  addBookmark: (id: string) => void
  removeBookmark: (id: string) => void
  isBookmarked: (id: string) => boolean
  addVisitHistory: (id: string) => void
  removeVisitHistory: (id: string) => void
}
```

### useOnboardingStore (localStorage 동기화)

```typescript
interface OnboardingStore {
  isCompleted: boolean
  currentStep: 1 | 2 | 3
  complete: () => void
  setStep: (step: 1 | 2 | 3) => void
}
```

---

## 인앱브라우저(카카오톡) 핵심 고려사항

| 항목 | 내용 |
|------|------|
| Web Share API | 미지원 → Kakao SDK `sendDefault()`로만 처리 |
| 소셜 로그인 리다이렉트 | OAuth 리다이렉트 시 외부 브라우저 이탈 가능 → 이메일 로그인 기본 권장 |
| sessionStorage | 탭 복귀 시 초기화 가능 → localStorage만 사용 |
| 팝업/새 탭 | 차단 가능성 → 네이버 지도 링크는 `<a target="_blank">` 사용 |
| 위치 권한 | 제한적 → 선택 지역(district) 기준으로만 동작 |

- `frontend/src/lib/inAppBrowser.ts` — UA 감지 유틸 (`isKakao()` 등)
- 공유 버튼: Kakao SDK 로드 실패 시 클립보드 복사로 폴백
- OG 메타태그 설정 — 카카오톡 링크 미리보기용

---

## 디자인 토큰

```
cream:    '#FAF7F2'  - 배경
beige:    '#E8DDD0'  - 카드 배경
olive:    '#8B9D77'  - 포인트 컬러
warmGray: '#9E9087'  - 서브텍스트
```

---

## 가격대 필터 UX 설계

```
1인당 예산을 입력해주세요

  최소 금액  [_________ 원]
  최대 금액  [_________ 원]

  빠른 선택:
  ○ ~1만원     ○ 1~2만원
  ○ 2~3만원    ○ 3만원 이상
```

---

## 12개 화면 구성

| # | 화면 | 경로 | 인증 |
|---|------|------|------|
| 1 | 스플래시 | `/splash` | - |
| 2-4 | 온보딩 1~3 | `/onboarding` | - |
| 5 | 로그인/회원가입 | `/(auth)/login` | - |
| 6 | 홈 | `/(main)/home` | 게스트 허용 |
| 7 | 조건 선택 | `/(main)/conditions` | 게스트 허용 |
| 8 | 추천 결과 | `/(main)/results` | 게스트 허용 |
| 9 | 랜덤 결정 | `/(main)/random` | 게스트 허용 |
| 10 | 장소 상세 | `/(main)/place/[id]` | 게스트 허용 |
| 11 | 빈 결과 | results 내부 처리 | 게스트 허용 |
| 12 | 마이페이지 | `/(main)/mypage` | 로그인 필요 |

---

## 라우팅 흐름

```
/ → /splash → /onboarding → /login (skip 가능)
/home → /conditions → /results → /place/[id]
/random (results에서 플로팅 버튼으로 진입)
/mypage (로그인 필요)
```

- `middleware.ts`: 인증 가드 (마이페이지는 로그인 리다이렉트)
- 페이지 트랜지션: Framer Motion AnimatePresence 슬라이드

---

## MVP 확정 기능

| 기능 | 설명 | 인증 |
|------|------|------|
| 북마크(찜) 저장 | 장소 저장 + 마이페이지 찜 목록 (서버 동기화) | 로그인 필요 |
| 방문이력 표시 | "방문 완료" 직접 표시 (서버 동기화) | 로그인 필요 |
| 결과 공유 | Kakao SDK sendDefault → 클립보드 폴백 | 비회원 허용 |
| 정렬 탭 | 거리순/인기순 | 비회원 허용 |
| 가격대 필터 | 라디오 + 직접 입력 (1인당 기준) | 비회원 허용 |
| 불호 필터 | 세부 업종 제외 선택 | 비회원 허용 |
| 현재 영업 중 필터 | 토글 ON/OFF | 비회원 허용 |
| 최근 검색 조건 | 검색 이력 저장 + 홈 원탭 재사용 (서버 동기화) | 로그인 필요 |
| 영업시간 표시 | 요일별 + 영업중 뱃지 | 비회원 허용 |
| 하단 네비게이션 | 홈 / 마이페이지 탭 | - |

---

## 구현 단계

1. **Phase 1** - 모노레포 세팅 (Next.js init, Django init, Tailwind 토큰, Kakao SDK 로드)
2. **Phase 2** - Django 앱 구조 + DB 모델 + JWT 인증 엔드포인트
3. **Phase 3** - 타입 정의 + Mock 데이터 20개 + Django 장소 API 연결
4. **Phase 4** - 스플래시 + 온보딩 (Framer Motion 슬라이드)
5. **Phase 5** - 인증 화면 (NextAuth + Django JWT 연동 + 건너뛰기)
6. **Phase 6** - 홈 + 조건 선택 (가격대·불호필터·영업중 토글, Zustand 연동)
7. **Phase 7** - 추천 결과 (정렬 탭 + Kakao 공유) + 빈 결과 (TanStack Query)
8. **Phase 8** - 랜덤 결정 (FlipCard) + 장소 상세 (영업시간·북마크·방문표시) + 마이페이지
9. **Phase 9** - 페이지 트랜지션, Skeleton UI, 에러 상태 UI, OG 메타태그, 반응형 최종 점검
10. **Phase 10** - Vercel(프론트) + Fly.io(백엔드) + Supabase(DB) 배포

---

## Git 설정

### .gitignore (루트)

```
# 공통
.DS_Store
*.log

# 프론트엔드
frontend/.env*.local
frontend/.env.production
frontend/node_modules/
frontend/.next/
frontend/out/

# 백엔드
backend/.env
backend/__pycache__/
backend/*.pyc
backend/.venv/
backend/staticfiles/
```

### 브랜치 전략

```
main         - 프로덕션 배포 (보호)
develop      - 통합 개발
feature/*    - 기능 단위 (예: feature/conditions-filter)
fix/*        - 버그 수정 (예: fix/jwt-refresh)
```

### 커밋 컨벤션

```
feat:     새로운 기능
fix:      버그 수정
style:    UI/스타일 변경
refactor: 리팩터링
chore:    설정·패키지 등 기타
docs:     문서 수정

예시: feat: 조건 선택 화면 불호 필터 추가
```

---

## 환경 변수

### 프론트엔드 (`frontend/.env.local`)

```bash
# Django API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Kakao
NEXT_PUBLIC_KAKAO_JS_KEY=
NEXT_PUBLIC_KAKAO_MAP_KEY=

# NextAuth
NEXTAUTH_SECRET=           # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 백엔드 (`backend/.env`)

```bash
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://...   # Supabase connection string
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 배포 설정

### 프론트엔드 — Vercel

- GitHub `main` → Vercel 자동 배포
- `develop` → Preview 배포
- 환경 변수: `NEXT_PUBLIC_API_URL`에 Fly.io 배포 URL 등록

### 백엔드 — Fly.io

```toml
# backend/fly.toml (fly launch 자동 생성)
app = "howmany-api"
primary_region = "nrt"  # 도쿄 (한국 사용자 기준 가장 가까운 리전)

[build]

[http_service]
  internal_port = 8000
  force_https = true

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

```
# backend/Procfile
web: gunicorn config.wsgi --log-file -
```

- `fly launch` 명령 한 번으로 대부분 자동 설정
- 환경 변수: `fly secrets set SECRET_KEY=... DATABASE_URL=... CORS_ALLOWED_ORIGINS=...`
- `DEBUG=False`, `ALLOWED_HOSTS`에 Fly.io 도메인 추가
- 무료 플랜: 256MB RAM × 1 VM, **sleep 없음**
- 트래픽 증가 시 `fly scale memory 512` 또는 `fly scale count 2`로 스케일업

### 배포 단계별 확장 경로

| 단계 | 백엔드 | 비용 | 기준 |
|------|--------|------|------|
| MVP | Fly.io 무료 | $0 | 초기 운영 |
| 성장 | Fly.io 유료 | $5~20/월 | 트래픽 증가, RAM 부족 |
| 확장 | AWS ECS / NCP | $30~/월 | 실사용자 수만 명, 팀 규모화 |

### 기능 추가 시 인프라 확장 계획

| 추가 기능 | 필요 인프라 |
|-----------|------------|
| 실시간 알림 | Redis + Django Channels (WebSocket) |
| 이미지 업로드 | AWS S3 또는 Cloudflare R2 |
| 검색 고도화 | Elasticsearch 또는 Algolia |
| 트래픽 급증 대비 | Redis 캐싱 레이어 (django-redis) |
| 한국 사용자 최적화 | NCP (네이버 클라우드) 이전 검토 |

### DB — Supabase

- Supabase 프로젝트 생성 → Connection String을 `DATABASE_URL`로 사용
- Django `migrate`로 테이블 자동 생성
- 무료 플랜 (500MB, MVP 충분)

### OG 메타태그 (`frontend/src/app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: '몇명이니?',
  description: '인원 수·지역·분위기로 모임 장소를 빠르게 결정하세요',
  openGraph: {
    title: '몇명이니?',
    description: '인원 수·지역·분위기로 모임 장소를 빠르게 결정하세요',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}
```

---

## 프론트엔드 성능 최적화

### 번들 크기 최적화

**Framer Motion dynamic import** — 무거운 컴포넌트는 필요한 화면에서만 로드
```typescript
// app/random/page.tsx
const FlipCard = dynamic(() => import('@/components/random/FlipCard'), { ssr: false })

// app/onboarding/page.tsx
const OnboardingSlide = dynamic(() => import('@/components/onboarding/OnboardingSlide'), { ssr: false })
```

**Kakao SDK lazy load** — 지도·공유가 필요한 시점에만 로드
```typescript
// lib/kakao.ts
export const loadKakaoSDK = () => {
  return new Promise<void>((resolve) => {
    if (window.Kakao?.isInitialized()) return resolve()
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.onload = () => { window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY); resolve() }
    document.head.appendChild(script)
  })
}
```

---

### 이미지 최적화 (LCP)

- 장소 카드 썸네일 / 히어로 이미지 → `next/image` 필수 (WebP 자동 변환 + 사이즈 최적화)
- 장소 상세 히어로: `priority` 속성으로 즉시 로드
- 카드 썸네일: `placeholder="blur"` + `sizes` 속성으로 CLS 방지

```tsx
// 장소 상세 히어로 이미지 (Above the fold → priority)
<Image src={place.images[0]} alt={place.name} fill priority
  sizes="100vw" />

// 장소 카드 썸네일 (lazy load + blur placeholder)
<Image src={place.images[0]} alt={place.name} fill
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur" blurDataURL="data:image/png;base64,..." />
```

---

### 웹폰트 최적화 (CLS)

CDN 방식 사용 시 폰트 교체로 레이아웃 밀림 발생 → `next/font/local`로 대체
```typescript
// app/layout.tsx
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
})
```
- `PretendardVariable.woff2` (가변 폰트 단일 파일) → `public/fonts/`에 포함

---

### TanStack Query 캐싱 전략

장소 데이터는 자주 변경되지 않으므로 staleTime을 적극 활용
```typescript
// 장소 목록 (10분 캐시)
useQuery({ queryKey: ['places', condition], staleTime: 10 * 60 * 1000 })

// 장소 상세 (30분 캐시)
useQuery({ queryKey: ['place', id], staleTime: 30 * 60 * 1000 })

// 북마크 (실시간성 중요 → 캐시 없음)
useQuery({ queryKey: ['bookmarks'], staleTime: 0 })

// 검색이력 (5분 캐시)
useQuery({ queryKey: ['searchHistory'], staleTime: 5 * 60 * 1000 })
```

---

### 애니메이션 최적화 (인앱브라우저)

카카오톡 인앱브라우저는 메모리 제한이 있어 무거운 애니메이션 주의
- `transform`, `opacity` 기반만 사용 (GPU 가속) — `width`, `height`, `top` 변경 금지
- `prefers-reduced-motion` 대응 (접근성 + 저사양 기기)

```typescript
// hooks/useReducedMotion.ts
const shouldReduce = useReducedMotion()

const variants = {
  hidden: { opacity: 0, y: shouldReduce ? 0 : 20 },
  visible: { opacity: 1, y: 0 },
}
```

---

### React Server Components 활용

Server Component는 JS 번들에 포함되지 않아 클라이언트로 전달되는 JS를 근본적으로 줄임

| Server Component (기본) | Client Component (`'use client'`) |
|------------------------|----------------------------------|
| 장소 상세 레이아웃 | 북마크 버튼 |
| 홈 정적 섹션 | 조건 선택 폼 |
| OG 메타데이터 | Framer Motion 애니메이션 |

```typescript
// Server Component — 서버에서 직접 fetch, JS 번들 미포함
async function PlaceDetailPage({ params }: { params: { id: string } }) {
  const place = await fetchPlace(params.id)
  return <PlaceDetail place={place} />
}

// Client Component — 인터랙션 필요한 것만 분리
'use client'
function BookmarkButton({ placeId }: { placeId: string }) { ... }
```

---

### next/script로 Kakao SDK 관리

`document.createElement` 방식 대신 `next/script`로 로드 타이밍 제어

```tsx
// app/layout.tsx
import Script from 'next/script'

<Script
  src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
  strategy="lazyOnload"
  onLoad={() => window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)}
/>
```

- `lazyOnload`: 페이지 로드 완료 후 유휴 시간에 로드 → 초기 렌더링 차단 없음
- `lib/kakao.ts`의 동적 스크립트 삽입 코드 제거

---

### 장소 카드 리렌더링 방지

정렬 탭 변경 시 불필요한 전체 카드 리렌더링 방지

```typescript
// components/results/PlaceCard.tsx
const PlaceCard = React.memo(
  ({ place, isBookmarked, onBookmark }: PlaceCardProps) => <div>...</div>,
  (prev, next) =>
    prev.place.id === next.place.id && prev.isBookmarked === next.isBookmarked
)

// app/(main)/results/page.tsx — 필터링/정렬 연산 메모이제이션
const filteredPlaces = useMemo(
  () => places.filter(filterByCondition).sort(sortByType),
  [places, sortType, condition]
)
```

---

### Suspense + Streaming (결과 화면)

조건 요약은 즉시 표시, 장소 리스트만 스트리밍으로 점진적 렌더링

```tsx
// app/(main)/results/page.tsx
<>
  <ConditionSummary condition={condition} />
  <Suspense fallback={<PlaceListSkeleton />}>
    <PlaceList condition={condition} />
  </Suspense>
</>
```

---

### 정적 페이지 선언

온보딩·스플래시는 빌드 타임에 HTML 생성 → CDN 캐시 적용

```typescript
// app/onboarding/page.tsx
export const dynamic = 'force-static'

// app/splash/page.tsx
export const dynamic = 'force-static'
```

---

### Intersection Observer 카드 애니메이션

스크롤 이벤트 대신 Intersection Observer — 뷰포트 밖 카드는 애니메이션 미실행

```typescript
// react-intersection-observer (2KB)
import { useInView } from 'react-intersection-observer'

const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 20 }}
  animate={inView ? { opacity: 1, y: 0 } : {}}
  transition={{ duration: 0.3 }}
/>
```

---

### Optimistic Updates

북마크 토글 시 서버 응답을 기다리지 않고 UI를 즉시 반영 → 체감 속도 크게 향상

```typescript
// hooks/useBookmark.ts
const { mutate } = useMutation({
  mutationFn: (placeId: string) => apiClient.post('/api/bookmarks/', { place_id: placeId }),
  onMutate: async (placeId) => {
    await queryClient.cancelQueries({ queryKey: ['bookmarks'] })
    const previous = queryClient.getQueryData(['bookmarks'])
    queryClient.setQueryData(['bookmarks'], (old: string[]) => [...old, placeId])
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['bookmarks'], context?.previous)  // 실패 시 롤백
  },
})
```

---

### API Waterfall 방지

장소 목록 + 북마크 상태를 순차가 아닌 병렬로 fetch

```typescript
// ❌ Waterfall — 순차 실행
const places = await fetchPlaces(condition)
const bookmarks = await fetchBookmarks()

// ✅ 병렬 실행 — useQueries
const results = useQueries({
  queries: [
    { queryKey: ['places', condition], queryFn: () => fetchPlaces(condition) },
    { queryKey: ['bookmarks'], queryFn: fetchBookmarks },
  ],
})
```

---

### Route Prefetching

조건 선택 화면에서 "계속하기" 버튼 hover 시 결과 화면 미리 준비

```typescript
// components/conditions/SubmitButton.tsx
'use client'
const router = useRouter()

<button
  onMouseEnter={() => router.prefetch('/results')}
  onClick={() => router.push('/results')}
>
  계속하기
</button>
```

---

### Vercel Edge Cache

장소 데이터는 자주 바뀌지 않으므로 CDN 엣지에서 캐시

```typescript
// app/api/places/route.ts
export async function GET() {
  const places = await fetchPlaces()
  return Response.json(places, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
    },
  })
}
```

---

### useInfiniteQuery 구조 설계 (확장 대비)

MVP는 20개 고정이지만 데이터 증가 시 무한 스크롤 전환 가능하도록 구조 설계

```typescript
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['places', condition],
  queryFn: ({ pageParam = 1 }) => fetchPlaces({ ...condition, page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
})
```

---

### 성능 우선순위 (전체)

| 우선순위 | 항목 | 주요 지표 |
|---------|------|---------|
| 🔴 높음 | Server / Client Component 분리 | JS 번들 최대 감소 |
| 🔴 높음 | `next/image` 적용 | LCP 개선 |
| 🔴 높음 | `next/font/local` (Pretendard) | CLS 방지 |
| 🔴 높음 | `next/script` lazyOnload (Kakao SDK) | 초기 로드 차단 제거 |
| 🔴 높음 | Framer Motion dynamic import | 초기 번들 감소 |
| 🔴 높음 | Optimistic Updates (북마크) | 체감 속도 즉시 개선 |
| 🟡 중간 | TanStack Query staleTime 설정 | 불필요한 API 호출 제거 |
| 🟡 중간 | API 병렬 fetch (useQueries) | 결과 화면 로딩 단축 |
| 🟡 중간 | `React.memo` + `useMemo` (장소 카드) | 리렌더링 방지 |
| 🟡 중간 | Suspense streaming (결과 화면) | 체감 속도 개선 |
| 🟡 중간 | Route prefetch (조건 선택 → 결과) | 화면 전환 속도 개선 |
| 🟡 중간 | Vercel Edge Cache (장소 API) | 서버 부하 감소 |
| 🟡 중간 | `force-static` (스플래시·온보딩) | CDN 캐시 활용 |
| 🟡 중간 | 애니메이션 transform/opacity 제한 | 인앱브라우저 버벅임 방지 |
| 🟢 낮음 | Intersection Observer 애니메이션 | 스크롤 성능 |
| 🟢 낮음 | useInfiniteQuery 구조 설계 | 데이터 증가 대비 |
| 🟢 낮음 | @tanstack/react-virtual (리스트 50개+) | 렌더링 부하 감소 |

---

## 검증 방법

- 로컬: `frontend/` → `npm run dev`, `backend/` → `python manage.py runserver` 동시 실행
- 모바일 뷰포트(375px)에서 전체 화면 플로우 확인
- 카카오톡 인앱브라우저에서 공유 버튼 동작 확인
- JWT 인증 흐름 (로그인 → 북마크 저장 → 다른 기기 재로그인 → 북마크 유지) 확인
- 불호 필터·영업중 필터 결과 정확성 확인
- TypeScript `npm run build` 오류 없음 확인
- Fly.io 배포 URL + Vercel Preview URL 연동 확인

---

## 핵심 파일

### 프론트엔드
- `frontend/src/types/place.ts` - 앱 전반 타입 기준
- `frontend/src/types/search.ts` - 검색 조건 타입
- `frontend/src/lib/api.ts` - Django API 클라이언트
- `frontend/src/lib/kakao.ts` - Kakao SDK 초기화 + 공유
- `frontend/src/lib/inAppBrowser.ts` - 인앱브라우저 감지
- `frontend/src/store/useSearchStore.ts` - 검색 조건 상태
- `frontend/src/store/useUserStore.ts` - 북마크 + 방문이력 상태
- `frontend/src/components/random/FlipCard.tsx` - 랜덤 결정 인터랙션
- `frontend/tailwind.config.ts` - 디자인 토큰
- `frontend/middleware.ts` - 인증 가드

### 백엔드
- `backend/apps/users/` - 사용자 + JWT 인증
- `backend/apps/bookmarks/` - 찜 CRUD
- `backend/apps/search_history/` - 검색 이력 CRUD
- `backend/config/settings/production.py` - 프로덕션 설정
- `backend/Procfile` - Fly.io 배포 진입점
