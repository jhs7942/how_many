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

---

## Part 3. HM-21 결과 공유 카드 이미지화 1단계 (2026-04-18) — ⚠️ Deprecated

> **Deprecated — 2026-04-18 롤백 (commit `1e5d1cd`)**.
> 이 Part 3 는 클라이언트 `html-to-image` + `@capacitor/share` 파일 전송 기반의 1단계 설계다.
> 실제 사용자가 기대한 UX 는 "카카오 Feed 썸네일에 카드가 노출"되는 것이었고, 현재 설계로는 달성 불가 → 전면 재설계됨.
> 재설계 스펙은 **§ Part 4** 참조. 아래 내용은 이력으로만 보존한다. 재도입 금지.

Linear 이슈: HM-21
대응 plan: `.claude/plans/plan.md` (2026-04-18 작성본)

### 1. 아키텍처 개요

결과 페이지(`FlowResultPage`)의 "공유" 액션이 다음 5개 모듈을 경유해 이미지 생성 → 미리보기 → 네이티브 Share Sheet 전달을 수행한다.

```
FlowResultPage
   │  activity, tipData
   ▼
[공유 버튼 onClick]
   │
   ▼
useShareImage (훅)
   │  ①오프스크린 DOM 마운트
   │  ②html-to-image로 PNG 생성
   │  ③Blob 반환
   ▼
SharePreviewModal (컴포넌트)
   │  사용자 확인
   ▼
useShareImage.share()
   │  분기:
   │   - Capacitor: Filesystem.writeFile(Cache) → Share.share({files:[uri]}) → 임시파일 정리
   │   - Web: navigator.share({files:[File]}) → 미지원 시 <a download> fallback
   ▼
OS Share Sheet → 사용자 선택(카톡·갤러리·...)
```

### 2. 파일 구조

| 파일 | 역할 | 신규/수정 |
|---|---|---|
| `lib/hooks/useShareImage.ts` | 이미지 생성·공유 공용 훅 | 신규 |
| `components/ShareCard.tsx` | 오프스크린 공유 카드 DOM (1080×1080) | 신규 |
| `components/SharePreviewModal.tsx` | 공유 전 미리보기 모달 | 신규 |
| `lib/constants/shareCard.ts` | 카드 스타일 상수 (색상·크기·폰트) | 신규 |
| `components/flow/FlowResultPage.tsx` | "공유" 버튼 훅업, 기존 "링크 복사" 버튼 흡수 | 수정 |
| `package.json` | `html-to-image`, `@capacitor/filesystem` 추가 | 수정 |

### 3. 공용 훅 인터페이스 — `useShareImage`

```ts
// lib/hooks/useShareImage.ts
interface ShareCardData {
  emoji: string;        // activity.emoji
  label: string;        // activity.label
  tip?: string;         // tipData에서 찾은 팁 (없으면 undefined)
}

interface UseShareImageReturn {
  generate: (data: ShareCardData) => Promise<Blob>;
  share: (blob: Blob, filename?: string) => Promise<void>;
  isGenerating: boolean;
  isSharing: boolean;
  error: ShareError | null;
}

type ShareError =
  | { kind: 'render_failed'; cause: unknown }
  | { kind: 'permission_denied' }
  | { kind: 'save_failed'; cause: unknown }
  | { kind: 'share_unsupported' };

export function useShareImage(): UseShareImageReturn;
```

- `generate`: `ShareCard` DOM을 offscreen에 마운트하고 `html-to-image.toBlob()` 호출. `await import('html-to-image')` 동적 import로 초기 번들 제외
- `share`: Capacitor/Web 환경 분기. 실패 시 `ShareError` 반환

### 4. 공유 카드 컴포넌트 — `ShareCard`

팁 유무에 따른 분기 레이아웃을 단일 컴포넌트 내에 구현한다.

```tsx
// components/ShareCard.tsx
interface ShareCardProps {
  emoji: string;
  label: string;
  tip?: string;  // undefined → 팁 영역 숨김 + 수직 중앙 재배치
}
```

- **offscreen 마운트**: `position: fixed; left: -99999px; top: 0;` + `ref` — 렌더 타겟 용도만
- **고정 크기**: `width: 1080px; height: 1080px;` (디바이스 뷰포트 무관)
- **레이아웃 분기**:
  - `tip` 있음: 이모지(520px) · 컨텐츠명(128px) · 팁(44px, line-clamp:2) 수직 배열
  - `tip` 없음: 이모지 + 컨텐츠명을 수직 중앙 정렬

### 5. 미리보기 모달 — `SharePreviewModal`

```tsx
interface SharePreviewModalProps {
  blob: Blob | null;         // null이면 생성 중
  onConfirm: () => void;     // Share Sheet 트리거
  onClose: () => void;
  isSharing: boolean;        // 공유 중 버튼 disabled
}
```

- `URL.createObjectURL(blob)`로 `<img src>` 표시, 언마운트 시 `revokeObjectURL`
- 포커스 트랩 + ESC 닫기 (NF3 접근성)
- 모달 외곽 탭으로 닫기 허용

### 6. 스타일 상수 — `lib/constants/shareCard.ts`

```ts
export const SHARE_CARD = {
  width: 1080,
  height: 1080,
  bg: 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)',
  emoji: { size: 520 },
  label: { size: 128, weight: 800, color: '#FFFFFF' },
  tip:   { size: 44,  color: 'rgba(255,255,255,0.8)', maxLines: 2 },
  padding: 80,
} as const;
```

화면 카드(`FlowResultPage` result-card)는 이 상수를 **참조하지 않음** — 공유 카드 전용.

### 7. 데이터 플로우

```
FlowResultPage
  activity = session.get<{label,emoji}>(sessionKeys.activity)
  tip = tipData ? (tipData[activity.label] ?? tipData['default']) : undefined

  onClick(공유):
    blob = await generate({ emoji, label, tip })
    openPreview(blob)
    onConfirm:
      await share(blob, `howmany-${activity.label}.png`)
```

- `tipData` 자체가 `undefined`인 경로(Group 등)에서는 `tip`도 `undefined` → `ShareCard`에서 팁 영역 숨김 분기
- 1단계에서 Solo만 사용하므로 실제 `tipData` 항상 있음. Food/Group 확장 시 경로 검증 필요

### 8. 플랫폼 분기 상세

#### Web (`navigator.share` 지원 브라우저)

```ts
const file = new File([blob], filename, { type: 'image/png' });
if (navigator.canShare?.({ files: [file] })) {
  await navigator.share({ files: [file] });
} else {
  // fallback: <a download>
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

#### Capacitor (Android)

```ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const base64 = await blobToBase64(blob);
const result = await Filesystem.writeFile({
  path: filename,
  data: base64,
  directory: Directory.Cache,
});
await Share.share({
  files: [result.uri],
  dialogTitle: '결과 공유',
});
await Filesystem.deleteFile({ path: filename, directory: Directory.Cache });
```

- `Directory.Cache` — Android 15 Scoped Storage 대응. 앱 전용 임시 공간이라 권한 불필요
- 공유 후 즉시 삭제로 누적 방지

### 9. 라이브러리 선택 — 트레이드오프

| 후보 | gzip | CSS 지원 | React 19 | 이모지 렌더 | 비고 |
|---|---|---|---|---|---|
| **html-to-image** ✅ | ~30KB | foreignObject 방식, 현대 CSS 양호 | OK | system emoji 정상 | 채택 |
| html2canvas | ~45KB | Canvas 에뮬레이션, gradient 지원 제한 | OK | 일부 OS 깨짐 | |
| dom-to-image-more | ~35KB | html-to-image와 유사 | 확인 안 됨 | 유사 | 유지보수 활발도 낮음 |
| 서버사이드 Satori + OG | 0 (client) | React 컴포넌트 직접 렌더 | OK | 완벽 제어 | 인프라 필요 — HM-21-2로 분리 |

**채택 근거**: `html-to-image`는 번들·품질·React 19 호환성·유지보수 활성도 전부 균형. linear-gradient 배경·시스템 이모지만 쓰는 본 작업 스펙에 제약 없음.

### 10. 저장·공유 API 선택 — 트레이드오프

| 접근 | Web | Android | 장점 | 단점 |
|---|---|---|---|---|
| **Share Sheet 통합** ✅ | `navigator.share` | `@capacitor/share` + `Filesystem` | 단일 API, 사용자 선택 범위 최대 | Web의 `navigator.share` 파일 지원 브라우저 제한 (fallback 필요) |
| 직접 다운로드만 | `<a download>` | `Filesystem.writeFile(Documents)` | 구현 단순 | Android 15 Scoped Storage 권한 필요, UX 마찰 ↑ |
| MediaStore 직접 | — | Custom native plugin | 갤러리 통합 완벽 | 네이티브 플러그인 개발 비용 |

**채택 근거**: Share Sheet 경로가 Scoped Storage 우회 + UX 마찰 최소 + 카톡 등 SNS 직결. 웹 미지원 환경은 `<a download>` fallback.

### 11. 에러 처리 매핑

| `ShareError.kind` | 발생 지점 | 사용자 메시지 | 후속 동작 |
|---|---|---|---|
| `render_failed` | `html-to-image.toBlob` 예외 | "이미지 생성에 실패했어요" | 모달 닫기, 기존 링크 공유로 안내 |
| `permission_denied` | Capacitor Share 취소 | (메시지 없음 — 사용자 의도) | 모달 유지 |
| `save_failed` | `Filesystem.writeFile` 예외 | "저장에 실패했어요" | 모달 닫기 |
| `share_unsupported` | 웹 `canShare` false + download도 실패 | "이 기기에서는 공유할 수 없어요" | 링크 복사 fallback |

### 12. 번들 크기 제어

- `html-to-image`는 `useShareImage` 내부에서 동적 import
  ```ts
  const { toBlob } = await import('html-to-image');
  ```
- 공유 버튼 첫 클릭 시점에 로드 → 초기 번들에 영향 없음
- `@capacitor/filesystem`은 Capacitor 환경에서만 로드되도록 조건부 import (web 빌드 제외)

### 13. 테스트 전략

| 레이어 | 도구 | 범위 |
|---|---|---|
| 유닛 | — (브라우저 기능 의존) | 해당 없음 |
| 컴포넌트 시각 | Playwright screenshot | `ShareCard` 팁 있음/없음/최장31자/default fallback 4 시나리오 |
| E2E | Playwright | Solo 결과 → 공유 버튼 → 미리보기 모달 노출 확인 (다운로드는 실기기 검증) |
| 실기기 | 수동 | Android AAB 설치 → Share Sheet → 카톡 대화방 전송 end-to-end |

Playwright에서 `navigator.share` 자체는 테스트 제한적 — 미리보기 모달 노출·이미지 blob 생성 여부까지 자동화, OS Share Sheet 이후는 수동.

### 14. 기존 `FlowResultPage` 수정 지점

현재 버튼 영역 구조 (components/flow/FlowResultPage.tsx:145-240):

```
버튼 영역
├─ [세부 뽑기] (optional)
├─ [링크 복사] ← Share Sheet로 교체
├─ [카카오 공유] ← 유지
├─ [다시 돌리기]
└─ [홈]
```

변경 후:

```
버튼 영역
├─ [세부 뽑기] (optional)
├─ [공유] (신규 — 이미지 생성 + Share Sheet) ← 기존 링크 복사 버튼 위치
├─ [카카오 공유] ← 유지
├─ [다시 돌리기]
└─ [홈]
```

- `handleShare` 기존 로직은 훅으로 이관, 버튼 `onClick`에서 `useShareImage.generate → preview.open` 호출
- 카카오 공유는 1단계에서 건드리지 않음 (서버 이미지 URL 필요, HM-21-2에서 해결)

### 15. 1단계 완료 후 Food/Group 확장 시 변경점

| 대상 | 필요한 변경 |
|---|---|
| `FlowResultPage`의 Food 진입점 | 동일한 버튼 훅업. 1단계에서 작업한 파일 그대로 재사용 |
| `app/group/result/page.tsx` | 별도 컴포넌트이므로 `useShareImage` + `SharePreviewModal`을 직접 import. `tipData` 없으므로 자동으로 팁 숨김 레이아웃 적용 |
| `ShareCard` | 수정 없음 — `tip: undefined` 분기가 이미 Group 용도를 커버함 |

이 설계로 1단계 배포 후 확장 이슈(HM-21-F, HM-21-G)는 **버튼 훅업 변경만으로 완료**.

---

## Part 4. HM-21 재설계 — 카카오 Feed 썸네일 기반 OG 이미지 (2026-04-18)

> Part 3 의 전면 대체. Linear 이슈: HM-21
> 대응 plan: `.claude/plans/plan.md` (2026-04-18 재작성본)
> 재설계 스크립트: `script.md` (프로젝트 루트)

### 1. 아키텍처 개요

카카오 Feed Template 의 `imageUrl` 은 **서버 공개 URL 에서 이미지를 가져오는 방식**이다. 따라서 `/result/{id}/opengraph-image` 라는 Edge route 를 두고, 카카오가 이 URL 로 GET 요청을 보냈을 때 1200×630 PNG 를 동적으로 응답한다.

```
[사용자 Android 앱] FlowResultPage "카카오 공유" onClick
   │
   ▼
sendKakaoMessage({
  imageUrl: https://how-many-mauve.vercel.app/result/{id}/opengraph-image,
  imageWidth: 1200, imageHeight: 630,
  link: { mobileWebUrl: .../result/{id}, webUrl: 동일 },
  ...
})
   │
   ▼
[카카오 서버] imageUrl 로 GET 요청
   │
   ▼
[Vercel Edge] app/result/[id]/opengraph-image.tsx
   ① params.id 로 Supabase results 조회 (winner_label, winner_emoji)
   ② tips.json 매칭으로 tip 획득
   ③ Pretendard 폰트 fetch (캐시)
   ④ Satori ImageResponse 1200×630 PNG 반환 (Cache-Control: 1y immutable)
   │
   ▼
[카카오 서버] 수신한 PNG 를 Feed 썸네일로 첨부
   │
   ▼
[수신자 카톡] Feed 메시지 썸네일 노출 → 클릭 시 link.mobileWebUrl 이동
```

추가로 `generateMetadata` 로 `<head>` 에 `og:image` 를 주입해 **카톡 대화방에 URL 을 텍스트로 붙여넣어도** 자동 미리보기 썸네일이 노출되게 한다.

### 2. 파일 구조

| 파일 | 역할 | 신규/수정 |
|---|---|---|
| `app/result/[id]/opengraph-image.tsx` | Edge route, 1200×630 PNG 응답 | 신규 |
| `lib/og/loadFont.ts` | Pretendard 폰트 ArrayBuffer 로드 | 신규 |
| `lib/constants/shareCard.ts` | 카드 크기·색상 상수 | 신규 (재설계 버전) |
| `public/fonts/Pretendard-Regular.woff2` | 한글 폰트 (Regular) | 신규 |
| `public/fonts/Pretendard-Bold.woff2` | 한글 폰트 (Bold) | 신규 |
| `app/result/[id]/page.tsx` | `generateMetadata` 추가, Supabase 서버 조회 | 수정 |
| `lib/kakao.ts` | Feed Template 에 `imageWidth`·`imageHeight` 명시 | 수정 |
| `components/flow/FlowResultPage.tsx` | `handleKakaoShare` 에 절대 `imageUrl` 주입 | 수정 |
| `next.config.ts` | `NEXT_STATIC_EXPORT=true` 시 opengraph-image 제외 | 수정 |

### 3. Edge route — `app/result/[id]/opengraph-image.tsx`

Next.js 16 App Router 의 파일 컨벤션. `opengraph-image.tsx` 는 동일 segment 의 OG 이미지를 담당한다.

```tsx
import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import tipsJson from '@/assets/data/tips.json';
import foodTipsJson from '@/assets/data/food-tips.json';
import { loadPretendard } from '@/lib/og/loadFont';
import { SHARE_CARD } from '@/lib/constants/shareCard';

export const runtime = 'edge';
export const alt = '몇명이니 결과 카드';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = { params: Promise<{ id: string }> };

export default async function OgImage({ params }: Params) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase
    .from('results')
    .select('winner_label, winner_emoji')
    .eq('id', id)
    .maybeSingle();

  const label = data?.winner_label ?? '결과';
  const emoji = data?.winner_emoji ?? '🎉';
  const tip =
    (tipsJson as Record<string, string>)[label]
    ?? (foodTipsJson as Record<string, string>)[label]
    ?? (tipsJson as Record<string, string>)['default']
    ?? '몇명이니로 결정했어요!';

  const [regular, bold] = await loadPretendard();

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        background: SHARE_CARD.bg,
        padding: SHARE_CARD.padding,
        fontFamily: 'Pretendard',
      }}>
        <div style={{
          fontSize: SHARE_CARD.emoji.size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 420,
        }}>
          {emoji}
        </div>
        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1,
          color: '#FFFFFF',
        }}>
          <div style={{ fontSize: SHARE_CARD.label.size, fontWeight: 700, lineHeight: 1.2 }}>
            {label}
          </div>
          <div style={{
            fontSize: SHARE_CARD.tip.size,
            color: SHARE_CARD.tip.color,
            lineHeight: 1.4, marginTop: 24,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {tip}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      emoji: 'twemoji',
      fonts: [
        { name: 'Pretendard', data: regular, weight: 400, style: 'normal' },
        { name: 'Pretendard', data: bold, weight: 700, style: 'normal' },
      ],
      headers: {
        'Cache-Control': 'public, s-maxage=31536000, immutable',
      },
    },
  );
}
```

### 4. 폰트 로더 — `lib/og/loadFont.ts`

Satori 는 `fonts` 옵션에 ArrayBuffer 를 요구한다. Edge runtime 은 `fs` 접근이 제한적이므로 `fetch` 로 `public/fonts/` 의 폰트를 동일 배포에서 가져온다.

```ts
let cache: [ArrayBuffer, ArrayBuffer] | null = null;

export async function loadPretendard(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (cache) return cache;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://how-many-mauve.vercel.app';
  const [regular, bold] = await Promise.all([
    fetch(`${base}/fonts/Pretendard-Regular.woff2`).then(r => r.arrayBuffer()),
    fetch(`${base}/fonts/Pretendard-Bold.woff2`).then(r => r.arrayBuffer()),
  ]);
  cache = [regular, bold];
  return cache;
}
```

- `cache` 는 Edge instance 생명주기 내 재사용. Vercel Edge 는 각 지역에서 warm state 유지 → 폰트 재fetch 최소화
- `NEXT_PUBLIC_APP_URL` 로 fetch 하므로 Vercel preview/프로덕션 모두 동일 코드

### 5. 스타일 상수 — `lib/constants/shareCard.ts`

```ts
export const SHARE_CARD = {
  width: 1200,
  height: 630,
  bg: 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)',
  emoji: { size: 360 },
  label: { size: 96, weight: 700, color: '#FFFFFF' },
  tip:   { size: 32, color: 'rgba(255,255,255,0.85)', maxLines: 2 },
  padding: 80,
} as const;
```

재설계 버전 — Part 3 의 1080×1080 상수는 재사용하지 않는다(롤백 대상). 이 파일은 신규 생성으로 취급.

### 6. `generateMetadata` — `app/result/[id]/page.tsx`

카톡 대화방에 URL 을 **텍스트로 붙여넣어도** 썸네일이 노출되도록 `<head>` 메타를 동적 주입.

```ts
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase
    .from('results')
    .select('winner_label, winner_emoji')
    .eq('id', id)
    .maybeSingle();

  const label = data?.winner_label ?? '결과';
  const emoji = data?.winner_emoji ?? '🎉';
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://how-many-mauve.vercel.app';
  const ogUrl = `${base}/result/${id}/opengraph-image`;

  return {
    title: `${emoji} ${label} — 몇명이니`,
    description: '몇명이니로 결정했어요! 같이 해볼까요?',
    openGraph: {
      title: `${emoji} ${label}`,
      description: '몇명이니로 결정했어요!',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `${label} 결과 카드` }],
      type: 'website',
      url: `${base}/result/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${emoji} ${label}`,
      images: [ogUrl],
    },
  };
}
```

- 기존 `generateStaticParams()` 는 정적 빌드용이므로 SSR/Edge 모드에서 공존 확인 필요
- static export 모드에서는 이 함수도 빌드타임에 호출되지만 Supabase 호출이 실패하면 fallback 값 사용

### 7. `lib/kakao.ts` 수정

현재 `sendKakaoMessage` 는 `imageUrl` 을 받지만 `imageWidth`/`imageHeight` 를 지정하지 않는다. 카톡 Feed Template 명세에 맞게 추가한다.

```ts
window.Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: params.title,
    description: params.description,
    imageUrl: params.imageUrl ?? `${getAppBaseUrl()}/og-image.png`,
    imageWidth: 1200,
    imageHeight: 630,
    link: { mobileWebUrl: params.linkUrl, webUrl: params.linkUrl },
  },
  buttons: [...],
});
```

### 8. `FlowResultPage.tsx` 수정

`handleKakaoShare` 에서 절대 URL 로 opengraph-image 경로를 전달.

```ts
const handleKakaoShare = async () => {
  if (!activity || !resultId) return;
  const base = getAppBaseUrl();
  const linkUrl = `${base}/result/${resultId}`;
  const imageUrl = `${base}/result/${resultId}/opengraph-image`;
  await sendKakaoMessage({
    title: `${resultTitle}: ${activity.emoji} ${activity.label}`,
    description: '몇명이니로 결정했어요! 같이 해볼까요?',
    imageUrl,
    linkUrl,
    buttonText: '결과 보기',
  });
};
```

### 9. Android Capacitor 빌드 충돌 회피 — `next.config.ts`

```ts
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : undefined,
  pageExtensions: isStaticExport
    ? ['page.tsx', 'page.ts', 'page.jsx', 'page.js']  // opengraph-image.tsx 제외
    : ['tsx', 'ts', 'jsx', 'js'],
  // ...기존 설정
};
```

- **일반 모드 (Vercel)**: 모든 확장자 허용 → `opengraph-image.tsx` 가 Edge route 로 등록
- **static export 모드 (Android)**: `page.*` 만 허용 → `opengraph-image.tsx` 무시, 빌드 통과
- 단, Next 기본 파일명 규칙이 이미 `page.tsx`이므로 일반 페이지 파일에는 영향 없음. 만약 `layout.tsx`, `not-found.tsx`, `error.tsx` 같은 특수 파일이 있다면 배열에 추가 필요 → **Phase B 착수 시 프로젝트 전체 파일 목록 확인**

### 10. Supabase Edge 호환성

`@supabase/supabase-js` 는 Edge runtime 호환성을 공식 지원한다(v2 이상). 단 주의할 점:
- `createClient` 를 **모듈 스코프가 아닌 함수 내부**에서 호출 (Edge worker lifecycle 대응)
- Cookies/Session 관련 API 사용 금지 (anon 조회만)
- RLS `results` SELECT 정책이 public 이어야 함 (MEMORY.md 상 이미 완료 상태)

### 11. 에러 처리

| 상황 | 응답 | UX 영향 |
|---|---|---|
| Supabase 조회 실패 | fallback 값("결과", "🎉", default tip)으로 렌더 | 카드는 노출되지만 구체 정보 없음 |
| 폰트 fetch 실패 | Satori 기본 sans fallback | 한글 가독성 ↓, 최종 수단 |
| 존재하지 않는 `id` | `maybeSingle()` null → fallback 값 렌더 | 2xx 응답 유지, 캐시 독 방지는 TTL 로 감수 |
| Twemoji fetch 실패 | 시스템 이모지 fallback (Satori 기본 동작) | 카카오톡에서 빈 사각형 가능성 있음 |

### 12. 테스트 전략

| 레이어 | 도구 | 범위 |
|---|---|---|
| 단위 | — (Edge runtime 의존) | 해당 없음 |
| 로컬 통합 | `npm run dev` + 브라우저 | `GET /result/{id}/opengraph-image` PNG 렌더 확인 |
| 빌드 | `npm run build` + `npm run build:android` | 양쪽 모두 통과 |
| Vercel preview | 배포 후 `view-source:/result/{id}` | `og:image` 메타 존재 확인 |
| 실기기 E2E | 수동 | Android AAB → 카톡 공유 버튼 → Feed 썸네일 노출 |
| 보너스 | 수동 | 카톡 대화방 URL 붙여넣기 자동 미리보기 |

### 13. 롤백 계획

문제가 발생할 경우 복구 절차:
1. `lib/kakao.ts` 의 `imageWidth`/`imageHeight` 추가분만 되돌려도 기존 `/og-image.png` 정적 파일 fallback 으로 동작
2. `generateMetadata` 제거 시 URL 붙여넣기 미리보기만 사라지고 Feed 공유는 정상
3. `opengraph-image.tsx` 자체를 제거해도 카톡은 `imageUrl` 요청 실패 → 썸네일 미노출, 공유 플로우 자체는 진행됨

즉 단계별 부분 롤백이 가능한 독립 모듈 구조.

### 14. 확장 경로

본 설계는 `result_id` 만 받으므로:
- **Solo/Food/Group 자동 커버**: 동일 Edge route 로 모든 플로우의 결과 썸네일 생성
- **디자인 개선**: `SHARE_CARD` 상수만 수정하면 전역 반영
- **카드 종류 분기**: `method` 필드 기반으로 테마 변경 가능 (후속 이슈)

### 15. Part 3 대비 변경점 요약

| 항목 | Part 3 (롤백됨) | Part 4 (현행) |
|---|---|---|
| 렌더 위치 | 클라이언트 | Vercel Edge 서버 |
| 라이브러리 | `html-to-image` (~30KB) | Next 16 `next/og` (내장, 클라이언트 영향 0) |
| 비율 | 1080×1080 정사각형 | 1200×630 가로형 |
| 공유 방식 | Share Sheet 파일 전송 | 카카오 Feed `imageUrl` 서버 URL |
| 이모지 | OS system emoji | Twemoji 강제 |
| 폰트 | 브라우저 시스템 | Pretendard woff2 번들 |
| 미리보기 모달 | 있음 | 없음 (서버 렌더로 불필요) |
| Android 빌드 | 문제 없음 | pageExtensions 분기 필요 (Edge runtime 비호환) |
| Food/Group 확장 | 버튼 훅업 | `result_id` 기반으로 자동 커버 |

이 설계로 Part 3 의 "카톡에 썸네일이 안 뜬다"는 한계가 해소되며, 1단계 배포 후 후속 이슈(HM-21-F/G)는 **실기기 QA 만으로 완료**된다.

