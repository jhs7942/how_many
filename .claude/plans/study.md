# 프론트엔드 성능 최적화 학습 정리

> 몇명이니 프로젝트를 기준으로 정리한 프론트엔드 성능 개선 개념

---

## 1. 성능 지표 이해

### Core Web Vitals — Google이 정의한 3가지 핵심 지표

| 지표 | 이름 | 한마디 | 기준 |
|------|------|--------|------|
| **LCP** | Largest Contentful Paint | 화면에서 가장 큰 요소가 언제 나타나는가 | 2.5초 이내 = 좋음 |
| **CLS** | Cumulative Layout Shift | 화면 요소가 예고 없이 얼마나 움직이는가 | 0.1 이하 = 좋음 |
| **INP** | Interaction to Next Paint | 버튼 클릭 후 얼마나 빨리 반응하는가 | 200ms 이내 = 좋음 |

#### LCP 예시 — 이미지 최적화와 직결
```
사용자가 링크 클릭 → 흰 화면 → 텍스트 등장 → [히어로 이미지 등장] ← 여기까지가 LCP
```
장소 상세 화면의 큰 이미지가 늦게 뜨면 LCP가 나빠짐 → `next/image`로 해결

#### CLS 예시 — 폰트/이미지 크기 미지정
```
[시스템 폰트로 렌더]   →   [Pretendard 로딩 완료]
 버튼이 여기 있음              버튼이 아래로 밀림! ← 사용자가 이미 클릭했는데 다른 버튼을 누름
```
`next/font/local`로 폰트를 미리 로드하면 이 밀림 현상 방지

---

## 2. 번들 크기 줄이기

### 번들(Bundle)이란?
브라우저가 다운로드하는 JavaScript 파일 묶음. 크면 클수록 로딩이 느려짐.

### Dynamic Import — 필요할 때만 로드
```typescript
// ❌ 항상 로드 — 랜덤 결정 화면에 안 들어가도 다운로드됨
import FlipCard from '@/components/random/FlipCard'

// ✅ 해당 화면 진입 시에만 로드
const FlipCard = dynamic(() => import('@/components/random/FlipCard'), { ssr: false })
```

**적용 대상**: Framer Motion 무거운 컴포넌트, 온보딩 슬라이드, FlipCard 등

### next/script의 strategy — 로드 타이밍 제어
```typescript
<Script src="카카오SDK" strategy="lazyOnload" />
// lazyOnload: 페이지 다 뜬 후 여유 시간에 로드 → 초기 화면 렌더링 방해 안 함
```

| strategy | 언제 로드 | 용도 |
|----------|----------|------|
| `beforeInteractive` | 페이지 로드 전 | 분석 도구 등 |
| `afterInteractive` | 하이드레이션 직후 | 기본값 |
| `lazyOnload` | 유휴 시간 | 카카오 SDK처럼 급하지 않은 것 |

---

## 3. 이미지 최적화 (`next/image`)

### 왜 `next/image`를 써야 하나?
- PNG/JPG → **WebP 자동 변환** (같은 이미지가 30~50% 작아짐)
- 뷰포트에 맞는 크기로 **자동 리사이즈**
- 화면 밖 이미지는 **자동 lazy load**

```tsx
// 히어로 이미지 (화면 최상단 → priority로 즉시 로드)
<Image src={place.images[0]} alt={place.name} fill priority sizes="100vw" />

// 카드 썸네일 (스크롤 내려야 보임 → lazy load + 블러 placeholder)
<Image
  src={place.images[0]}
  alt={place.name}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
```

- `priority`: 즉시 로드 (LCP 요소에만 사용)
- `placeholder="blur"`: 로딩 중 흐린 이미지 표시 → CLS 방지
- `sizes`: 화면 크기별 이미지 크기 힌트 → 불필요한 큰 이미지 다운로드 방지

---

## 4. 웹폰트 최적화 (`next/font/local`)

### CDN 방식의 문제
```html
<!-- ❌ CDN — 외부 서버에서 받아오는 동안 시스템 폰트로 먼저 표시 → 교체 시 CLS 발생 -->
<link href="https://cdn.jsdelivr.net/npm/pretendard/..." rel="stylesheet">
```

### next/font/local 방식
```typescript
// ✅ 빌드 타임에 포함 → 폰트 교체 없음 → CLS 0
import localFont from 'next/font/local'

const pretendard = localFont({
  src: '../public/fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
})
```
`PretendardVariable.woff2` (가변 폰트) 한 파일로 모든 굵기 대응

---

## 5. React Server Components

### 개념
Next.js App Router에서 컴포넌트는 기본적으로 **Server Component**

| | Server Component | Client Component |
|-|-----------------|-----------------|
| 실행 위치 | 서버 | 브라우저 |
| JS 번들 포함 | ❌ (포함 안 됨) | ✅ |
| 사용 가능 | DB 직접 접근, async/await | useState, useEffect, 이벤트 핸들러 |
| 선언 방법 | 기본값 | 파일 상단에 `'use client'` |

### 분류 기준
```typescript
// ✅ Server Component — 데이터 가져오고 보여주기만 함
async function PlaceDetailPage({ params }) {
  const place = await fetchPlace(params.id)  // 서버에서 직접 fetch
  return <PlaceDetail place={place} />
}

// ✅ Client Component — 클릭, 상태 변화 필요
'use client'
function BookmarkButton({ placeId }) {
  const [saved, setSaved] = useState(false)
  return <button onClick={() => setSaved(!saved)}>찜하기</button>
}
```

**핵심**: Server Component는 JS 번들에 포함되지 않으므로 클라이언트로 전달되는 JS를 근본적으로 줄일 수 있음

---

## 6. TanStack Query 캐싱 전략

### staleTime — 데이터를 "신선하다"고 볼 시간
```typescript
// 장소 목록 — 자주 안 바뀜 → 10분 캐시
useQuery({ queryKey: ['places', condition], staleTime: 10 * 60 * 1000 })

// 북마크 — 방금 추가한 게 안 보이면 안 됨 → 캐시 없음
useQuery({ queryKey: ['bookmarks'], staleTime: 0 })
```

staleTime = 0이면 탭 전환할 때마다 서버에 재요청. 장소 데이터처럼 잘 안 바뀌는 데이터는 길게 설정할수록 불필요한 API 호출 감소

---

## 7. Optimistic Updates

### 개념
서버 응답을 기다리지 않고 **먼저 UI를 바꾼 뒤, 실패하면 되돌림**

```
❌ 일반 방식: 북마크 클릭 → 서버 저장 기다림(0.5~2초) → UI 업데이트
✅ Optimistic: 북마크 클릭 → UI 즉시 반영 → 서버 저장 (실패 시 자동 롤백)
```

```typescript
const { mutate } = useMutation({
  mutationFn: (placeId) => apiClient.post('/api/bookmarks/', { place_id: placeId }),
  onMutate: async (placeId) => {
    const previous = queryClient.getQueryData(['bookmarks'])
    queryClient.setQueryData(['bookmarks'], (old) => [...old, placeId]) // 즉시 반영
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['bookmarks'], context.previous) // 실패 시 롤백
  },
})
```

---

## 8. API Waterfall 방지

### Waterfall이란?
요청이 순서대로 실행되어 앞 요청이 끝나야 다음 요청이 시작되는 현상

```
❌ Waterfall:
장소 목록 요청 ──────────────► 완료
                                     북마크 요청 ──────► 완료
                                                               화면 표시
총 시간: 0.3초 + 0.2초 = 0.5초

✅ 병렬:
장소 목록 요청 ──────────────► 완료
북마크 요청 ──────────────────────────► 완료 (동시 실행)
화면 표시
총 시간: max(0.3초, 0.2초) = 0.3초
```

```typescript
// useQueries로 병렬 실행
const [placesQuery, bookmarksQuery] = useQueries({
  queries: [
    { queryKey: ['places', condition], queryFn: () => fetchPlaces(condition) },
    { queryKey: ['bookmarks'], queryFn: fetchBookmarks },
  ],
})
```

---

## 9. Suspense + Streaming

### 개념
페이지의 일부를 먼저 보여주고, 느린 부분은 나중에 채워 넣음

```
❌ 기존: 장소 리스트 다 로드될 때까지 전체 흰 화면

✅ Streaming:
1단계: 조건 요약 즉시 표시 ("강남 · 3~5명 · 식당")
2단계: 리스트 로딩 중 → Skeleton UI 표시
3단계: 리스트 완성 → 교체
```

```tsx
<>
  <ConditionSummary condition={condition} />   {/* 즉시 렌더 */}
  <Suspense fallback={<PlaceListSkeleton />}>
    <PlaceList condition={condition} />          {/* 스트리밍 */}
  </Suspense>
</>
```

---

## 10. React.memo + useMemo — 리렌더링 방지

### 리렌더링이 언제 문제가 되나?
정렬 탭("거리순 → 인기순") 클릭 시 변경되지 않은 카드까지 전부 다시 렌더링됨

```typescript
// React.memo — props가 바뀌지 않으면 리렌더링 건너뜀
const PlaceCard = React.memo(({ place, isBookmarked }) => <div>...</div>)

// useMemo — 연산 결과를 기억해뒀다가 의존값이 바뀔 때만 재계산
const filteredPlaces = useMemo(
  () => places.filter(filterByCondition).sort(sortByType),
  [places, sortType, condition]  // 이것들이 바뀔 때만 재계산
)
```

---

## 11. 정적 페이지 (`force-static`)

스플래시, 온보딩처럼 항상 같은 내용을 보여주는 페이지는 빌드 타임에 HTML 생성 후 CDN에서 바로 제공

```typescript
export const dynamic = 'force-static'
// → 서버 연산 없이 CDN 엣지에서 즉시 응답
```

---

## 12. Vercel Edge Cache

```typescript
return Response.json(places, {
  headers: {
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
  },
})
// s-maxage=600: CDN에서 10분간 캐시
// stale-while-revalidate=1200: 20분간 오래된 데이터 먼저 주고 백그라운드에서 갱신
```

사용자는 즉시 응답 받고, 서버는 덜 바쁨

---

## 13. Route Prefetching

다음에 갈 페이지를 미리 다운로드

```typescript
// 버튼에 마우스 올리는 순간 결과 페이지 JS를 백그라운드에서 다운로드
<button onMouseEnter={() => router.prefetch('/results')}>
  계속하기
</button>
```

버튼 클릭 → 이동 사이의 딜레이가 거의 사라짐

---

## 14. 인앱브라우저(카카오톡) 특이사항

카카오톡 인앱브라우저는 일반 브라우저보다 메모리 제한이 타이트함

```typescript
// ❌ 레이아웃 변경 애니메이션 — CPU 연산 필요
animate={{ width: '100%', height: '200px', top: 0 }}

// ✅ transform/opacity만 — GPU 가속, 메모리 효율적
animate={{ opacity: 1, y: 0, scale: 1 }}
```

저사양 기기 대응:
```typescript
const shouldReduce = useReducedMotion()  // 기기 설정에서 애니메이션 줄이기 켜놓은 경우
const variants = {
  hidden: { opacity: 0, y: shouldReduce ? 0 : 20 },
  visible: { opacity: 1, y: 0 },
}
```

---

## 15. Intersection Observer

스크롤 이벤트는 매 픽셀마다 실행되어 부하가 큼. Intersection Observer는 뷰포트 진입/이탈 시에만 실행

```typescript
const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 })
// triggerOnce: 한 번 진입하면 다시 체크 안 함
// threshold: 0.1 = 10%만 보여도 진입으로 판단

<motion.div
  ref={ref}
  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
/>
```

---

## 전체 우선순위 요약

| 우선순위 | 항목 | 왜 중요한가 |
|---------|------|-----------|
| 🔴 높음 | Server / Client Component 분리 | JS 번들 자체를 줄임 |
| 🔴 높음 | `next/image` | 이미지가 LCP의 주원인 |
| 🔴 높음 | `next/font/local` | 폰트 교체로 CLS 발생 |
| 🔴 높음 | `next/script` lazyOnload | 카카오 SDK가 초기 렌더링 막지 않게 |
| 🔴 높음 | Framer Motion dynamic import | 큰 라이브러리를 나눠서 로드 |
| 🔴 높음 | Optimistic Updates | 클릭 즉시 반응 → 체감 속도 |
| 🟡 중간 | TanStack Query staleTime | 불필요한 재요청 방지 |
| 🟡 중간 | useQueries 병렬 fetch | Waterfall 제거 |
| 🟡 중간 | React.memo + useMemo | 불필요한 리렌더링 방지 |
| 🟡 중간 | Suspense streaming | 부분 렌더링으로 체감 빠름 |
| 🟡 중간 | Route prefetch | 화면 전환 딜레이 제거 |
| 🟡 중간 | Vercel Edge Cache | 서버 부하 + 응답 속도 |
| 🟡 중간 | force-static | 정적 페이지 CDN 직접 제공 |
| 🟡 중간 | transform/opacity 애니메이션 | 인앱브라우저 버벅임 방지 |
| 🟢 낮음 | Intersection Observer | 뷰포트 밖 애니메이션 미실행 |
| 🟢 낮음 | useInfiniteQuery 구조 | 데이터 늘어날 때 대비 |
| 🟢 낮음 | react-virtual | 리스트 50개 넘을 때 |
