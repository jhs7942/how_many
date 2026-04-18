# Implementation Context — HM-11 + HM-14 (G1. MapButton 리팩토링)

## 설계 결정

- **유틸 분리**: `openMap(service, query): boolean` 을 `lib/utils.ts`에 추가. 기존 유틸 집중 관례를 따르며, `window.open` null/closed 체크로 best-effort 팝업 차단 감지.
- **컴포넌트 신규**: `components/MapButton.tsx`. 기본 `flex: 1` 로 flex/grid 양쪽 레이아웃에서 호환.
- **testId 규칙**: 기본값 `btn-map-${service}` — 기존 Playwright testId 유지.
- **Toast 연결은 호출부 책임**: `onBlocked` prop만 제공. 호출부가 `useToast`로 연결.
- **group/result는 대상 제외**: 의도적 디자인 차별화(흰 배경+테두리) 유지. `window.open` → `openMap` 유틸만 치환해 HM-14 팝업 차단 대응은 공유.

## 파일 의존

| 파일 | 역할 |
|---|---|
| `lib/utils.ts` | `openMap` + `MapService` export |
| `components/MapButton.tsx` | `openMap` 소비 + 스타일 캡슐화 |
| `components/Toast.tsx` | `useToast` hook + `<Toast>` — 호출부에서 사용 |

## 주의사항

- MapButton 내부 `SERVICE_STYLE`은 카카오·네이버 브랜드 색. 변경 시 두 버튼 스타일이 단일 지점에서 갱신된다.
- `openMap`은 SSR 고려 없음 (호출부가 `'use client'` 컴포넌트). `window.open` 직접 사용.
- FlowDetailResultPage는 기존 `grid + gridTemplateColumns: '1fr 1fr'` 래퍼 유지 — MapButton의 `flex: 1`이 grid 칼럼 안에서도 자연스럽게 차지.
- ResultClient는 `useToast` + `<Toast>` 신규 도입. PageLayout 하위에 렌더 위치 주의.
- group/result의 `handleMapSearch`는 **타입 시그니처 유지** + 내부만 `openMap` 경유로 교체. 스타일 코드는 절대 건드리지 않음.

## 검증 순서

1. `npm run lint`
2. `npm run build`
3. 로컬 `npm run dev` 으로 6경로 수동 클릭 확인: `/solo/result`, `/solo/place/result`, `/food/result`, `/food/detail/result`, `/result/{id}`, `/group/result`
4. Playwright testId 깨지지 않음 확인 — `grep -r "btn-map-" e2e/`

## 커밋 후 작업

- 이 디렉토리 삭제
- Linear HM-11·HM-14 상태 In Progress → In Review 전환 (또는 직커밋 자동 링킹으로 충분하다면 생략)
