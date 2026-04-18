# HM-21 재설계 — Next 16 `next/og` + Satori 기반 서버사이드 OG 이미지

## 결정 환경
- 날짜: 2026-04-18 (같은 날 이전 ADR 번복 후 재결정)
- 관련 프로젝트: how_many (v1.1 안정화 단계)
- 기술 영역: 서버사이드 OG 이미지 렌더, Next.js 16 App Router, Vercel Edge runtime, Capacitor 8 정적 export 호환성

## 맥락

Linear 이슈 HM-21 "결과 공유 카드 이미지화". 같은 날 오전 Accepted 된 `hm-21-share-card-architecture.md` 의 `html-to-image` + Share Sheet 조합은 기술적으로는 동작했으나 **사용자가 기대한 UX(카카오 Feed 썸네일에 결과 카드가 바로 노출됨)** 을 달성할 수 없음이 확인됨.

핵심 한계:
- 카카오톡 Feed Template 의 `imageUrl` 은 **서버 공개 URL 에서 이미지를 가져온다**. 클라이언트가 Blob 을 첨부할 수 없다.
- 결국 "갤러리에 저장 후 카톡 대화방에 이미지 첨부"라는 추가 단계가 필요 → 기대 UX 와 동떨어짐.

재설계 목표:
1. 카톡 공유 버튼 클릭 시 **친구 카톡에 Feed 썸네일이 즉시 노출**
2. 결과 URL 을 카톡에 **텍스트로 붙여넣기만 해도** 자동 미리보기 썸네일 노출
3. Solo/Food/Group 모두 동일 경로로 자동 커버
4. Android Capacitor 정적 export 빌드와 공존

### 제약 조건

| 영역 | 제약 |
|---|---|
| 프레임워크 | Next.js 16.1.7 App Router, React 19.2.3 |
| 렌더 위치 | Vercel Edge runtime (무료 티어 호환) |
| 데이터 | Supabase `results` 테이블 (winner_label, winner_emoji) |
| 정적 export | Android Capacitor 빌드는 `NEXT_STATIC_EXPORT=true` 로 `output: 'export'` — Edge runtime 과 충돌 |
| 캐시 | 카카오/카톡 서버 캐시를 고려해 immutable URL 구조 필요 |
| 한글 | Satori 는 시스템 폰트 없음 → 한글 폰트 ArrayBuffer 필요 |
| 이모지 | Satori 는 system emoji 미지원 → 외부 이모지 세트 필수 |
| 번들 | 클라이언트 번들 증가 0 (모두 서버 렌더) |

## 검토한 대안

### 결정 1 — 렌더 기술

| 대안 | 번들 영향 | 한글 | 이모지 | 플랫폼 의존 |
|---|---|---|---|---|
| **Next 16 `next/og` (내장 Satori)** ✅ | 0 (Edge chunk) | 폰트 ArrayBuffer 주입 | `emoji: 'twemoji'` 옵션 | Vercel Edge 최적화 |
| `@vercel/og` (외부 패키지) | 0 | 동일 | 동일 | 동일 (Next 14 이전용, 16에서는 중복) |
| Puppeteer + Chromium (서버리스) | 크기 大 | OS 폰트 | OS 이모지 | Lambda cold start 긺 |
| 미리 정적 PNG 생성 + CDN | 0 | 이미지 편집 툴로 pre-bake | pre-bake | 동적 결과별 이미지 생성 불가 (핵심 요구와 모순) |

**채택**: Next 16 에 내장된 `next/og` 는 Satori(HTML→SVG→PNG) 를 Edge runtime 에서 직접 실행. `@vercel/og` 는 Next 13 시절 외부 패키지였으나 16에서는 내장으로 흡수 — 별도 설치 불필요.

### 결정 2 — 이미지 비율

| 대안 | 규격 | 카톡 Feed | URL 미리보기 | 인스타 |
|---|---|---|---|---|
| **1200×630 가로형 (OG 표준)** ✅ | Meta Open Graph 권장 | 최적 | 최적 | 크롭 |
| 1080×1080 정사각형 | Instagram 피드 표준 | 카톡에서 축소 표시 | 축소 | 최적 |
| 1080×1920 세로형 | 스토리 | 비호환 | 비호환 | 스토리만 |

**채택**: **카카오 Feed 썸네일 노출이 1단계 성공 기준**이므로 1200×630 을 우선. 인스타 피드 크롭은 감수(본 기능 주 사용처 아님).

### 결정 3 — 이모지 렌더

| 대안 | 구현 | 안정성 | 응답 속도 |
|---|---|---|---|
| **Twemoji 외부 fetch** ✅ (`emoji: 'twemoji'`) | Satori 옵션 한 줄 | CDN 안정 | 첫 요청 지연, Edge 캐시 후 warm hit 빠름 |
| Twemoji 로컬 번들 | `loadAdditionalAsset` 콜백 커스터마이징 | 완전 자립 | 항상 빠름 |
| 시스템 이모지 fallback | 별도 처리 없음 | Satori 가 system emoji 미지원 → **렌더 실패** | N/A |

**채택**: 구현 단순성 우선. Vercel Edge CDN 캐시 + 1년 immutable 응답 헤더로 실제 사용자 지연 없음.

### 결정 4 — 한글 폰트

| 대안 | 톤 | 번들 | 라이선스 |
|---|---|---|---|
| **Pretendard 가변 woff2** ✅ | 앱 UI 톤 일치 | ~80KB (가변 1파일로 Regular/Bold 모두 커버) | OFL |
| Noto Sans KR | Google Fonts 계열 | weight 별 파일 분리, subset 필요 | OFL |
| 시스템 폰트 fallback | 한글 깨짐 | 0 | N/A |

**채택**: 앱 전반의 디자인 언어와 통일. 가변 폰트 활용으로 파일 수 최소.

### 결정 5 — Android Capacitor 충돌 회피

| 대안 | 변경 범위 | 유지보수 |
|---|---|---|
| **`next.config.ts` pageExtensions 조건부** ✅ | 설정 파일 한 곳 | 빌드 스크립트 불변 |
| 빌드 스크립트에서 파일 rename/복원 | `scripts/` shell 수정 | 실패 시 복원 누락 리스크 |
| Capacitor 전용 Next 앱 분리 | 프로젝트 구조 대수술 | 중복 코드 관리 |

**채택**: `NEXT_STATIC_EXPORT=true` 시 `pageExtensions: ['page.tsx', ...]` 로 제한하여 `opengraph-image.tsx` 파일을 아예 page 후보에서 제외. 단일 설정 파일로 해결.

## 최종 결정

**Next 16 `next/og` + Edge runtime + Twemoji + Pretendard + pageExtensions 조건부 분기** 조합 채택.

구조 요약:
```
app/result/[id]/
├── page.tsx              ← generateMetadata 추가
└── opengraph-image.tsx   ← Edge runtime, ImageResponse 1200×630 PNG

lib/
├── og/loadFont.ts        ← Pretendard ArrayBuffer fetch+캐시
└── constants/shareCard.ts ← 크기·색상 상수

public/fonts/
├── Pretendard-Regular.woff2
└── Pretendard-Bold.woff2

next.config.ts            ← pageExtensions 조건부 분기
```

## 트레이드오프

### 포기한 것
- **Android 앱 내부에서 OG 이미지 렌더**: Android 정적 export 에서는 opengraph-image 를 빌드하지 않음. 하지만 Android 앱은 실제로는 Vercel URL 을 로드하므로, OG 이미지는 Vercel 서버에서만 렌더되면 충분함을 확인 → 실질적 손실 없음.
- **카톡 서버 캐시 무력화**: 카카오는 한 번 받은 imageUrl 응답을 상당 시간 캐시함. `result_id` 자체가 불변이므로 실제 영향은 없으나, 디자인 대폭 변경 시 기존 URL 썸네일 갱신은 기대하기 어려움.
- **OS 기본 이모지 룩**: Twemoji 강제 적용으로 사용자 익숙한 OS 이모지(Apple Color, Noto Color) 대비 디자인 차이. 트위터·SNS 에서 익숙한 룩이라 대체 수용 가능.
- **더 화려한 아트웍**: Satori 의 flexbox-only 제약으로 복잡한 레이아웃 불가. 현 스펙은 flex + linear-gradient 범위로 단순함.

### 감수하는 리스크
- Edge runtime 에서 `@supabase/supabase-js` 일부 API 비호환 가능성 → 최소 API(`createClient` + `from().select().maybeSingle()`)만 사용
- Twemoji CDN 다운타임 시 이모지 렌더 실패 → Satori 가 system emoji fallback 시도하나 결과 불확실. 실발생 시 로컬 번들로 전환 (번복 조건)
- `next.config.ts` pageExtensions 분기가 다른 특수 파일(layout, error, not-found 등) 인식에 영향 줄 가능성 → 프로젝트 전체 파일 목록 확인 후 배열에 추가로 완화

## 예상 영향

### 긍정
- **기대 UX 달성**: 카톡 공유 버튼 → 친구 카톡 Feed 썸네일 노출 (1단계 성공 기준)
- **URL 자동 미리보기**: `generateMetadata` 로 텍스트 붙여넣기에도 썸네일 노출 (보너스 UX)
- **자동 확장**: `result_id` 기반이라 Solo/Food/Group 모두 동일 경로 자동 커버 → 후속 이슈(HM-21-F/G)는 실기기 QA 만으로 완료
- **클라이언트 번들 증가 0**: 모든 렌더가 서버 Edge 에서 수행
- **이모지 일관성**: OS 에 관계없이 모든 사용자 카톡에서 동일한 이모지 룩

### 부정
- **Edge runtime 의존**: Vercel 의 Edge 가용성에 묶임. Vercel 장애 시 OG 이미지 응답 실패
- **첫 요청 지연**: cold start + 폰트/이모지 fetch 로 최초 응답이 200ms 이상 걸릴 수 있음 (warm hit 시 해소)
- **Supabase 조회 실패 시 fallback 렌더**: 존재하지 않는 `id` 나 RLS 차단 시 "결과/🎉/default tip" 조합으로 폴백 → 무의미한 카드 노출 가능

### 번복 조건

다음 중 하나 발생 시 재검토:
1. Vercel Edge 응답 지연이 카카오 서버 타임아웃(통상 5초)을 초과해 썸네일 미노출이 빈발 → Puppeteer + 사전 렌더 or 정적 PNG 캐시 전환
2. Twemoji CDN 다운타임으로 이모지 렌더 실패 누적 → `loadAdditionalAsset` 콜백 + 로컬 SVG 번들로 전환
3. Android 정적 export 빌드가 `pageExtensions` 외 다른 이유로 실패하는 케이스 발생 → 빌드 스크립트 기반 파일 rename 방식으로 전환
4. 카톡이 요구하는 image 규격이 변경 (예: 1080×1080 필수) → `size` 상수 변경

## 상태

Accepted (2026-04-18, 같은 날 이전 ADR 번복)

## 참조

- 재작성된 plan: `.claude/plans/plan.md` (2026-04-18)
- construction: `.claude/plans/construction.md § Part 4`
- 재설계 스펙 원본: `script.md` (프로젝트 루트)
- 번복된 이전 ADR: `.claude/study/adr/2026-04-18/hm-21-share-card-architecture.md` (Superseded)
- Linear 이슈: HM-21 (https://linear.app/wqeqw/issue/HM-21)
- 롤백 커밋: `1e5d1cd` (HM-21 1단계 구현 롤백)
