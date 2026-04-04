# 기술 구현 계획

---

## Part 1. 앱 아이콘 교체 및 빌드

### 1. 아이콘 파일 복사

#### 소스 경로
`/Users/jeonghyeonseung/Downloads/몇명이니_아이콘 (1)/res/`

#### 파일명 매핑 (한국어 → Android 리소스 규칙 영문)

| 원본 파일명 | 대상 파일명 |
|------------|------------|
| `몇명이니_아이콘.png` | `ic_launcher.png` + `ic_launcher_round.png` |
| `몇명이니_아이콘_adaptive_back.png` | `ic_launcher_background.png` |
| `몇명이니_아이콘_adaptive_fore.png` | `ic_launcher_foreground.png` |

#### 대상 디렉토리 (5개 해상도)
```
android/app/src/main/res/mipmap-hdpi/
android/app/src/main/res/mipmap-mdpi/
android/app/src/main/res/mipmap-xhdpi/
android/app/src/main/res/mipmap-xxhdpi/
android/app/src/main/res/mipmap-xxxhdpi/
```

### 2. Adaptive Icon XML 수정

#### 파일: `mipmap-anydpi-v26/ic_launcher.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

#### 파일: `mipmap-anydpi-v26/ic_launcher_round.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

### 3. 릴리스 빌드

```bash
# Next.js static export + Capacitor 동기화
cd /Users/jeonghyeonseung/workspaces/how_many
npm run build:android

# AAB 빌드
cd android
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
```

#### 빌드 출력
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- 서명: `android/key.properties` + `android/howmany-release.keystore` 사용

---

## Part 2. 맛집 랜덤 선택 기능

### Step 1. 데이터 파일 생성

#### `assets/data/foods.json`
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

#### `assets/data/menus.json`
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
  "일식": [
    {"label": "초밥", "emoji": "🍣"},
    {"label": "라멘", "emoji": "🍜"},
    {"label": "우동", "emoji": "🍜"},
    {"label": "돈카츠", "emoji": "🍖"},
    {"label": "규동", "emoji": "🥩"},
    {"label": "오마카세", "emoji": "🍱"}
  ],
  "양식": [
    {"label": "파스타", "emoji": "🍝"},
    {"label": "스테이크", "emoji": "🥩"},
    {"label": "리조또", "emoji": "🍚"},
    {"label": "샐러드", "emoji": "🥗"},
    {"label": "스프", "emoji": "🍲"}
  ],
  "분식": [
    {"label": "떡볶이", "emoji": "🌶️"},
    {"label": "순대", "emoji": "🍢"},
    {"label": "튀김", "emoji": "🍤"},
    {"label": "김밥", "emoji": "🍙"},
    {"label": "라볶이", "emoji": "🍜"},
    {"label": "엽기떡볶이", "emoji": "🔥"}
  ],
  "치킨": [
    {"label": "후라이드", "emoji": "🍗"},
    {"label": "양념치킨", "emoji": "🍗"},
    {"label": "간장치킨", "emoji": "🍗"},
    {"label": "파닭", "emoji": "🍗"},
    {"label": "뿌링클", "emoji": "🍗"},
    {"label": "치즈볼", "emoji": "🧀"}
  ],
  "피자": [
    {"label": "페퍼로니", "emoji": "🍕"},
    {"label": "마르게리따", "emoji": "🍕"},
    {"label": "콤비네이션", "emoji": "🍕"},
    {"label": "불고기피자", "emoji": "🍕"},
    {"label": "포테이토", "emoji": "🍕"}
  ],
  "햄버거": [
    {"label": "빅맥", "emoji": "🍔"},
    {"label": "와퍼", "emoji": "🍔"},
    {"label": "더블패티", "emoji": "🍔"},
    {"label": "치킨버거", "emoji": "🍗"},
    {"label": "쉑쉑버거", "emoji": "🍔"},
    {"label": "스매시버거", "emoji": "🍔"}
  ],
  "카페": [
    {"label": "아메리카노", "emoji": "☕"},
    {"label": "라떼", "emoji": "🥛"},
    {"label": "에이드", "emoji": "🍹"},
    {"label": "스무디", "emoji": "🥤"},
    {"label": "딸기라떼", "emoji": "🍓"}
  ],
  "디저트": [
    {"label": "케이크", "emoji": "🎂"},
    {"label": "마카롱", "emoji": "🍬"},
    {"label": "와플", "emoji": "🧇"},
    {"label": "빙수", "emoji": "🍧"},
    {"label": "아이스크림", "emoji": "🍦"},
    {"label": "타르트", "emoji": "🥧"}
  ],
  "동남아": [
    {"label": "쌀국수", "emoji": "🍜"},
    {"label": "팟타이", "emoji": "🍜"},
    {"label": "반미", "emoji": "🥖"},
    {"label": "나시고랭", "emoji": "🍚"},
    {"label": "똠얌꿍", "emoji": "🍲"}
  ],
  "멕시칸": [
    {"label": "타코", "emoji": "🌮"},
    {"label": "부리또", "emoji": "🌯"},
    {"label": "나초", "emoji": "🧀"},
    {"label": "케사디아", "emoji": "🫓"},
    {"label": "과카몰리", "emoji": "🥑"}
  ]
}
```

#### `assets/data/food-tips.json`
```json
{
  "한식": "🍚 반찬 가짓수와 국물 맛으로 맛집을 판단해보세요!",
  "중식": "🥟 짜장면은 곱빼기, 짬뽕은 해물이 포인트!",
  "일식": "🍣 점심 특선 메뉴가 가성비 좋아요!",
  "양식": "🍝 파스타는 면 익힘 정도가 맛집의 기준!",
  "분식": "🍢 즉석 조리가 신선함의 포인트예요!",
  "치킨": "🍗 배달보다 홀에서 먹으면 더 바삭해요!",
  "피자": "🍕 화덕 피자는 도우가 핵심이에요!",
  "햄버거": "🍔 수제버거는 패티 두께가 맛을 결정해요!",
  "카페": "☕ 원두 원산지를 체크해보세요!",
  "디저트": "🍰 SNS 유명 디저트는 웨이팅 각오하세요!",
  "동남아": "🍜 고수 추가 여부 미리 확인하세요!",
  "멕시칸": "🌮 살사 소스 맵기 조절이 가능한지 확인해요!",
  "default": "🍽️ 새로운 메뉴에 도전해보는 건 어떨까요?"
}
```

---

### Step 2. `lib/data.ts` 확장

기존 `ACTIVITY_DATA`, `PLACE_DATA` 아래에 추가:

```typescript
import foodsJson from '@/assets/data/foods.json';
import menusJson from '@/assets/data/menus.json';

export const ALL_FOODS: ActivityItem[] = foodsJson;
export const MENU_DATA: Record<string, ActivityItem[]> = menusJson;
```

---

### Step 3. `ActivityPresetPicker` — `title` prop 추가

파일: `components/ActivityPresetPicker.tsx`

`"추천 활동 빠른 선택"` 하드코딩 텍스트를 prop으로 교체:

```typescript
interface ActivityPresetPickerProps {
  activities: ActivityItem[];
  selected: ActivityItem[];
  maxCount: number;
  onToggle: (activity: ActivityItem) => void;
  title?: string; // 기본값: "추천 활동 빠른 선택"
}
```

JSX 내 텍스트 변경:
```tsx
// Before
<div>추천 활동 빠른 선택</div>

// After
<div>{title ?? '추천 활동 빠른 선택'}</div>
```

---

### Step 4. 공용 컴포넌트 추출 (`components/flow/`)

기존 `solo/*` 페이지들의 공통 로직을 추출. 각 컴포넌트는 Client Component (`'use client'`).

#### 4-1. `FlowSettingPage`
파일: `components/flow/FlowSettingPage.tsx`

```typescript
interface FlowOption {
  mode: string;
  emoji: string;
  title: string;
  desc: string;
}

interface FlowSettingPageProps {
  title: string;
  description: string;
  options: FlowOption[];
  onSelect: (mode: string) => void;
}
```

- 기존 `solo/setting/page.tsx`의 카드 선택 UI 추출
- `onSelect` 콜백으로 mode 전달, 라우팅은 부모(페이지)가 담당

#### 4-2. `FlowCustomPage`
파일: `components/flow/FlowCustomPage.tsx`

```typescript
interface FlowCustomPageProps {
  presets: ActivityItem[];
  presetTitle?: string;        // ActivityPresetPicker title prop
  defaultCandidates?: ActivityItem[];
  backHref: string;
  nextHref: string;
  sessionKey: string;          // 예: 'soloCandidates' | 'foodCandidates'
}
```

- 기존 `solo/custom/page.tsx` 로직 추출
- `CandidateEditor` + `ActivityPresetPicker` 조합
- "다음" 클릭 시 `session.set(sessionKey, candidates)` 후 `router.push(nextHref)`

#### 4-3. `FlowLocationPage`
파일: `components/flow/FlowLocationPage.tsx`

```typescript
interface FlowLocationPageProps {
  backHref: string;
  nextHref: string;
  sessionKey: string;          // 예: 'soloLocation' | 'foodLocation'
}
```

- 기존 `solo/location/page.tsx` 로직 추출
- 위치 텍스트 입력 + 건너뛰기 버튼
- `session.set(sessionKey, location)` 후 `router.push(nextHref)`

#### 4-4. `FlowRandomPage`
파일: `components/flow/FlowRandomPage.tsx`

```typescript
interface FlowRandomSessionKeys {
  candidates: string;   // 예: 'soloCandidates' | 'foodCandidates'
  location: string;     // 예: 'soloLocation' | 'foodLocation'
  activity: string;     // 예: 'activity' | 'foodActivity'
  resultId: string;     // 예: 'soloResultId' | 'foodResultId'
}

interface FlowRandomPageProps {
  backHref: string;
  sessionKeys: FlowRandomSessionKeys;
  resultHref: string;
}
```

- 기존 `solo/random/page.tsx` 로직 추출
- `pickGameType()` 호출 → SpinWheel/ContentShuffle/SlotMachine/RopePull 렌더
- 결과 시 `saveResult()` + `session.set(sessionKeys.activity, winner)` + `router.push(resultHref)`

#### 4-5. `FlowResultPage`
파일: `components/flow/FlowResultPage.tsx`

```typescript
interface FlowResultSessionKeys {
  activity: string;
  location: string;
  resultId: string;
}

interface FlowResultPageProps {
  backHref: string;
  sessionKeys: FlowResultSessionKeys;
  resultTitle?: string;          // 예: '오늘의 활동' | '오늘의 맛집'
  retryHref: string;
  detailHref?: string;           // 세부 뽑기로 이동 (optional)
  detailLabel?: string;          // 버튼 텍스트 (예: '세부 메뉴 뽑기')
  tipData?: Record<string, string>; // 카테고리별 팁
}
```

- 기존 `solo/result/page.tsx` 로직 추출
- 당첨 항목 표시 + 카카오/네이버 지도 검색 + 공유 + 다시 뽑기
- `detailHref` 있으면 "세부 메뉴 뽑기" 버튼 추가 렌더

#### 4-6. `FlowDetailRandomPage`
파일: `components/flow/FlowDetailRandomPage.tsx`

```typescript
interface FlowDetailSessionKeys {
  parentActivity: string;  // 1차 결과 (예: 'foodActivity')
  activity: string;        // 2차 결과 저장 키 (예: 'foodDetailActivity')
  resultId: string;        // 예: 'foodDetailResultId'
}

interface FlowDetailRandomPageProps {
  backHref: string;
  dataMap: Record<string, ActivityItem[]>;  // MENU_DATA 또는 PLACE_DATA
  sessionKeys: FlowDetailSessionKeys;
  resultHref: string;
}
```

- `session.get(sessionKeys.parentActivity)` → 카테고리 확인
- `dataMap[category]`에서 세부 후보 로드
- 4종 게임 실행 → 결과 저장 → `router.push(resultHref)`

#### 4-7. `FlowDetailResultPage`
파일: `components/flow/FlowDetailResultPage.tsx`

```typescript
interface FlowDetailResultPageProps {
  backHref: string;
  sessionKeys: {
    activity: string;         // 2차 결과 키
    resultId: string;
    parentActivity: string;   // 1차 결과 (부모 표시용)
  };
  retryHref: string;
}
```

- 1차 결과(카테고리) + 2차 결과(세부 메뉴) 함께 표시
- 지도 검색: `${parentLabel} ${detailLabel}` 조합으로 검색

---

### Step 5. 기존 solo 페이지 리팩토링

공용 컴포넌트 추출 후 기존 solo 페이지를 얇은 래퍼로 전환. 동작 변경 없음.

| 기존 파일 | 사용할 공용 컴포넌트 |
|-----------|---------------------|
| `app/solo/setting/page.tsx` | `FlowSettingPage` |
| `app/solo/custom/page.tsx` | `FlowCustomPage` |
| `app/solo/location/page.tsx` | `FlowLocationPage` |
| `app/solo/random/page.tsx` | `FlowRandomPage` |
| `app/solo/result/page.tsx` | `FlowResultPage` |
| `app/solo/place/spin/page.tsx` | `FlowDetailRandomPage` |
| `app/solo/place/result/page.tsx` | `FlowDetailResultPage` |

Solo 페이지 래퍼 예시:
```tsx
// app/solo/random/page.tsx
import FlowRandomPage from '@/components/flow/FlowRandomPage';

export default function SoloRandomPage() {
  return (
    <FlowRandomPage
      backHref="/solo/location"
      sessionKeys={{
        candidates: 'soloCandidates',
        location: 'soloLocation',
        activity: 'activity',
        resultId: 'soloResultId',
      }}
      resultHref="/solo/result"
    />
  );
}
```

---

### Step 6. food 페이지 생성

신규 파일 생성. 모두 공용 컴포넌트를 사용하는 얇은 래퍼.

#### `app/food/setting/page.tsx`
```tsx
'use client';
import { useRouter } from 'next/navigation';
import { ALL_FOODS } from '@/lib/data';
import { session } from '@/lib/session';
import FlowSettingPage from '@/components/flow/FlowSettingPage';

export default function FoodSettingPage() {
  const router = useRouter();
  return (
    <FlowSettingPage
      title="맛집 결정"
      description="어떻게 메뉴를 정할까요?"
      options={[
        { mode: 'default', emoji: '🍽️', title: '추천 메뉴로 뽑기', desc: '인기 음식 카테고리 중 랜덤으로' },
        { mode: 'custom', emoji: '✏️', title: '직접 입력하기', desc: '먹고 싶은 메뉴를 직접 입력' },
      ]}
      onSelect={(mode) => {
        session.set('foodMode', mode);
        if (mode === 'default') {
          session.set('foodCandidates', ALL_FOODS);
          router.push('/food/location');
        } else {
          router.push('/food/custom');
        }
      }}
    />
  );
}
```

#### `app/food/custom/page.tsx`
```tsx
import FlowCustomPage from '@/components/flow/FlowCustomPage';
import { ALL_FOODS } from '@/lib/data';

export default function FoodCustomPage() {
  return (
    <FlowCustomPage
      presets={ALL_FOODS}
      presetTitle="음식 카테고리 빠른 선택"
      backHref="/food/setting"
      nextHref="/food/location"
      sessionKey="foodCandidates"
    />
  );
}
```

#### `app/food/location/page.tsx`
```tsx
import FlowLocationPage from '@/components/flow/FlowLocationPage';

export default function FoodLocationPage() {
  return (
    <FlowLocationPage
      backHref="/food/setting"
      nextHref="/food/random"
      sessionKey="foodLocation"
    />
  );
}
```

#### `app/food/random/page.tsx`
```tsx
import FlowRandomPage from '@/components/flow/FlowRandomPage';

export default function FoodRandomPage() {
  return (
    <FlowRandomPage
      backHref="/food/location"
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

#### `app/food/result/page.tsx`
```tsx
import FlowResultPage from '@/components/flow/FlowResultPage';
import foodTipsJson from '@/assets/data/food-tips.json';

export default function FoodResultPage() {
  return (
    <FlowResultPage
      backHref="/food/setting"
      sessionKeys={{
        activity: 'foodActivity',
        location: 'foodLocation',
        resultId: 'foodResultId',
      }}
      resultTitle="오늘의 맛집"
      retryHref="/food/setting"
      detailHref="/food/detail/random"
      detailLabel="세부 메뉴 뽑기"
      tipData={foodTipsJson}
    />
  );
}
```

#### `app/food/detail/random/page.tsx`
```tsx
import FlowDetailRandomPage from '@/components/flow/FlowDetailRandomPage';
import { MENU_DATA } from '@/lib/data';

export default function FoodDetailRandomPage() {
  return (
    <FlowDetailRandomPage
      backHref="/food/result"
      dataMap={MENU_DATA}
      sessionKeys={{
        parentActivity: 'foodActivity',
        activity: 'foodDetailActivity',
        resultId: 'foodDetailResultId',
      }}
      resultHref="/food/detail/result"
    />
  );
}
```

#### `app/food/detail/result/page.tsx`
```tsx
import FlowDetailResultPage from '@/components/flow/FlowDetailResultPage';

export default function FoodDetailResultPage() {
  return (
    <FlowDetailResultPage
      backHref="/food/result"
      sessionKeys={{
        activity: 'foodDetailActivity',
        resultId: 'foodDetailResultId',
        parentActivity: 'foodActivity',
      }}
      retryHref="/food/detail/random"
    />
  );
}
```

---

### Step 7. 홈 화면 수정 (`app/page.tsx`)

기존 카드(혼자 결정, 같이 결정, 참여하기) 아래에 구분선 + 맛집 결정 카드 추가:

```tsx
{/* 구분선 */}
<div style={{ width: '100%', height: 1, background: 'var(--color-border)', margin: '8px 0' }} />

{/* 맛집 결정 카드 */}
<Link href="/food/setting" style={{
  display: 'flex', alignItems: 'center', gap: 16,
  padding: '20px 24px', borderRadius: 16,
  background: '#FFF', border: '1.5px solid #FFE0CC',
  textDecoration: 'none', color: 'var(--color-text)',
}}>
  <span style={{ fontSize: 40 }}>🍽️</span>
  <div>
    <div style={{ fontWeight: 700, fontSize: 18 }}>맛집 결정</div>
    <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>오늘 뭐 먹지? 랜덤으로 정해요</div>
  </div>
</Link>
```

---

### Step 8. CLAUDE.md 업데이트

`CLAUDE.md`의 "두 가지 사용자 플로우" 섹션에 맛집 플로우 추가:

```
맛집 결정 (Food)
  /food/setting → /food/custom → /food/location → /food/random → /food/result
                                                               ↘ /food/detail/random → /food/detail/result
```

sessionStorage 키 목록에 신규 키 추가:

| 키 | 설정 위치 | 사용 위치 |
|----|-----------|-----------|
| `foodMode` | food/setting | food/custom |
| `foodCandidates` | food/setting, food/custom | food/random |
| `foodLocation` | food/location | food/random, food/result |
| `foodActivity` | food/random | food/result, food/detail/random |
| `foodResultId` | food/random | food/result |
| `foodDetailActivity` | food/detail/random | food/detail/result |
| `foodDetailResultId` | food/detail/random | food/detail/result |
