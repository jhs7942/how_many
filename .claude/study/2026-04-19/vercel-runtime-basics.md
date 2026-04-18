# Vercel 런타임 기초 — 플랜·Function 유형·Runtime·Bundle·wasm

## 학습 환경
- 날짜: 2026-04-19
- 관련 프로젝트: how_many (v1.1 안정화, HM-21 재설계 과정)
- 기술·버전: Next.js 16.1.7, React 19.2.3, `next/og` (내장 Satori), Vercel Hobby 플랜

## 배경

HM-21 "결과 공유 카드 이미지화"를 카카오 Feed 썸네일용 **서버 OG 이미지 렌더링** 방식으로 재설계·구현했다(`app/result/[id]/opengraph-image.tsx`, `runtime = 'edge'`). 로컬 빌드는 통과했으나 Vercel 배포에서 "image size 제한" 오류 발생.

원인을 파고들다가 다음 용어들이 모두 뒤섞여 등장: Hobby, Edge Function, Serverless Function, Edge runtime, Node.js runtime, bundle size, wasm, cold start, CDN 캐시. 각 용어의 정체와 서로의 관계를 체계적으로 정리할 필요가 생겨 학습 노트로 남긴다.

## 핵심 개념

### 1. Vercel 플랜 (Hobby / Pro / Enterprise)

Vercel 의 **요금제**. 같은 서비스지만 플랜마다 리소스 한도가 다르다.

| 플랜 | 월 요금 | 주 용도 |
|---|---|---|
| **Hobby** | 무료 | 개인·사이드 프로젝트 |
| **Pro** | $20/인 | 스타트업·실무 팀 |
| **Enterprise** | 협의 | 대기업 |

우리 프로젝트는 **Hobby** 사용.

### 2. Runtime (런타임)

"코드가 실제로 실행되는 환경". 같은 JavaScript 코드라도 어디서 실행하느냐에 따라 사용 가능한 기능·속도·크기 제한이 달라진다.

비유: 같은 레시피를 **캠핑장(제한된 도구) vs 정식 주방(풀 세팅 도구)** 중 어디서 조리하는지의 차이.

등장하는 Runtime 두 가지:

| Runtime | 본체 | 사용 가능 기능 | 콜드 스타트 | 크기 한도 |
|---|---|---|---|---|
| **Edge** (`runtime = 'edge'`) | V8 엔진 (브라우저용 경량 JS 엔진) | Web 표준 API만, `fs`·`path` 등 Node API 사용 불가 | 100–500 ms | **작음** |
| **Node.js** (`runtime = 'nodejs'`) | 정식 Node.js | 거의 모든 npm 패키지·Node API 사용 가능 | 1–3 s | **큼** |

### 3. Function 유형 (Edge Function vs Serverless Function)

둘 다 **"요청이 올 때만 실행되는 서버 코드"**. 서버를 24시간 켜두지 않고 호출 시 일시적으로 실행된다 → "serverless".

| 구분 | Edge Function | Serverless Function |
|---|---|---|
| 실행 위치 | 전 세계 Edge 노드 (사용자 근접) | 한 지역의 중앙 서버 (주로 한국이면 인천) |
| 사용 Runtime | **Edge** 전용 | 주로 **Node.js** |
| 콜드 스타트 | 빠름 | 느림 |
| 번들 크기 한도 (Hobby) | **1 MB (압축)** | **50 MB (압축)** |

**관계**: `export const runtime = 'edge'` 를 선언하면 Edge Function 으로 배포, `'nodejs'` 면 Serverless Function 으로 배포. **단 한 줄이 배포 형태 전체를 결정**.

### 4. Bundle (번들)

"배포할 때 하나로 묶인 파일 덩어리". 소스 코드 + 의존 라이브러리 + 에셋(폰트, wasm, 이미지)을 빌드 도구(Next.js/Turbopack)가 묶어 실행 가능한 단위로 만든다.

HM-21 opengraph-image Edge Function 번들 구성 (실측):

```
opengraph-image 번들 (5.2 MB)
├─ JSX/TS 소스 컴파일 결과     : 수십 KB
├─ @vercel/og 라이브러리        : 384 KB
├─ resvg.wasm                   : 1.3 MB   ← 이미지 렌더 엔진
├─ yoga.wasm                    : 88 KB    ← flexbox 레이아웃 엔진
├─ Pretendard-Regular.otf       : 1.5 MB   ← 한글 폰트
└─ Pretendard-Bold.otf          : 1.5 MB
```

### 5. WebAssembly (wasm)

**브라우저·Node·Edge 어디서나 실행 가능한 "빠른 바이너리 코드 포맷"**. JavaScript 보다 계산 빠른 작업(이미지 렌더, 레이아웃 계산, 암호화 등)에 쓴다. C++·Rust 같은 언어를 컴파일해 wasm 형태로 배포.

HM-21 에서 중요한 두 wasm:
- `resvg.wasm`: SVG → PNG 변환 (Rust 기반)
- `yoga.wasm`: flexbox 레이아웃 계산 (Facebook Yoga, C++ 기반)

Satori 가 내부에서 `HTML(JSX) → SVG → (resvg.wasm) → PNG` 순으로 변환할 때 필수 엔진. **번들에서 제외 불가**. 이 둘만 해도 1.4 MB → Edge Hobby 1 MB 한도를 이미 넘는 결정적 원인.

### 6. Cold Start (콜드 스타트)

Serverless/Edge 는 안 쓰는 동안 꺼져있다가 요청이 오면 켜진다. "처음 깨어나는 시간" 이 Cold Start. 두 번째 요청부터는 잠시 깨어있는 동안(warm) 빠르게 응답.

| Runtime | Cold Start |
|---|---|
| Edge | 100–500 ms |
| Node.js Serverless | 1–3 s |

### 7. Edge Network (Vercel CDN 캐시)

Vercel 이 전 세계에 배치한 **캐시 서버망**. 응답 헤더에 `Cache-Control: public, s-maxage=31536000` 같은 캐시 지시가 있으면 Edge Network 가 저장하고, 같은 URL 재요청 시 Function 을 다시 실행하지 않고 캐시에서 바로 응답한다. 공짜·빠름.

HM-21 opengraph-image 는 **1년 immutable 캐시** 적용 → 같은 `result_id` 는 카카오 서버 + Vercel Edge Network 양쪽에 캐시되어 cold start 영향이 실질적으로 **최초 1회**로 수렴.

## 실제 적용

### HM-21 에서의 선택과 변경

**증상**: `runtime = 'edge'` 선언된 opengraph-image 가 Vercel Hobby Edge Function 1 MB 한도를 초과(5.2 MB)해 빌드 실패.

**원인**:
- Hobby 의 Edge Function 한도가 1 MB인데 wasm 엔진만으로 1.4 MB.
- Pretendard OTF 2 개 합 3 MB 추가.
- `fetch(new URL('./fonts/...', import.meta.url))` 패턴이 폰트를 번들에 포함시킴.

**해결 (단 한 줄)**:

```diff
// app/result/[id]/opengraph-image.tsx
- export const runtime = 'edge';
+ export const runtime = 'nodejs';
```

**효과**:
| 항목 | 이전 (edge) | 이후 (nodejs) |
|---|---|---|
| Function 유형 | Edge Function | Serverless Function |
| 번들 한도 (Hobby) | 1 MB | 50 MB |
| 실제 번들 | 5.2 MB (**한도 초과**) | 5.2 MB (**여유**) |
| Cold start | 100–500 ms | 1–3 s |
| Warm 응답 | 20–50 ms | 30–80 ms |
| 사용자 체감 | 카카오 5 s 타임아웃 여유 + 1년 캐시 → 초회만 지연 | 동일 |

### 의사결정 플로우차트

```
서버 OG 이미지 렌더가 필요한가?
  └─ 예
      ├─ Vercel 플랜?
      │   ├─ Hobby → runtime = 'nodejs' (Serverless, 50MB 여유)
      │   ├─ Pro   → runtime = 'edge' (4MB 내면 전 세계 빠른 응답)
      │   └─ Enterprise → 상동
      └─ 번들 크기 체크 (.next/server/edge/ 또는 .next/server/ 하위)
          ├─ @vercel/og 쓰면 최소 1.4MB (wasm 2개)
          ├─ 한글 폰트 번들 포함 시 +1.5MB/파일
          └─ 총합이 플랜 한도 내인지 확인
```

### 실측 방법

```bash
npm run build
# .next/server/edge/ 하위가 Edge Function 번들
# .next/server/ 상위의 별도 경로가 Serverless Function 번들
find .next/server -type f | xargs du -h | sort -hr | head -20
```

## 주의사항

### 혼동 포인트

1. **"1 MB 한도"는 프로젝트 전체가 아니라 각 Edge Function 단위**. 클라이언트 번들·정적 페이지·Serverless Function 은 별도 한도.
2. **Edge Function 자체가 0 개이면 한도 검사 대상도 0 개**. HM-21 전에는 이 프로젝트에 Edge Function 이 없었기 때문에 한도 문제가 없었다. "기존에 1 MB 이하였다가 증가한 게 아니라, 처음으로 5.2 MB 짜리가 하나 생긴 것."
3. **`runtime` export 는 파일 상단에 top-level 로** 써야 한다. 함수 내부에서 조건부로 선언할 수 없다.
4. **Next.js 16 에서 `ImageResponse` 는 `edge`·`nodejs` 두 런타임 모두 공식 지원**. 과거 Next 14 이전에는 Edge 전용이었다.
5. **Node.js Serverless 의 응답 페이로드 한도는 별도로 4.5 MB**. OG 이미지 PNG 가 ~100 KB 수준이라 문제 없음. 단 매우 큰 이미지를 쏜다면 이 한도도 고려.
6. **폰트 포맷**: Satori 는 WOFF2 미지원. TTF·OTF·WOFF 만 허용. 번들 크기 줄이려고 woff2 받아도 에러(`Unsupported OpenType signature wOF2`).

### Edge 의 이점을 포기한 대신 얻는 것

Edge → Node.js 전환 시 포기하는 것:
- 전 세계 저지연 응답 (Edge 는 사용자 근처에서 실행, Serverless 는 보통 한 지역)
- 빠른 콜드 스타트

얻는 것:
- 큰 번들 허용 (50 MB vs 1 MB)
- 더 많은 Node API (fs, path, 대부분의 npm 패키지)

OG 이미지처럼 **응답 캐시가 잘 작동하고 트래픽이 카카오/CDN 경유로 흡수되는 유즈케이스**에서는 Node.js Serverless 가 실용적으로 더 적합한 경우가 많다.

### 번복 조건

다음 상황이 오면 `edge` 재검토:
1. Vercel Pro/Enterprise 업그레이드 → Edge 한도 4 MB 로 확장. 번들 슬림화 후 복귀 가능.
2. 카카오 서버가 OG fetch 에서 Node.js cold start 1–3 s 타임아웃으로 반복 실패 (드물지만 가능). → 캐시 warm 까지 Edge 우회 필요.
3. 트래픽이 글로벌로 확장되어 cold start 지연이 지역별 UX 차이로 체감 → Edge 전환 + 번들 슬림화(폰트 subset, wasm 공유 등) 동시 진행.

## 참고 자료

- Vercel Runtimes: https://vercel.com/docs/functions/runtimes
- Vercel Limits (Hobby/Pro/Enterprise): https://vercel.com/docs/limits
- Next.js `ImageResponse`: https://nextjs.org/docs/app/api-reference/functions/image-response
- Next.js `opengraph-image` 파일 컨벤션: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- Satori (서버 HTML→SVG 렌더): https://github.com/vercel/satori
- @vercel/og 저장소: https://github.com/vercel/og
- Pretendard 폰트: https://github.com/orioncactus/pretendard
- 관련 프로젝트 문서:
  - `.claude/plans/plan.md` (HM-21 재설계 본문)
  - `.claude/plans/construction.md § Part 4` (아키텍처 상세)
  - `.claude/study/adr/2026-04-18/hm-21-og-image-satori.md` (ADR)
