# ADR (Architecture Decision Record)

## 학습 환경
- 날짜: 2026-04-18
- 관련 프로젝트: how_many (HM-21 결과 공유 카드 이미지화 설계 중)
- 기술·버전: 개발 방법론 (기술 스택 무관)

## 배경

HM-21 작업의 construction.md에 라이브러리 선택과 공유 API 접근 두 곳에 **대안 비교 테이블**이 등장하면서 프로젝트의 CLAUDE.md ADR Rule이 트리거됐다. "ADR로 기록할까요?"라는 제안을 받고 ADR이라는 용어 자체가 궁금해져 학습하게 됐다.

단순히 문서 한 장 더 쓰는 부담이 아니라, 왜 이런 관행이 존재하는지·언제 쓰는 게 가치가 있는지를 이해해두면 앞으로 설계 결정을 내릴 때마다 판단할 수 있다.

## 핵심 개념

### ADR이란

**Architecture Decision Record**의 약자. 소프트웨어 설계에서 내린 **중요한 기술적 결정과 그 근거**를 짧은 문서로 남기는 관행이다. 2011년 Michael Nygard의 블로그 글 "Documenting Architecture Decisions"에서 대중화됐다.

### 왜 필요한가

코드에는 **결정의 결과**만 남고 **왜 그렇게 결정했는지**는 남지 않는다. 시간이 지나면 다음과 같은 문제가 반복된다:

- 6개월 뒤 같은 논의를 처음부터 다시 함
- 이미 기각된 대안을 모르고 다시 시도함
- 결정 당시 있던 제약(버전·팀 상황·비용)이 바뀌었는데도 과거 결정을 맹목적으로 따름
- 새로 합류한 팀원이 "왜 이렇게 돼 있지?"를 끝없이 질문함

ADR은 **결정 당시의 맥락을 박제**해서 이 낭비를 막는 장치다.

### 표준 구조 (Michael Nygard 포맷)

| 섹션 | 내용 |
|---|---|
| 제목 | 짧은 동사구 (예: "html-to-image 라이브러리 채택") |
| 상태 | Proposed / Accepted / Deprecated / Superseded by ADR-XXX |
| 맥락 | 왜 이 결정이 필요한가? 어떤 제약·요구가 있었나? |
| 결정 | 우리가 선택한 것 |
| 대안 | 고려했지만 기각한 선택지와 그 이유 |
| 결과 | 긍정·부정·향후 번복 조건 |

### 상태 전이

```
Proposed   → 제안 단계, 논의 중
Accepted   → 승인됨, 현재 활성
Deprecated → 더 이상 권장 안 되지만 현재 코드에 잔존
Superseded → 새 ADR이 이 결정을 대체 (ADR-003 → ADR-007 링크)
```

ADR은 **삭제하지 않는다**. 결정을 바꿀 때는 기존 ADR의 상태를 `Superseded by ADR-NNN`으로 바꾸고, 새 ADR이 앞선 결정을 참조한다. 역사를 지우지 않는 것이 ADR의 핵심.

### 언제 기록하는가

| 기록 ✅ | 기록 불필요 ❌ |
|---|---|
| 여러 후보 중 하나를 선택 | 유일한 선택지 (대안 없음) |
| 되돌리기 어려운 결정 (DB 스키마, 인증 방식) | 내일 쉽게 바꿀 수 있는 스타일 결정 |
| 논쟁이 있던 결정 | 명백한 best practice 적용 |
| 트레이드오프가 명시적 | "이게 표준이니까" 수준 |

**트레이드오프 테이블(대안 2개 이상 비교)이 등장했는가**가 가장 실용적인 트리거 기준이다. 프로젝트 CLAUDE.md도 이 기준을 자동 감지 조건으로 삼는다.

### 길이

**1페이지가 이상적**. 2페이지 초과하면 ADR이 아니라 설계 문서로 성격이 바뀐다. ADR의 가치는 "나중에 빠르게 훑어볼 수 있다"는 점이라, 길면 읽히지 않는다.

## 실제 적용

### HM-21에 대입

| ADR 섹션 | 실제 내용 |
|---|---|
| 제목 | "공유 카드 이미지 생성 — html-to-image 채택" |
| 상태 | Accepted |
| 맥락 | 결과 화면 공유 카드 필요. 번들 +50KB 이내, React 19 호환, linear-gradient·system emoji 지원 필요 |
| 결정 | html-to-image (동적 import) + @capacitor/share Share Sheet 통합 |
| 대안 | html2canvas / dom-to-image-more / 서버사이드 Satori OG |
| 결과 | +30KB 번들, 이모지 OS별 차이 허용, 서버 OG 기능은 HM-21-2로 이연 |

### 보관 위치

프로젝트마다 다르지만 흔한 패턴:
- `docs/adr/NNN-decision-title.md` (넘버링 순차)
- `.claude/study/adr/YYYY-MM-DD/{결정-이름}.md` (이 프로젝트 규칙, 날짜별)

이 프로젝트는 후자를 채택. CLAUDE.md의 ADR Rule이 경로·템플릿·자동 감지 조건을 명시한다.

### ADR 도구

수동으로 마크다운을 쓰는 게 기본이지만, 도구화된 사례도 있다:
- [adr-tools](https://github.com/npryce/adr-tools) — `adr new "제목"` 명령으로 템플릿 생성
- [Log4brains](https://github.com/thomvaill/log4brains) — ADR을 정적 사이트로 렌더
- Notion / Confluence / GitHub Issues 템플릿

이 프로젝트는 `.claude/templates/study-note-adr-template.md`를 활용하는 정적 파일 방식.

## 주의사항

### 결정 "후"에 쓰지 말고 "중"에 쓴다
결정이 완료된 뒤 사후 정리용으로 쓰면 "왜 그랬는지" 기억이 흐려져 형식적 문서가 된다. **논의 중에 실시간으로 쓰면서 결정**하는 것이 이상적. 글을 쓰면서 논리 허점이 드러나는 효과도 크다.

### ADR 번호는 충돌 관리가 필요
여러 사람이 동시에 ADR을 만들면 번호가 겹친다. 번호 대신 날짜+슬러그(`2026-04-18-share-card-library`)로 충돌을 회피하는 방식이 이 프로젝트 규칙.

### 너무 사소한 것을 ADR로 만들지 않는다
"변수명을 camelCase로 한다" 수준은 ADR 아니라 스타일 가이드에 들어간다. **번복 시 영향 범위가 넓은 것**만 ADR 대상.

### 대안을 기각하는 "이유"가 핵심
"html2canvas를 기각했다"만 쓰면 의미 없음. **"gzip 45KB로 번들 목표 초과, 일부 OS에서 이모지 렌더 깨짐"** 처럼 기각 근거를 구체적으로 쓴다. 미래의 누군가가 "그때 번들 목표가 달랐다면?"을 판단할 수 있어야 한다.

### 감정·자존심이 아닌 제약을 기록한다
"팀 A가 html2canvas를 좋아해서"는 안 된다. "팀 A는 번들 크기에 민감해서 html2canvas보다 작은 대안을 선호했다"처럼 **객관 제약**으로 재기술한다.

## 참고 자료

- [Documenting Architecture Decisions — Michael Nygard (2011)](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) — ADR 포맷의 원전
- [adr.github.io](https://adr.github.io/) — 여러 ADR 포맷 비교 (Nygard / MADR / Y-Statement 등)
- [MADR (Markdown Any Decision Records)](https://adr.github.io/madr/) — Nygard 포맷의 확장판, 더 상세
- [ThoughtWorks Technology Radar — Lightweight ADRs](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)
- 프로젝트 내: `~/.claude/templates/study-note-adr-template.md`, `CLAUDE.md § 📐 ADR Rule`
