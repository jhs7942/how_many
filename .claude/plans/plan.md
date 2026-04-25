# Plan — HM-30 / HM-31 콘텐츠 정책 (2026-04-25)

## 작업 범위

- HM-30: 맛집추천 진입 화면을 7개 카테고리 돌림판으로
- HM-31: 추천 콘텐츠 최대 7개 제한 + 줄뽑기/셔플은 6개 이하만 노출

두 이슈는 같은 정책에서 파생, 1 사이클로 묶어 처리.

## 핵심 결정

### 1. 1차 카테고리(`foods.json`): 12 → 7개로 축소

- 한식 / 중식 / 일식 / 양식 / 동남아 / 멕시칸 / **간편식**
- 치킨/피자/햄버거 → 간편식 통합 (description 명시)
- 카페/디저트 → 제외 (description 명시)
- 분식 → 간편식에 통합 (사용자 결정)

### 2. 세부 메뉴(`menus.json`): 풀은 풍부하게 유지, 렌더 시점에 7개 random sampling

기존: 한식 8 / 중식 5 / 일식 6 등 카테고리별 5~8개 고정 노출
변경: **데이터 풀은 그대로 또는 늘리고**, 화면 진입 시 7개 random sampling

핵심 변경 지점: `components/flow/FlowDetailRandomPage.tsx` — `dataMap[parent]`에서 받은 배열을 7개로 random sample 후 자식 컴포넌트(SpinWheel/SlotMachine 등)에 전달.

효과:
- 매번 다른 메뉴 조합 노출 → 재미 요소 + 재진입 동기
- HM-31 "7개 제한" 정책 충족 (화면 노출 7개)
- PLACE_DATA(Solo place flow)도 동일 컴포넌트 사용 → 자동으로 동일 효과

### 3. 사용자 후보 등록 상한(MAX_COUNT): 8 → 7

3곳에 산재한 상수 일괄 변경.

## 변경 파일

| # | 파일 | 변경 |
|---|---|---|
| 1 | `assets/data/foods.json` | 12개 → 7개 (한식/중식/일식/양식/동남아/멕시칸/간편식) |
| 2 | `assets/data/menus.json` | 분식/카페/디저트 키 제거, 간편식 키 신규(분식+치킨+피자+햄버거 메뉴 통합 = 풀 풍부), 다른 카테고리는 그대로 |
| 3 | `components/flow/FlowDetailRandomPage.tsx` | `dataMap[parent]` 결과를 7개로 random sample 후 표시 |
| 4 | `components/flow/FlowCustomPage.tsx:12` | `MAX_COUNT = 8 → 7` |
| 5 | `app/group/create/page.tsx:59` | `MAX_COUNT = 8 → 7` |
| 6 | `components/CandidateEditor.tsx:22` | 기본 `maxCount = 8 → 7` |

## 검증

- `npm run build` 통과
- food/setting → 7개 카테고리 돌림판
- food/detail/random → 카테고리 선택 시마다 풀에서 다른 7개 메뉴 표시
- 간편식 선택 시 ~22개 풀에서 7개 random sampling
- solo/custom·group/create → 후보 7개 등록 후 8번째 비활성화

## Out of scope

- `pickGameType` 코드 변경 (정책과 이미 일치)
- CLAUDE.md 문구 정정 (별도)
- ACTIVITY_DATA·PLACE_DATA의 1차 항목 7개 초과 정리 — `FlowDetailRandomPage` 샘플링이 PLACE_DATA 자동 커버하므로 추가 작업 불필요

## Linear 인계

- 두 이슈 모두 In Progress → In Review (커밋 후 `/linear:review HM-30 HM-31`)
