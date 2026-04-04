# 코드 리뷰: 맛집 랜덤 선택 기능 (food flow) + solo 리팩토링

## 변경 범위
- 변경 파일: 24개 (신규 7 flow 컴포넌트, 7 food 라우트, 수정된 solo 라우트 7개, data.ts, ActivityPresetPicker.tsx, page.tsx, JSON 3개)
- 관련 기능: food 플로우 전체 (setting -> custom/location -> random -> result -> detail/random -> detail/result), solo 플로우 공용 컴포넌트 리팩토링

## 발견 사항

### [HIGH] solo/spin/page.tsx - Hydration Error #418 위반

- 파일: `app/solo/spin/page.tsx:19-20`
- 문제: `session.get<number>('people')`이 `useEffect` 밖 컴포넌트 최상위 스코프에서 직접 호출되고 있음. CLAUDE.md에 명시된 Hydration 주의사항을 정면으로 위반하며, SSR 시 `window === undefined`로 `null`을 반환하고 클라이언트에서는 실제 값을 반환하므로 Hydration 불일치가 발생할 수 있음.
  ```tsx
  // 현재 코드 (19-20번째 줄)
  const people = session.get<number>('people') ?? 4;
  const segments = ACTIVITY_DATA[people] ?? ACTIVITY_DATA[4];
  ```
- 수정: `useState` + `useEffect` 패턴으로 변경 필요:
  ```tsx
  const [segments, setSegments] = useState(ACTIVITY_DATA[4]);
  useEffect(() => {
    const p = session.get<number>('people') ?? 4;
    setSegments(ACTIVITY_DATA[p] ?? ACTIVITY_DATA[4]);
  }, []);
  ```
- 비고: 이 파일은 리팩토링 대상에서 누락된 레거시 페이지로, 새 flow 컴포넌트(FlowRandomPage)에서는 올바르게 useEffect 내부에서 호출하고 있음. 단, `/solo/spin` 라우트가 여전히 사용되고 있다면 문제가 됨.

### [HIGH] solo/custom/page.tsx - FlowCustomPage와의 중복 / 리팩토링 미완

- 파일: `app/solo/custom/page.tsx` (전체)
- 문제: `FlowCustomPage` 공용 컴포넌트가 정확히 동일한 기능을 제공하는데, `solo/custom/page.tsx`는 리팩토링하지 않고 원본 코드를 그대로 유지하고 있음. food/custom은 `FlowCustomPage`를 사용하지만 solo/custom은 직접 구현. 이로 인해:
  - 향후 CandidateEditor 관련 변경 시 양쪽을 모두 수정해야 하는 유지보수 부담
  - FlowCustomPage에서 발생하는 버그 수정이 solo/custom에 반영되지 않을 위험
- 수정: solo/custom도 FlowCustomPage 래퍼로 전환:
  ```tsx
  import FlowCustomPage from '@/components/flow/FlowCustomPage';
  import { ALL_ACTIVITIES } from '@/lib/data';

  export default function SoloCustomPage() {
    return (
      <FlowCustomPage
        presets={ALL_ACTIVITIES}
        backHref="/solo/setting"
        nextHref="/solo/location"
        sessionKey="soloCandidates"
      />
    );
  }
  ```

### [HIGH] solo 플로우 경로 불일치 - location 뒤로가기가 people을 가리킴

- 파일: `app/solo/location/page.tsx:6`
- 문제: `backHref="/solo/people"`로 설정되어 있으나, custom 모드(직접 입력)에서 진입할 경우 올바른 뒤로가기 경로는 `/solo/custom`이어야 함. people 선택은 default 모드에서만 거치는 단계임. 사용자가 직접 입력 -> 위치 입력 화면에서 뒤로가기를 누르면 인원 선택 화면(people)으로 이동하게 되어 혼란 발생.
- 수정: session에서 `soloMode`를 읽어 분기하거나, `solo/custom/page.tsx`에서 location 대신 바로 random으로 가도록 플로우를 조정해야 함.

### [HIGH] FlowRandomPage - 빈 후보 배열로 게임 시작 가능한 경쟁 상태

- 파일: `components/flow/FlowRandomPage.tsx:147`
- 문제: `candidates` 배열이 빈 상태일 때 로딩 화면을 보여주지만, `testMode && !gameType` 분기가 먼저 평가되므로 테스트 모드에서는 candidates가 비어 있어도 게임 타입 선택 화면이 노출됨. 게임 타입 선택 후 빈 후보로 게임 컴포넌트(SpinWheel, SlotMachine 등)가 렌더링될 수 있음.
- 수정: 테스트 모드 분기에서도 candidates 길이 체크를 추가:
  ```tsx
  if (testMode && !gameType && candidates.length > 0) { ... }
  ```

### [MEDIUM] FlowSettingPage의 onSelect에서 session 직접 호출 - Hydration 안전하지만 아키텍처 불일치

- 파일: `app/food/setting/page.tsx:20-23`, `app/solo/setting/page.tsx:19`
- 문제: `onSelect` 콜백 내부에서 `session.set()`을 호출하는데, 이는 사용자 클릭(이벤트 핸들러) 내부이므로 Hydration 문제는 없음. 그러나 FlowSettingPage 컴포넌트 자체는 session을 import하지 않으면서 부모가 직접 session에 접근하는 패턴이 food/solo 간 다르게 적용됨. solo/setting은 `soloMode`만 저장하지만, food/setting은 `foodMode` + `foodCandidates`를 저장함. 이 차이가 명시적으로 문서화되어 있지 않아 혼동 가능.
- 수준: 동작상 문제는 없으나, 플로우 간 일관성 측면에서 주의 필요.

### [MEDIUM] sessionStorage 키 관리 분산 - 키 충돌 없으나 관리 어려움

- 파일: 전체 flow 컴포넌트 및 라우트 페이지
- 문제: sessionStorage 키가 문자열 리터럴로 분산되어 있음:
  - solo: `soloMode`, `soloCandidates`, `soloLocation`, `activity`, `soloResultId`, `people`, `place`, `placeResultId`
  - food: `foodMode`, `foodCandidates`, `foodLocation`, `foodActivity`, `foodResultId`, `foodDetailActivity`, `foodDetailResultId`
  - 공통: `splashSeen`, `devTestMode`
  - **충돌은 없음** (solo는 `solo` 접두사, food는 `food` 접두사). 단, solo의 `activity`와 `place` 키만 접두사가 없어 향후 다른 플로우 추가 시 충돌 가능성 있음.
- 수정: 상수 객체로 키를 중앙 관리하면 타이핑 실수 방지 + 자동완성 가능:
  ```tsx
  export const SESSION_KEYS = {
    solo: { mode: 'soloMode', candidates: 'soloCandidates', ... },
    food: { mode: 'foodMode', candidates: 'foodCandidates', ... },
  } as const;
  ```

### [MEDIUM] FlowCustomPage - defaultCandidates가 빈 배열일 때 "다음" 버튼 비활성화

- 파일: `app/food/custom/page.tsx:9`
- 문제: `defaultCandidates={[]}`로 전달하면 초기 candidates가 빈 배열이 되어, 사용자가 프리셋에서 2개 이상을 직접 선택하기 전까지 "다음" 버튼이 비활성화됨. 이는 의도된 동작으로 보이나, solo/custom(FlowCustomPage 미사용)에서는 기본 2개(카페, 영화)가 있어 UX 일관성이 다름. food에서 빈 배열 시작이 의도된 것이라면 문제 없음.
- 수준: UX 의도 확인 필요 (기능적 버그는 아님).

### [MEDIUM] FlowDetailResultPage - 카카오 공유 기능 누락

- 파일: `components/flow/FlowDetailResultPage.tsx`
- 문제: FlowResultPage에는 카카오 공유 버튼(`sendKakaoMessage`)이 있으나, FlowDetailResultPage에는 링크 복사만 있고 카카오 공유가 빠져 있음. 2차 결과(세부 메뉴)도 공유하고 싶은 사용자 입장에서 기능 누락으로 느껴질 수 있음.
- 수준: 기능 완성도 이슈 (의도적 생략일 수 있음).

### [LOW] FlowDetailResultPage - border/cursor 스타일 누락

- 파일: `components/flow/FlowDetailResultPage.tsx:126-162`
- 문제: 지도 검색 버튼과 하단 액션 버튼들에 `border: 'none'`과 `cursor: 'pointer'`가 일부 누락됨. 기본 `<button>` 스타일이 브라우저마다 다르게 보일 수 있음.
- 수정: 모든 `<button>` 요소에 `border: 'none'`, `cursor: 'pointer'` 일관 적용.

### [LOW] solo의 activity 키가 접두사 없음 - 네이밍 불일치

- 파일: `app/solo/random/page.tsx:10`, `app/solo/result/page.tsx:9`
- 문제: solo 플로우에서 1차 결과 키가 `'activity'`이고 food에서는 `'foodActivity'`. solo 쪽도 `'soloActivity'`로 통일하는 것이 향후 확장에 유리하나, 기존 호환성을 위해 변경 시 solo/spin, solo/place 등 기존 연관 코드도 모두 수정 필요.
- 수준: 네이밍 컨벤션 불일치 (현재 동작에 영향 없음).

## 리뷰 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 0 | pass |
| HIGH | 4 | warn |
| MEDIUM | 4 | info |
| LOW | 2 | note |

### HIGH 이슈 요약
1. **solo/spin Hydration 위반**: session.get()이 컴포넌트 최상위에서 호출됨 (CLAUDE.md 규칙 위반)
2. **solo/custom 리팩토링 누락**: FlowCustomPage 공용 컴포넌트 전환 미완료 (코드 중복)
3. **solo/location 뒤로가기 경로 오류**: custom 모드에서 진입 시 people로 잘못 이동
4. **FlowRandomPage 테스트 모드 빈 후보**: candidates 빈 상태에서 게임 선택 가능

### Verdict: Warning

CRITICAL 보안 이슈는 없으나, HIGH 이슈 4건이 존재합니다.
- Hydration 오류(#1)는 런타임 버그로 이어질 수 있으므로 수정 권장
- 뒤로가기 경로(#3)는 사용자 경험에 직접 영향
- 나머지는 주의하여 머지 가능하나, 빠른 후속 작업 권장
