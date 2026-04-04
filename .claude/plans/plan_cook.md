# 맛집 랜덤 선택 기능 구현 계획

## 개요
기존 "활동 결정" 플로우와 별도로 "맛집 결정" 전용 플로우를 추가한다.
랜덤 게임 컴포넌트와 공용 컴포넌트는 100% 재사용하되, solo/food 간 중복되는 페이지 로직은 **공용 컴포넌트로 추출**하여 코드 중복을 최소화한다.

## 확정된 요구사항

| 항목 | 결정 |
|------|------|
| 데이터 형태 | **카테고리 + 세부 메뉴** 2단계 (한식 → 김치찌개, 된장찌개 등) |
| 데이터 구조 | **인원수 무관 단일 카테고리 목록** (음식은 인원수에 의존하지 않으므로) |
| 진입 경로 | **홈 화면에 별도 "맛집 결정" 카드** 추가 |
| 그룹 적용 | **Solo만 MVP**. Group 맛집 모드는 Future |
| 지도 연결 | **기존 방식 유지** (위치 입력 시 카카오맵/네이버맵 검색 버튼 표시) |
| 코드 구조 | **공용 컴포넌트 추출** — solo와 food가 동일 로직을 공유 |
| 2차 랜덤 | **4종 게임 전체** 사용 (1차와 동일) |

## 사용자 플로우

```
맛집 결정 (Solo)
  홈 → /food/setting → /food/custom → /food/location → /food/random → /food/result
                                                                     ↘ /food/detail/random → /food/detail/result (세부 메뉴)
```

인원수 기반이 아니므로 `/food/people` 단계는 없음. 진입 시 바로 카테고리 선택(custom) 또는 프리셋 선택.

### 상세 플로우

1. **홈** (`/`): "맛집 결정" 카드 클릭 → `/food/setting`
2. **설정** (`/food/setting`): "추천 메뉴로 뽑기" vs "직접 입력하기" 선택
   - "추천 메뉴로 뽑기": 전체 음식 카테고리를 후보로 자동 세팅 → `/food/location`
   - "직접 입력하기": `/food/custom`으로 이동
3. **직접 입력** (`/food/custom`): CandidateEditor로 음식/맛집 직접 입력. 음식 카테고리 프리셋 제공
4. **위치 입력** (`/food/location`): 위치 입력 (선택, 건너뛰기 가능)
5. **랜덤 게임** (`/food/random`): 4종 게임 중 랜덤 선택하여 실행
6. **결과** (`/food/result`): 당첨 음식 카테고리 표시 + 지도 검색 + 공유 + "세부 메뉴 뽑기" 버튼
7. **세부 메뉴 뽑기** (`/food/detail/random` → `/food/detail/result`): 당첨된 카테고리의 세부 메뉴로 2차 랜덤 (4종 게임)

## 공용 컴포넌트 추출 계획

solo와 food 페이지가 공유하는 패턴을 공용 컴포넌트로 추출한다.

### 추출 대상

| 공용 컴포넌트 | 역할 | props |
|--------------|------|-------|
| `FlowSettingPage` | 모드 선택 (추천 vs 직접입력) | `title`, `description`, `options: {mode, emoji, title, desc}[]`, `onSelect` |
| `FlowCustomPage` | 후보 편집 + 프리셋 선택 | `presets: ActivityItem[]`, `presetTitle`, `defaultCandidates`, `backHref`, `nextHref`, `sessionKey` |
| `FlowLocationPage` | 위치 입력 | `backHref`, `nextHref`, `sessionKey` |
| `FlowRandomPage` | 4종 게임 실행 | `backHref`, `sessionKeys: {candidates, location, activity, resultId}`, `resultHref` |
| `FlowResultPage` | 결과 표시 + 공유 + 지도 | `backHref`, `sessionKeys`, `resultTitle`, `detailHref?`, `detailLabel?`, `retryHref`, `tipData` |
| `FlowDetailRandomPage` | 2차 랜덤 (세부 데이터) | `backHref`, `dataMap`, `sessionKeys`, `resultHref` |
| `FlowDetailResultPage` | 2차 결과 표시 | `backHref`, `sessionKeys`, `parentSessionKey`, `retryHref` |

### 적용 방식

각 `/solo/*` 및 `/food/*` 페이지는 공용 컴포넌트를 import하고 적절한 props만 전달하는 얇은 래퍼가 된다.

```tsx
// app/food/random/page.tsx (예시)
import FlowRandomPage from '@/components/flow/FlowRandomPage';

export default function FoodRandomPage() {
  return (
    <FlowRandomPage
      backHref="/food/setting"
      sessionKeys={{
        candidates: 'foodCandidates',
        location: 'foodLocation',
        activity: 'foodActivity',
        resultId: 'foodResultId',
      }}
      resultHref="/food/result"
    />
  );
}
```

## 신규 데이터 파일

### `assets/data/foods.json`
음식 카테고리 단일 목록 (인원수 무관):
```json
[
  {"label": "한식", "emoji": "🍚"},
  {"label": "중식", "emoji": "🥟"},
  {"label": "일식", "emoji": "🍣"},
  {"label": "양식", "emoji": "🍝"},
  {"label": "분식", "emoji": "🍢"},
  {"label": "치킨", "emoji": "🍗"},
  {"label": "피자", "emoji": "🍕"},
  {"label": "햄버거", "emoji": "🍔"},
  {"label": "카페", "emoji": "☕"},
  {"label": "디저트", "emoji": "🍰"},
  {"label": "동남아", "emoji": "🍜"},
  {"label": "멕시칸", "emoji": "🌮"}
]
```

### `assets/data/menus.json`
음식 카테고리별 세부 메뉴:
```json
{
  "한식": [
    {"label": "김치찌개", "emoji": "🍲"},
    {"label": "된장찌개", "emoji": "🫕"},
    {"label": "비빔밥", "emoji": "🍚"},
    {"label": "삼겹살", "emoji": "🥓"},
    {"label": "냉면", "emoji": "🍜"},
    {"label": "불고기", "emoji": "🥩"},
    {"label": "제육볶음", "emoji": "🔥"},
    {"label": "순대국", "emoji": "🍜"}
  ],
  "중식": [
    {"label": "짜장면", "emoji": "🍜"},
    {"label": "짬뽕", "emoji": "🌶️"},
    {"label": "탕수육", "emoji": "🍖"},
    {"label": "마라탕", "emoji": "🥘"},
    {"label": "양꼬치", "emoji": "🍢"}
  ],
  ...
}
```

### `assets/data/food-tips.json`
음식 카테고리별 추천 팁:
```json
{
  "한식": "🍚 반찬 가짓수와 국물 맛으로 맛집을 판단해보세요!",
  "중식": "🥟 짜장면은 곱빼기, 짬뽕은 해물이 포인트!",
  "일식": "🍣 점심 특선 메뉴가 가성비 좋아요!",
  "default": "🍽️ 새로운 메뉴에 도전해보는 건 어떨까요?"
}
```

## lib/data.ts 변경

```typescript
import foodsJson from '@/assets/data/foods.json';
import menusJson from '@/assets/data/menus.json';

// 음식 카테고리 목록 (인원수 무관, 단일 배열)
export const ALL_FOODS: ActivityItem[] = foodsJson;

// 음식 카테고리별 세부 메뉴
export const MENU_DATA: Record<string, ActivityItem[]> = menusJson;
```

## 홈 화면 변경 (`app/page.tsx`)

기존 카드(혼자 결정, 같이 결정, 참여하기) 아래에 구분선 + "맛집 결정" 카드 추가:
```tsx
<Link href="/food/setting" style={...}>
  <span style={{ fontSize: 40 }}>🍽️</span>
  <div>
    <div>맛집 결정</div>
    <div>오늘 뭐 먹지? 랜덤으로 정해요</div>
  </div>
</Link>
```

## sessionStorage 키 (신규)

| 키 | 설정 위치 | 사용 위치 |
|----|-----------|-----------|
| `foodMode` | food/setting | food/custom |
| `foodCandidates` | food/setting, food/custom | food/random |
| `foodLocation` | food/location | food/random, food/result |
| `foodActivity` | food/random | food/result, food/detail/random |
| `foodResultId` | food/random | food/result |
| `foodDetailActivity` | food/detail/random | food/detail/result |
| `foodDetailResultId` | food/detail/random | food/detail/result |

## ActivityPresetPicker 보완

컴포넌트 내부의 `"추천 활동 빠른 선택"` 하드코딩 텍스트를 `title` prop으로 변경:
```tsx
interface ActivityPresetPickerProps {
  activities: ActivityItem[];
  selected: ActivityItem[];
  maxCount: number;
  onToggle: (activity: ActivityItem) => void;
  title?: string;  // 추가
}
// 기본값: "추천 활동 빠른 선택"
```

## Result 구분 처리

`saveResult()` 호출 시 구분을 위해:
- 결과 공유 페이지(`/result/[id]`)에서 `winner_label`이 음식 카테고리에 해당하는지 확인하거나
- 또는 `location` 필드 존재 여부로 맛집/활동을 유추하여 타이틀을 동적으로 표시

DB 스키마 변경 없이 처리 가능한 방향 우선 적용.

## 구현 순서

1. **데이터 파일 생성**: `foods.json`, `menus.json`, `food-tips.json`
2. **lib/data.ts 확장**: `ALL_FOODS`, `MENU_DATA` 추가
3. **ActivityPresetPicker 보완**: `title` prop 추가
4. **공용 컴포넌트 추출** (`components/flow/`):
   - 기존 solo 페이지의 공통 로직을 추출
   - `FlowSettingPage`, `FlowCustomPage`, `FlowLocationPage`, `FlowRandomPage`, `FlowResultPage`
5. **기존 solo 페이지 리팩토링**: 공용 컴포넌트를 사용하도록 전환 (동작 변경 없음)
6. **food 페이지 생성**: 공용 컴포넌트를 사용하는 얇은 래퍼
7. **2차 랜덤 페이지**: food/detail/random → food/detail/result
8. **홈 화면 수정**: 맛집 결정 카드 추가
9. **CLAUDE.md 업데이트**: 맛집 플로우 문서 반영

## 재사용 컴포넌트 (변경 없음)

- `SpinWheel`, `ContentShuffle`, `SlotMachine`, `RopePull` — 랜덤 게임 4종
- `CandidateEditor` — 후보 입력/편집
- `BackButton`, `PageLayout` — 레이아웃
- `Toast` / `useToast` — 알림

## 재사용 유틸 (변경 없음)

- `pickGameType()`, `session.ts`, `copyToClipboard()`, `getAppBaseUrl()`, `saveResult()`

## 범위 외 (Future)

- Group 맛집 투표 모드
- 카카오 Local API 연동 (실제 식당 랜덤 뽑기)
- 방문 이력 기반 "새로운 곳만" 추천
- 메뉴 월드컵 토너먼트 모드
- 가격대/거리 필터
- 상황 기반 필터 (점심/저녁/야식/회식/데이트)

## 요구사항 검증 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| 모순/충돌 | **PASS** | 기존 활동 결정과 독립적인 별도 플로우 |
| 모호성 | **PASS** | 데이터 구조(단일 목록), 게임 타입(4종), 코드 구조(공용화) 모두 확정 |
| 품질 목표 | **PASS** | 기존 앱과 동일 스택, 반응형 디자인 유지 |
| MVP 범위 | **PASS** | Solo 맛집 플로우만. 적정 규모 |
| 기술 실현성 | **PASS** | 신규 기술 도입 없음, 기존 코드 호환 |
| 의존성 | **PASS** | 공용 컴포넌트 추출 → solo 리팩토링 → food 페이지 순서 확정 |
