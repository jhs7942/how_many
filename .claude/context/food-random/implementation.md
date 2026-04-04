## 구현 파일
| 파일 | 역할 | 의존 |
|------|------|------|
| `assets/data/foods.json` | 음식 카테고리 12종 정적 데이터 | 없음 |
| `assets/data/menus.json` | 카테고리별 세부 메뉴 데이터 | 없음 |
| `assets/data/food-tips.json` | 카테고리별 추천 팁 텍스트 | 없음 |
| `lib/data.ts` | `ALL_FOODS`, `MENU_DATA` export 추가 | `foods.json`, `menus.json` |
| `components/ActivityPresetPicker.tsx` | `title` prop 추가 | `lib/data.ts` (ActivityItem) |
| `components/flow/FlowSettingPage.tsx` | 공용 모드 선택 화면 | `PageLayout`, `BackButton` |
| `components/flow/FlowCustomPage.tsx` | 공용 후보 편집 화면 | `CandidateEditor`, `ActivityPresetPicker`, `session` |
| `components/flow/FlowLocationPage.tsx` | 공용 위치 입력 화면 | `session` |
| `components/flow/FlowRandomPage.tsx` | 공용 4종 게임 실행 화면 | `SpinWheel`, `ContentShuffle`, `SlotMachine`, `RopePull`, `saveResult`, `pickGameType` |
| `components/flow/FlowResultPage.tsx` | 공용 결과 표시 화면 | `session`, `copyToClipboard`, `sendKakaoMessage`, `Toast` |
| `components/flow/FlowDetailRandomPage.tsx` | 공용 2차 랜덤 화면 | `SpinWheel`, `ContentShuffle`, `SlotMachine`, `RopePull`, `saveResult`, `pickGameType` |
| `components/flow/FlowDetailResultPage.tsx` | 공용 2차 결과 표시 화면 | `session`, `copyToClipboard`, `Toast` |
| `app/solo/setting/page.tsx` | solo 설정 래퍼 | `FlowSettingPage` |
| `app/solo/custom/page.tsx` | solo 커스텀 래퍼 | `FlowCustomPage` |
| `app/solo/location/page.tsx` | solo 위치 래퍼 | `FlowLocationPage` |
| `app/solo/random/page.tsx` | solo 랜덤 래퍼 | `FlowRandomPage` |
| `app/solo/result/page.tsx` | solo 결과 래퍼 | `FlowResultPage` |
| `app/solo/place/spin/page.tsx` | solo 장소 뽑기 래퍼 | `FlowDetailRandomPage` |
| `app/solo/place/result/page.tsx` | solo 장소 결과 래퍼 | `FlowDetailResultPage` |
| `app/food/setting/page.tsx` | food 설정 페이지 | `FlowSettingPage`, `ALL_FOODS`, `session` |
| `app/food/custom/page.tsx` | food 커스텀 페이지 | `FlowCustomPage`, `ALL_FOODS` |
| `app/food/location/page.tsx` | food 위치 페이지 | `FlowLocationPage` |
| `app/food/random/page.tsx` | food 랜덤 페이지 | `FlowRandomPage` |
| `app/food/result/page.tsx` | food 결과 페이지 | `FlowResultPage`, `food-tips.json` |
| `app/food/detail/random/page.tsx` | food 세부 메뉴 랜덤 페이지 | `FlowDetailRandomPage`, `MENU_DATA` |
| `app/food/detail/result/page.tsx` | food 세부 메뉴 결과 페이지 | `FlowDetailResultPage` |
| `app/page.tsx` | 홈 화면에 맛집 결정 카드 추가 | 없음 |
| `CLAUDE.md` | 맛집 플로우/sessionStorage 키 문서화 | 없음 |

## 설계 결정
| 결정 | 이유 | 대안(기각) |
|------|------|-----------|
| 공용 `components/flow/` 7개 컴포넌트로 추출 | solo/food 양쪽 페이지가 동일한 로직(게임 선택, 결과 표시, 공유)을 공유하므로 중복 제거 | 각 페이지에서 직접 구현 (기각: 중복 코드 ~1000줄 이상 발생) |
| 페이지를 얇은 래퍼로 전환 (props만 전달) | 비즈니스 로직을 공용 컴포넌트에 집중하여 유지보수 단일 포인트 확보 | 페이지에서 공용 컴포넌트를 부분적으로만 사용 (기각: 중복 제거 효과 반감) |
| `FlowDetailRandomPage`에서 4종 게임 전체 지원 | 기존 solo/place/spin은 SpinWheel만 사용했으나, construction.md에서 4종 게임 전체 사용으로 명시 | SpinWheel만 사용 (기각: plan.md 요구사항 "4종 게임 전체 사용") |
| `FlowSettingPage`에 `whiteSpace: 'pre-line'` 적용 | solo는 description에 `\n` 줄바꿈을 사용하므로 CSS로 줄바꿈 처리 | JSX `<br/>` 사용 (기각: props로 문자열만 전달하는 구조가 더 깔끔) |
| food/custom에서 defaultCandidates를 빈 배열로 설정 | 음식 플로우에서는 "카페", "영화" 같은 활동 기본값이 부적절하므로 빈 상태에서 시작 | solo와 동일한 기본값 사용 (기각: 도메인 불일치) |
| `FlowResultPage`에 `detailHref` optional prop 추가 | solo/result에는 기존에 세부 뽑기가 없었으나 (place/spin으로 이동하는 별도 경로였음), food에서는 결과에서 바로 세부 메뉴 뽑기로 이동 필요 | 결과 페이지를 solo/food 별도 구현 (기각: 공용화 목적에 반함) |
| `sessionKeys`를 객체로 묶어 전달 | 각 플로우별로 다른 sessionStorage 키 이름을 사용하므로 (예: `activity` vs `foodActivity`) 키 이름 충돌 방지 | 고정 키 이름 사용 (기각: solo와 food 동시 사용 시 키 충돌) |

## 파일 간 의존 관계
- `app/food/*` → `components/flow/*`: food 페이지들이 공용 컴포넌트를 import
- `app/solo/*` → `components/flow/*`: 리팩토링된 solo 페이지들이 공용 컴포넌트를 import
- `components/flow/*` → `components/{SpinWheel,ContentShuffle,SlotMachine,RopePull}`: 게임 컴포넌트 사용
- `components/flow/*` → `lib/session`, `lib/utils`, `lib/api/results`, `lib/kakao`: 유틸 사용
- `lib/data.ts` → `assets/data/foods.json`, `assets/data/menus.json`: JSON import
- `app/food/result/page.tsx` → `assets/data/food-tips.json`: 팁 데이터 직접 import

## 주의사항
- solo 페이지 리팩토링 시 기존 sessionStorage 키 이름(`activity`, `soloLocation`, `soloResultId`, `place`, `placeResultId`)을 그대로 유지. 변경하면 기존 플로우가 깨짐.
- food 페이지는 별도의 sessionStorage 키 namespace 사용 (`foodActivity`, `foodLocation` 등). solo와 키가 섞이지 않음.
- `FlowSettingPage`의 `onSelect` 콜백은 라우팅을 부모 페이지에서 처리. solo와 food의 라우팅 경로가 다르기 때문.
- `FlowCustomPage`의 `defaultCandidates`가 빈 배열이면 사용자가 최소 2개 이상 추가해야 "다음" 버튼 활성화.
- `FlowDetailRandomPage`는 `parentActivity` 세션값이 없으면 `fallbackHref`로 리다이렉트. 직접 URL 접근 방어.
- `ActivityPresetPicker`의 `title` prop은 optional (기본값: "추천 활동 빠른 선택"). food에서는 "음식 카테고리 빠른 선택"으로 전달.
- `app/solo/setting/page.tsx`만 `'use client'`가 필수 (onSelect 내에서 `useRouter`, `session.set` 사용). 나머지 solo 래퍼 중 `FlowCustomPage`, `FlowLocationPage` 등은 공용 컴포넌트 자체가 `'use client'`이므로 래퍼에는 불필요.
