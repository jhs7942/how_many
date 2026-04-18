# HM-21 결과 공유 카드 — 이미지 생성 라이브러리 및 공유 API 채택

## 결정 환경
- 날짜: 2026-04-18
- 관련 프로젝트: how_many (v1.1 안정화 단계)
- 기술 영역: 클라이언트 이미지 생성, 네이티브 공유 API, React 19 + Next.js 16 + Capacitor 8

## 맥락

Linear 이슈 HM-21: "결과 공유 카드 이미지화 (SNS 바이럴)". 결과 화면의 정보를 PNG 이미지로 생성해 카톡 대화방·인스타 등에 공유할 수 있게 만든다. 기획자 코멘트로 스코프가 **1단계 클라이언트 카드 생성**으로 축소됨 (서버사이드 OG는 HM-21-2로 이연).

### 제약 조건

| 영역 | 제약 |
|---|---|
| 번들 크기 | +50KB gzip 이내 (NF2) |
| 생성 시간 | 중급 Android에서 1,000ms 이내 (NF1) |
| 프레임워크 | React 19.2 + Next.js 16.1 환경 호환 |
| 플랫폼 | 1단계 Web + Android. iOS는 후속 |
| 저장소 | Android 15 Scoped Storage (targetSdkVersion=36) |
| CSS 요구 | linear-gradient 배경, system emoji 렌더 필요 |
| 기존 의존 | `@capacitor/share` 이미 설치 |

### 해결해야 할 두 가지 결정

1. **이미지 생성 라이브러리**: DOM → PNG 변환 방식
2. **저장·공유 API**: 생성된 PNG를 사용자가 공유하는 경로

## 검토한 대안

### 결정 1 — 이미지 생성 라이브러리

| 대안 | 장점 | 단점 |
|---|---|---|
| **html-to-image** ✅ | gzip ~30KB로 작음. SVG foreignObject 방식으로 현대 CSS 지원 양호. 활발히 유지보수됨. React 19 호환 확인 | Canvas tainted 대비 `crossOrigin` 설정 필요 (본 작업은 로컬 이모지만 써서 영향 없음) |
| html2canvas | 문서·레퍼런스 풍부. 오래된 브라우저 호환성 ↑ | gzip ~45KB로 번들 목표 근접. Canvas 에뮬레이션 방식이라 gradient·backdrop-filter 일부 미지원. 일부 Android에서 system emoji 렌더 시 깨짐 보고 |
| dom-to-image-more | html-to-image와 유사한 접근 | 최근 커밋 간격 길고 React 19 호환 미확인. 유지보수 활성도 낮음 |
| 서버사이드 Satori + OG 이미지 | 완벽한 렌더 제어. 카카오톡 미리보기까지 지원 | 서버 인프라 필요 (Vercel Edge / Image API). 1단계 스코프 초과 |

### 결정 2 — 저장·공유 API

| 대안 | Web 경로 | Android 경로 | 장점 | 단점 |
|---|---|---|---|---|
| **Share Sheet 통합** ✅ | `navigator.share({files})` | `Filesystem(Cache)` + `Share.share({files})` | 단일 API, 사용자 선택 범위(카톡·갤러리·...) 최대, Scoped Storage 권한 불필요 | Web의 `navigator.share` 파일 지원이 브라우저별 상이 (fallback 필요) |
| 직접 다운로드만 | `<a download>` | `Filesystem.writeFile(Documents)` | 구현 단순 | Android 15 Scoped Storage 권한 플로우 필요, "갤러리로 내보내기" 추가 마찰 |
| MediaStore 직접 통합 | — | 커스텀 네이티브 플러그인 | 갤러리 표시 완벽 | 네이티브 플러그인 개발·유지보수 비용, Capacitor 생태계 벗어남 |

## 최종 결정

**html-to-image + Share Sheet 통합** 채택.

### 결정 1: `html-to-image`
- 번들 ~30KB (NF2 범위 내 여유 20KB)
- SVG foreignObject 방식이 linear-gradient·system emoji를 Canvas 에뮬레이션보다 정확히 렌더
- React 19 환경에서 실사용 사례 확인
- `useShareImage` 훅 내부에서 `await import('html-to-image')`로 동적 로드 → 초기 번들 영향 없음

### 결정 2: Share Sheet 통합
- `@capacitor/share` 이미 설치되어 있어 추가 의존 없음
- Android: `Filesystem.writeFile(Directory.Cache)` → `Share.share({files:[uri]})` → 임시 파일 삭제. Scoped Storage 우회
- Web: `navigator.canShare` 체크 후 분기, 미지원 시 `<a download>` fallback
- 기존 "링크 복사" 버튼을 Share Sheet에 흡수해 UX 마찰 최소

## 트레이드오프

### 포기한 것
- **이모지 OS별 렌더 일관성**: Twemoji 강제 적용을 포기하고 system emoji 허용. Android(Noto Color) ↔ iOS(Apple Color) 이모지 모양이 카드마다 다르게 나올 수 있음. 카드 구조가 단순해 영향 미미하다고 판단
- **카카오톡 이미지 직접 첨부**: 카톡 feed template은 URL 기반이라 로컬 이미지 첨부 불가. 기존 링크 공유 방식 유지. 이미지 공유는 Share Sheet 경유
- **서버사이드 퍼포먼스·정합성**: Satori OG 대비 클라이언트 렌더는 기기 성능 영향 받음. 중급 Android에서 1,000ms 이내를 NF1으로 설정해 대응, 초과 시 720×720으로 해상도 하향 대안 확보
- **갤러리 저장 직결**: Share Sheet에서 사용자가 "이미지 저장"을 선택해야 갤러리로 감. 한 번의 추가 탭

### 감수하는 리스크
- `html-to-image` 동적 import 실패 시 공유 기능 전체 장애 → try/catch + 링크 공유 자동 fallback으로 완화
- Share Sheet가 웹에서 실패할 수 있음 → `<a download>` fallback
- Canvas CORS tainting → 외부 이미지 사용 금지 정책으로 회피

## 예상 영향

### 긍정
- 번들 크기 여유로 추가 기능(예: 미리보기 모달) 수용 가능
- 공용 훅 `useShareImage` 설계로 Food/Group 확장 시 버튼 훅업만 추가하면 완료 (HM-21-F, HM-21-G 비용 최소화)
- 카톡 공유 → Share Sheet → 이미지 전송 경로가 사용자 실제 행동 패턴과 일치 → 바이럴 전환율 기대

### 부정
- 클라이언트 렌더 의존이라 저사양 기기 성능 의존
- 이모지 렌더 차이를 데이터로 확인하려면 실기기 테스트 필수
- 카톡 미리보기(URL 미리보기 카드) 개선은 HM-21-2 이후에나 가능

### 번복 조건

다음 중 하나가 발생하면 재검토:
1. 실기기 생성 시간이 1,500ms 초과 지속 → Satori 기반 서버사이드 OG로 전환
2. 이모지 렌더 차이에 대한 사용자 불만이 누적 → Twemoji 강제 적용 ADR 신규 작성
3. `html-to-image` 유지보수 중단 → dom-to-image-more 또는 서버 렌더로 전환

## 상태

**Superseded by `hm-21-og-image-satori.md` (2026-04-18)**

최초 Accepted 된 당일 같은 날 번복됨. 이유:
- 사용자가 기대한 UX 는 "카카오 Feed 썸네일에 결과 카드 노출"이었으나, 본 ADR 의 `html-to-image` + Share Sheet 조합으로는 카톡이 요구하는 **서버 공개 URL** 을 제공할 수 없어 달성 불가.
- "카톡 미리보기는 HM-21-2 이후"로 이연한 것이 실제로는 **1단계 성공 기준 그 자체**였음.
- 번복 조건 중 "이모지 OS 별 렌더 차이"도 Twemoji 강제로 해결하는 방향으로 재결정.

재설계된 선택:
- Next 16 `next/og` (내장 Satori) + Edge runtime + Supabase anon key + Pretendard + Twemoji
- 1200×630 가로형(Meta OG 표준) 으로 비율 변경
- 자세한 내용은 동일 디렉토리 `hm-21-og-image-satori.md` 참조

## 참조

- plan: `.claude/plans/plan.md` (2026-04-18)
- construction: `.claude/plans/construction.md § Part 3 § 9·10`
- Linear 이슈: HM-21 (https://linear.app/wqeqw/issue/HM-21)
- 기획자 코멘트(2026-04-17): 클라이언트 1단계 우선 요청
