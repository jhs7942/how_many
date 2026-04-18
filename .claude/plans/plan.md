# Plan — HM-21 재설계: 카카오 Feed 썸네일 기반 결과 공유 카드 (2026-04-18)

## 작업 브랜치

- **현재 브랜치**: `develop` (직커밋)
- Vercel preview URL(`how-many-git-develop-*.vercel.app`)로 자동 배포 → 카카오가 이 URL에서 OG 메타를 읽어감
- `main` 머지는 실기기 카톡 공유 검증 + 기획자 QA 완료 후 사용자 승인 시 별도 진행
- Linear 이슈: HM-21 (https://linear.app/wqeqw/issue/HM-21)

## 작업 배경

### 왜 재설계인가

2026-04-18에 1단계 구현(html-to-image + Share Sheet 기반 클라이언트 카드)을 **commit `1e5d1cd` 로 롤백**함. 사용자가 기대한 UX는 "네이티브 Share Sheet 이미지 전송"이 아니라 **"카카오 공유 버튼 → 카톡 친구에게 전송된 Feed 메시지 썸네일에 결과 카드 이미지가 노출"** 되는 것이었기 때문.

기존 1단계 구현은 기술적으로는 동작했으나:
- 카카오톡 Feed Template 은 **서버 공개 URL 로부터 이미지를 가져옴** — 클라이언트 Blob 첨부 불가
- 결국 "갤러리에 저장 후 카톡에 이미지 첨부"라는 추가 단계가 필요했고, 이는 사용자가 기대한 "공유 버튼 → 친구에게 카드 도착" 플로우와 달라짐

### 원하는 최종 UX (Draw Mafia 스타일 참조)

카톡 대화방에 Feed 메시지가 다음과 같이 노출:
- 상단 이미지: 결과 카드 (1200×630, #FF7A3D 그라디언트 + 이모지 + 활동명 + 팁)
- 제목: `🧺 피크닉` (winner_emoji + winner_label)
- 설명: 팁 또는 "몇명이니로 결정했어요!"
- 링크 클릭 시 `/result/{id}` 결과 페이지로 이동
- 추가 효과: 결과 URL 을 **텍스트로 붙여넣기**만 해도 자동 썸네일 미리보기가 노출됨

## 1단계 스코프

### IN

- `app/result/[id]/opengraph-image.tsx` Edge route: `result_id` 기반 1200×630 PNG 동적 생성
- `app/result/[id]/page.tsx` `generateMetadata` 추가: `openGraph.images`, `title`, `description` 주입
- `lib/kakao.ts` 카카오 Feed 호출에 `imageUrl`·`imageWidth`·`imageHeight` 명시
- `components/flow/FlowResultPage.tsx` `handleKakaoShare` 에서 절대 URL(`${base}/result/${id}/opengraph-image`) 주입
- Android Capacitor 정적 빌드(`NEXT_STATIC_EXPORT=true`)에서 opengraph-image 파일 빌드 제외

### OUT (재도입 금지)

- `html-to-image` 재설치
- `@capacitor/share` 파일 전송 (files 옵션)
- `useShareImage.ts`, `ShareCard.tsx`, `SharePreviewModal.tsx`, `sanitizeFilename` 재도입
- 갤러리 저장, 이미지 미리보기 모달
- "공유" 버튼 UX (롤백 시 제거됨, "링크 복사" 복원 상태 유지)

### 자동 커버 범위

`opengraph-image` 는 `result_id` 만 받으면 Supabase `results` 테이블에서 `winner_label`/`winner_emoji` 를 조회하므로 **Solo/Food/Group 자동 커버**. 다만 테스트·기획자 QA는 Solo 플로우만 실행하고, Food/Group 실기기 검증은 후속 이슈(HM-21-F, HM-21-G)로 분리.

## 확정된 카드 스펙

### 해상도 및 비율

- **1200×630 가로형** (Meta Open Graph 표준, 카카오 Feed 권장)
- 카톡 Feed 메시지·URL 미리보기 모두 크롭 없이 노출

### 레이아웃

```
┌──────────────────────────────────────────────┐ 1200px
│                                              │
│  🧺           피크닉                         │
│               돗자리와 간식을 챙겨가면       │ 630px
│               더 즐거워요                    │
│                                              │
└──────────────────────────────────────────────┘
```

### 요소별 스펙

| 요소 | 값 | 비고 |
|---|---|---|
| 배경 | `linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)` | `var(--color-primary)` 계열 |
| 좌측 이모지 | 360px, padding-left 80px | `winner_emoji` — Twemoji 강제 |
| 우측 활동명 | 96px Bold `#FFFFFF` | `winner_label` |
| 우측 팁 | 32px Regular `rgba(255,255,255,0.85)`, 최대 2줄 `line-clamp` | `tips.json[label]` ?? `default` |
| 좌우 분할 | 좌측 420px : 우측 780px (flex) | 여백 포함 |

### 팁 영역 처리 (엣지 케이스)

| 상황 | 처리 |
|---|---|
| `tips.json[winner_label]` 매칭 성공 | 해당 팁 표시 |
| 매칭 실패 | `tips.json['default']` 사용 |
| `tips.json` 자체 없음 (이론상 발생 안 함) | "몇명이니로 결정했어요!" 문자열 |

## 수용 기준 (Acceptance Criteria)

- [ ] `GET /result/{id}/opengraph-image` 요청 시 1200×630 PNG(Content-Type `image/png`) 응답
- [ ] `view-source:/result/{id}` HTML `<head>` 에 `<meta property="og:image" content="...">` 존재
- [ ] og:image URL 이 절대 URL 형태 (`https://...`)로 주입
- [ ] **실기기 Android (내부 테스트 AAB)에서 Solo 결과 → 카카오 공유 버튼 → 친구 전송 → 친구 카톡 화면에 Feed 썸네일 노출**
- [ ] 썸네일 클릭 시 `/result/{id}` 로 이동 확인
- [ ] 카톡 대화방에 `https://how-many-mauve.vercel.app/result/{id}` URL 을 **텍스트로 붙여넣기** 시 자동 미리보기 썸네일 노출
- [ ] `winner_emoji` 가 Twemoji 아이콘으로 렌더됨 (OS 기본 이모지 아님)
- [ ] 한글 `winner_label` 과 팁이 Pretendard 폰트로 정상 렌더 (공백/깨짐 없음)
- [ ] `npm run build` (Vercel SSR 모드) 통과
- [ ] `npm run build:android` (static export 모드) 통과 — opengraph-image 파일이 빌드에서 제외되어 에러 없음
- [ ] 기존 "링크 복사 / 카카오 공유 / 다시 돌리기 / 홈" 버튼 UX 회귀 없음
- [ ] 1년 immutable 캐시 헤더(`Cache-Control: public, s-maxage=31536000, immutable`) 응답

## 요구사항

### 기능 요구사항

| # | 요구 | 비고 |
|---|---|---|
| F1 | Edge route 에서 `result_id` 로 Supabase results 조회 | anon key + 공개 RLS |
| F2 | `tips.json` 을 label 로 매칭하여 tip 문자열 획득 | `default` fallback |
| F3 | Satori `ImageResponse` 로 1200×630 PNG 반환 | `next/og` 내장 사용 |
| F4 | Pretendard 한글 폰트 주입 (Regular + Bold) | `public/fonts/` 에서 fetch |
| F5 | Twemoji 강제 적용 | `emoji: 'twemoji'` 옵션 |
| F6 | `generateMetadata` 로 openGraph 메타 주입 | URL 붙여넣기 미리보기 대응 |
| F7 | `lib/kakao.ts` Feed Template 에 `imageUrl`·`imageWidth`·`imageHeight` 전달 | 카톡 Feed 썸네일 |
| F8 | 1년 immutable 캐시 응답 | result 는 불변 레코드 |
| F9 | Android static export 에서 opengraph-image 파일 제외 | Edge runtime ↔ export 비호환 회피 |

### 비기능 요구사항

| # | 요구 | 기준 |
|---|---|---|
| NF1 | OG 이미지 응답 시간 | Vercel Edge cold start < 800ms, warm < 200ms |
| NF2 | 번들 영향 | `next/og` 는 빌드타임 제외 (Edge chunk), 클라이언트 번들 증가 0 |
| NF3 | 접근성 | `og:image:alt` 에 "{label} 결과 카드" 형태 대체 텍스트 |
| NF4 | 기존 기능 회귀 없음 | FlowResultPage 기타 버튼 동작, Android 빌드 모두 회귀 없음 |
| NF5 | 보안 | anon key 만 사용, service_role 금지. Supabase RLS `results` SELECT 공개 정책 확인 |
| NF6 | 캐시 안정성 | `result_id` 기반 URL 이 불변이므로 1년 immutable 캐시. Supabase 데이터 변조 시에도 카톡/카카오 캐시가 유지됨을 감수 |

## 확정된 기술 선택 (ADR 대상)

| 결정 | 선택 | 주요 근거 |
|---|---|---|
| 렌더 기술 | **Next 16 `next/og` (내장 Satori)** + Edge runtime | `@vercel/og` 별도 설치 불필요, Vercel Edge 최적화 |
| 이미지 비율 | **1200×630 가로형** | Meta OG 표준, 카카오 Feed·URL 미리보기 공통 권장 |
| 이모지 렌더 | **Twemoji 강제** (`emoji: 'twemoji'`) | Satori 는 system emoji 미지원. 외부 CDN fetch 로 구현 단순화 |
| 한글 폰트 | **Pretendard** 가변 woff2 | 앱 UI 톤 일치, 가변 폰트 1개로 Regular/Bold 커버 |
| 데이터 소스 | **Supabase `results` 테이블 + anon key + 공개 RLS** | 기존 저장 구조 재사용, 별도 API 불필요 |
| 캐시 정책 | **1년 immutable** (`public, s-maxage=31536000, immutable`) | result 는 생성 후 변경 없음 |
| Android 빌드 충돌 회피 | **`next.config.ts` pageExtensions 조건부 분기** | 코드 한 곳 관리, 빌드 스크립트 불변 |

## 리스크

| ID | 리스크 | 영향 | 완화 |
|---|---|---|---|
| R1 | Edge runtime 에서 `@supabase/supabase-js` 일부 API 비호환 | Edge route 빌드 실패 | 최소 API(`createClient` + `from().select()`)만 사용, 필요시 fetch 기반 직접 호출로 fallback |
| R2 | Pretendard CDN 또는 로컬 번들 fetch 실패 | 한글 깨짐 | `public/fonts/` 로컬 번들 (CDN 의존 제거), 빌드 시 파일 존재 확인 |
| R3 | Twemoji 외부 fetch 지연 | OG 이미지 응답 시간 증가 | Vercel Edge 의 CDN 캐시 + 1년 immutable 헤더로 warm hit 시 0ms |
| R4 | `next.config.ts` pageExtensions 분기 부작용 | 다른 특수 파일(sitemap, robots 등) 인식 실패 | 현재 프로젝트에 그런 파일 없음을 빌드 전 확인, 있으면 `pageExtensions` 배열에 추가 |
| R5 | Supabase RLS `results` SELECT 정책 미설정 | Edge route 에서 빈 결과 반환 → OG 이미지가 fallback 텍스트로 렌더 | 배포 전 Supabase dashboard 에서 정책 확인(이미 `/result/[id]` 페이지가 공개 조회 중이라 존재 가능성 높음) |
| R6 | 카톡/카카오 서버 캐시로 인한 변경 반영 지연 | OG 이미지 수정해도 기존 URL 썸네일 갱신 안됨 | `result_id` 자체가 불변이므로 실질 영향 없음. 디자인 대폭 변경 시 배포 후 테스트용 신규 `result_id` 로 확인 |
| R7 | Satori flexbox 외 CSS 미지원 | 의도한 레이아웃 불가 | 카드 디자인을 flex + linear-gradient 범위로 제한 (grid·float 금지) |
| R8 | 카카오 Feed Template 의 imageUrl 상대 경로 미지원 | 썸네일 미노출 | `getAppBaseUrl()` + 경로 조합으로 절대 URL 보장 |
| R9 | Android AAB 빌드 시 opengraph-image.tsx 인식되어 빌드 실패 | Play Console 업로드 불가 | NEXT_STATIC_EXPORT=true 시 `pageExtensions` 필터링으로 파일 무시 |

## 작업 순서

1. **Phase A (문서)**
   1. 이 plan.md 재작성 (본 문서)
   2. construction.md § Part 3 Deprecated 마크 + § Part 4 신규 작성
   3. 기존 ADR (`hm-21-share-card-architecture.md`) Superseded 전이
   4. 신규 ADR (`hm-21-og-image-satori.md`) 작성
2. **Phase B (구현)** — 사용자 승인 후
   1. `public/fonts/` 에 Pretendard-Regular.woff2, Pretendard-Bold.woff2 번들
   2. `lib/og/loadFont.ts` 폰트 로더 유틸
   3. `lib/constants/shareCard.ts` 상수
   4. `app/result/[id]/opengraph-image.tsx` Edge route
   5. `app/result/[id]/page.tsx` generateMetadata
   6. `lib/kakao.ts` imageWidth/imageHeight 명시
   7. `FlowResultPage.tsx` handleKakaoShare 에 imageUrl 주입
   8. `next.config.ts` pageExtensions 조건부 분기
3. **Phase C (검증)**
   1. `npm run build` 통과 (Vercel SSR 모드)
   2. `npm run build:android` 통과 (static export 모드, opengraph-image 제외 확인)
   3. 로컬 `GET /result/{id}/opengraph-image` PNG 응답 검증
   4. Vercel preview 배포 후 `<head>` og:image 메타 확인
   5. 내부 테스트 AAB 설치 → Solo 플로우 → 카톡 공유 실기기 검증
   6. 카톡 URL 텍스트 붙여넣기 썸네일 검증
4. **Phase D (마무리)**
   1. Linear HM-21 `In Progress → In Review` 전이 + 기획자 재현 요청 코멘트
   2. 기획자 재현 완료 시 `Done` 전이
   3. 후속 이슈 생성 (HM-21-F Food, HM-21-G Group 실기기 검증)

## 후속 이슈 (본 작업 밖)

- **HM-21-F**: Food 결과 카드 실기기 카톡 공유 검증 (OG route 자체는 이번 작업으로 커버되므로 실기기 QA 만 분리)
- **HM-21-G**: Group 결과 카드 실기기 카톡 공유 검증
- **HM-21-3**: OG 카드 디자인 개선 (타이포 튜닝, 별도 아트웍 추가 등) — 실공유 데이터 확인 후 착수 여부 판단

## 참조

- 롤백 경위 및 재설계 스펙: `script.md` (프로젝트 루트)
- 이전 이력: `.claude/context/hm-21-share-card/implementation.md` (롤백된 구현의 설계 결정 기록)
- 구 ADR (Superseded 전이 예정): `.claude/study/adr/2026-04-18/hm-21-share-card-architecture.md`
- 신규 ADR: `.claude/study/adr/2026-04-18/hm-21-og-image-satori.md`
- 재설계 계획 전체(본 문서 원본): `.claude/plans/script-md-swirling-mango.md`
